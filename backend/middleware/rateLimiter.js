const rateLimit = require('express-rate-limit');

// Login rate limiter: Max 5 attempts within 15 minutes window
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. You have exceeded 5 attempts. Please wait 15 minutes before trying again.'
  }
});

// Forgot password rate limiter: 1 request per 60 seconds
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1,
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
