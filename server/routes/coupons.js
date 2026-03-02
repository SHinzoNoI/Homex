const express = require('express');
const router = express.Router();
const { getCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon } = require('../controllers/couponController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.post('/validate', validateCoupon); // public — for checkout
router.get('/', verifyToken, requireRole('admin'), getCoupons);
router.post('/', verifyToken, requireRole('admin'), createCoupon);
router.put('/:id', verifyToken, requireRole('admin'), updateCoupon);
router.delete('/:id', verifyToken, requireRole('admin'), deleteCoupon);

module.exports = router;
