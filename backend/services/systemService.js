const checkDatabaseHealth = require('../utils/databaseHealth');
const env = require('../config/env');

const getHealthStatus = async () => {
    return {
        status: 'UP',
        timestamp: new Date()
    };
};

const getSystemInfo = async () => {
    const dbHealth = await checkDatabaseHealth();
    return {
        applicationName: 'AI Finance Manager',
        version: '1.0.0',
        environment: env.NODE_ENV,
        databaseStatus: dbHealth.connected ? 'connected' : 'disconnected',
        currentTime: new Date()
    };
};

module.exports = {
    getHealthStatus,
    getSystemInfo
};
