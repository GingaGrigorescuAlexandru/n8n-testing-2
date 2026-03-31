const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/me
// @desc    Get current authenticated user profile
// @access  Private
router.get('/me', authenticate, authController.getMe);

// @route   PUT /api/auth/me
// @desc    Update current user profile
// @access  Private
router.put('/me', authenticate, authController.updateMe);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authenticate, authController.changePassword);

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Public (requires valid refresh token)
router.post('/refresh-token', authController.refreshToken);

module.exports = router;