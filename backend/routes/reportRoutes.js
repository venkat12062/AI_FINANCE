const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All report routes must be authenticated
router.use(authenticateUser);

// GET /api/reports/summary
router.get('/summary', reportController.getReportSummary);

// GET /api/reports/category-analysis
router.get('/category-analysis', reportController.getCategoryAnalysis);

// GET /api/reports/monthly-analysis
router.get('/monthly-analysis', reportController.getMonthlyAnalysis);

// GET /api/reports/export/csv
router.get('/export/csv', reportController.exportCSV);

// GET /api/reports/export/pdf
router.get('/export/pdf', reportController.exportPDF);

module.exports = router;
