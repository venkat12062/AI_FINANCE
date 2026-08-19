const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All AI routes must be authenticated
router.use(authenticateUser);

// GET /api/ai/insights & GET /api/insights
router.get('/', aiController.getInsights);
router.get('/insights', aiController.getInsights);

// GET /api/ai/financial-health
router.get('/financial-health', aiController.getFinancialHealth);

// GET /api/ai/spending-analysis
router.get('/spending-analysis', aiController.getSpendingAnalysis);

// GET /api/ai/recommendations
router.get('/recommendations', aiController.getRecommendations);

module.exports = router;
