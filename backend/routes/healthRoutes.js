const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

const { authenticateUser } = require('../middleware/authMiddleware');

// GET /api/system/health
router.get('/health', healthController.getHealthStatus);

// GET /api/system/performance
router.get('/performance', authenticateUser, healthController.getPerformanceStats);

module.exports = router;
