const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All backup routes are strictly protected
router.use(authenticateUser);

// POST /api/backups/create
router.post('/create', backupController.createBackup);

// GET /api/backups
router.get('/', backupController.getBackups);

// DELETE /api/backups/:filename
router.delete('/:filename', backupController.deleteBackup);

// POST /api/backups/restore
router.post('/restore', backupController.restoreBackup);

module.exports = router;
