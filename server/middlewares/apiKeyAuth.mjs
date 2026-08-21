import User from '../models/User.mjs';


export const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.header('x-api-key');

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'API Key is missing' });
    }

    // Find a merchant (user) that has this exact active api key inside their apiKeys array
    const merchant = await User.findOne({
      'apiKeys.key': apiKey,
      'apiKeys.isActive': true
    });

    if (!merchant) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive API Key' });
    }

    // Attach user payload to req object for controllers to use downstream
    req.user = merchant;
    next();
  } catch (error) {
    console.error('API Key Auth Error:', error);
    res.status(500).json({ success: false, message: 'Server Errors verifying API Key' });
  }
};
