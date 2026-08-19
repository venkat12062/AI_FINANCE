const dbUtils = require('./database');

const checkDatabaseHealth = async () => {
    try {
        const tablesToCheck = ['users', 'categories', 'transactions', 'budgets', 'receipts', 'ai_insights'];
        const tableStatus = {};
        let allGood = true;

        for (const table of tablesToCheck) {
            try {
                await dbUtils.executeQuery(`SELECT 1 FROM \`${table}\` LIMIT 1`);
                tableStatus[table] = true;
            } catch (err) {
                tableStatus[table] = false;
                allGood = false;
            }
        }

        return {
            database: "connected",
            connected: allGood,
            tables: tableStatus
        };
    } catch (error) {
        return {
            database: "disconnected",
            connected: false,
            error: error.message
        };
    }
};

module.exports = checkDatabaseHealth;
