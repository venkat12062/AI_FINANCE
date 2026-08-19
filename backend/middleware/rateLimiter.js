const rateLimit = require('express-rate-limit');

// Generous rate limit in development (10,000 requests / 15 min), standard in production
const isDev = process.env.NODE_ENV !== 'production';

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: isDev ? 10000 : 100, 
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, 
    legacyHeaders: false, 
    skip: (req) => {
        // Skip rate limiting for local development requests
        const ip = req.ip || req.connection?.remoteAddress || '';
        return isDev || ip === '127.0.0.1' || ip === '::1' || ip.includes('localhost');
    }
});

module.exports = globalLimiter;

