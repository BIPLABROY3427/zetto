import jwt from 'jsonwebtoken';
import User from '../models/User.mjs';

export const apiOrJwtAuth = async (req, res, next) => {
  try {
    // Check for API Key first
    const apiKey = req.header('x-api-key');
    if (apiKey) {
      const merchant = await User.findOne({
        apiKey: apiKey
      });

      if (!merchant || apiKey === '') {
        return res.status(401).json({ success: false, message: 'Invalid or inactive API Key' });
      }

      if (merchant.isActive === false) {
        return res.status(403).json({ success: false, message: 'Merchant account is deactivated' });
      }

      req.user = merchant;
      return next();
    }

    // Fallback to JWT Auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'User account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    console.error('API/JWT Auth Error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};
