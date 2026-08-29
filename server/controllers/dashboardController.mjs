import Transaction from '../models/Transaction.mjs';
import User from '../models/User.mjs';
import { queryUpstreamPayIn, queryUpstreamPayOut } from '../services/aeropayService.mjs';
import { sendWebhookToMerchant } from './gatewayController.mjs';
import { logActivity } from '../services/activityLogger.mjs';
import axios from 'axios';

/**
 * @desc    Get dashboard aggregated stats and chart data
 * @route   GET /api/merchant/dashboard/stats
 * @access  Private (Requires Token)
 */
export const getDashboardStats = async (req, res) => {
  try {
    const merchantId = req.user._id;

    // We already have wallet metrics logically mapped on the user
    // (In a real system, these would be carefully transactionally maintained during payments/withdrawals)
    const merchant = await User.findById(merchantId);

    // Get transactions from the last 7 days for the chart
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTransactions = await Transaction.find({
      merchantId,
      createdAt: { $gte: sevenDaysAgo },
      status: 'completed'
    }).sort({ createdAt: 1 });

    // Group transaction amounts by day for the chart
    // Example chart formatting: [ { name: 'Mon', uv: 4000 }, { name: 'Tue', uv: 3000 } ]
    const dailyData = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-US', { weekday: 'short' });
      dailyData[dateString] = 0; // Initialize empty buckets
    }

    recentTransactions.forEach((tx) => {
      if (tx.type === 'payment') {
        const dateString = new Date(tx.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        if (dailyData[dateString] !== undefined) {
          dailyData[dateString] += tx.amount;
        }
      }
    });

    const chartData = Object.keys(dailyData).map(key => ({
      name: key,
      received: dailyData[key]
    }));

    // Calculate today's stats for Success Ratio
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaysTransactions = await Transaction.find({
      merchantId,
      createdAt: { $gte: startOfToday }
    });

    let inSuccAmount = 0, inAmount = 0;
    let outSuccAmount = 0, outAmount = 0;
    let inCount = 0, inSuccCount = 0;
    let outCount = 0, outSuccCount = 0;

    todaysTransactions.forEach(tx => {
      if (tx.type === 'payment') {
        inAmount += tx.amount;
        inCount += 1;
        if (tx.status === 'completed') {
          inSuccAmount += tx.amount;
          inSuccCount += 1;
        }
      } else if (tx.type === 'withdrawal') {
        outAmount += tx.amount;
        outCount += 1;
        if (tx.status === 'completed') {
          outSuccAmount += tx.amount;
          outSuccCount += 1;
        }
      }
    });

    res.status(200).json({
      success: true,
      stats: {
        walletBalance: merchant.walletBalance || 0,
        frozenAmount: merchant.frozenAmount || 0,
        frozenReason: merchant.frozenReason || '',
        totalReceived: merchant.totalReceived || 0,
        totalWithdrawals: merchant.totalWithdrawals || 0,
        todayStats: {
          inSuccAmount,
          inAmount,
          inSuccRate: inCount > 0 ? (inSuccCount / inCount) * 100 : 0,
          outSuccAmount,
          outAmount,
          outSuccRate: outCount > 0 ? (outSuccCount / outCount) * 100 : 0,
        }
      },
      settings: {
        commission: merchant.commission || {
          payin: { percent: 5, flat: 0 },
          payout: { percent: 2, flat: 0 }
        },
        commissionRate: merchant.commissionRate || 0.05,
        callbackUrl: merchant.callbackUrl || '',
        webhookSecret: merchant.webhookSecret || '',
        activeApiKey: merchant.apiKey || null
      },
      chartData
    });
  } catch (error) {
    console.error('getDashboardStats Error:', error);
    res.status(500).json({ success: false, message: 'Server Error retrieving dashboard stats' });
  }
};

/**
 * @desc    Get paginated, sorted, and filtered transactions for Data Tables
 * @route   GET /api/merchant/dashboard/transactions
 * @access  Private (Requires Token)
 */
