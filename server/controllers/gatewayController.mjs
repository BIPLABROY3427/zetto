import Transaction from '../models/Transaction.mjs';
import User from '../models/User.mjs';
import {
    bindUpstreamOrder,
    initiatePayIn,
    initiatePayOut,
    queryBatchUpstream,
    queryUpstreamPayIn,
    queryUpstreamPayOut,
    upstreamBalance,
    upstreamUpiCheck,
    upstreamUtrCheck,
    verifySignature
} from '../services/aeropayService.mjs';
import { webhookQueue } from '../services/webhookQueue.mjs';

/**
 * Utility to send webhook to the Merchant (Queued)
 */
export const sendWebhookToMerchant = async (merchant, transaction) => {
    if (!merchant.callbackUrl) return;

    try {
        const payload = {
            transactionId: transaction.transactionId,
            status: transaction.status,
            amount: transaction.amount,
            type: transaction.type,
            timestamp: new Date().toISOString()
        };

        // Save payload initially
        transaction.webhookPayload = payload;
        transaction.webhookStatus = 'pending_retry'; // indicating it is queued
        await transaction.save();

        // Enqueue the job for reliable delivery with 3 retries
        await webhookQueue.add('send-webhook', {
            transactionId: transaction._id,
            merchantId: merchant._id,
            payload
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000 // 5s, 10s, 20s
            }
        });

    } catch (error) {
        console.error('Failed to enqueue webhook:', error.message);
    }
};

/**
 * @desc    Create a payment intent (Pay-In) via AeroPay
 * @route   POST /api/v1/gateway/payment
 * @access  Private (API Key)
 */
