import User from '../models/User.mjs';
import crypto from 'crypto';

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
        
        // Deactivate all existing keys
        await User.updateOne(
            { _id: userId },
            { $set: { "apiKeys.$[].isActive": false } }
        );

        // Generate a new secure API key
        const newKey = crypto.randomBytes(32).toString('hex');

        // Add new active key
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    apiKeys: {
                        key: newKey,
                        name: 'Primary API Key',
                        isActive: true
                    }
                }
            },
            { new: true }
        );

        const activeKey = updatedUser.apiKeys.find(k => k.isActive)?.key;

        res.status(200).json({
            success: true,
            message: 'API Key reset successfully',
            activeApiKey: activeKey
        });

    } catch (error) {
        console.error('Reset API Key Error:', error);
        res.status(500).json({ success: false, message: 'Server error resetting API Key' });
    }
};
