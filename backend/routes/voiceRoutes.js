const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All voice routes must be authenticated
router.use(authenticateUser);

// POST /api/voice/parse
router.post('/parse', voiceController.parseVoice);

// POST /api/voice/create-transaction
router.post('/create-transaction', voiceController.createTransaction);

// GET /api/voice/history
router.get('/history', voiceController.getHistory);

// DELETE /api/voice/history/:id
router.delete('/history/:id', voiceController.deleteHistory);

module.exports = router;
