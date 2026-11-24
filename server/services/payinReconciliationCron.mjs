import cron from 'node-cron';
import Transaction from '../models/Transaction.mjs';
import User from '../models/User.mjs';
import { queryUpstreamPayIn } from './aeropayService.mjs';
import { sendWebhookToMerchant } from '../controllers/gatewayController.mjs';

/**
 * Pay-In Reconciliation Cron
 * Automatically recovers payments if the server was down/restarting
 * when the upstream webhook arrived, or if webhook was dropped.
 * Runs every 2 minutes.
 */
cron.schedule('*/2 * * * *', async () => {
    try {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Find pending pay-in transactions created between 2 mins and 24 hours ago
        const pendingPayins = await Transaction.find({
            type: 'payment',
            status: 'pending',
            createdAt: { $gte: twentyFourHoursAgo, $lte: twoMinutesAgo }
        }).sort({ createdAt: 1 }).limit(50);

        if (pendingPayins.length === 0) return;

        console.log(`[PayInReconciliation] Found ${pendingPayins.length} pending pay-ins to verify against upstream...`);

        for (const tx of pendingPayins) {
            try {
                const upstreamStatus = await queryUpstreamPayIn(tx.transactionId);
                if (!upstreamStatus || !upstreamStatus.data) continue;

                const newOrderState = String(upstreamStatus.data.orderState);
                const actualAmount = upstreamStatus.data.amount;

                if (newOrderState === '1') {
                    // Upstream Confirmed SUCCESS!
                    const updatedTx = await Transaction.findOneAndUpdate(
                        { _id: tx._id, status: 'pending' },
                        {
                            $set: {
                                status: 'completed',
                                gatewayResponse: upstreamStatus,
                                description: 'Completed via automated reconciliation'
                            }
                        },
                        { new: true }
                    );

                    if (updatedTx) {
                        const netAmount = updatedTx.amount - (updatedTx.commissionAmount || 0);
                        const merchant = await User.findOneAndUpdate(
                            { _id: updatedTx.merchantId },
                            {
                                $inc: {
                                    walletBalance: netAmount,
                                    totalReceived: Number(actualAmount || updatedTx.amount)
                                }
                            },
                            { new: true }
                        );

                        if (merchant) {
                            sendWebhookToMerchant(merchant, updatedTx);
                        }

                        console.log(`[PayInReconciliation] ✅ Successfully reconciled order ${updatedTx.transactionId}: ₹${netAmount} credited`);
                    }
                } else if (newOrderState === '2' || newOrderState === '4') {
                    // Upstream Confirmed FAILED
                    const updatedTx = await Transaction.findOneAndUpdate(
                        { _id: tx._id, status: 'pending' },
                        {
                            $set: {
                                status: 'failed',
                                gatewayResponse: upstreamStatus,
                                description: 'Failed upstream confirmed via reconciliation'
                            }
                        },
                        { new: true }
                    );

                    if (updatedTx) {
                        const merchant = await User.findById(updatedTx.merchantId);
                        if (merchant) {
                            sendWebhookToMerchant(merchant, updatedTx);
                        }
                        console.log(`[PayInReconciliation] ❌ Marked failed order ${updatedTx.transactionId}`);
                    }
                } else {
                    // Still pending/unpaid upstream.
                    // If order is older than 60 minutes and still unpaid, mark it expired
                    const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
                    if (new Date(tx.createdAt) < sixtyMinutesAgo) {
                        await Transaction.findOneAndUpdate(
                            { _id: tx._id, status: 'pending' },
                            {
                                $set: {
                                    status: 'failed',
                                    description: 'Expired/Unpaid after 60 minutes'
                                }
                            }
                        );
                        console.log(`[PayInReconciliation] ⏱️ Expired unpaid order ${tx.transactionId}`);
                    }
                }
            } catch (err) {
                // If upstream query fails, skip to next without breaking loop
                console.warn(`[PayInReconciliation] Error verifying order ${tx.transactionId}:`, err.message);
            }
        }
    } catch (globalErr) {
        console.error('[PayInReconciliation] Cron Error:', globalErr.message);
    }
});
