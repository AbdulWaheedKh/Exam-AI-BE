const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const logger = require('../logger');

/**
 * Middleware to authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      logger.warn(`Authentication failed: User not found for token`);
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    logger.info(`User authenticated: ${user.username} (${user.role})`);
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

/**
 * Middleware to authorize admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authorizeAdmin = (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      logger.warn(`Authorization failed: User ${req.user.username} attempted admin access`);
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    
    logger.info(`Admin access granted: ${req.user.username}`);
    next();
  } catch (error) {
    logger.error(`Authorization error: ${error.message}`);
    res.status(403).json({ message: 'Authorization failed' });
  }
};

/**
 * Middleware to authorize teacher
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authorizeTeacher = (req, res, next) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      logger.warn(`Authorization failed: User ${req.user.username} attempted teacher access`);
      return res.status(403).json({ message: 'Access denied. Teacher only.' });
    }
    
    logger.info(`Teacher access granted: ${req.user.username}`);
    next();
  } catch (error) {
    logger.error(`Authorization error: ${error.message}`);
    res.status(403).json({ message: 'Authorization failed' });
  }
};

/**
 * Middleware to authorize student
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authorizeStudent = (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      logger.warn(`Authorization failed: User ${req.user.username} attempted student access`);
      return res.status(403).json({ message: 'Access denied. Student only.' });
    }
    
    logger.info(`Student access granted: ${req.user.username}`);
    next();
  } catch (error) {
    logger.error(`Authorization error: ${error.message}`);
    res.status(403).json({ message: 'Authorization failed' });
  }
};

module.exports = {
  authenticate,
  authorizeAdmin,
  authorizeTeacher,
  authorizeStudent
}; 