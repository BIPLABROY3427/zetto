import Order from '../models/Order.mjs';
import Merchant from '../models/Merchant.mjs';
import { dispatchWebhook } from '../utils/webhookSender.mjs';

/**
 * @desc    Test Endpoint to Simulate a Bank successfully settling an Order Intent.
 *          This fires off the webhook dispatcher asynchronously!
 * @route   POST /api/orders/simulate-payment
 * @access  Superadmin / Admin ONLY — blocked in production
 */
export const simulatePaymentCompletion = async (req, res) => {
  // ─── SECURITY: Never allow this endpoint in production ───────────────────
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'This endpoint is not available in production.' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Order already completed' });
    }

    // Fetch Merchant to access webhooks & secrets
    const merchant = await Merchant.findById(order.merchantId);

    // 1. Mark Order as Completed
    order.status = 'completed';
    await order.save();

    // 2. Here, in production, we'd also call walletController logic to credit the balance via $inc

    // 3. Dispatch Background Webhook only if merchant exists
    if (merchant) {
      dispatchWebhook(merchant, order, 'success').catch(err => {
        console.error('Unhandled callback error:', err);
      });
    } else {
      console.warn(`[simulate-payment] No merchant found for merchantId=${order.merchantId} — webhook skipped.`);
    }

    res.status(200).json({
      success: true,
      message: 'Simulated payment completed. Webhook dispatcher initiated.',
      order: order.orderId
    });

  } catch (error) {
    console.error('Simulate Completion Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error simulating webhook' });
  }
};
