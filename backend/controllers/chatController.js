const pool = require('../config/database');

// Send a message
exports.sendMessage = async (req, res) => {
    const { message, sender } = req.body;
    let userId;

    if (sender === 'user') {
        userId = req.user.id;
    } else if (sender === 'admin') {
        userId = req.body.userId; // Admin sends to a specific user
    }

    if (!userId || !message || !sender) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO chats (user_id, message, sender) VALUES (?, ?, ?)',
            [userId, message, sender]
        );

        res.status(201).json({ success: true, message: 'Message sent', chatId: result.insertId });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get chat history for a specific user
exports.getMessages = async (req, res) => {
    let userId = req.user.id;
    
    // If admin is requesting, they can provide a userId in params
    if (req.user.role === 'admin' && req.params.userId) {
        userId = req.params.userId;
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM chats WHERE user_id = ? ORDER BY created_at ASC',
            [userId]
        );
        res.json({ success: true, messages: rows });
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin: Get all chat sessions (users who have sent messages) with unread counts
exports.getAllChats = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.user_id, 
                u.name, 
                u.email,
                MAX(c.created_at) as last_activity,
                SUM(CASE WHEN c.sender = 'user' AND c.is_read = FALSE THEN 1 ELSE 0 END) as unread_count
            FROM users u
            JOIN chats c ON u.user_id = c.user_id
            GROUP BY u.user_id, u.name, u.email
            ORDER BY last_activity DESC
        `;
        const [rows] = await pool.query(query);
        res.json({ success: true, chats: rows });
    } catch (error) {
        console.error('Error getting all chats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Admin/User: Mark messages as read
exports.markAsRead = async (req, res) => {
    const { senderToMark } = req.body; // 'user' (admin reading user messages) or 'admin' (user reading admin messages)
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

// Admin: Get total unread users count
exports.getUnreadCount = async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT COUNT(DISTINCT user_id) as unreadUsers FROM chats WHERE sender = "user" AND is_read = FALSE'
        );
        res.json({ success: true, unreadUsers: rows[0].unreadUsers });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
