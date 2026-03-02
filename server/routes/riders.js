const express = require('express');
const router = express.Router();
const { getRiders, createRider, updateRider, deleteRider, getRiderStats, checkInRider, checkOutRider } = require('../controllers/riderController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('admin', 'rider'), getRiders);
router.post('/', verifyToken, requireRole('admin'), createRider);
router.get('/:id/stats', verifyToken, requireRole('admin', 'rider'), getRiderStats);
router.put('/:id', verifyToken, requireRole('admin', 'rider'), updateRider);
router.delete('/:id', verifyToken, requireRole('admin'), deleteRider);
router.post('/:id/checkin', verifyToken, requireRole('admin', 'rider'), checkInRider);
router.post('/:id/checkout', verifyToken, requireRole('admin', 'rider'), checkOutRider);

module.exports = router;
