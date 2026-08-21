import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // Minimum 1 INR
    },
    status: {
      type: String,
      enum: ['created', 'processing', 'completed', 'failed'],
      default: 'created',
    },
    currency: {
      type: String,
      default: 'INR'
    },
    qrData: {
      type: String,
    },
    assignedUpi: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ orderId: 1, merchantId: 1 });
orderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB native TTL mapping

const Order = mongoose.model('Order', orderSchema);
export default Order;
