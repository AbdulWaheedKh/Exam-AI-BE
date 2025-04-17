const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');

// Import controllers (these would need to be created)
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile
} = require('../controllers/auth.controller');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

module.exports = router; 