const rateLimit = require('express-rate-limit');

/**
 * Specialized rate limiter for password reset requests.
 * Limits each IP to 3 requests per hour to prevent SMTP spam and brute force.
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per windowMs
    message: {
        success: false,
        error: 'Too many password reset attempts, please try again later'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const passwordUpdateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Too many password update attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for login requests to mitigate brute-force password attacks.
 * Limits each IP to 10 requests per 15 minutes.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        error: 'Too many login attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for registration requests to prevent user registration spam.
 * Limits each IP to 5 requests per hour.
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
        success: false,
        error: 'Too many account registrations, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for score submissions to prevent XP farming.
 * Limits each IP to 30 requests per 15 minutes.
 */
const scoreLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    message: {
        success: false,
        error: 'Too many score submissions, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Rate limiter for challenge sends to prevent spam.
 * Limits each IP to 10 challenge sends per 15 minutes.
 */
const challengeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        success: false,
        error: 'Too many challenge requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { passwordResetLimiter, passwordUpdateLimiter, loginLimiter, registerLimiter, scoreLimiter, challengeLimiter };
