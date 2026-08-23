import cron from 'node-cron';
import Transaction from '../models/Transaction.mjs';
import User from '../models/User.mjs';
import { initiatePayOut, upstreamBalance } from './aeropayService.mjs';
import { sendWebhookToMerchant } from '../controllers/gatewayController.mjs';

// Run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    try {
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
                 console.log(`[PayoutQueue] Processing queued payout: ${tx.transactionId} for ₹${tx.amount}`);
                 try {
                     const aeroRes = await initiatePayOut(tx.transactionId, tx.amount, tx.customerDetails);
                     
                     if (aeroRes.code === 0) {
                         // Success, mark as pending waiting for webhook
                         tx.status = 'pending';
                         tx.description = 'Processed from queue, waiting for upstream callback';
                         tx.gatewayResponse = aeroRes;
                         await tx.save();
                         
                         availableBalance -= tx.amount; // deduct locally so we don't over-process in this loop
                         console.log(`[PayoutQueue] Payout ${tx.transactionId} initiated successfully.`);
                     } else {
                         throw new Error(aeroRes.msg || "Gateway rejected payout");
                     }
                 } catch (err) {
                     const errMsg = err.message || "";
                     if (errMsg.toLowerCase().includes('balance') || errMsg.toLowerCase().includes('insufficient')) {
                         console.log(`[PayoutQueue] Upstream balance exhausted during processing. Stopping loop.`);
                         break; // Stop loop, wait for next cron run
                     } else {
                         // Some other hard error (e.g. bad account number) -> Fail and refund
                         console.log(`[PayoutQueue] Payout ${tx.transactionId} failed with hard error: ${errMsg}. Refunding merchant.`);
                         
                         tx.status = 'failed';
                         tx.description = `Failed during queue processing: ${errMsg}`;
                         await tx.save();

                         // Revert local wallet balance
                         const refundAmount = tx.amount + (tx.commissionAmount || 0);
                         const merchant = await User.findOneAndUpdate(
                             { _id: tx.merchantId },
                             {
                                 $inc: {
                                     walletBalance: refundAmount,
                                     totalWithdrawals: -tx.amount
                                 }
                             },
                             { new: true }
                         );

                         // Send failed webhook
                         if (merchant) {
                             sendWebhookToMerchant(merchant, tx);
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