export const getTransactions = async (req, res) => {
  try {
    const merchantId = req.user._id;

    // Destructure Query Params
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      type = 'all',
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { merchantId };

    // Exact Match Filters
    if (status !== 'all') query.status = status;
    if (type !== 'all') query.type = type;

    // Search Query ($regex across strings)
    if (search.trim() !== '') {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Date Range Filters ($gte, $lte on timestamps)
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Handle Sorting
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute Compound Aggregation
    const skipAmount = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .sort(sortConfig)
        .skip(skipAmount)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('getTransactions Error:', error);
    res.status(500).json({ success: false, message: 'Server Error processing filtered transactions' });
  }
};

/**
 * @desc    Manually resend webhook for a specific transaction
 * @route   POST /api/dashboard/transactions/:id/resend-webhook
 */
export const resendWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Ensure merchant can only resend their own
    if (user.role === 'user' && transaction.merchantId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to transaction' });
    }

    const merchant = await User.findById(transaction.merchantId);
    if (!merchant || !merchant.callbackUrl) {
      return res.status(400).json({ success: false, message: 'Merchant does not have a callback URL set' });
    }

    // Prepare payload
    const payload = {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: transaction.amount,
        type: transaction.type,
        timestamp: new Date().toISOString()
    };
    
    const finalPayload = {
        ...payload,
        secret: merchant.webhookSecret || 'default_secret'
    };

    let webhookResponseData = null;
    let isSuccess = false;

    try {
        const response = await axios.post(merchant.callbackUrl, finalPayload, { timeout: 5000 });
        webhookResponseData = response.data;
        isSuccess = true;
    } catch (error) {
        webhookResponseData = error.response?.data || error.message;
        isSuccess = false;
    }

    // If it was already sent successfully before, we DO NOT change the DB status.
    // "succes wala pending nahe hosakte", "agr sent hogaya tho ow change nahe hoga"
    if (transaction.webhookStatus !== 'sent') {
        transaction.webhookStatus = isSuccess ? 'sent' : 'failed';
        transaction.webhookResponse = webhookResponseData;
        await transaction.save();
    }

    if (isSuccess) {
        return res.status(200).json({
            success: true,
            message: 'Webhook sent successfully!',
            webhookStatus: transaction.webhookStatus,
            webhookResponse: webhookResponseData
        });
    } else {
        return res.status(400).json({
            success: false,
            message: `Webhook failed: ${JSON.stringify(webhookResponseData)}`,
            webhookStatus: transaction.webhookStatus,
            webhookResponse: webhookResponseData
        });
    }
  } catch (error) {
    console.error('Resend Webhook Error:', error);
    res.status(500).json({ success: false, message: 'Server Error resending webhook' });
  }
};

/**
 * @desc    Get all transactions across the system (Superadmin)
 * @route   GET /api/dashboard/admin/transactions
 */
export const getAllSystemTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = 'all',
      type = 'all',
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Exact Match Filters
    if (status !== 'all') query.status = status;
    if (type !== 'all') query.type = type;
    if (req.query.merchantId) query.merchantId = req.query.merchantId;

    // Date Range Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search by transactionId, gatewayOrderId, accountNumber, or User details
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { businessName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const userIds = users.map(u => u._id);

      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { gatewayOrderId: { $regex: search, $options: 'i' } },
        { 'customerDetails.accountNumber': { $regex: search, $options: 'i' } },
        { merchantId: { $in: userIds } }
      ];
    }

    const sortConfig = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [transactions, totalCount] = await Promise.all([
      Transaction.find(query)
        .populate('merchantId', 'name email businessName')
        .sort(sortConfig)
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Transaction.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        totalRecords: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('getAllSystemTransactions Error:', error);
    res.status(500).json({ success: false, message: 'Server Error processing system transactions' });
  }
};

/**
 * @desc    Get detailed analytics for Superadmin (Top users, Performance List)
 * @route   GET /api/dashboard/admin/analytics
 */
