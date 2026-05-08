const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/settings', verifyToken, isAdmin, adminController.getSettings);

router.put('/settings', verifyToken, isAdmin, adminController.updateSettings);

router.post('/settings/hero-image', verifyToken, isAdmin, upload.single('hero_banner_image'), adminController.uploadHeroImage);

router.post('/settings/founder-image', verifyToken, isAdmin, upload.single('founder_image'), adminController.uploadFounderImage);

router.put('/password/request-otp', verifyToken, isAdmin, adminController.requestPasswordChangeOtp);

router.post('/password/verify-otp', verifyToken, isAdmin, adminController.verifyPasswordChangeOtp);

router.get('/activity-logs', verifyToken, isAdmin, adminController.getActivityLogs);

module.exports = router;