export const createPaymentIntent = async (req, res) => {
    try {
        const { amount, customerDetails, description } = req.body;
        const merchant = req.user;

        if (!amount || amount < 200) {
            return res.status(400).json({ success: false, message: 'Minimum amount is 200 INR' });
        }

        if (merchant.isPayinEnabled === false) {
            return res.status(403).json({ success: false, message: 'Payin service is disabled for your account. Please contact support.' });
        }

        // Generate unique order ID
        const orderNo = `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        // Calculate commission (Percentage + Flat)
        const payinSettings = merchant.commission?.payin || { percent: 5, flat: 0 };
        const commissionAmount = (amount * (payinSettings.percent / 100)) + payinSettings.flat;
        const netAmount = amount - commissionAmount;

        // Create pending transaction
        const newTransaction = await Transaction.create({
            merchantId: merchant._id,
            transactionId: orderNo,
            type: 'payment',
            amount: amount,
            commissionAmount,
            status: 'pending',
            customerDetails,
            description: description || 'Payment received'
        });

        // Call AeroPay
        const aeroResponse = await initiatePayIn(orderNo, amount);

        if (aeroResponse.code === 0 && aeroResponse.data?.code_url) {
            // Update transaction with gateway order ID and explicit URL
            newTransaction.gatewayOrderId = aeroResponse.data.orderNo || orderNo; // Sometime gateway generates its own
            newTransaction.paymentUrl = aeroResponse.data.code_url;
            newTransaction.gatewayResponse = aeroResponse;
            await newTransaction.save();

            return res.status(200).json({
                success: true,
                message: 'Payment intent created',
                paymentUrl: aeroResponse.data.code_url,
                transactionId: orderNo
            });
        } else {
            // Gateway rejected
            newTransaction.status = 'failed';
            newTransaction.gatewayResponse = aeroResponse;
            await newTransaction.save();
            return res.status(500).json({ success: false, message: 'Gateway rejected the payment request' });
        }
    } catch (error) {
        console.error('Create Payment Intent Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment' });
    }
};

/**
 * @desc    AeroPay Pay-In Webhook Callback
 * @route   POST /api/v1/gateway/aeropay/callback
 * @access  Public
 */
export const aeroPayInCallback = async (req, res) => {
    try {
        const payload = req.body;
        const incomingSign = payload.sign;

        // Verify signature
        if (!verifySignature(payload, incomingSign)) {
            return res.status(400).send('invalid signature');
        }

        const { orderNo, orderState, amount, businessNo } = payload;

        // Find transaction
        const transaction = await Transaction.findOne({ transactionId: orderNo });
        if (!transaction) {
            return res.status(404).send('order not found');
        }

        if (businessNo) {
            transaction.gatewayOrderId = String(businessNo);
        }

        // Idempotency check
        if (transaction.status === 'completed') {
            return res.status(200).send('success');
        }

        // orderState mapping: 1 = Success, 2,4 = Failed
        if (String(orderState) === '1') {
            transaction.status = 'completed';

            // Atomically update merchant balance
            const merchant = await User.findOneAndUpdate(
                { _id: transaction.merchantId },
                {
                    $inc: {
                        walletBalance: transaction.amount - (transaction.commissionAmount || 0),
                        totalReceived: Number(amount)
                    }
                },
                { new: true }
            );

            await transaction.save();

            // Fire webhook to merchant
            if (merchant) {
                // Background async
                sendWebhookToMerchant(merchant, transaction);
            }

            return res.status(200).send('success');
        } else if (String(orderState) === '2' || String(orderState) === '4') {
            transaction.status = 'failed';
            await transaction.save();

            const merchant = await User.findById(transaction.merchantId);
            if (merchant) sendWebhookToMerchant(merchant, transaction);

            return res.status(200).send('success'); // ACK the webhook
        }

        // Pending states
        return res.status(200).send('success');
    } catch (error) {
        console.error('AeroPay Callback Error:', error);
        res.status(500).send('server error');
    }
};

/**
 * @desc    Create a payout intent (Withdrawal) via AeroPay
 * @route   POST /api/v1/gateway/payout
 * @access  Private (API Key)
 */
export const createPayoutIntent = async (req, res) => {
    try {
        const { amount, bankDetails, description } = req.body;
        const merchant = req.user;

        if (!amount || amount < 100) {
            return res.status(400).json({ success: false, message: 'Minimum withdrawal is 100 INR' });
        }

        if (merchant.isPayoutEnabled === false) {
            return res.status(403).json({ success: false, message: 'Payout service is disabled for your account. Please contact support.' });
        }

        if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode) {
            return res.status(400).json({ success: false, message: 'Complete bank details are required' });
        }

        // Calculate commission (Percentage + Flat)
        const payoutSettings = merchant.commission?.payout || { percent: 2, flat: 0 };
        const payoutFee = (Number(amount) * (payoutSettings.percent / 100)) + payoutSettings.flat;
        const totalDeduction = Number(amount) + payoutFee;

        // Check frozen amount
        const frozenAmt = merchant.frozenAmount || 0;
        if ((merchant.walletBalance - frozenAmt) < totalDeduction) {
            return res.status(400).json({ success: false, message: 'Insufficient available balance.' });
        }

        // Atomically deduct balance
        const updatedMerchant = await User.findOneAndUpdate(
            { _id: merchant._id, walletBalance: { $gte: totalDeduction } },
            {
                $inc: {
                    walletBalance: -totalDeduction,
                    totalWithdrawals: Number(amount)
                }
            },
            { new: true }
        );

        if (!updatedMerchant) {
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }

        // Generate unique order ID
        const orderNo = `POUT_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

        const newTransaction = await Transaction.create({
            merchantId: merchant._id,
            transactionId: orderNo,
            type: 'withdrawal',
            amount: amount,
            commissionAmount: payoutFee,
            status: 'pending',
            customerDetails: bankDetails, // Save bank details here
            description: description || 'Payout request'
        });

        // Call AeroPay
        try {
            const aeroResponse = await initiatePayOut(orderNo, amount, bankDetails);
            
            console.log("=== AEROPAY PAYOUT SUCCESS RESPONSE ===", aeroResponse);

            if (aeroResponse.code === 0) {
                newTransaction.gatewayResponse = aeroResponse;
                await newTransaction.save();
                return res.status(200).json({ success: true, message: 'Payout initiated successfully', transactionId: orderNo });
            } else {
                throw new Error("Gateway rejected payout");
            }
        } catch (aeroError) {
            console.log("=== AEROPAY PAYOUT ERROR ===", aeroError.message);
            const errMsg = aeroError.message || "";
            if (errMsg.toLowerCase().includes('balance') || errMsg.toLowerCase().includes('insufficient')) {
                newTransaction.status = 'queued';
                newTransaction.description = 'Queued due to insufficient upstream balance';
                await newTransaction.save();
                return res.status(200).json({
                    success: true,
                    message: 'Payout queued due to system limits. It will be processed automatically.',
                    transactionId: orderNo
                });
            }

            // Revert balance if gateway fails immediately for other reasons
            await User.updateOne(
                { _id: merchant._id },
                {
                    $inc: {
                        walletBalance: totalDeduction,
                        totalWithdrawals: -Number(amount)
                    }
                }
            );
            newTransaction.status = 'failed';
            newTransaction.description = `Failed at gateway initiation: ${errMsg}`;
            await newTransaction.save();
            return res.status(500).json({ success: false, message: 'Gateway failed to initiate payout. Amount refunded.' });
        }
    } catch (error) {
        console.error('Create Payout Intent Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payout' });
    }
};

