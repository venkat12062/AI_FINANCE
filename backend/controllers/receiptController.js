const receiptService = require('../services/receiptService');
const { successResponse } = require('../utils/apiResponse');
const fs = require('fs');

const uploadReceipt = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided" });
        }
        
        const userId = req.user.userId;
        const result = await receiptService.uploadReceipt(userId, req.file);
        
        return successResponse(res, result, "Receipt uploaded and parsed successfully", 201);
    } catch (error) {
        // Cleanup if there's a failure during OCR/DB insert
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
};

const getReceipts = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const result = await receiptService.getReceipts(userId);
        return successResponse(res, result, "Receipts fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getReceiptById = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const receiptId = req.params.id;
        const result = await receiptService.getReceiptById(userId, receiptId);
        return successResponse(res, result, "Receipt details fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const deleteReceipt = async (req, res, next) => {
    try {
        const userId    = req.user.userId;
        const receiptId = req.params.id;
        await receiptService.deleteReceipt(userId, receiptId);
        return successResponse(res, null, 'Receipt deleted successfully', 200);
    } catch (error) {
        if (error.message && error.message.includes('not found')) {
            return res.status(404).json({ success: false, message: 'Receipt not found' });
        }
        next(error);
    }
};

const createExpense = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { receiptId, categoryId, amount, date, description } = req.body;
        
        if (!receiptId || !categoryId || !amount || !date) {
            return res.status(400).json({ success: false, message: "Missing required fields for expense creation" });
        }

        await receiptService.createExpenseFromReceipt(userId, req.body);
        return successResponse(res, null, "Expense created successfully.", 201);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadReceipt,
    getReceipts,
    getReceiptById,
    deleteReceipt,
    createExpense
};
