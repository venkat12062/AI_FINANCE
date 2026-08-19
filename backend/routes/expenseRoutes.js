const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { expenseValidation } = require('../validators/expenseValidator');
const validateRequest = require('../middleware/validateRequest');
const { authenticateUser } = require('../middleware/authMiddleware');

// All expense routes must be authenticated
router.use(authenticateUser);

// GET /api/expenses/summary
router.get('/summary', expenseController.getExpenseSummary);

// GET /api/expenses/top-categories
router.get('/top-categories', expenseController.getTopCategories);

// GET /api/expenses/monthly-trend
router.get('/monthly-trend', expenseController.getMonthlyTrend);

// GET /api/expenses
router.get('/', expenseController.getAllExpenses);

// GET /api/expenses/:id
router.get('/:id', expenseController.getExpenseById);

// POST /api/expenses
router.post('/', expenseValidation, validateRequest, expenseController.createExpense);

// PUT /api/expenses/:id
router.put('/:id', expenseValidation, validateRequest, expenseController.updateExpense);

// DELETE /api/expenses/:id
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
