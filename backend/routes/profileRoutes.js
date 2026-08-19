const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { updateProfileValidation, changePasswordValidation } = require('../validators/profileValidator');
const validateRequest = require('../middleware/validateRequest');
const { authenticateUser } = require('../middleware/authMiddleware');

// All profile routes must be authenticated
router.use(authenticateUser);

// GET /api/profile
router.get('/', profileController.getProfile);

// PUT /api/profile
router.put('/', updateProfileValidation, validateRequest, profileController.updateProfile);

// PUT /api/profile/change-password
router.put('/change-password', changePasswordValidation, validateRequest, profileController.changePassword);

module.exports = router;
