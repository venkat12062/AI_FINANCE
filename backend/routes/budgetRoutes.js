const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { budgetValidation } = require('../validators/budgetValidator');
const validateRequest = require('../middleware/validateRequest');
const { authenticateUser } = require('../middleware/authMiddleware');

// All budget routes must be authenticated
router.use(authenticateUser);

// GET /api/budgets/summary
router.get('/summary', budgetController.getBudgetSummary);

// GET /api/budgets/current
router.get('/current', budgetController.getCurrentBudget);

// GET /api/budgets/alerts
router.get('/alerts', budgetController.getBudgetAlerts);

// GET /api/budgets
router.get('/', budgetController.getAllBudgets);

// GET /api/budgets/:id
router.get('/:id', budgetController.getBudgetById);

// POST /api/budgets
router.post('/', budgetValidation, validateRequest, budgetController.createBudget);

// PUT /api/budgets/:id
router.put('/:id', budgetValidation, validateRequest, budgetController.updateBudget);

// DELETE /api/budgets/:id
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
