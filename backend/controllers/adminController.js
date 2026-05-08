const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { logAdminActivity } = require('../utils/activityLogger');

exports.getSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT setting_key, setting_value FROM site_settings');
        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('Fetch Settings Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = req.body;
        
        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }

        const keys = Object.keys(settings);
        if (keys.length === 0) {
            return res.status(400).json({ success: false, message: 'No settings to update' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            for (const key of keys) {
                const value = settings[key] !== null ? String(settings[key]) : '';
                await connection.query(
                    'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                    [key, value]
                );
            }

            await connection.commit();
            await logAdminActivity(req, 'UPDATE', 'Settings', null, settings);
            res.status(200).json({ success: true, message: 'Settings updated successfully' });
        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
};

exports.uploadHeroImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = req.file.path.replace(/\\/g, '/');
        
        await db.query(
            'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
            ['hero_banner_image', filePath]
        );

        await logAdminActivity(req, 'UPDATE', 'Settings', null, { hero_banner_image: filePath });

        res.status(200).json({ success: true, message: 'Hero banner updated successfully', data: { hero_banner_image: filePath } });
    } catch (error) {
        console.error('Upload Hero Image Error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload image' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Old and new passwords are required' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect old password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, userId]);

        await logAdminActivity(req, 'UPDATE', 'Settings', userId, { action: 'change_password' });

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
};

exports.getActivityLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const countQuery = 'SELECT COUNT(*) as total FROM admin_activity_logs';
        const [countRows] = await db.query(countQuery);
        const total = countRows[0].total;

        const query = `
            SELECT al.*, u.name as admin_name 
            FROM admin_activity_logs al
            LEFT JOIN users u ON al.user_id = u.user_id
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `;
        const [logs] = await db.query(query, [limit, offset]);

        res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get Activity Logs Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch activity logs' });
    }
};
