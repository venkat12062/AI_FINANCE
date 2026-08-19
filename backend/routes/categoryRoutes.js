const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { categoryValidation } = require('../validators/categoryValidator');
const validateRequest = require('../middleware/validateRequest');
const { authenticateUser } = require('../middleware/authMiddleware');

// All category routes must be authenticated
router.use(authenticateUser);

// GET /api/categories
router.get('/', categoryController.getAllCategories);

// GET /api/categories/:id
router.get('/:id', categoryController.getCategoryById);

// POST /api/categories
router.post('/', categoryValidation, validateRequest, categoryController.createCategory);

// PUT /api/categories/:id
router.put('/:id', categoryValidation, validateRequest, categoryController.updateCategory);

// DELETE /api/categories/:id
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
