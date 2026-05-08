const express = require('express');
const router = express.Router();
const wholesaleController = require('../controllers/wholesaleController');

const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Allow creating an order
router.post('/', wholesaleController.createWholesaleOrder);

// Dashboard routes
router.get('/', verifyToken, isAdmin, wholesaleController.getAllOrders);
router.get('/:id', verifyToken, isAdmin, wholesaleController.getOrderById);
router.put('/:id/status', verifyToken, isAdmin, wholesaleController.updateOrderStatus);

module.exports = router;
