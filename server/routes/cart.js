const express = require('express');
const router = express.Router();
const C = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken); // All cart routes require auth
router.get('/',                   C.getCart);
router.post('/items',             C.addItem);
router.patch('/items/:productId', C.updateItem);
router.delete('/items/:productId',C.removeItem);
router.post('/coupon',            C.applyCoupon);
router.delete('/coupon',          C.removeCoupon);
router.delete('/',                C.clearCart);

module.exports = router;
