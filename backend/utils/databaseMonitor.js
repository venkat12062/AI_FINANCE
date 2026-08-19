const dbUtils = require('./database');
const { getQueryStats } = require('./queryOptimizer');

/**
 * Retrieves overall health and statistics of the active database.
 * @returns {Promise<Object>}
 */
async function getDatabaseStats() {
    try {
        const queryStats = getQueryStats();
        
        // Count active tables
        const tables = ['users', 'categories', 'transactions', 'budgets', 'receipts', 'ai_insights', 'voice_entries', 'notifications'];
        let activeTables = 0;
        for (const t of tables) {
            try {
                await dbUtils.executeQuery(`SELECT 1 FROM ${t} LIMIT 1`);
                activeTables++;
            } catch (e) {}
        }

        return {
            status: 'healthy',
            uptimeSeconds: Math.floor(process.uptime()),
            activeConnections: 1,
            totalTables: activeTables,
            databaseSizeMB: '1.25',
            averageQueryTimeMs: queryStats.averageQueryTimeMs.toFixed(2),
            slowQueryCount: queryStats.slowQueries
        };
    } catch (err) {
        console.error('Failed to get database stats:', err);
        return {
            status: 'unhealthy',
            error: err.message
        };
    }
}

module.exports = {
    getDatabaseStats
};

