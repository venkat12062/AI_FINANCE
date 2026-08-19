const systemService = require('../services/systemService');
const { successResponse } = require('../utils/apiResponse');

const healthCheck = async (req, res, next) => {
    try {
        const data = await systemService.getHealthStatus();
        return successResponse(res, data, "System is healthy");
    } catch (error) {
        next(error);
    }
};

const systemInfo = async (req, res, next) => {
    try {
        const data = await systemService.getSystemInfo();
        return successResponse(res, data, "System info retrieved successfully");
    } catch (error) {
        next(error);
    }
};

module.exports = {
    healthCheck,
    systemInfo
};
