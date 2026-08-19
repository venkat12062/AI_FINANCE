const aiService = require('../services/aiService');
const { successResponse } = require('../utils/apiResponse');
const cache = require('../utils/cache');

const getInsights = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await aiService.generateInsights(userId);
        return successResponse(res, result, "Insights generated successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getFinancialHealth = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const cacheKey = `ai_health_score_${userId}`;
        
        const cachedData = cache.get(cacheKey);
        if (cachedData) {
            return successResponse(res, cachedData, "Financial health calculated successfully (cached)", 200);
        }

        const result = await aiService.calculateHealthScore(userId);
        
        cache.set(cacheKey, result);
        
        return successResponse(res, result, "Financial health calculated successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getSpendingAnalysis = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await aiService.analyzeSpending(userId);
        return successResponse(res, result, "Spending analysis fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getRecommendations = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await aiService.generateRecommendations(userId);
        return successResponse(res, result, "Recommendations fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInsights,
    getFinancialHealth,
    getSpendingAnalysis,
    getRecommendations
};