export const getAdminAnalytics = async (req, res) => {
  try {
    const { days = 7, startDate, endDate } = req.query; // 7 or 30

    let topMerchantsMatchQuery = { status: 'completed' };
    let lifetimeMatchQuery = {}; // We want lifetime data for allMerchantsStats, but if the user wants filtered date, we can apply it. Let's see.

    if (startDate && endDate) {
      topMerchantsMatchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
      lifetimeMatchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (days === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      topMerchantsMatchQuery.createdAt = { $gte: today };
      lifetimeMatchQuery.createdAt = { $gte: today };
    } else if (days === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      topMerchantsMatchQuery.createdAt = { $gte: yesterday, $lt: today };
      lifetimeMatchQuery.createdAt = { $gte: yesterday, $lt: today };
    } else if (days !== 'lifetime') {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - parseInt(days));
      dateLimit.setHours(0, 0, 0, 0);
      topMerchantsMatchQuery.createdAt = { $gte: dateLimit };
      lifetimeMatchQuery.createdAt = { $gte: dateLimit };
    }

    // 1. Top Merchants by Volume (for the selected time period)
    const topMerchants = await Transaction.aggregate([
      {
        $match: topMerchantsMatchQuery
      },
      {
        $group: {
          _id: "$merchantId",
          totalVolume: { $sum: "$amount" },
          txCount: { $sum: 1 }
        }
      },
      { $sort: { totalVolume: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'merchant'
        }
      },
      { $unwind: "$merchant" },
      {
        $project: {
          _id: 1,
          totalVolume: 1,
          txCount: 1,
          "merchant.name": 1,
          "merchant.email": 1,
          "merchant.businessName": 1
        }
      }
    ]);

    // 2. All Merchants Performance List (Lifetime or based on filter?)
    // User requested: "user ne ketna ajtak payment link ceate keya number of transaction total ketna amount payin keya and petna payout yea sab"
    // "ajtak" means lifetime (Overall), so we completely ignore the date filter for this table!

    const allMerchantsStats = await Transaction.aggregate([
      {
        // Apply the same date filter as topMerchants, but without filtering by status=completed
        $match: lifetimeMatchQuery
      },
      {
        $group: {
          _id: "$merchantId",
          totalLinksCreated: {
            $sum: { $cond: [{ $eq: ["$type", "payment"] }, 1, 0] }
          },
          totalCreatedAmount: {
            $sum: { $cond: [{ $eq: ["$type", "payment"] }, "$amount", 0] }
          },
          successCount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "payment"] }, { $eq: ["$status", "completed"] }] }, 1, 0] }
          },
          successAmount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "payment"] }, { $eq: ["$status", "completed"] }] }, "$amount", 0] }
          },
          pendingCount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "payment"] }, { $eq: ["$status", "pending"] }] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "payment"] }, { $eq: ["$status", "pending"] }] }, "$amount", 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "payment"] }, { $eq: ["$status", "failed"] }] }, 1, 0] }
          },
          failedAmount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "payment"] }, { $eq: ["$status", "failed"] }] }, "$amount", 0] }
          },
          payoutCreatedCount: {
            $sum: { $cond: [{ $eq: ["$type", "withdrawal"] }, 1, 0] }
          },
          payoutCreatedAmount: {
            $sum: { $cond: [{ $eq: ["$type", "withdrawal"] }, "$amount", 0] }
          },
          payoutSuccessCount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "withdrawal"] }, { $eq: ["$status", "completed"] }] }, 1, 0] }
          },
          payoutSuccessAmount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "withdrawal"] }, { $eq: ["$status", "completed"] }] }, "$amount", 0] }
          },
          payoutPendingCount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "withdrawal"] }, { $eq: ["$status", "pending"] }] }, 1, 0] }
          },
          payoutPendingAmount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "withdrawal"] }, { $eq: ["$status", "pending"] }] }, "$amount", 0] }
          },
          payoutFailedCount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "withdrawal"] }, { $eq: ["$status", "failed"] }] }, 1, 0] }
          },
          payoutFailedAmount: {
            $sum: { $cond: [{ $and: [{ $eq: ["$type", "withdrawal"] }, { $eq: ["$status", "failed"] }] }, "$amount", 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'merchant'
        }
      },
      { $unwind: "$merchant" },
      {
        $project: {
          _id: 1,
          totalLinksCreated: 1,
          totalCreatedAmount: 1,
          successCount: 1,
          successAmount: 1,
          pendingCount: 1,
          pendingAmount: 1,
          failedCount: 1,
          failedAmount: 1,
          payoutCreatedCount: 1,
          payoutCreatedAmount: 1,
          payoutSuccessCount: 1,
          payoutSuccessAmount: 1,
          payoutPendingCount: 1,
          payoutPendingAmount: 1,
          payoutFailedCount: 1,
          payoutFailedAmount: 1,
          "merchant.name": 1,
          "merchant.email": 1,
          "merchant.businessName": 1
        }
      },
      { $sort: { successAmount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      topMerchants,
      allMerchantsStats
    });

  } catch (error) {
    console.error('getAdminAnalytics Error:', error);
    res.status(500).json({ success: false, message: 'Server Error processing analytics' });
  }
};

/**
 * @desc    Sync a pending transaction status with AeroPay
 * @route   POST /api/dashboard/admin/transactions/:id/sync
 */
