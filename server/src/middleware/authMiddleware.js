import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Reusable authentication middleware
 * Extracts token from Authorization Bearer header or HTTP-only cookies.
 * Verifies JWT signature and active account status.
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to token stored in HTTP-only cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to access this resource.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devconnect-secret-key-super-safe');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user account associated with this session no longer exists.',
      });
    }

    // Verify account status
    if (user.status && user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}. Access denied.`,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid, malformed, or expired authentication token. Please log in again.',
    });
  }
};

export const authenticate = protect;

/**
 * Optional authentication middleware:
 * Attaches req.user if a valid token is provided, but continues without error if not.
 */
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devconnect-secret-key-super-safe');
    const user = await User.findById(decoded.id).select('-password');
    if (user && user.status === 'active') {
      req.user = user;
    }
  } catch (error) {
    // Ignore error for optional authentication
  }

  next();
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: role '${req.user ? req.user.role : 'guest'}' is not authorized.`,
      });
    }
    next();
  };
};

export default { protect, authenticate, optionalAuth, authorize };