/**
 * @desc    AeroPay Pay-Out Webhook Callback
 * @route   POST /api/v1/gateway/aeropay/payoutcallback
 * @access  Public
 */
export const aeroPayOutCallback = async (req, res) => {
    try {
        const payload = req.body;
        console.log("=== INCOMING AEROPAY PAYOUT WEBHOOK ===", payload);

        // AeroPay Payout webhook nests the data inside a 'data' key
        const data = payload.data ? payload.data : payload;

        const incomingSign = data.sign;

        if (!verifySignature(data, incomingSign)) {
            return res.status(400).send('invalid signature');
        }

        const { orderNo, orderState, amount, businessNo } = data;

        const transaction = await Transaction.findOne({ transactionId: orderNo });
        if (!transaction) return res.status(404).send('order not found');
        if (transaction.status !== 'pending') return res.status(200).send('success');

        if (businessNo) {
            transaction.gatewayOrderId = String(businessNo);
        }

        if (String(orderState) === '1') {
            transaction.status = 'completed';
            await transaction.save();

            const merchant = await User.findById(transaction.merchantId);
            if (merchant) sendWebhookToMerchant(merchant, transaction);

            return res.status(200).send('success');
        } else if (String(orderState) === '2' || String(orderState) === '4') {
            // Failed -> Refund
            transaction.status = 'failed';
            await transaction.save();

            const refundAmount = transaction.amount + transaction.commissionAmount;

            const merchant = await User.findOneAndUpdate(
                { _id: transaction.merchantId },
                {
                    $inc: {
                        walletBalance: refundAmount,
                        totalWithdrawals: -transaction.amount
                    }
                },
                { new: true }
            );

            if (merchant) sendWebhookToMerchant(merchant, transaction);
            return res.status(200).send('success');
        }

        return res.status(200).send('success');
    } catch (error) {
        console.error('AeroPay Payout Callback Error:', error);
        res.status(500).send('server error');
    }
};

/**
 * @desc    Query Pay-In Order Status
 * @route   GET /api/v1/gateway/payin/query?orderNo=...
 * @access  Private (API Key)
 */
