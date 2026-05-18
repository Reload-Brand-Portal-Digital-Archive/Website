const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { optionalVerifyToken, verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.post('/subscribe', optionalVerifyToken, newsletterController.subscribe);
router.get('/unsubscribe', newsletterController.unsubscribePublic);

router.delete('/unsubscribe-auth', verifyToken, newsletterController.unsubscribeAuth);
router.get('/status', verifyToken, newsletterController.checkStatus);

router.get('/', verifyToken, isAdmin, newsletterController.getAllSubscribers);
router.get('/export/:format', verifyToken, isAdmin, newsletterController.exportData);
router.get('/stats', verifyToken, isAdmin, newsletterController.getStats);
router.delete('/:id', verifyToken, isAdmin, newsletterController.deleteSubscriber);

module.exports = router;
