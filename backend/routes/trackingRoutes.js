const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { optionalVerifyToken, verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Endpoint for recording page view (accessible as guest or user)
router.post('/pageview', optionalVerifyToken, trackingController.recordPageView);

// Endpoint for recording platform clicks (Shopee/TikTok)
router.post('/click/:platform', optionalVerifyToken, trackingController.recordLinkClick);

// Protected endpoint for admin stats
router.get('/stats', verifyToken, isAdmin, trackingController.getTrackingStats);

module.exports = router;
