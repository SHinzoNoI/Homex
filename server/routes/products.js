const express = require('express');
const router = express.Router();
const C = require('../controllers/productController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', C.getProducts);
router.get('/:id', C.getProduct);
router.post('/', verifyToken, requireRole('admin'), C.createProduct);
router.put('/:id', verifyToken, requireRole('admin'), C.updateProduct);
router.delete('/:id', verifyToken, requireRole('admin'), C.deleteProduct);
router.patch('/:id/stock', verifyToken, requireRole('admin'), C.updateStock);

module.exports = router;
