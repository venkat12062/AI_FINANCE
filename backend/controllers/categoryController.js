const categoryService = require('../services/categoryService');
const { successResponse } = require('../utils/apiResponse');

const getAllCategories = async (req, res, next) => {
    try {
        const { type, search } = req.query;
        const userId = req.user.userId;
        const categories = await categoryService.getAllCategories(userId, type, search);
        return successResponse(res, categories, "Categories fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const getCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const category = await categoryService.getCategoryById(userId, id);
        return successResponse(res, category, "Category fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

const createCategory = async (req, res, next) => {
    try {
        const { categoryName, categoryType } = req.body;
        const userId = req.user.userId;
        const newCategory = await categoryService.createCategory(userId, categoryName, categoryType);
        return successResponse(res, newCategory, "Category created successfully", 201);
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { categoryName, categoryType } = req.body;
        const userId = req.user.userId;
        const updatedCategory = await categoryService.updateCategory(userId, id, categoryName, categoryType);
        return successResponse(res, updatedCategory, "Category updated successfully", 200);
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        await categoryService.deleteCategory(userId, id);
        return successResponse(res, null, "Category deleted successfully", 200);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
