const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/settings', verifyToken, isAdmin, adminController.getSettings);

router.put('/settings', verifyToken, isAdmin, adminController.updateSettings);

router.post('/settings/hero-image', verifyToken, isAdmin, upload.single('hero_banner_image'), adminController.uploadHeroImage);

router.put('/password', verifyToken, isAdmin, adminController.changePassword);

router.get('/activity-logs', verifyToken, isAdmin, adminController.getActivityLogs);

module.exports = router;
