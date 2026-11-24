import cron from 'node-cron';
import Transaction from '../models/Transaction.mjs';
import User from '../models/User.mjs';
import { initiatePayOut, queryUpstreamPayOut, upstreamBalance } from './aeropayService.mjs';
import { sendWebhookToMerchant } from '../controllers/gatewayController.mjs';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    try {
        // Recovery: Check any stale 'processing' transactions if server crashed mid-execution
        const staleProcessingTime = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes ago
        const staleTxns = await Transaction.find({
            type: 'withdrawal',
            status: 'processing',
            updatedAt: { $lt: staleProcessingTime }
        });

        for (const staleTx of staleTxns) {
            console.log(`[PayoutQueue Recovery] Checking stale processing transaction: ${staleTx.transactionId}`);
            try {
                const upstreamCheck = await queryUpstreamPayOut(staleTx.transactionId);
                const orderState = String(upstreamCheck?.data?.orderState || '');
                if (orderState === '1') {
                    staleTx.status = 'completed';
                    staleTx.description = 'Completed upstream verified during recovery';
                    await staleTx.save();
                } else if (orderState === '2' || orderState === '4' || orderState === '5') {
                    // Upstream failed, safe to refund
                    staleTx.status = orderState === '5' ? 'refunded' : 'failed';
                    staleTx.description = 'Failed upstream verified during recovery';
                    await staleTx.save();
                    const refundAmount = staleTx.amount + (staleTx.commissionAmount || 0);
                    await User.findOneAndUpdate(
                        { _id: staleTx.merchantId },
                        { $inc: { walletBalance: refundAmount, totalWithdrawals: -staleTx.amount } }
                    );
                } else if (String(upstreamCheck?.code) === '500' && upstreamCheck?.msg?.includes('OrderNo not exist')) {
                    // Truly never submitted upstream, return to queue
                    staleTx.status = 'queued';
                    staleTx.description = 'Re-queued after server restart verification';
                    await staleTx.save();
                } else {
                    // Pending upstream
                    staleTx.status = 'pending';
                    staleTx.description = 'Pending upstream callback';
                    await staleTx.save();
                }
            } catch (recoveryErr) {
                console.error(`[PayoutQueue Recovery] Error verifying ${staleTx.transactionId}:`, recoveryErr.message);
            }
        }

        // 1. Find all queued payout transactions, oldest first
        const queuedTxns = await Transaction.find({ type: 'withdrawal', status: 'queued' }).sort({ createdAt: 1 });
        
        if (queuedTxns.length === 0) return;

        console.log(`[PayoutQueue] Found ${queuedTxns.length} queued payouts. Checking upstream balance...`);

        // 2. Check upstream balance
        const balanceData = await upstreamBalance();
        let availableBalance = Number(balanceData.data?.balance || 0);

        if (availableBalance <= 0) {
            console.log('[PayoutQueue] Upstream balance is still 0. Waiting for next cycle.');
            return;
        }

        console.log(`[PayoutQueue] Upstream available balance: ₹${availableBalance}`);

        for (const tx of queuedTxns) {
            if (availableBalance >= tx.amount) {
                 // Atomically acquire lock on this transaction
                 const lockedTx = await Transaction.findOneAndUpdate(
                     { _id: tx._id, status: 'queued' },
                     { $set: { status: 'processing', description: 'Processing payout from queue' } },
                     { new: true }
                 );
                 if (!lockedTx) continue; // Already picked by another process

                 console.log(`[PayoutQueue] Processing queued payout: ${lockedTx.transactionId} for ₹${lockedTx.amount}`);
                 try {
                     const aeroRes = await initiatePayOut(lockedTx.transactionId, lockedTx.amount, lockedTx.customerDetails);
                     
                     if (aeroRes.isNetworkError) {
                         lockedTx.status = 'pending';
                         lockedTx.description = `Processed from queue (Network/Timeout: ${aeroRes.message})`;
                         await lockedTx.save();
                         availableBalance -= lockedTx.amount; 
                         console.log(`[PayoutQueue] Payout ${lockedTx.transactionId} processing with network error/timeout.`);
                     } else if (aeroRes.code === 0) {
                         // Success, mark as pending waiting for webhook
                         lockedTx.status = 'pending';
                         lockedTx.description = 'Processed from queue, waiting for upstream callback';
                         lockedTx.gatewayResponse = aeroRes;
                         await lockedTx.save();
                         
                         availableBalance -= lockedTx.amount; // deduct locally so we don't over-process in this loop
                         console.log(`[PayoutQueue] Payout ${lockedTx.transactionId} initiated successfully.`);
                     } else {
                         throw new Error(aeroRes.msg || "Gateway rejected payout");
                     }
                 } catch (err) {
                     const errMsg = err.message || "";
                     if (errMsg.toLowerCase().includes('balance') || errMsg.toLowerCase().includes('insufficient')) {
                         console.log(`[PayoutQueue] Upstream balance exhausted during processing. Re-queuing and stopping loop.`);
                         await Transaction.findByIdAndUpdate(lockedTx._id, {
                             status: 'queued',
                             description: 'Queued: Upstream balance exhausted during processing'
                         });
                         break; // Stop loop, wait for next cron run
                     } else {
                         // Verify upstream state before refunding to avoid double-spend loss!
                         console.log(`[PayoutQueue] Payout ${lockedTx.transactionId} encountered error: ${errMsg}. Verifying upstream state...`);
                         
                         let canRefund = false;
                         try {
                             const upstreamCheck = await queryUpstreamPayOut(lockedTx.transactionId);
                             const orderState = String(upstreamCheck?.data?.orderState || '');
                             
                             if (orderState === '1') {
                                 // Already completed upstream! NEVER refund!
                                 console.log(`[PayoutQueue] Payout ${lockedTx.transactionId} actually succeeded upstream! Marking completed.`);
                                 lockedTx.status = 'completed';
                                 lockedTx.gatewayResponse = upstreamCheck;
                                 lockedTx.description = 'Completed upstream verified';
                                 await lockedTx.save();
                                 availableBalance -= lockedTx.amount;
                                 
                                 const merchant = await User.findById(lockedTx.merchantId);
                                 if (merchant) sendWebhookToMerchant(merchant, lockedTx);
                                 continue;
                             } else if (orderState === '2' || orderState === '4' || orderState === '5') {
                                 // Verified failed or reversed upstream
                                 canRefund = true;
                             } else if (String(upstreamCheck?.code) === '500' && upstreamCheck?.msg?.includes("OrderNo not exist")) {
                                 // Confirmed order was never created upstream
                                 canRefund = true;
                             } else if (orderState === '0' || (upstreamCheck?.data && orderState !== '')) {
                                 // Order is pending upstream, do not refund!
                                 console.log(`[PayoutQueue] Payout ${lockedTx.transactionId} is pending upstream. Waiting for callback.`);
                                 lockedTx.status = 'pending';
                                 lockedTx.description = 'Processing upstream, awaiting callback';
                                 await lockedTx.save();
                                 availableBalance -= lockedTx.amount;
                                 continue;
                             }
                         } catch (verifyErr) {
                             console.warn(`[PayoutQueue] Upstream check failed for ${lockedTx.transactionId}: ${verifyErr.message}. Holding as pending to prevent loss.`);
                             // Hold as pending without refunding to protect against double payouts
                             lockedTx.status = 'pending';
                             lockedTx.description = `Pending verification: ${errMsg}`;
                             await lockedTx.save();
                             continue;
                         }

                         if (canRefund) {
                             console.log(`[PayoutQueue] Payout ${lockedTx.transactionId} confirmed non-existent/failed upstream. Refunding merchant.`);
                             const updatedTx = await Transaction.findOneAndUpdate(
                                 { transactionId: lockedTx.transactionId, status: { $nin: ['completed', 'failed', 'refunded'] } },
                                 { $set: { status: 'failed', description: `Failed during queue processing: ${errMsg}` } },
                                 { new: true }
                             );

                             if (updatedTx) {
                                 const refundAmount = updatedTx.amount + (updatedTx.commissionAmount || 0);
                                 const merchant = await User.findOneAndUpdate(
                                     { _id: updatedTx.merchantId },
                                     {
                                         $inc: {
                                             walletBalance: refundAmount,
                                             totalWithdrawals: -updatedTx.amount
                                         }
                                     },
                                     { new: true }
                                 );

                                 if (merchant) {
                                     sendWebhookToMerchant(merchant, updatedTx);
                                 }
                             }
                         } else {
                             // Safety fallback: Keep as pending for manual or webhook settlement
                             lockedTx.status = 'pending';
                             lockedTx.description = `Held for verification: ${errMsg}`;
                             await lockedTx.save();
                         }
                     }
                 }
            } else {
                 console.log(`[PayoutQueue] Not enough upstream balance for payout ${tx.transactionId} (requires ₹${tx.amount}, has ₹${availableBalance}). Stopping loop.`);
                 break; 
            }
        }
    } catch (err) {
        console.error('[PayoutQueue] Cron Error:', err.message);
    }
});
