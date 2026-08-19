const budgetService = require('../services/budgetService');
const { successResponse } = require('../utils/apiResponse');

const getAllBudgets = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await budgetService.getAllBudgets(userId);
        return successResponse(res, result, "Budgets fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getBudgetSummary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const summary = await budgetService.getBudgetSummary(userId);
        return successResponse(res, summary, "Budget summary fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getCurrentBudget = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const budget = await budgetService.getCurrentBudget(userId);
        return successResponse(res, budget, "Current budget fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getBudgetAlerts = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const alerts = await budgetService.getBudgetAlerts(userId);
        return successResponse(res, alerts, "Budget alerts fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getBudgetById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const record = await budgetService.getBudgetById(userId, id);
        return successResponse(res, record, "Budget fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const createBudget = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { month, year, budgetLimit } = req.body;
        const newRecord = await budgetService.createBudget(userId, month, year, budgetLimit);
        return successResponse(res, newRecord, "Budget created successfully", 201);
    } catch (error) {
        next(error);
    }
};

const updateBudget = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { month, year, budgetLimit } = req.body;
        const updatedRecord = await budgetService.updateBudget(userId, id, month, year, budgetLimit);
        return successResponse(res, updatedRecord, "Budget updated successfully", 200);
    } catch (error) {
        next(error);
    }
};

const deleteBudget = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        await budgetService.deleteBudget(userId, id);
        return successResponse(res, null, "Budget deleted successfully", 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllBudgets,
    getBudgetSummary,
    getCurrentBudget,
    getBudgetAlerts,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget
};
