const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'tradezen_super_secret_jwt_key_2026';

/**
 * Authentication Middleware: Extracts JWT from HTTP-only Cookie or Authorization Header
 */
async function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Check HTTP-Only Cookie
    if (req.cookies && req.cookies.tradezen_token) {
      token = req.cookies.tradezen_token;
    }

    // 2. Check Authorization Header (Bearer token fallback)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No session or token found.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

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
  JWT_SECRET
};
