import ActivityLog from '../models/ActivityLog.mjs';

/**
 * Utility to log user activity
 * @param {String} userId - The ID of the user performing the action
 * @param {String} action - Short identifier for the action (e.g. 'login', 'password_change')
 * @param {String} description - Human readable description of the action
 * @param {Object} req - The Express request object (to extract IP)
 */
export const logActivity = async (userId, action, description, req) => {
    try {
        if (!userId) return;

        // Get IP from request (handling proxies)
        let ip = '';
        if (req) {
            ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
            if (ip.includes(',')) ip = ip.split(',')[0].trim();
        }

        await ActivityLog.create({
            userId,
            action,
            description,
            ip
        });
    } catch (error) {
        // We log the error but don't throw it so it doesn't break the main flow
        console.error('Failed to log activity:', error);
    }
};
