const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { incomeValidation } = require('../validators/incomeValidator');
const validateRequest = require('../middleware/validateRequest');
const { authenticateUser } = require('../middleware/authMiddleware');

// All income routes must be authenticated
router.use(authenticateUser);

// GET /api/income/summary
router.get('/summary', incomeController.getIncomeSummary);

// GET /api/income
router.get('/', incomeController.getAllIncome);

// GET /api/income/:id
router.get('/:id', incomeController.getIncomeById);

// POST /api/income
router.post('/', incomeValidation, validateRequest, incomeController.createIncome);

// PUT /api/income/:id
router.put('/:id', incomeValidation, validateRequest, incomeController.updateIncome);

// DELETE /api/income/:id
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;
