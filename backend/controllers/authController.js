const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

function generate6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Set HTTP-Only Cookie with JWT token
 */
function setAuthCookie(res, token) {
  res.cookie('tradezen_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

/**
 * Register User (Step 1: 6-Digit Email Verification)
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // STRICT ONE USER PER EMAIL
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
      } else {
        const code = generate6DigitCode();
        existingUser.name = name.trim();
        existingUser.emailVerificationCode = code;
        existingUser.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
        const salt = await bcrypt.genSalt(10);
        existingUser.password = await bcrypt.hash(password, salt);
        await existingUser.save();

        console.log(`📧 [EMAIL SERVICE] 6-Digit Code for ${cleanEmail}: ${code}`);

        return res.status(200).json({
          needsVerification: true,
          email: cleanEmail,
          message: `Verification code sent to ${cleanEmail}. Enter the 6-digit code to activate your account.`,
          verificationCode: code
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const code = generate6DigitCode();

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationCode: code,
      emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000),
      virtualCashBalance: 50000.00,
      experiencePoints: 100,
      currentDisciplineLevel: 1,
      metrics: {
        totalTradesExecuted: 0,
        profitableTradesCount: 0,
        stopLossUsageCount: 0,
        tradeTimestamps: []
      },
      watchlist: []
    });

    await newUser.save();

    console.log(`📧 [EMAIL SERVICE] 6-Digit Code for ${cleanEmail}: ${code}`);

    res.status(201).json({
      needsVerification: true,
      email: cleanEmail,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
      verificationCode: code
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * Verify Email (Step 2: Submit 6-Digit Code)
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and 6-digit verification code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    if (user.isEmailVerified) {
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      setAuthCookie(res, token);
      return res.json({
        message: 'Account already verified. Logged in successfully.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          virtualCashBalance: user.virtualCashBalance,
          currentDisciplineLevel: user.currentDisciplineLevel,
          experiencePoints: user.experiencePoints,
          watchlist: user.watchlist
        }
      });
    }

    if (user.emailVerificationCode !== code.trim()) {
      return res.status(400).json({ message: 'Invalid 6-digit verification code. Please check and re-enter.' });
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);

    res.json({
      message: 'Email verified successfully! ₹50,000 demo trading capital activated.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        virtualCashBalance: user.virtualCashBalance,
        currentDisciplineLevel: user.currentDisciplineLevel,
        experiencePoints: user.experiencePoints,
        watchlist: user.watchlist
      }
    });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Server error during email verification.' });
  }
};

/**
 * Resend 6-Digit Code
 */
exports.resendCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const newCode = generate6DigitCode();
    user.emailVerificationCode = newCode;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`📧 [EMAIL SERVICE] Resent 6-Digit Code for ${cleanEmail}: ${newCode}`);

    res.json({
      message: `New 6-digit verification code dispatched to ${cleanEmail}.`,
      verificationCode: newCode
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error resending code.' });
  }
};

/**
 * User Login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User does not exist.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    if (!user.isEmailVerified) {
      const code = generate6DigitCode();
      user.emailVerificationCode = code;
      user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      console.log(`📧 [EMAIL SERVICE] Verification Code for unverified user ${cleanEmail}: ${code}`);

      return res.status(403).json({
        needsVerification: true,
        email: cleanEmail,
        message: 'Your email is not verified yet. We have sent a 6-digit code to complete verification.',
        verificationCode: code
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);

    res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        virtualCashBalance: user.virtualCashBalance,
        currentDisciplineLevel: user.currentDisciplineLevel,
        experiencePoints: user.experiencePoints,
        watchlist: user.watchlist
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

/**
 * 1-Click Demo Login
 */
exports.demoLogin = async (req, res) => {
  try {
    let demoUser = await User.findOne({ email: 'demo@tradezen.com' });
    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('DemoTrader@123', salt);

      demoUser = new User({
        name: 'Demo Trader',
        email: 'demo@tradezen.com',
        password: hashedPassword,
        isEmailVerified: true,
        virtualCashBalance: 50000.00,
        experiencePoints: 320,
        currentDisciplineLevel: 3,
        metrics: {
          totalTradesExecuted: 12,
          profitableTradesCount: 8,
          stopLossUsageCount: 10,
          tradeTimestamps: []
        },
        watchlist: []
      });
      await demoUser.save();
    }

    const token = jwt.sign({ id: demoUser._id }, JWT_SECRET, { expiresIn: '7d' });
    setAuthCookie(res, token);

    res.json({
      message: 'Logged in as Demo Trader with ₹50,000 demo capital.',
      token,
      user: {
        id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        virtualCashBalance: demoUser.virtualCashBalance,
        currentDisciplineLevel: demoUser.currentDisciplineLevel,
        experiencePoints: demoUser.experiencePoints,
        watchlist: demoUser.watchlist
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during demo login.' });
  }
};

/**
 * Sign Out (Clears HTTP-Only Cookie Session)
 */
exports.logout = (req, res) => {
  res.clearCookie('tradezen_token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.json({ message: 'Signed out successfully.' });
};

/**
 * Forgot Password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been generated.'
      });
    }

    const now = new Date();
    if (user.lastResetRequestTime && (now - user.lastResetRequestTime < 60000)) {
      const remainingSecs = Math.ceil((60000 - (now - user.lastResetRequestTime)) / 1000);
      return res.status(429).json({
        message: `Please wait ${remainingSecs}s before requesting another reset email.`
      });
    }

    const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    user.lastResetRequestTime = now;
    await user.save();

    console.log(`📧 [EMAIL SERVICE] Password Reset Code for ${cleanEmail}: ${resetToken}`);

    res.json({
      success: true,
      message: `Password reset instructions sent. Demo reset code: ${resetToken} (expires in 1 hr).`,
      resetToken
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error processing request.' });
  }
};

/**
 * Reset Password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;
    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ message: 'Email, reset code, and new password are required.' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: resetCode.trim(),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password has been successfully updated. You may now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error during password reset.' });
  }
};

/**
 * Current User Profile (/me)
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching user profile.' });
  }
};
