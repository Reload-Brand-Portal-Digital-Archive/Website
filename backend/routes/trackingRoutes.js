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

// GPS Location tracking (public - guest or user)
router.post('/location', optionalVerifyToken, trackingController.recordGpsLocation);

// Admin: get all GPS visitor locations
router.get('/locations', verifyToken, isAdmin, trackingController.getGpsLocations);

// Admin: get completed wholesale order locations (status = 'Pesanan selesai')
router.get('/wholesale-locations', verifyToken, isAdmin, trackingController.getCompletedWholesaleLocations);

module.exports = router;
