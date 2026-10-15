const crypto = require('crypto');
const userModel = require('../models/User');
const {
  JWT_SECRET,
  COOKIE_NAME,
  getCookieOptions,
  signToken
} = require('../middleware/auth');
const { sendRegistrationEmail, sendCodeEmail, isEmailConfigured } = require('../services/email');

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CODE_ATTEMPTS = 5;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


const generateCode = () => crypto.randomInt(100000, 1000000).toString();

const hashCode = (code) =>
  crypto.createHash('sha256').update(`${String(code)}:${JWT_SECRET}`).digest('hex');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

/** What the frontend is allowed to know about a user. */
function publicUser(user) {
  return {
    _id: user._id,
    id: String(user._id), // frontend socket code uses `id`
    email: user.email,
    name: user.name,
    virtualCashBalance: user.virtualCashBalance,
    experiencePoints: user.experiencePoints,
    watchlist: user.watchlist || []
  };
}

/** Sets the session cookie and returns the JWT. */
function startSession(res, user) {
  const token = signToken(user._id);
  res.cookie(COOKIE_NAME, token, getCookieOptions());
  return token;
}

/**
 * Sends a 6-digit code by email.
 * If email is not configured / fails and we are NOT in production, the code is
 * returned so the frontend "dev code" box can show it (so the demo never gets stuck).
 */
async function deliverCode(user, { subject, heading, code }) {
  let sent = false;
  try {
    const result = await sendCodeEmail(user.email, user.name, subject, heading, code);
    sent = !result.skipped;
  } catch (err) {
    console.error('[auth] Failed to send code email:', err.message);
  }

  const exposeDevCode = !sent && process.env.NODE_ENV !== 'production';
  if (exposeDevCode) {
    console.log(`[auth] DEV CODE for ${user.email}: ${code}${isEmailConfigured() ? ' (email send failed)' : ' (email not configured)'}`);
  }

  return { sent, devCode: exposeDevCode ? code : undefined };
}

async function issueVerificationCode(user) {
  const code = generateCode();
  user.emailVerification = {
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
    attempts: 0
  };
  await user.save();

  return deliverCode(user, {
    subject: 'Verify your email - TradeZen',
    heading: 'Welcome to TradeZen! Use the code below to verify your email address.',
    code
  });
}

/** Checks a submitted code against a stored {codeHash, expiresAt, attempts} block. */
function checkCode(block, submitted) {
  if (!block || !block.codeHash || !block.expiresAt) {
    return { ok: false, reason: 'No active code. Please request a new one.' };
  }
  if (block.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: 'This code has expired. Please request a new one.' };
  }
  if (block.attempts >= MAX_CODE_ATTEMPTS) {
    return { ok: false, reason: 'Too many wrong attempts. Please request a new code.' };
  }
  if (hashCode(String(submitted || '').trim()) !== block.codeHash) {
    return { ok: false, reason: 'Invalid code.', countAttempt: true };
  }
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Register -> sends 6-digit code (user must verify before getting a session)  */
/* -------------------------------------------------------------------------- */
const register = async (req, res) => {
  try {
    const { name, password } = req.body || {};
    const email = normalizeEmail(req.body && req.body.email);

    if (!name || !String(name).trim() || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.', status: 'failed' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.', status: 'failed' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.', status: 'failed' });
    }

    let user = await userModel.findOne({ email });

    if (user && user.isEmailVerified) {
      return res.status(400).json({
        message: 'User already exists with this email',
        status: 'failed'
      });
    }

    if (user) {
      // Unverified leftover account: let them restart registration
      user.name = String(name).trim();
      user.password = password;
    } else {
      user = new userModel({ name: String(name).trim(), email, password });
    }

    await user.save();

    const { sent, devCode } = await issueVerificationCode(user);

    return res.status(201).json({
      message: sent
        ? `Verification code sent to ${email}.`
        : 'Account created. Email delivery is not available, use the code shown below.',
      status: 'success',
      email: user.email,
      verificationCode: devCode
    });
  } catch (err) {
    console.error('Register error:', err);
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email', status: 'failed' });
    }
    return res.status(500).json({ message: 'Registration failed. Please try again.', status: 'failed' });
  }
};

/* -------------------------------------------------------------------------- */
/* Verify Email -> marks verified and logs the user in                         */
/* -------------------------------------------------------------------------- */
const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body || {};
    const email = normalizeEmail(req.body && req.body.email);

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required.', status: 'failed' });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found for this email.', status: 'failed' });
    }

    if (!user.isEmailVerified) {
      const result = checkCode(user.emailVerification, code);
      if (!result.ok) {
        if (result.countAttempt) {
          user.emailVerification.attempts += 1;
          await user.save();
        }
        return res.status(400).json({ message: result.reason, status: 'failed' });
      }

      user.isEmailVerified = true;
      user.emailVerification = { codeHash: null, expiresAt: null, attempts: 0 };
      await user.save();

      // Welcome email is a nice-to-have: never let it break (or crash) the request
      sendRegistrationEmail(user.email, user.name).catch((err) =>
        console.error('[auth] Welcome email failed:', err.message)
      );
    }

    const token = startSession(res, user);

    return res.status(200).json({
      message: 'Email verified successfully',
      status: 'success',
      token,
      user: publicUser(user)
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ message: 'Verification failed. Please try again.', status: 'failed' });
  }
};

