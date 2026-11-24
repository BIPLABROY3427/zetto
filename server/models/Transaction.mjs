import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ['payment', 'withdrawal', 'refund', 'freeze', 'unfreeze'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'queued', 'processing', 'refunded'],
      default: 'pending',
    },
    customerDetails: {
      name: String,
      email: String,
      phone: String,
      upiId: String,
    },
    description: {
      type: String,
    },
    gatewayOrderId: {
      type: String,
      index: true,
    },
    paymentUrl: {
      type: String,
    },
    upiId: {
      type: String,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    webhookStatus: {
      type: String,
      enum: ['pending', 'pending_retry', 'sent', 'failed'],
      default: 'pending',
    },
    webhookPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    webhookResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Basic indexing for faster dashboard queries
transactionSchema.index({ merchantId: 1, createdAt: -1 });
transactionSchema.index({ merchantId: 1, status: 1 });
transactionSchema.index({ merchantId: 1, type: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1, createdAt: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
