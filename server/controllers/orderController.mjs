import Order from '../models/Order.mjs';
import QRCode from 'qrcode';

/**
 * @desc    Generate an Order dynamically assigning a random valid UPI destination
 * @route   POST /api/orders/create
 * @access  Private (Requires x-api-key)
 */
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const merchant = req.merchant; 

    // Validate Input
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid numeric amount greater than 0 is required' });
    }

    // Load Balancing: Filter eligible UPI IDs from the merchant's pool
    const eligibleUpis = merchant.upiPool.filter(u => {
      return u.isActive === true && (u.currentVolume + amount <= u.dailyLimit);
    });

    if (eligibleUpis.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No eligible payment vectors available. Transaction limits may be exceeded or no UPI mapping exists.' 
      });
    }

    // Randomize the valid upi targets to distribute loads
    const randomIndex = Math.floor(Math.random() * eligibleUpis.length);
    const assignedUpiTarget = eligibleUpis[randomIndex];

    // Generate Order UUID
    const orderId = `ord_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;

    // Establish TTL for order expiration (10 minutes from exactly now)
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);

    // 1. Construct standard UPI string mapped exactly to the securely drawn assignedUpiTarget
    const upiString = `upi://pay?pa=${assignedUpiTarget.upiId}&pn=${encodeURIComponent(merchant.name)}&am=${amount}&tr=${orderId}&cu=INR`;

    // 2. Base64 Encode cleanly
    const qrCodeDataUri = await QRCode.toDataURL(upiString, {
      margin: 2,
      scale: 10,
      color: { dark: '#0f172a', light: '#ffffff' }
    });

    // 3. Persist intended target and TTL timestamp so we can track payment status synchronously
    const newOrder = await Order.create({
      merchantId: merchant._id,
      orderId,
      amount,
      status: 'created',
      currency: 'INR',
      assignedUpi: assignedUpiTarget.upiId,
      expiresAt: expirationTime
    });

    // We do NOT permanently increment `currentVolume` on the Merchant pool yet.
    // That should realistically be done firmly upon webhook verification of success. But the router works.

    res.status(201).json({
      success: true,
      message: 'Payment order generated successfully',
      order: {
        orderId: newOrder.orderId,
        amount: newOrder.amount,
        status: newOrder.status,
        expiresAt: newOrder.expiresAt, // Send TTL reference back for timer UI rendering normally
        assignedUpi: newOrder.assignedUpi
      },
      payment: {
        upiString,
        qrCode: qrCodeDataUri
      }
    });

  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, message: 'Server Internal Error generating dynamic order' });
  }
};
