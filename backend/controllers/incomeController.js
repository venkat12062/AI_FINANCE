const incomeService = require('../services/incomeService');
const { successResponse } = require('../utils/apiResponse');

const getAllIncome = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await incomeService.getAllIncome(userId, req.query);
        return successResponse(res, result, "Income records fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getIncomeSummary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const summary = await incomeService.getIncomeSummary(userId);
        return successResponse(res, summary, "Income summary fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getIncomeById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const record = await incomeService.getIncomeById(userId, id);
        return successResponse(res, record, "Income record fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const createIncome = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { categoryId, amount, description, transactionDate } = req.body;
        const newRecord = await incomeService.createIncome(userId, categoryId, amount, description, transactionDate);
        return successResponse(res, newRecord, "Income record created successfully", 201);
    } catch (error) {
        next(error);
    }
};

const updateIncome = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { categoryId, amount, description, transactionDate } = req.body;
        const updatedRecord = await incomeService.updateIncome(userId, id, categoryId, amount, description, transactionDate);
        return successResponse(res, updatedRecord, "Income record updated successfully", 200);
    } catch (error) {
        next(error);
    }
};

const deleteIncome = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        await incomeService.deleteIncome(userId, id);
        return successResponse(res, null, "Income record deleted successfully", 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllIncome,
    getIncomeSummary,
    getIncomeById,
    createIncome,
    updateIncome,
    deleteIncome
};
