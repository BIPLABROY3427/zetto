import User from '../models/User.mjs';
import Transaction from '../models/Transaction.mjs';
import { sendWebhookToMerchant } from './gatewayController.mjs';

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

    todaysTransactions.forEach(tx => {
      if (tx.type === 'payment') {
        inAmount += tx.amount;
        if (tx.status === 'completed') inSuccAmount += tx.amount;
      } else if (tx.type === 'withdrawal') {
        outAmount += tx.amount;
        if (tx.status === 'completed') outSuccAmount += tx.amount;
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
          inSuccRate: inAmount > 0 ? (inSuccAmount / inAmount) * 100 : 0,
          outSuccAmount,
          outAmount,
          outSuccRate: outAmount > 0 ? (outSuccAmount / outAmount) * 100 : 0,
        }
      },
      settings: {
        commissionRate: merchant.commissionRate || 0.05,
        callbackUrl: merchant.callbackUrl || '',
        webhookSecret: merchant.webhookSecret || '',
        activeApiKey: merchant.apiKeys?.find(k => k.isActive)?.key || null
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
    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    if (!merchant.callbackUrl) {
      return res.status(400).json({ success: false, message: 'Merchant does not have a callback URL set' });
    }

    await sendWebhookToMerchant(merchant, transaction);

    res.status(200).json({ 
      success: true, 
      message: `Webhook sent with status: ${transaction.webhookStatus}`,
      webhookStatus: transaction.webhookStatus,
      webhookResponse: transaction.webhookResponse
    });
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

    // Date Range Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search by transactionId or gatewayOrderId
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { gatewayOrderId: { $regex: search, $options: 'i' } },
        { 'customerDetails.accountNumber': { $regex: search, $options: 'i' } }
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
      dateLimit.setHours(0,0,0,0);
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
        $group: {
          _id: "$merchantId",
          totalLinksCreated: { 
            $sum: { $cond: [{ $eq: ["$type", "payment"] }, 1, 0] } 
          },
          totalPayinAmount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$type", "payment"] }, { $eq: ["$status", "completed"] }] }, "$amount", 0]
            }
          },
          totalPayoutAmount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$type", "withdrawal"] }, { $eq: ["$status", "completed"] }] }, "$amount", 0]
            }
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
          totalPayinAmount: 1,
          totalPayoutAmount: 1,
          "merchant.name": 1,
          "merchant.email": 1,
          "merchant.businessName": 1
        }
      },
      { $sort: { totalPayinAmount: -1 } }
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
