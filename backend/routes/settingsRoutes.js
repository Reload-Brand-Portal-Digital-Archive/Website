const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/public', settingsController.getPublicSettings);

// @route   GET /api/settings/ecommerce-hub
// @desc    Get e-commerce distribution and statistics data for the dashboard map
router.get('/ecommerce-hub', verifyToken, isAdmin, settingsController.getEcommerceHubData);

// @route   POST /api/settings/sync-ecommerce
// @desc    Sync data with TikTok and Shopee dummy endpoints
router.post('/sync-ecommerce', verifyToken, isAdmin, settingsController.syncEcommerce);

// @route   POST /api/settings/upload-report
// @desc    Handle manual upload of TikTok/Shopee reports
router.post('/upload-report', verifyToken, isAdmin, settingsController.uploadReport);
router.delete('/clear-ecommerce', verifyToken, isAdmin, settingsController.clearEcommerceData);

module.exports = router;