/* -------------------------------------------------------------------------- */
/* Resend verification code                                                    */
/* -------------------------------------------------------------------------- */
const resendCode = async (req, res) => {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    if (!email) {
      return res.status(400).json({ message: 'Email is required.', status: 'failed' });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found for this email.', status: 'failed' });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'This email is already verified. Please log in.', status: 'failed' });
    }

    const { sent, devCode } = await issueVerificationCode(user);

    return res.status(200).json({
      message: sent ? 'Verification code resent successfully' : 'Email delivery is not available, use the code shown below.',
      status: 'success',
      verificationCode: devCode
    });
  } catch (error) {
    console.error('Resend code error:', error);
    return res.status(500).json({ message: 'Could not resend code.', status: 'failed' });
  }
};

/* -------------------------------------------------------------------------- */
/* Login                                                                       */
/* -------------------------------------------------------------------------- */
const login = async (req, res) => {
  try {
    const { password } = req.body || {};
    const email = normalizeEmail(req.body && req.body.email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.', status: 'failed' });
    }

    const user = await userModel.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'No User Exists', status: 'failed' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Incorrect password', status: 'failed' });
    }

    // Correct password but email not verified yet -> send a fresh code
    if (!user.isEmailVerified) {
      const { sent, devCode } = await issueVerificationCode(user);
      return res.status(403).json({
        needsVerification: true,
        email: user.email,
        verificationCode: devCode,
        message: sent
          ? 'Your email is not verified yet. We sent a 6-digit code to activate your account.'
          : 'Your email is not verified yet. Email delivery is not available, use the code shown below.',
        status: 'failed'
      });
    }

    const token = startSession(res, user);

    return res.status(200).json({
      message: 'Login Successful',
      status: 'success',
      user: publicUser(user),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed. Please try again.', status: 'failed' });
  }
};

/* -------------------------------------------------------------------------- */
/* Demo Login                                                                  */
/* -------------------------------------------------------------------------- */
const demoLogin = async (req, res) => {
  try {
    let demoUser = await userModel.findOne({ email: 'demo@tradezen.com' });

    if (!demoUser) {
      demoUser = new userModel({
        name: 'Demo Trader',
        email: 'demo@tradezen.com',
        password: 'demopassword123',
        isEmailVerified: true
      });
      await demoUser.save();
    } else if (!demoUser.isEmailVerified) {
      demoUser.isEmailVerified = true;
      await demoUser.save();
    }

    const token = startSession(res, demoUser);

    return res.status(200).json({
      message: 'Demo login successful',
      status: 'success',
      user: publicUser(demoUser),
      token
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return res.status(500).json({ message: 'Demo login failed.', status: 'failed' });
  }
};

/* -------------------------------------------------------------------------- */
/* Logout                                                                      */
/* -------------------------------------------------------------------------- */
const logout = async (req, res) => {
  try {
    const { maxAge, ...clearOptions } = getCookieOptions();
    res.clearCookie(COOKIE_NAME, clearOptions);

    return res.status(200).json({ message: 'User logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Logout failed' });
  }
};

/* -------------------------------------------------------------------------- */
/* Forgot Password -> sends 6-digit reset code                                 */
/* -------------------------------------------------------------------------- */
const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    if (!email) {
      return res.status(400).json({ message: 'Email is required.', status: 'failed' });
    }

    const user = await userModel.findOne({ email });

    // Same response whether or not the account exists (prevents email enumeration)
    const genericResponse = {
      message: 'If an account exists for this email, a 6-digit reset code has been sent.',
      status: 'success'
    };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const code = generateCode();
    user.passwordReset = {
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      attempts: 0
    };
    await user.save();

    const { sent, devCode } = await deliverCode(user, {
      subject: 'Password Reset Code - TradeZen',
      heading: 'We received a request to reset your TradeZen password.',
      code
    });

    if (!sent && devCode) {
      return res.status(200).json({
        message: `Email delivery is not available. Dev reset code: ${devCode}`,
        status: 'success',
        resetCode: devCode
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Could not process the reset request.', status: 'failed' });
  }
};

/* -------------------------------------------------------------------------- */
/* Reset Password                                                              */
/* Frontend sends { email, resetCode, newPassword }                            */
/* -------------------------------------------------------------------------- */
const resetPassword = async (req, res) => {
  try {
    const body = req.body || {};
    const email = normalizeEmail(body.email);
    const code = body.resetCode ?? body.otp;
    const newPassword = body.newPassword ?? body.password;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, reset code and new password are required.', status: 'failed' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.', status: 'failed' });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid code.', status: 'failed' });
    }

    const result = checkCode(user.passwordReset, code);
    if (!result.ok) {
      if (result.countAttempt) {
        user.passwordReset.attempts += 1;
        await user.save();
      }
      return res.status(400).json({ message: result.reason, status: 'failed' });
    }

    user.password = newPassword;
    user.passwordReset = { codeHash: null, expiresAt: null, attempts: 0 };
    // Receiving the code in their inbox also proves they own the email
    user.isEmailVerified = true;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully', status: 'success' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error', status: 'failed' });
  }
};

/* -------------------------------------------------------------------------- */
/* Current user                                                                */
/* -------------------------------------------------------------------------- */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: publicUser(req.user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to get current user' });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendCode,
  login,
  demoLogin,
  logout,
  forgotPassword,
  resetPassword,
  getMe
};