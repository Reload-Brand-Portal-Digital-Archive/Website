const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/public', settingsController.getPublicSettings);

// @route   GET /api/settings/ecommerce-hub
// @desc    Get e-commerce distribution and statistics data for the dashboard map
router.get('/ecommerce-hub', settingsController.getEcommerceHubData);

// @route   POST /api/settings/sync-ecommerce
// @desc    Sync data with TikTok and Shopee dummy endpoints
router.post('/sync-ecommerce', settingsController.syncEcommerce);

// @route   POST /api/settings/upload-report
// @desc    Handle manual upload of TikTok/Shopee reports
router.post('/upload-report', settingsController.uploadReport);
router.delete('/clear-ecommerce', settingsController.clearEcommerceData);

module.exports = router;
