const express = require('express');
const router = express.Router();
const wholesaleController = require('../controllers/wholesaleController');

const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Public: buyer submits a wholesale order (no auth required, but user_id sent from client)
router.post('/', wholesaleController.createWholesaleOrder);

// Admin routes
router.get('/', verifyToken, isAdmin, wholesaleController.getAllOrders);
router.get('/admin/user/:userId', verifyToken, isAdmin, wholesaleController.getUserWholesaleOrder);
router.get('/:id', verifyToken, isAdmin, wholesaleController.getOrderById);
router.put('/:id/status', verifyToken, isAdmin, wholesaleController.updateOrderStatus);
router.put('/:id/confirm', verifyToken, isAdmin, wholesaleController.confirmOrder);

module.exports = router;
