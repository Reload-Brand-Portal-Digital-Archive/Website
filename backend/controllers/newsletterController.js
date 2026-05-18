const db = require('../config/database');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { logAdminActivity } = require('../utils/activityLogger');

exports.subscribe = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    try {
        const [existing] = await db.query('SELECT * FROM newsletter_subscribers WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        const userId = req.user && req.user.id ? req.user.id : null;

        await db.query(
            'INSERT INTO newsletter_subscribers (email, user_id) VALUES (?, ?)',
            [email, userId]
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
            to: email,
            subject: '[RELOAD DISTRO] Berhasil Berlangganan Newsletter',
            html: `
                <div style="background-color: #000000; padding: 40px 20px; font-family: 'Courier New', Consolas, monospace;">
                    <div style="max-width: 520px; margin: 0 auto; border: 1px solid #1a1a1a; padding: 0;">
                        <div style="background-color: #0a0a0a; border-bottom: 1px solid #1a1a1a; padding: 20px 24px;">
                            <span style="color: #10b981; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase;">[ RELOAD DISTRO // NEWSLETTER ]</span>
                        </div>

                        <div style="padding: 32px 24px;">
                            <div style="margin-bottom: 28px;">
                                <span style="color: #eab308; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; display: block; margin-bottom: 8px;">> SUBSCRIPTION CONFIRMED</span>
                                <h1 style="color: #fafafa; font-size: 20px; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; font-weight: bold;">Welcome to the Underground</h1>
                            </div>

                            <p style="color: #71717a; font-size: 12px; line-height: 1.6; margin: 0 0 24px 0;">
                                Terima kasih telah berlangganan newsletter kami. Email Anda (<span style="color: #d4d4d8;">${email}</span>) telah terdaftar di sistem.
                            </p>
                            
                            <p style="color: #71717a; font-size: 12px; line-height: 1.6; margin: 0 0 24px 0;">
                                Anda sekarang akan menjadi yang pertama mendapatkan akses ke rilisan terbaru, diskon eksklusif, dan info drop rahasia.
                            </p>

                            <div style="margin-bottom: 32px;">
                                <a href="http://localhost:5173/shop" target="_blank" style="display: inline-block; background-color: #0a0a0a; border: 1px solid #10b981; color: #10b981; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase;">[ EKSPLOR KOLEKSI KAMI ]</a>
                            </div>

                            <div style="margin-top: 40px; text-align: center;">
                                <a href="http://localhost:5173/unsubscribe?email=${encodeURIComponent(email)}" style="color: #52525b; font-size: 10px; text-decoration: underline; letter-spacing: 0.1em; text-transform: uppercase;">[ UNSUBSCRIBE ]</a>
                            </div>
                        </div>

                        <div style="background-color: #0a0a0a; border-top: 1px solid #1a1a1a; padding: 16px 24px; text-align: center;">
                            <span style="color: #27272a; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;">© ${new Date().getFullYear()} RELOAD DISTRO // ALL RIGHTS RESERVED</span>
                        </div>
                    </div>
                </div>
            `
        };

        transporter.sendMail(mailOptions).catch(err => console.error('Failed to send newsletter welcome email:', err));

        res.status(201).json({ message: 'Terima kasih telah berlangganan!' });
    } catch (error) {
        console.error('Newsletter Subscribe Error:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
};

exports.getAllSubscribers = async (req, res) => {
    try {
        const [subscribers] = await db.query(`
            SELECT n.*, u.name as user_name 
            FROM newsletter_subscribers n
            LEFT JOIN users u ON n.user_id = u.user_id
            ORDER BY n.created_at DESC
        `);
        res.json(subscribers);
    } catch (error) {
        console.error('Get Newsletter Subscribers Error:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
};

exports.deleteSubscriber = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query('DELETE FROM newsletter_subscribers WHERE newsletter_id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Subscriber not found.' });
        }
        
        await logAdminActivity(req, 'DELETE', 'Newsletter', id, { newsletter_id: id });
        
        res.json({ message: 'Subscriber deleted successfully.' });
    } catch (error) {
        console.error('Delete Newsletter Subscriber Error:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const [totalResult] = await db.query('SELECT COUNT(*) as total FROM newsletter_subscribers');
        const total = totalResult[0].total;

        const [monthlyResult] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                COUNT(*) as count
            FROM newsletter_subscribers
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
            LIMIT 12
        `);

        const monthlyStats = monthlyResult.map(row => ({
            name: row.month,
            count: row.count
        }));

        res.json({
            total,
            monthlyStats
        });
    } catch (error) {
        console.error('Get Newsletter Stats Error:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
};

exports.exportData = async (req, res) => {
    const { format } = req.params;
    
    try {
        const [subscribers] = await db.query(`
            SELECT n.*, u.name as user_name 
            FROM newsletter_subscribers n
            LEFT JOIN users u ON n.user_id = u.user_id
            ORDER BY n.created_at DESC
        `);

        if (format === 'csv') {
            let csv = 'Email,User Status,Subscribed Date\n';
            subscribers.forEach(sub => {
                const status = sub.user_name ? 'Registered' : 'Guest';
                const date = new Date(sub.created_at).toISOString().split('T')[0];
                csv += `${sub.email},${status},${date}\n`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=newsletter_subscribers.csv');
            await logAdminActivity(req, 'READ', 'Newsletter', null, { action: 'export_subscribers', format: 'csv' });
            return res.status(200).send(csv);
            
        } else if (format === 'excel') {
            const ExcelJS = require('exceljs');
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Subscribers');
            
            worksheet.columns = [
                { header: 'Email', key: 'email', width: 35 },
                { header: 'User Status', key: 'status', width: 20 },
                { header: 'Subscribed Date', key: 'date', width: 20 }
            ];

            subscribers.forEach(sub => {
                worksheet.addRow({
                    email: sub.email,
                    status: sub.user_name ? 'Registered' : 'Guest',
                    date: new Date(sub.created_at).toISOString().split('T')[0]
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=newsletter_subscribers.xlsx');
            
            await logAdminActivity(req, 'READ', 'Newsletter', null, { action: 'export_subscribers', format: 'excel' });
            await workbook.xlsx.write(res);
            return res.end();
            
        } else if (format === 'pdf') {
            const PDFDocument = require('pdfkit-table');
            const doc = new PDFDocument({ margin: 30, size: 'A4' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=newsletter_subscribers.pdf');
            doc.pipe(res);

            const imagePath = path.join(__dirname, '../../frontend/src/assets/reload_transparent.png');
            if (fs.existsSync(imagePath)) {
                doc.save();
                doc.opacity(0.75);
                doc.translate(doc.page.width / 2, doc.page.height / 2);
                doc.rotate(-45);
                doc.image(imagePath, -250, -250, { width: 600 });
                doc.restore();
            }

            doc.font('Helvetica-Bold').fontSize(16).text('Reload Distro - Newsletter Subscribers', { align: 'center' });
            doc.moveDown(2);

            const table = {
                title: 'Subscriber List',
                headers: ['Email', 'Status', 'Subscribed Date'],
                rows: subscribers.map(sub => [
                    sub.email,
                    sub.user_name ? 'Registered' : 'Guest',
                    new Date(sub.created_at).toISOString().split('T')[0]
                ])
            };

            await doc.table(table, {
                width: 500,
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
                prepareRow: () => doc.font('Helvetica').fontSize(10)
            });

            await logAdminActivity(req, 'READ', 'Newsletter', null, { action: 'export_subscribers', format: 'pdf' });
            doc.end();
            return;
        } else {
            return res.status(400).json({ message: 'Invalid format requested' });
        }

    } catch (error) {
        console.error('Export Newsletter Error:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
};

exports.unsubscribePublic = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: 'Email parameter is required' });
    }

    try {
        const [result] = await db.query('DELETE FROM newsletter_subscribers WHERE email = ?', [email]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Email not found in our records' });
        }

        res.status(200).json({ message: 'Successfully unsubscribed' });
    } catch (error) {
        console.error('Public Unsubscribe Error:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
};

exports.unsubscribeAuth = async (req, res) => {
    const userId = req.user.id;

    try {
        const [result] = await db.query('DELETE FROM newsletter_subscribers WHERE user_id = ?', [userId]);

        res.status(200).json({ message: 'Successfully unsubscribed' });
    } catch (error) {
        console.error('Auth Unsubscribe Error:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
};

exports.checkStatus = async (req, res) => {
    const userId = req.user.id;

    try {
        const [rows] = await db.query('SELECT newsletter_id FROM newsletter_subscribers WHERE user_id = ?', [userId]);
        const isSubscribed = rows.length > 0;
        res.status(200).json({ isSubscribed });
    } catch (error) {
        console.error('Check Newsletter Status Error:', error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
};
