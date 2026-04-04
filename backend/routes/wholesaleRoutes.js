const express = require('express');
const router = express.Router();
const wholesaleController = require('../controllers/wholesaleController');

// Allow creating an order
router.post('/', wholesaleController.createWholesaleOrder);

// Dashboard routes
router.get('/', wholesaleController.getAllOrders);
router.get('/:id', wholesaleController.getOrderById);
router.put('/:id/status', wholesaleController.updateOrderStatus);

module.exports = router;
