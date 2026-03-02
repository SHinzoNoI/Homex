const express = require('express');
const router = express.Router();
const { login, register, sendOTP, verifyOTP, verifyOrderOTP, getMe, updateProfile, createStaff } = require('../controllers/authController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.use(authLimiter);

router.post('/send-otp', sendOTP);     // Customer OTP login step 1
router.post('/verify-otp', verifyOTP);           // Customer OTP login step 2
router.post('/verify-order-otp', verifyOrderOTP);      // Checkout phone verification (no login)
router.post('/login', login);       // Email/password (admin & rider)
router.post('/register', register);    // Public customer registration
router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, updateProfile);
router.post('/staff', verifyToken, requireRole('admin'), createStaff); // Admin creates staff

module.exports = router;
