const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const logger = require('../logger');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate token
      const token = this.generateToken(user);

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          grade: user.grade
        },
        token
      };
    } catch (error) {
      logger.error(`Error registering user: ${error.message}`);
      throw new Error('Failed to register user');
    }
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - User and token
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = this.generateToken(user);

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          grade: user.grade
        },
        token
      };
    } catch (error) {
      logger.error(`Error logging in user: ${error.message}`);
      throw new Error('Failed to login');
    }
  }

  /**
   * Generate JWT token
   * @param {Object} user - User object
   * @returns {string} - JWT token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} - Decoded token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.error(`Error verifying token: ${error.message}`);
      throw new Error('Invalid token');
    }
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} - User
   */
  async getUserById(id) {
    try {
      const user = await User.findById(id).select('-password');
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      logger.error(`Error getting user by ID: ${error.message}`);
      throw new Error('Failed to get user');
    }
  }
}

module.exports = new AuthService(); 