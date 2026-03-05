const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', getCategories); // public
router.post('/', verifyToken, requireRole('admin'), createCategory);
router.put('/:id', verifyToken, requireRole('admin'), updateCategory);
router.delete('/:id', verifyToken, requireRole('admin'), deleteCategory);

module.exports = router;
