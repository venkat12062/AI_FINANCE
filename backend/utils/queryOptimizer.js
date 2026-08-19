const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
const queryLogFile = path.join(logDir, 'query.log');

const appendFileAsync = promisify(fs.appendFile);

let slowQueryCount = 0;
let totalQueryCount = 0;
let totalQueryTimeMs = 0;

/**
 * Logs a slow query to the query.log file
 * @param {string} sql 
 * @param {number} executionTimeMs 
 */
async function logSlowQuery(sql, executionTimeMs) {
    slowQueryCount++;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] SLOW QUERY (${executionTimeMs.toFixed(2)}ms): ${sql.trim()}\n`;
    
    try {
        await appendFileAsync(queryLogFile, logMessage);
    } catch (err) {
        console.error('Failed to write to query.log:', err);
    }
}

/**
 * Wraps a database query function to measure execution time
 * @param {Function} queryFn The original database execution function
 * @returns {Function} Wrapped function
 */
function measureQueryPerformance(queryFn) {
    return async function (sql, params) {
        const startTime = process.hrtime();
        
        try {
            const result = await queryFn(sql, params);
            
            const diff = process.hrtime(startTime);
            const executionTimeMs = (diff[0] * 1000) + (diff[1] / 1e6);
            
            totalQueryCount++;
            totalQueryTimeMs += executionTimeMs;

            if (executionTimeMs > 500) {
                logSlowQuery(sql, executionTimeMs);
            }
            
            return result;
        } catch (error) {
            throw error;
        }
    };
}

function getSlowQueryCount() {
    return slowQueryCount;
}

function getQueryStats() {
    return {
        totalQueries: totalQueryCount,
        averageQueryTimeMs: totalQueryCount > 0 ? (totalQueryTimeMs / totalQueryCount) : 0,
        slowQueries: slowQueryCount
    };
}

module.exports = {
    measureQueryPerformance,
    logSlowQuery,
    getSlowQueryCount,
    getQueryStats
};