export const queryPayinOrder = async (req, res) => {
    try {
        const { orderNo } = req.query;
        if (!orderNo) return res.status(400).json({ success: false, message: 'orderNo is required' });

        const transaction = await Transaction.findOne({ transactionId: orderNo, merchantId: req.user._id });
        if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

        // Optionally, check upstream if pending
        if (transaction.status === 'pending') {
            try {
                const upstreamStatus = await queryUpstreamPayIn(orderNo);
                if (upstreamStatus && upstreamStatus.data) {
                    const newOrderState = String(upstreamStatus.data.orderState);
                    const actualAmount = upstreamStatus.data.amount;

                    if (newOrderState === '1') {
                        transaction.status = 'completed';
                        await User.findOneAndUpdate(
                            { _id: transaction.merchantId },
                            { $inc: { walletBalance: transaction.amount - (transaction.commissionAmount || 0), totalReceived: Number(actualAmount || transaction.amount) } }
                        );
                        await transaction.save();

                        const merchant = await User.findById(transaction.merchantId);
                        if (merchant) sendWebhookToMerchant(merchant, transaction);

                        return res.status(200).json({ success: true, status: transaction.status, amount: transaction.amount, upstreamData: upstreamStatus });
                    } else if (newOrderState === '2' || newOrderState === '4') {
                        transaction.status = 'failed';
                        await transaction.save();

                        const merchant = await User.findById(transaction.merchantId);
                        if (merchant) sendWebhookToMerchant(merchant, transaction);

                        return res.status(200).json({ success: true, status: transaction.status, amount: transaction.amount, upstreamData: upstreamStatus });
                    }
                }
            } catch (err) {
                // Ignore upstream error and just return local
            }
        }

        res.status(200).json({ success: true, status: transaction.status, amount: transaction.amount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Query Pay-Out Order Status
 * @route   GET /api/v1/gateway/payout/query?orderNo=...
 * @access  Private (API Key)
 */
export const queryPayoutOrder = async (req, res) => {
    try {
        const { orderNo } = req.query;
        if (!orderNo) return res.status(400).json({ success: false, message: 'orderNo is required' });

        const transaction = await Transaction.findOne({ transactionId: orderNo, merchantId: req.user._id });
        if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

        if (transaction.status === 'pending') {
            try {
                const upstreamStatus = await queryUpstreamPayOut(orderNo);
                if (upstreamStatus && upstreamStatus.data) {
                    const newOrderState = String(upstreamStatus.data.orderState);

                    if (newOrderState === '1') {
                        transaction.status = 'completed';
                        await transaction.save();

                        const merchant = await User.findById(transaction.merchantId);
                        if (merchant) sendWebhookToMerchant(merchant, transaction);

                        return res.status(200).json({ success: true, status: transaction.status, amount: transaction.amount, upstreamData: upstreamStatus });
                    } else if (newOrderState === '2' || newOrderState === '4') {
                        transaction.status = 'failed';
                        const refundAmount = transaction.amount + (transaction.commissionAmount || 0);
                        await User.findOneAndUpdate(
                            { _id: transaction.merchantId },
                            { $inc: { walletBalance: refundAmount, totalWithdrawals: -transaction.amount } }
                        );
                        await transaction.save();

                        const merchant = await User.findById(transaction.merchantId);
                        if (merchant) sendWebhookToMerchant(merchant, transaction);

                        return res.status(200).json({ success: true, status: transaction.status, amount: transaction.amount, upstreamData: upstreamStatus });
                    }
                }
            } catch (err) { }
        }

        res.status(200).json({ success: true, status: transaction.status, amount: transaction.amount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Get Merchant Zetto Wallet Balance
 * @route   GET /api/v1/gateway/balance
 * @access  Private (API Key)
 */
export const getMerchantBalance = async (req, res) => {
    try {
        const merchant = req.user;
        res.status(200).json({
            success: true,
            balance: merchant.walletBalance,
            currency: 'INR'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Check UTR validity (Pass-through)
 * @route   POST /api/v1/gateway/utrcheck
 * @access  Private (API Key)
 */
export const checkUtr = async (req, res) => {
    try {
        const { utr } = req.body;
        if (!utr) return res.status(400).json({ success: false, message: 'UTR is required' });

        const upstreamRes = await upstreamUtrCheck(utr);
        res.status(200).json({ success: true, data: upstreamRes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to verify UTR' });
    }
};

/**
 * @desc    Check UPI validity (Pass-through)
 * @route   POST /api/v1/gateway/upicheck
 * @access  Private (API Key)
 */
export const checkUpi = async (req, res) => {
    try {
        const { upi } = req.body;
        if (!upi) return res.status(400).json({ success: false, message: 'UPI ID is required' });

        const upstreamRes = await upstreamUpiCheck(upi);
        res.status(200).json({ success: true, data: upstreamRes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to verify UPI' });
    }
};

/**
 * @desc    Get Superadmin System Health (Upstream Balance & Total Volume)
 * @route   GET /api/v1/gateway/system/health
 * @access  Private (SuperAdmin)
 */
export const getSystemHealth = async (req, res) => {
    try {
        // Only allow superadmin
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // 1. Fetch real upstream balance from AeroPay
        let upstreamData = { balance: 0, status: 'error' };
        try {
            const aeroBal = await upstreamBalance();
            if (aeroBal.code === 0) {
                upstreamData = {
                    balance: aeroBal.data?.balance || 0,
                    status: 'online'
                };
            }
        } catch (err) {
            console.error('Failed to fetch upstream balance', err.message);
        }

        // 2. Aggregate local system volume (Today)
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(startOfDay);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const aggregateVolumeToday = await Transaction.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startOfDay }
                }
            },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" },
                    totalCommission: { $sum: "$commissionAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const aggregateVolumeYesterday = await Transaction.aggregate([
            {
                $match: {
                    status: 'completed',
                    createdAt: { $gte: startOfYesterday, $lt: startOfDay }
                }
            },
            {
                $group: {
                    _id: "$type",
                    totalAmount: { $sum: "$amount" },
                    totalCommission: { $sum: "$commissionAmount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        const formatMetrics = (aggData) => {
            let payins = { amount: 0, commission: 0, count: 0 };
            let payouts = { amount: 0, commission: 0, count: 0 };
            aggData.forEach(item => {
                if (item._id === 'payment') payins = { amount: item.totalAmount, commission: item.totalCommission, count: item.count };
                else if (item._id === 'withdrawal') payouts = { amount: item.totalAmount, commission: item.totalCommission, count: item.count };
            });
            return { payins, payouts };
        };

        // 3. Aggregate total wallet balance across all users
        const userBalanceAgg = await User.aggregate([
            { $group: { _id: null, totalWallet: { $sum: "$walletBalance" } } }
        ]);
        const totalUserBalance = userBalanceAgg.length > 0 ? userBalanceAgg[0].totalWallet : 0;

        res.status(200).json({
            success: true,
            upstream: upstreamData,
            totalUserBalance: totalUserBalance,
            todayMetrics: formatMetrics(aggregateVolumeToday),
            yesterdayMetrics: formatMetrics(aggregateVolumeYesterday)
        });

    } catch (error) {
        console.error('System Health Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * @desc    Force-bind UTR to Pay-In Order Upstream
 * @route   POST /api/v1/gateway/payin/bind
 * @access  Private (API Key)
 */
export const bindPayinOrder = async (req, res) => {
    try {
        const { orderNo, utr, amount } = req.body;
        if (!orderNo || !utr || !amount) {
            return res.status(400).json({ success: false, message: 'orderNo, utr, and amount are required' });
        }

        // Validate transaction belongs to user
        const transaction = await Transaction.findOne({ transactionId: orderNo, merchantId: req.user._id });
        if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

        const upstreamStatus = await bindUpstreamOrder(orderNo, utr, amount);
        res.status(200).json({ success: true, data: upstreamStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to bind order upstream' });
    }
};

/**
 * @desc    Batch Query Pay-In Orders
 * @route   POST /api/v1/gateway/payin/querybatch
 * @access  Private (API Key)
 */
export const queryBatchPayinOrders = async (req, res) => {
    try {
        const { orders } = req.body; // e.g. "ORD123,ORD124"
        if (!orders) {
            return res.status(400).json({ success: false, message: 'orders parameter is required (comma separated)' });
        }

        const upstreamStatus = await queryBatchUpstream(orders);
        res.status(200).json({ success: true, data: upstreamStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to query batch upstream' });
    }
};
