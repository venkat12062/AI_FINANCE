const expenseService = require('../services/expenseService');
const { successResponse } = require('../utils/apiResponse');

const getAllExpenses = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await expenseService.getAllExpenses(userId, req.query);
        return successResponse(res, result, "Expense records fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getExpenseSummary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const summary = await expenseService.getExpenseSummary(userId);
        return successResponse(res, summary, "Expense summary fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getTopCategories = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await expenseService.getTopCategories(userId);
        return successResponse(res, result, "Top categories fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getMonthlyTrend = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await expenseService.getMonthlyTrend(userId);
        return successResponse(res, result, "Monthly trend fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getExpenseById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const record = await expenseService.getExpenseById(userId, id);
        return successResponse(res, record, "Expense record fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const createExpense = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { categoryId, amount, description, transactionDate } = req.body;
        const newRecord = await expenseService.createExpense(userId, categoryId, amount, description, transactionDate);
        return successResponse(res, newRecord, "Expense record created successfully", 201);
    } catch (error) {
        next(error);
    }
};

const updateExpense = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { categoryId, amount, description, transactionDate } = req.body;
        const updatedRecord = await expenseService.updateExpense(userId, id, categoryId, amount, description, transactionDate);
        return successResponse(res, updatedRecord, "Expense record updated successfully", 200);
    } catch (error) {
        next(error);
    }
};

const deleteExpense = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        await expenseService.deleteExpense(userId, id);
        return successResponse(res, null, "Expense record deleted successfully", 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllExpenses,
    getExpenseSummary,
    getTopCategories,
    getMonthlyTrend,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense
};
