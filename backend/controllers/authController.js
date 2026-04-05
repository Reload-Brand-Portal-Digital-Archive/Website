const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Your email address has been registered!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, 'user']
        );

        res.status(201).json({ message: 'Registration successful!!', userId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Email not found!' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect password!' });
        }

        const payload = {
            id: user.user_id,
            role: user.role
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: 'Login successful!',
            token: token,
            user: { id: user.user_id, name: user.name, email: user.email, role: user.role, google_id: user.google_id || null }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred on the server' });
    }
};

exports.googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        let [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        let user = users[0];

        if (!user) {
            const [result] = await db.query(
                'INSERT INTO users (name, email, google_id, role) VALUES (?, ?, ?, ?)',
                [name, email, googleId, 'user']
            );
            user = { user_id: result.insertId, name, email, role: 'user' };
        } else if (!user.google_id) {
            await db.query('UPDATE users SET google_id = ? WHERE email = ?', [googleId, email]);
        }

        const jwtToken = jwt.sign(
            { id: user.user_id || user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Google Login berhasil!',
            token: jwtToken,
            user: { id: user.user_id || user.id, name: user.name, email: user.email, role: user.role, google_id: user.google_id || null }
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Otorisasi Google gagal atau token tidak valid!' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Email tidak terdaftar!' });
        }

        const user = users[0];
        if (user.google_id && !user.password) {
            return res.status(400).json({ message: 'Akun ini menggunakan Google SSO. Silakan Login with Google.' });
        }

        const secret = process.env.JWT_SECRET + user.password;
        const payload = { email: user.email, id: user.user_id };
        const token = jwt.sign(payload, secret, { expiresIn: '15m' });
        const resetLink = `http://localhost:5173/reset-password/${user.user_id}/${token}`;
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
            subject: '[RELOAD DISTRO] Permintaan Reset Password',
            html: `
                <div style="background-color: #000000; padding: 40px 20px; font-family: 'Courier New', Consolas, monospace;">
                    <div style="max-width: 520px; margin: 0 auto; border: 1px solid #1a1a1a; padding: 0;">
                        <!-- Header -->
                        <div style="background-color: #0a0a0a; border-bottom: 1px solid #1a1a1a; padding: 20px 24px;">
                            <span style="color: #ef4444; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase;">[ RELOAD DISTRO // SECURITY ]</span>
                        </div>

                        <!-- Body -->
                        <div style="padding: 32px 24px;">
                            <div style="margin-bottom: 28px;">
                                <span style="color: #eab308; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; display: block; margin-bottom: 8px;">> PASSWORD WARNING</span>
                                <h1 style="color: #fafafa; font-size: 20px; margin: 0; text-transform: uppercase; letter-spacing: 0.08em; font-weight: bold;">Reset Password</h1>
                            </div>

                            <p style="color: #71717a; font-size: 12px; line-height: 1.6; margin: 0 0 24px 0;">
                                Halo, <span style="color: #d4d4d8;">${user.name}</span>. Kami menerima permintaan untuk mereset password akun RELOAD Anda.
                            </p>
                            
                            <p style="color: #71717a; font-size: 12px; line-height: 1.6; margin: 0 0 24px 0;">
                                Silakan klik tombol di bawah ini untuk membuat password baru (berlaku selama 15 menit):
                            </p>

                            <!-- Action Button -->
                            <div style="margin-bottom: 32px;">
                                <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #0a0a0a; border: 1px solid #ef4444; color: #ef4444; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase;">[ RESET PASSWORD ]</a>
                            </div>

                            <p style="color: #3f3f46; font-size: 11px; line-height: 1.5; margin: 0;">
                                Jika Anda tidak merasa meminta reset password, abaikan email ini.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="background-color: #0a0a0a; border-top: 1px solid #1a1a1a; padding: 16px 24px; text-align: center;">
                            <span style="color: #27272a; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;">© ${new Date().getFullYear()} RELOAD DISTRO // ALL RIGHTS RESERVED</span>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Link reset password telah dikirim ke email Anda!' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

exports.resetPassword = async (req, res) => {
    const { id, token } = req.params;
    const { newPassword } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ message: 'User tidak ditemukan!' });

        const user = users[0];
        const secret = process.env.JWT_SECRET + user.password;

        try {
            jwt.verify(token, secret);
        } catch (err) {
            return res.status(403).json({ message: 'Link reset tidak valid atau sudah kedaluwarsa!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, id]);

        res.json({ message: 'Password berhasil diubah! Silakan login dengan password baru.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};