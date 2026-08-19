const pool = require('../config/db');

/**
 * Gets a dedicated connection from the pool.
 * Useful for transactions.
 */
async function getConnection() {
    return await pool.getConnection();
}

const { measureQueryPerformance } = require('./queryOptimizer');

const { executeSqliteQuery } = require('../database/sqlite-adapter');
const logger = require('./logger');

let useSqliteFallback = false;

/**
 * Executes a query using the MySQL pool or SQLite fallback.
 */
const executeQuery = measureQueryPerformance(async function(sql, params = []) {
    if (useSqliteFallback) {
        return await executeSqliteQuery(sql, params);
    }

    try {
        const [rows, fields] = await pool.execute(sql, params);
        return rows;
    } catch (dbError) {
        // If MySQL is unreachable / access denied, switch seamlessly to SQLite
        if (
            dbError.code === 'ER_ACCESS_DENIED_ERROR' ||
            dbError.code === 'ECONNREFUSED' ||
            dbError.code === 'PROTOCOL_CONNECTION_LOST' ||
            dbError.code === 'ER_BAD_DB_ERROR' ||
            dbError.message?.includes('Access denied') ||
            dbError.message?.includes('connect ECONNREFUSED')
        ) {
            if (!useSqliteFallback) {
                logger.info('🔄 MySQL is unavailable. Seamlessly switched to local SQLite database mode.');
                useSqliteFallback = true;
            }
            return await executeSqliteQuery(sql, params);
        }
        throw dbError;
    }
});

/**
 * Begins a transaction on a specific connection.
 */
async function beginTransaction(connection) {
    await connection.beginTransaction();
}

/**
 * Commits a transaction on a specific connection.
 */
async function commitTransaction(connection) {
    await connection.commit();
}

/**
 * Rolls back a transaction on a specific connection.
 */
async function rollbackTransaction(connection) {
    await connection.rollback();
}

/**
 * Releases a dedicated connection back to the pool.
 */
function releaseConnection(connection) {
    if (connection) {
        connection.release();
    }
}

module.exports = {
    getConnection,
    executeQuery,
    beginTransaction,
    commitTransaction,
    rollbackTransaction,
    releaseConnection
};
