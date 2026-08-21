import mongoose from 'mongoose';

const webhookLogSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    payload: {
      type: Object,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    responseCode: {
      type: Number,
    },
    errorLog: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const WebhookLog = mongoose.model('WebhookLog', webhookLogSchema);
export default WebhookLog;
