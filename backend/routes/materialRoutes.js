const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.get('/', materialController.getAllMaterials);
router.post('/', verifyToken, isAdmin, upload.single('image'), materialController.createMaterial);
router.put('/:id', verifyToken, isAdmin, upload.single('image'), materialController.updateMaterial);
router.delete('/:id', verifyToken, isAdmin, materialController.deleteMaterial);

module.exports = router;