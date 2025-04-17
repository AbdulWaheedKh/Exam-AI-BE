const authService = require('../service/auth.service');
const logger = require('../logger');

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error in register controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error in login controller: ${error.message}`);
    res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error(`Error in getCurrentUser controller: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser
}; 