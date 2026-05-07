const db = require('../config/database');

/**
 * Logs an admin activity to the database.
 * @param {Object} req - The Express request object (must have req.user)
 * @param {string} action - 'CREATE', 'UPDATE', 'DELETE', etc.
 * @param {string} entityType - The entity being modified, e.g., 'Product', 'Category', 'Settings'
 * @param {string|number|null} entityId - The ID of the entity, if applicable
 * @param {Object} details - Additional details about the action (e.g. form data)
 */
const logAdminActivity = async (req, action, entityType, entityId = null, details = {}) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            console.warn('logAdminActivity: No user found in req.user. Activity will not be logged.');
            return;
        }

        const sanitizedDetails = { ...details };
        const sensitiveKeys = ['password', 'oldPassword', 'newPassword', 'confirmPassword', 'token'];
        Object.keys(sanitizedDetails).forEach(key => {
            if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
                sanitizedDetails[key] = '***HIDDEN***';
            }
        });

        const detailsJson = JSON.stringify(sanitizedDetails);

        const query = `
            INSERT INTO admin_activity_logs (user_id, action, entity_type, entity_id, details)
            VALUES (?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [userId, action, entityType, entityId ? String(entityId) : null, detailsJson]);
    } catch (error) {
        console.error('Failed to log admin activity:', error);
    }
};

module.exports = {
    logAdminActivity
};
