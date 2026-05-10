const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/notifications', verifyToken, profileController.getNotifications);
router.get('/wholesale', verifyToken, profileController.getWholesaleOrders);
router.put('/wholesale/read', verifyToken, profileController.markWholesaleOrdersAsRead);
router.put('/update', verifyToken, profileController.updateProfile);

module.exports = router;
