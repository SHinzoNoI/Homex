const express = require('express');
const router = express.Router();
const C = require('../controllers/orderController');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/auth');

router.get('/stats', verifyToken, requireRole('admin'), C.getStats);
router.post('/', verifyToken, C.createOrder);
router.get('/', verifyToken, C.getOrders);
router.get('/:id', verifyToken, C.getOrder);
router.patch('/:id/status', verifyToken, requireRole('admin', 'rider'), C.updateOrderStatus);
router.post('/:id/cancel', verifyToken, C.cancelOrder);
router.post('/:id/verify-otp', verifyToken, requireRole('rider'), C.verifyDeliveryOTP);
router.post('/:id/rate', verifyToken, C.rateOrder);
router.post('/:id/return', verifyToken, C.requestReturn);
router.post('/:id/reorder', verifyToken, C.reorder);
router.post('/:id/assign-me', verifyToken, requireRole('rider'), C.selfAssignOrder);

module.exports = router;
