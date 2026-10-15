const rateLimit = require('express-rate-limit');

// Login rate limiter: max 5 FAILED attempts within a 15 minute window.
// Successful logins are not counted, so a real user is never locked out of the demo.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. You have exceeded 5 attempts. Please wait 15 minutes before trying again.'
  }
});

// Forgot password rate limiter: 1 request per 60 seconds
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many reset requests. Please wait 60 seconds before trying again.'
  }
});

module.exports = {
  loginRateLimiter,
  forgotPasswordLimiter
};