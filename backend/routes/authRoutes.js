const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validators/authValidator');
const validateRequest = require('../middleware/validateRequest');

// POST /api/auth/register
router.post('/register', registerValidation, validateRequest, authController.register);

// POST /api/auth/login
router.post('/login', loginValidation, validateRequest, authController.login);

const { authenticateUser } = require('../middleware/authMiddleware');

// GET /api/auth/me (Protected Route)
router.get('/me', authenticateUser, authController.getCurrentUser);

// GET /api/auth/verify (Protected Route)
router.get('/verify', authenticateUser, authController.verifyToken);

module.exports = router;
