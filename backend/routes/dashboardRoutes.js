const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All dashboard routes must be authenticated
router.use(authenticateUser);

// GET /api/dashboard & GET /api/dashboard/overview
router.get('/', dashboardController.getOverview);
router.get('/overview', dashboardController.getOverview);

// GET /api/dashboard/recent-transactions
router.get('/recent-transactions', dashboardController.getRecentTransactions);

// GET /api/dashboard/monthly-summary
router.get('/monthly-summary', dashboardController.getMonthlySummary);

// GET /api/dashboard/category-breakdown
router.get('/category-breakdown', dashboardController.getCategoryBreakdown);

// GET /api/dashboard/budget-overview
router.get('/budget-overview', dashboardController.getBudgetOverview);

module.exports = router;
