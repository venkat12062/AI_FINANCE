const dashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/apiResponse');
const cache = require('../utils/cache');

const getOverview = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const cacheKey = `dashboard_overview_${userId}`;
        
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return successResponse(res, cachedData, "Dashboard overview retrieved successfully (cached)", 200);
        }

        const data = await dashboardService.getOverview(userId);
        
        cache.set(cacheKey, data);
        
        return successResponse(res, data, "Dashboard overview retrieved successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getRecentTransactions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 10;
        const result = await dashboardService.getRecentTransactions(userId, limit);
        return successResponse(res, result, "Recent transactions fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getMonthlySummary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await dashboardService.getMonthlySummary(userId);
        return successResponse(res, result, "Monthly summary fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getCategoryBreakdown = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await dashboardService.getCategoryBreakdown(userId);
        return successResponse(res, result, "Category breakdown fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getBudgetOverview = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await dashboardService.getBudgetOverview(userId);
        return successResponse(res, result, "Budget overview fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getOverview,
    getRecentTransactions,
    getMonthlySummary,
    getCategoryBreakdown,
    getBudgetOverview
};
