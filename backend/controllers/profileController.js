const db = require('../config/database');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

exports.getWholesaleOrders = async (req, res) => {
    const userId = req.user.id;

    try {
        const [orders] = await db.query(
            'SELECT * FROM wholesale_orders WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        if (orders.length === 0) {
            return res.status(200).json([]);
        }

        const orderIds = orders.map(o => o.order_id);
        const [items] = await db.query(
            'SELECT * FROM order_items WHERE order_id IN (?)',
            [orderIds]
        );

        const itemsByOrder = {};
        items.forEach(item => {
            if (!itemsByOrder[item.order_id]) {
                itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push(item);
        });

        const ordersWithItems = orders.map(order => ({
            ...order,
            items: itemsByOrder[order.order_id] || []
        }));

        res.status(200).json(ordersWithItems);
    } catch (error) {
        console.error('Error fetching user wholesale orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { name, currentPassword, newPassword } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found!' });
        }

        const user = users[0];
        const updates = [];
        const values = [];

        if (name && name.trim() !== '') {
            updates.push('name = ?');
            values.push(name.trim());
        }
        if (newPassword) {
            if (user.google_id && !user.password) {
                return res.status(400).json({ message: 'Google SSO accounts cannot change password.' });
            }

            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to set a new password.' });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect!' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No changes to update.' });
        }

        values.push(userId);
        await db.query(`UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`, values);

        if (newPassword) {
            try {
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
                    subject: '[RELOAD DISTRO] Password Anda Telah Diubah',
                    html: `
                        <div style="background-color: #09090b; padding: 40px 20px; font-family: 'Courier New', Consolas, monospace;">
                            <div style="max-width: 500px; margin: 0 auto; border: 1px solid #27272a; padding: 32px;">
                                <div style="border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px;">
                                    <span style="color: #22c55e; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;">[ RELOAD SECURITY ]</span>
                                </div>
                                <h2 style="color: #fafafa; font-size: 18px; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.05em;">Password Updated</h2>
                                <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">
                                    Halo, <span style="color: #fafafa; font-weight: bold;">${user.name}</span>!
                                </p>
                                <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
                                    Password akun RELOAD Anda telah berhasil diubah pada <span style="color: #22c55e;">${new Date().toLocaleString('id-ID')}</span>.
                                </p>
                                <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">
                                    Jika Anda tidak melakukan perubahan ini, segera hubungi tim kami.
                                </p>
                                <div style="border-top: 1px solid #27272a; padding-top: 16px; margin-top: 24px;">
                                    <span style="color: #52525b; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase;">© ${new Date().getFullYear()} RELOAD DISTRO</span>
                                </div>
                            </div>
                        </div>
                    `
                };

                await transporter.sendMail(mailOptions);
            } catch (emailError) {
                console.error('Failed to send password change email:', emailError);
            }
        }

        const [updatedUsers] = await db.query('SELECT user_id, name, email, role, google_id FROM users WHERE user_id = ?', [userId]);

        res.status(200).json({
            message: newPassword ? 'Profile and password updated successfully!' : 'Profile updated successfully!',
            user: {
                id: updatedUsers[0].user_id,
                name: updatedUsers[0].name,
                email: updatedUsers[0].email,
                role: updatedUsers[0].role,
                google_id: updatedUsers[0].google_id
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
