import jwt from 'jsonwebtoken';
import Merchant from '../models/Merchant.mjs';

/**
 * Middleware to protect routes that require authentication
 */
export const parentAuth = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Missing token.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the merchant by id
    const merchant = await Merchant.findById(decoded.id);

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Attach merchant to request object
    req.merchant = merchant;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Invalid or expired token.',
    });
  }
};
