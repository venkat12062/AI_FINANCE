const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

// GET /api/health
router.get('/health', systemController.healthCheck);

// GET /api/system/info
router.get('/system/info', systemController.systemInfo);

module.exports = router;
