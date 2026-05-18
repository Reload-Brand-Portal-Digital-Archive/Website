const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
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

exports.uploadFounderImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const founderIndex = parseInt(req.body.founder_index) || 0;
        if (founderIndex < 0 || founderIndex > 2) {
            return res.status(400).json({ success: false, message: 'Invalid founder index (0-2)' });
        }

        const filePath = req.file.path.replace(/\\/g, '/');
        const settingKey = `about_founder_image_${founderIndex}`;
        
        const queries = [
            db.query(
                'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                [settingKey, filePath]
            )
        ];
        if (founderIndex === 0) {
            queries.push(
                db.query(
                    'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                    ['about_founder_image', filePath]
                )
            );
        }
        await Promise.all(queries);

        await logAdminActivity(req, 'UPDATE', 'Settings', null, { [settingKey]: filePath });

        res.status(200).json({ success: true, message: 'Founder image updated successfully', data: { [settingKey]: filePath } });
    } catch (error) {
        console.error('Upload Founder Image Error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload founder image' });
    }
};

exports.requestPasswordChangeOtp = async (req, res) => {
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

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        const tempToken = jwt.sign(
            { id: userId, otpHash, newPasswordHash }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1m' }
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: '[RELOAD DISTRO] Password Change OTP',
            html: `
                <div style="background-color: #000000; padding: 40px 20px; font-family: 'Courier New', Consolas, monospace;">
                    <div style="max-width: 520px; margin: 0 auto; border: 1px solid #1a1a1a; padding: 0;">
                        <div style="background-color: #0a0a0a; border-bottom: 1px solid #1a1a1a; padding: 20px 24px;">
                            <span style="color: #ef4444; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase;">[ RELOAD DISTRO // SECURITY ]</span>
                        </div>
                        <div style="padding: 32px 24px;">
                            <div style="margin-bottom: 28px;">
                                <h1 style="color: #fafafa; font-size: 20px; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; font-weight: bold;">Password Change OTP</h1>
                            </div>
                            <p style="color: #71717a; font-size: 12px; line-height: 1.6; margin: 0 0 24px 0;">
                                Halo, <span style="color: #d4d4d8;">${user.name}</span>. Gunakan kode OTP di bawah ini untuk melanjutkan proses perubahan password Anda. Kode ini berlaku selama 1 menit.
                            </p>
                            <div style="margin-bottom: 32px; background-color: #1a1a1a; padding: 20px; text-align: center; border: 1px dashed #3f3f46;">
                                <span style="color: #eab308; font-size: 24px; font-weight: bold; letter-spacing: 0.5em;">${otp}</span>
                            </div>
                            <p style="color: #3f3f46; font-size: 11px; line-height: 1.5; margin: 0;">
                                Jika Anda tidak merasa melakukan perubahan password, abaikan email ini.
                            </p>
                        </div>
                        <div style="background-color: #0a0a0a; border-top: 1px solid #1a1a1a; padding: 16px 24px; text-align: center;">
                            <span style="color: #27272a; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;">© ${new Date().getFullYear()} RELOAD DISTRO // ALL RIGHTS RESERVED</span>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            success: true, 
            message: 'OTP telah dikirim ke email Anda!',
            requireOtp: true,
            tempToken: tempToken
        });
    } catch (error) {
        console.error('Request Password Change OTP Error:', error);
        res.status(500).json({ success: false, message: 'Failed to request OTP' });
    }
};

exports.verifyPasswordChangeOtp = async (req, res) => {
    try {
        const { tempToken, otp } = req.body;

        if (!tempToken || !otp) {
            return res.status(400).json({ success: false, message: 'Token atau OTP tidak valid' });
        }

        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
        
        const isMatch = await bcrypt.compare(otp, decoded.otpHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Kode OTP salah' });
        }

        await db.query('UPDATE users SET password = ? WHERE user_id = ?', [decoded.newPasswordHash, decoded.id]);

        await logAdminActivity(req, 'UPDATE', 'Settings', decoded.id, { action: 'change_password' });

        res.status(200).json({ success: true, message: 'Password berhasil diperbarui!' });

    } catch (error) {
        console.error('Verify Password Change OTP Error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Kode OTP sudah kedaluwarsa. Silakan ulangi.' });
        }
        res.status(401).json({ success: false, message: 'Token tidak valid' });
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
