const dbUtils = require('../utils/database');
const { successResponse } = require('../utils/apiResponse');

const getHealthStatus = async (req, res, next) => {
    try {
        let dbStatus = 'Disconnected';
        try {
            await dbUtils.executeQuery('SELECT 1');
            dbStatus = 'Connected';
        } catch (e) {
            dbStatus = 'Error';
        }

        const memoryUsage = process.memoryUsage();

        const healthData = {
            database: dbStatus,
            server: 'Running',
            uptime: `${Math.floor(process.uptime())} seconds`,
            memoryUsage: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
            },
            version: '1.0.0'
        };

        return successResponse(res, healthData, "System health status retrieved successfully", 200);
    } catch (error) {
        next(error);
    }
};

const { getQueryStats } = require('../utils/queryOptimizer');
const { getCacheStats } = require('../utils/cache');

const getPerformanceStats = async (req, res, next) => {
    try {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const queryStats = getQueryStats();
        const cacheStats = getCacheStats();

        const performanceData = {
            memoryUsage: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
            },
            cpuUsage: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            serverUptime: `${Math.floor(process.uptime())} seconds`,
            cache: cacheStats,
            database: {
                totalQueries: queryStats.totalQueries,
                slowQueryCount: queryStats.slowQueries,
                averageQueryTimeMs: queryStats.averageQueryTimeMs.toFixed(2)
            },
            requestCount: queryStats.totalQueries // Approximated by total queries for now
        };

        return successResponse(res, performanceData, "Performance stats retrieved successfully", 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getHealthStatus,
    getPerformanceStats
};
