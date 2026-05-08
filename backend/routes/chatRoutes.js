const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware');

// User routes
router.post('/send', authMiddleware.verifyToken, chatController.sendMessage);
router.get('/messages', authMiddleware.verifyToken, chatController.getMessages);
router.put('/read', authMiddleware.verifyToken, chatController.markAsRead);

// Admin routes
router.get('/admin/chats', authMiddleware.verifyToken, authMiddleware.isAdmin, chatController.getAllChats);
router.get('/admin/messages/:userId', authMiddleware.verifyToken, authMiddleware.isAdmin, chatController.getMessages);
router.get('/admin/unread-count', authMiddleware.verifyToken, authMiddleware.isAdmin, chatController.getUnreadCount);
router.put('/admin/read', authMiddleware.verifyToken, authMiddleware.isAdmin, chatController.markAsRead);

module.exports = router;
