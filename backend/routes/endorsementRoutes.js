const express = require('express');
const router = express.Router();
const endorsementController = require('../controllers/endorsementController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', endorsementController.getAllEndorsements);
router.post('/', verifyToken, isAdmin, upload.single('image'), endorsementController.createEndorsement);
router.put('/:id', verifyToken, isAdmin, upload.single('image'), endorsementController.updateEndorsement);
router.delete('/:id', verifyToken, isAdmin, endorsementController.deleteEndorsement);

module.exports = router;