export const syncTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending transactions can be synced' });
    }

    let upstreamStatus;
    let newOrderState;
    let actualAmount;

    if (transaction.type === 'payment') {
      upstreamStatus = await queryUpstreamPayIn(transaction.transactionId);
      newOrderState = String(upstreamStatus.data?.orderState);
      actualAmount = upstreamStatus.data?.amount;
    } else if (transaction.type === 'withdrawal') {
      upstreamStatus = await queryUpstreamPayOut(transaction.transactionId);
      newOrderState = String(upstreamStatus.data?.orderState);
      actualAmount = upstreamStatus.data?.amount;
    }

    if (!upstreamStatus || !upstreamStatus.data) {
      return res.status(400).json({ success: false, message: 'Failed to fetch status from upstream' });
    }

    // Process based on new order state (1: Success, 2/4: Failed)
    if (newOrderState === '1') {
      transaction.status = 'completed';

      if (transaction.type === 'payment') {
        await User.findOneAndUpdate(
          { _id: transaction.merchantId },
          { $inc: { walletBalance: transaction.amount - (transaction.commissionAmount || 0), totalReceived: Number(actualAmount || transaction.amount) } }
        );
      }
      // For payout success, wallet is already deducted, no balance change needed

      await transaction.save();
      const merchant = await User.findById(transaction.merchantId);
      if (merchant) sendWebhookToMerchant(merchant, transaction);

      return res.status(200).json({ success: true, message: 'Transaction marked as completed and wallet updated.' });
    } else if (newOrderState === '2' || newOrderState === '4') {
      transaction.status = 'failed';

      if (transaction.type === 'withdrawal') {
        const refundAmount = transaction.amount + (transaction.commissionAmount || 0);
        await User.findOneAndUpdate(
          { _id: transaction.merchantId },
          { $inc: { walletBalance: refundAmount, totalWithdrawals: -transaction.amount } }
        );
      }

      await transaction.save();
      const merchant = await User.findById(transaction.merchantId);
      if (merchant) sendWebhookToMerchant(merchant, transaction);

      return res.status(200).json({ success: true, message: 'Transaction marked as failed.' });
    }

    return res.status(200).json({ success: true, message: 'Transaction is still pending on upstream.' });
  } catch (error) {
    console.error('Error syncing transaction:', error);
    res.status(500).json({ success: false, message: 'Server Error during sync', error: error.message });
  }
};

/**
 * @desc    Get K-Line chart data (hourly grouped by amount buckets)
 * @route   GET /api/merchant/dashboard/kline
 * @access  Private (Requires Token)
 */
export const getKLineData = async (req, res) => {
  try {
    const merchantId = req.user._id;
    const { date, type = 'payment', status = 'all' } = req.query;

    // Determine the date range (full day)
    let startOfDay, endOfDay;
    if (date) {
      startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
    } else {
      startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
    }

    // Build the query
    const query = {
      merchantId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      type
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const transactions = await Transaction.find(query).sort({ createdAt: 1 });

    // Initialize the hourly data structure (24 hours)
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      return {
        time: `${i.toString().padStart(2, '0')}:00`,
        '0-200': 0,
        '200-500': 0,
        '500-1000': 0,
        '1000-3000': 0,
        '3000+': 0,
        'Summary': 0
      };
    });

    // Populate data
    transactions.forEach(tx => {
      const hour = new Date(tx.createdAt).getHours();
      const amt = tx.amount;

      hourlyData[hour]['Summary'] += amt;

      if (amt <= 200) {
        hourlyData[hour]['0-200'] += amt;
      } else if (amt <= 500) {
        hourlyData[hour]['200-500'] += amt;
      } else if (amt <= 1000) {
        hourlyData[hour]['500-1000'] += amt;
      } else if (amt <= 3000) {
        hourlyData[hour]['1000-3000'] += amt;
      } else {
        hourlyData[hour]['3000+'] += amt;
      }
    });

    res.status(200).json({ success: true, data: hourlyData });
  } catch (error) {
    console.error('getKLineData Error:', error);
    res.status(500).json({ success: false, message: 'Server Error generating K-Line data' });
  }
};

/**
 * @desc    Cancel a queued/pending payout and refund the merchant
 * @route   POST /api/admin/transactions/:id/cancel-payout
 * @access  Private (Requires Token & Admin/Superadmin Role)
 */
export const cancelPayoutQueue = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaction = await Transaction.findById(id).populate('merchantId', 'name email callbackUrl webhookSecret');
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({ success: false, message: 'Only payout (withdrawal) transactions can be cancelled' });
    }
    if (transaction.status !== 'pending' && transaction.status !== 'queued') {
      return res.status(400).json({ success: false, message: `Cannot cancel transaction with status: ${transaction.status}` });
    }

    const refundAmount = transaction.amount + (transaction.commissionAmount || 0);
    const merchant = await User.findOneAndUpdate(
      { _id: transaction.merchantId._id },
      { $inc: { walletBalance: refundAmount, totalWithdrawals: -transaction.amount } },
      { new: true }
    );

    transaction.status = 'failed';
    transaction.description = 'Cancelled by Admin';
    await transaction.save();

    if (merchant) {
      sendWebhookToMerchant(merchant, transaction);
    }

    await logActivity(req.user._id, 'transaction_update', `Cancelled payout queue for TX: ${transaction.transactionId}`, req);

    res.status(200).json({ success: true, message: 'Payout cancelled and refunded successfully', transaction });

  } catch (error) {
    console.error('Cancel Payout Error:', error);
    res.status(500).json({ success: false, message: 'Server Error cancelling payout' });
  }
};
