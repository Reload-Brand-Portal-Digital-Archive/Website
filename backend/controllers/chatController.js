const pool = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Multer config for chat file uploads ─────────────────────────────────────
const chatUploadDir = path.join(__dirname, '../uploads/chat');
if (!fs.existsSync(chatUploadDir)) fs.mkdirSync(chatUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, chatUploadDir),
    filename:    (req, file, cb) => {
        const ext  = path.extname(file.originalname);
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('File type not allowed'));
};

exports.chatUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
}).single('file');

// ─── Upload file and return URL ───────────────────────────────────────────────
exports.uploadFile = (req, res) => {
    exports.chatUpload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const fileUrl  = `/uploads/chat/${req.file.filename}`;
        const isImage  = req.file.mimetype.startsWith('image/');
        res.json({
            success:      true,
            url:          fileUrl,
            originalName: req.file.originalname,
            mimeType:     req.file.mimetype,
            size:         req.file.size,
            isImage
        });
    });
};

// ─── Send a message (text or file) ───────────────────────────────────────────
exports.sendMessage = async (req, res) => {
    const { message, sender, file_url, file_name, file_mime, message_type } = req.body;
    let userId;

    if (sender === 'user') {
        userId = req.user.id;
    } else if (sender === 'admin') {
        userId = req.body.userId;
    }

    // file messages may have empty message text
    const isFile   = !!file_url;
    const msgText  = message || (isFile ? (file_name || 'File') : null);
    const msgType  = message_type || (isFile ? (file_mime?.startsWith('image/') ? 'image' : 'file') : 'text');

    if (!userId || !msgText || !sender) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        const metadata = isFile
            ? JSON.stringify({ file_url, file_name: file_name || 'File', file_mime: file_mime || 'application/octet-stream' })
            : null;

        const [result] = await pool.query(
            'INSERT INTO chats (user_id, message, sender, message_type, metadata) VALUES (?, ?, ?, ?, ?)',
            [userId, msgText, sender, msgType, metadata]
        );
        res.status(201).json({ success: true, message: 'Message sent', chatId: result.insertId });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Get chat history for a specific user ────────────────────────────────────
exports.getMessages = async (req, res) => {
    let userId = req.user.id;

    if (req.user.role === 'admin' && req.params.userId) {
        userId = req.params.userId;
    }

    try {
        const [rows] = await pool.query(
            `SELECT chat_id, user_id, message, sender, message_type, metadata, is_read, created_at
             FROM chats
             WHERE user_id = ?
             ORDER BY created_at ASC`,
            [userId]
        );

        const messages = rows.map(row => ({
            ...row,
            metadata: row.metadata
                ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata)
                : null
        }));

        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Admin: Get all chat sessions with unread counts ─────────────────────────
exports.getAllChats = async (req, res) => {
    try {
        const query = `
            SELECT
                u.user_id,
                u.name,
                u.email,
                MAX(c.created_at) AS last_activity,
                SUM(CASE WHEN c.sender = 'user' AND c.is_read = FALSE THEN 1 ELSE 0 END) AS unread_count,
                MAX(CASE WHEN c.message_type = 'wholesale_order' THEN 1 ELSE 0 END) AS has_wholesale_order,
                (
                    SELECT wo.order_id
                    FROM wholesale_orders wo
                    WHERE wo.user_id = u.user_id
                      AND wo.status IN ('pending_discussion','in_discussion')
                    ORDER BY wo.created_at DESC
                    LIMIT 1
                ) AS pending_order_id,
                (
                    SELECT wo.status
                    FROM wholesale_orders wo
                    WHERE wo.user_id = u.user_id
                      AND wo.status IN ('pending_discussion','in_discussion')
                    ORDER BY wo.created_at DESC
                    LIMIT 1
                ) AS pending_order_status
            FROM users u
            JOIN chats c ON u.user_id = c.user_id
            GROUP BY u.user_id, u.name, u.email
            ORDER BY last_activity DESC
        `;
        const [rows] = await pool.query(query);
        console.log('Admin getAllChats count:', rows.length);
        res.json({ success: true, chats: rows });
    } catch (error) {
        console.error('Error getting all chats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Admin / User: Mark messages as read ────────────────────────────────────
exports.markAsRead = async (req, res) => {
    const { senderToMark } = req.body;
    let userId = req.user.id;

    if (req.user.role === 'admin' && req.body.userId) {
        userId = req.body.userId;
    }

    try {
        await pool.query(
            'UPDATE chats SET is_read = TRUE WHERE user_id = ? AND sender = ?',
            [userId, senderToMark]
        );
        res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── Admin: Get total unread users count ────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT COUNT(DISTINCT user_id) AS unreadUsers FROM chats WHERE sender = "user" AND is_read = FALSE'
        );
        res.json({ success: true, unreadUsers: rows[0].unreadUsers });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
