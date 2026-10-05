const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { loginRateLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Registration with 6-Digit Email Verification
router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-code', authController.resendCode);

// Login protected by max 5 attempts rate limiter
router.post('/login', loginRateLimiter, authController.login);
router.post('/demo-login', authController.demoLogin);

// Logout (Clears HTTP-only session cookie)
router.post('/logout', authController.logout);

// Password recovery
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Profile
router.get('/me', requireAuth, authController.getMe);

module.exports = router;
