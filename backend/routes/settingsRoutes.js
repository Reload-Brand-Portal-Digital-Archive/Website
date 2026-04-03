const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// @route   GET /api/settings/ecommerce-hub
// @desc    Get e-commerce distribution and statistics data for the dashboard map
router.get('/ecommerce-hub', settingsController.getEcommerceHubData);

// @route   POST /api/settings/sync-ecommerce
// @desc    Sync data with TikTok and Shopee dummy endpoints
router.post('/sync-ecommerce', settingsController.syncEcommerce);

module.exports = router;
