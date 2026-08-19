const express = require('express');
const router = express.Router();
const dbUtils = require('../utils/database');
const { getDatabaseStats } = require('../utils/databaseMonitor');
const { authenticateUser } = require('../middleware/authMiddleware');

// GET /api/database/monitor
router.get('/monitor', authenticateUser, async (req, res) => {
    const stats = await getDatabaseStats();
    if (stats.status === 'healthy') {
        res.json({ success: true, data: stats });
    } else {
        res.status(500).json({ success: false, message: 'Database unhealthy', data: stats });
    }
});

// GET /api/database/status
router.get('/status', async (req, res) => {
    try {
        const tablesToCheck = ['users', 'categories', 'transactions', 'budgets', 'receipts', 'ai_insights'];
        const tableStatus = {};
        let allGood = true;

        for (const table of tablesToCheck) {
            try {
                // Check if table exists by selecting 1 row
                await dbUtils.executeQuery(`SELECT 1 FROM \`${table}\` LIMIT 1`);
                tableStatus[table] = true;
            } catch (err) {
                tableStatus[table] = false;
                allGood = false;
            }
        }

        res.json({
            success: allGood,
            database: "connected",
            tables: tableStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message
        });
    }
});

// GET /api/database/categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await dbUtils.executeQuery('SELECT * FROM categories');
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
            error: error.message
        });
    }
});

module.exports = router;
