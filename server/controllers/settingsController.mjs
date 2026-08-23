import User from '../models/User.mjs';
import crypto from 'crypto';
import { logActivity } from '../services/activityLogger.mjs';

/**
 * @desc    Update Merchant Webhook Settings (callbackUrl)
 * @route   PUT /api/merchant/dashboard/settings/webhooks
 * @access  Private (Requires Token)
 */
export const updateWebhooks = async (req, res) => {
    try {
        const userId = req.user._id;
        const { callbackUrl, webhookSecret } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                callbackUrl, 
                webhookSecret: webhookSecret || crypto.randomBytes(16).toString('hex') 
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Webhook settings updated successfully',
            settings: {
                callbackUrl: updatedUser.callbackUrl,
                webhookSecret: updatedUser.webhookSecret
            }
        });

        logActivity(userId, 'settings_update', 'Updated webhook URL and secret', req);

    } catch (error) {
        console.error('Update Webhooks Error:', error);
        res.status(500).json({ success: false, message: 'Server error updating webhooks' });
    }
};

/**
 * @desc    Generate / Reset API Key for Merchant
 * @route   POST /api/merchant/dashboard/settings/apikey/reset
 * @access  Private (Requires Token)
 */
export const resetApiKey = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Generate a new 16-character alphanumeric API key (crypto hex)
        const newKey = crypto.randomBytes(8).toString('hex');

        // Update apiKey field
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { apiKey: newKey } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'API Key reset successfully',
            activeApiKey: updatedUser.apiKey
        });

        logActivity(userId, 'settings_update', 'Rotated API Secret Key', req);

    } catch (error) {
        console.error('Reset API Key Error:', error);
        res.status(500).json({ success: false, message: 'Server error resetting API Key' });
    }
};
