const dbUtils = require('../utils/database');

const getAllCategories = async (userId, type, search) => {
    let query = 'SELECT category_id AS categoryId, category_name AS categoryName, category_type AS categoryType FROM categories WHERE (user_id = ? OR user_id IS NULL)';
    const params = [userId];

    if (type) {
        query += ' AND category_type = ?';
        params.push(type);
    }

    if (search) {
        query += ' AND category_name LIKE ?';
        params.push(`%${search}%`);
    }

    query += ' ORDER BY category_name ASC';

    return await dbUtils.executeQuery(query, params);
};

const getCategoryById = async (userId, categoryId) => {
    const categories = await dbUtils.executeQuery(
        'SELECT category_id AS categoryId, category_name AS categoryName, category_type AS categoryType FROM categories WHERE category_id = ? AND (user_id = ? OR user_id IS NULL)',
        [categoryId, userId]
    );

    if (!categories || categories.length === 0) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }

    return categories[0];
};

const createCategory = async (userId, categoryName, categoryType) => {
    // Prevent duplicates for this user or global
    const existing = await dbUtils.executeQuery(
        'SELECT category_id FROM categories WHERE category_name = ? AND category_type = ? AND (user_id = ? OR user_id IS NULL)',
        [categoryName, categoryType, userId]
    );

    if (existing && existing.length > 0) {
        const error = new Error('Category already exists');
        error.statusCode = 400;
        throw error;
    }

    const result = await dbUtils.executeQuery(
        'INSERT INTO categories (user_id, category_name, category_type) VALUES (?, ?, ?)',
        [userId, categoryName, categoryType]
    );

    return {
        categoryId: result.insertId,
        categoryName,
        categoryType
    };
};

const updateCategory = async (userId, categoryId, categoryName, categoryType) => {
    // Check if category exists and is owned by the user (cannot update global categories)
    const category = await dbUtils.executeQuery(
        'SELECT user_id FROM categories WHERE category_id = ?',
        [categoryId]
    );

    if (!category || category.length === 0) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }

    if (category[0].user_id === null) {
        const error = new Error('Cannot modify global system categories');
        error.statusCode = 403;
        throw error;
    }

    if (category[0].user_id !== userId) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
    }

    // Prevent duplicate name/type pair for this user
    const existing = await dbUtils.executeQuery(
        'SELECT category_id FROM categories WHERE category_name = ? AND category_type = ? AND category_id != ? AND (user_id = ? OR user_id IS NULL)',
        [categoryName, categoryType, categoryId, userId]
    );

    if (existing && existing.length > 0) {
        const error = new Error('Category already exists');
        error.statusCode = 400;
        throw error;
    }

    await dbUtils.executeQuery(
        'UPDATE categories SET category_name = ?, category_type = ? WHERE category_id = ? AND user_id = ?',
        [categoryName, categoryType, categoryId, userId]
    );

    return {
        categoryId: parseInt(categoryId, 10),
        categoryName,
        categoryType
    };
};

const deleteCategory = async (userId, categoryId) => {
    // Check if category exists and is owned by the user
    const category = await dbUtils.executeQuery(
        'SELECT user_id FROM categories WHERE category_id = ?',
        [categoryId]
    );

    if (!category || category.length === 0) {
        const error = new Error('Category not found');
        error.statusCode = 404;
        throw error;
    }

    if (category[0].user_id === null) {
        const error = new Error('Cannot delete global system categories');
        error.statusCode = 403;
        throw error;
    }

    if (category[0].user_id !== userId) {
        const error = new Error('Access denied');
        error.statusCode = 403;
        throw error;
    }

    // Check whether category is used by transactions
    const usage = await dbUtils.executeQuery(
        'SELECT transaction_id FROM transactions WHERE category_id = ? AND user_id = ? LIMIT 1',
        [categoryId, userId]
    );

    if (usage && usage.length > 0) {
        const error = new Error('Category is being used by transactions');
        error.statusCode = 409;
        throw error;
    }

    await dbUtils.executeQuery(
        'DELETE FROM categories WHERE category_id = ? AND user_id = ?',
        [categoryId, userId]
    );

    return true;
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
