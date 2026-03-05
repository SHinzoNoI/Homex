const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 1000,  // raised from 200 → 1000
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
    skip: (req) => req.path === '/api/health',
});

// Auth limiter — raised limit for dev usability (OTP resends, login attempts)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 100, // raised from 20 → 100
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.',
    },
});

module.exports = { rateLimiter, authLimiter };
