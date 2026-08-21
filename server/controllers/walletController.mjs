import User from '../models/User.mjs';
import Transaction from '../models/Transaction.mjs';

const COMMISSION_RATE = 0.05; // 5%

/**
 * @desc    Process incoming payment with 5% commission deduction using atomic operations
 * @route   POST /api/wallet/payment
 * @access  Private
 */
export const processPayment = async (req, res) => {
  try {
    const { amount, transactionId, customerDetails, description } = req.body;
    const merchantId = req.user._id;

    if (!amount || amount <= 0 || !transactionId) {
      return res.status(400).json({ success: false, message: 'Valid amount and transactionId are required' });
    }

    // Check if transaction ID already exists to prevent duplicate processing
    const existingTx = await Transaction.findOne({ transactionId });
    if (existingTx) {
      return res.status(400).json({ success: false, message: 'Transaction ID already processed' });
    }

    const commissionAmount = amount * COMMISSION_RATE;
    const netAmount = amount - commissionAmount;

    // 1. Update Merchant Balance Atomically using $inc
    const updatedMerchant = await User.findOneAndUpdate(
      { _id: merchantId },
      { 
        $inc: { 
          walletBalance: netAmount, 
          totalReceived: amount 
        } 
      },
      { new: true }
    );

    if (!updatedMerchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found' });
    }

    // 2. Create the Transaction Record
    const newTransaction = await Transaction.create({
      merchantId,
      transactionId,
      type: 'payment',
      amount: netAmount,
      status: 'completed',
      customerDetails,
      description: description || 'Payment received'
    });

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        creditedAmount: netAmount,
        commissionDeducted: commissionAmount,
        newBalance: updatedMerchant.walletBalance,
        transaction: newTransaction
      }
    });

  } catch (error) {
    console.error('Process Payment Error:', error);
    res.status(500).json({ success: false, message: 'Payment processing failed' });
  }
};

/**
 * @desc    Request a withdrawal, deducting standard fee using atomic operations
 * @route   POST /api/wallet/withdraw
 * @access  Private
 */
export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, description } = req.body;
    const merchantId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid requested amount is required' });
    }

    // Calculate total deduction requirement (Requested amount + 5% platform fee)
    const withdrawalFee = amount * COMMISSION_RATE;
    const totalDeductionRequired = amount + withdrawalFee;

    // 1. Safely deduct from Merchant Wallet Atomically. 
    // The query criteria ({ walletBalance: { $gte: totalDeductionRequired } }) prevents race conditions.
    const updatedMerchant = await User.findOneAndUpdate(
      { _id: merchantId, walletBalance: { $gte: totalDeductionRequired } },
      {
        $inc: {
          walletBalance: -totalDeductionRequired,
          totalWithdrawals: amount
        }
      },
      { new: true }
    );

    if (!updatedMerchant) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient wallet balance or merchant not found. You need ₹${totalDeductionRequired} to withdraw ₹${amount} due to a 5% fee.` 
      });
    }

    // 2. Create the Transaction Record
    const txId = `tx_wout_${Math.random().toString(36).substr(2, 9)}`;
    
    const newTransaction = await Transaction.create({
      merchantId,
      transactionId: txId,
      type: 'withdrawal',
      amount: amount, 
      status: 'completed', 
      description: description || `Withdrawal of ₹${amount} with ₹${withdrawalFee} fee`
    });

    res.status(200).json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        requestedAmount: amount,
        feeDeducted: withdrawalFee,
        totalDeducted: totalDeductionRequired,
        newBalance: updatedMerchant.walletBalance,
        transaction: newTransaction
      }
    });

  } catch (error) {
    console.error('Withdrawal Error:', error);
    res.status(500).json({ success: false, message: 'Withdrawal failed' });
  }
};
