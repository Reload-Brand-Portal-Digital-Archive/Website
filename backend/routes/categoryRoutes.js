const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', categoryController.getAllCategories);
router.post('/', verifyToken, isAdmin, categoryController.createCategory);
router.put('/:name', verifyToken, isAdmin, categoryController.updateCategory);
router.delete('/:name', verifyToken, isAdmin, categoryController.deleteCategory);

module.exports = router;