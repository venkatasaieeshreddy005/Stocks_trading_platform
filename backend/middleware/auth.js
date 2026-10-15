const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'tradezen_super_secret_jwt_key_2026';

if (!process.env.JWT_SECRET) {
  console.warn('[auth] JWT_SECRET is not set in .env - using an insecure development fallback secret.');
}

/**
 * Cookie name used for the HTTP-only session cookie.
 * (Login/register/demo-login set it, requireAuth reads it.)
 */
const COOKIE_NAME = 'tradezen_token';

/**
 * Cookie options that work both on http://localhost (dev) and on HTTPS hosting (prod).
 * - Dev:  secure=false, sameSite=lax   (secure cookies are unreliable on plain http)
 * - Prod: secure=true,  sameSite=none  (needed when frontend and backend are on different domains)
 */
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 2 * 24 * 60 * 60 * 1000
  };
}

/** Sign a session token. The payload ALWAYS uses `id`. */
function signToken(userId) {
  return jwt.sign({ id: String(userId) }, JWT_SECRET, { expiresIn: '2d' });
}

/** Verify a token and return the user id (accepts old `userId` payloads too). */
function verifyTokenToUserId(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded.id || decoded.userId || null;
}

/**
 * Authentication Middleware: Extracts JWT from HTTP-only Cookie or Authorization Header
 */
async function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Check HTTP-Only Cookie
    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }

    // 2. Check Authorization Header (Bearer token fallback)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ message: 'Authentication required. No session or token found.' });
    }

    const userId = verifyTokenToUserId(token);
    if (!userId) {
      return res.status(401).json({ message: 'Invalid session token.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: 'User session not found or expired.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid, revoked or expired session token.' });
  }
}

module.exports = {
  requireAuth,
  JWT_SECRET,
  COOKIE_NAME,
  getCookieOptions,
  signToken,
  verifyTokenToUserId
};