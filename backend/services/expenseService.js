const dbUtils = require('../utils/database');
const { ValidationError, NotFoundError } = require('../utils/AppError');

const getAllExpenses = async (userId, queryParams) => {
    let { page, limit, categoryId, startDate, endDate, search, sortBy, sortOrder, minAmount, maxAmount } = queryParams;
    
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;
    
    let baseQuery = `
        FROM transactions t
        JOIN categories c ON t.category_id = c.category_id
        WHERE t.user_id = ? AND t.type = 'Expense'
    `;
    const params = [userId];

    if (categoryId) {
        baseQuery += ' AND t.category_id = ?';
        params.push(categoryId);
    }

    if (startDate) {
        baseQuery += ' AND t.transaction_date >= ?';
        params.push(startDate);
    }

    if (endDate) {
        baseQuery += ' AND t.transaction_date <= ?';
        params.push(endDate);
    }

    if (minAmount !== undefined && minAmount !== '') {
        baseQuery += ' AND t.amount >= ?';
        params.push(minAmount);
    }

    if (maxAmount !== undefined && maxAmount !== '') {
        baseQuery += ' AND t.amount <= ?';
        params.push(maxAmount);
    }

    if (search) {
        baseQuery += ' AND (t.description LIKE ? OR c.category_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    // Count Total Records
    const countResult = await dbUtils.executeQuery(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const totalRecords = countResult[0].total;

    // Sorting
    const validSortFields = ['transaction_date', 'amount'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'transaction_date';
    const order = validSortOrders.includes(sortOrder ? sortOrder.toUpperCase() : '') ? sortOrder.toUpperCase() : 'DESC';
    
    baseQuery += ` ORDER BY t.${sortField} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Fetch Records
    const selectQuery = `
        SELECT 
            t.transaction_id AS transactionId,
            t.amount,
            t.description,
            t.transaction_date AS transactionDate,
            c.category_id AS categoryId,
            c.category_name AS categoryName
        ${baseQuery}
    `;

    const records = await dbUtils.executeQuery(selectQuery, params);

    return {
        records,
        pagination: {
            total: totalRecords,
            page,
            limit,
            totalPages: Math.ceil(totalRecords / limit)
        }
    };
};

const getExpenseById = async (userId, transactionId) => {
    const records = await dbUtils.executeQuery(
        `SELECT 
            t.transaction_id AS transactionId,
            t.amount,
            t.description,
            t.transaction_date AS transactionDate,
            c.category_id AS categoryId,
            c.category_name AS categoryName
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.transaction_id = ? AND t.user_id = ? AND t.type = 'Expense'`,
        [transactionId, userId]
    );

    if (!records || records.length === 0) {
        throw new NotFoundError('Expense record not found or access denied');
    }

    return records[0];
};

const createExpense = async (userId, categoryId, amount, description, transactionDate) => {
    // Validate category exists and is 'Expense'
    const categories = await dbUtils.executeQuery(
        'SELECT category_type FROM categories WHERE category_id = ?',
        [categoryId]
    );

    if (!categories || categories.length === 0) {
        throw new ValidationError('Category does not exist');
    }

    if (categories[0].category_type !== 'Expense') {
        throw new ValidationError('Category must be of type Expense');
    }

    const result = await dbUtils.executeQuery(
        `INSERT INTO transactions 
        (user_id, category_id, amount, type, description, transaction_date) 
        VALUES (?, ?, ?, 'Expense', ?, ?)`,
        [userId, categoryId, amount, description, transactionDate]
    );

    return {
        transactionId: result.insertId,
        categoryId,
        amount,
        description,
        transactionDate
    };
};

const updateExpense = async (userId, transactionId, categoryId, amount, description, transactionDate) => {
    // Verify ownership
    await getExpenseById(userId, transactionId);

    // Validate category exists and is 'Expense'
    const categories = await dbUtils.executeQuery(
        'SELECT category_type FROM categories WHERE category_id = ?',
        [categoryId]
    );

    if (!categories || categories.length === 0) {
        throw new ValidationError('Category does not exist');
    }

    if (categories[0].category_type !== 'Expense') {
        throw new ValidationError('Category must be of type Expense');
    }

    await dbUtils.executeQuery(
        `UPDATE transactions 
         SET category_id = ?, amount = ?, description = ?, transaction_date = ? 
         WHERE transaction_id = ? AND user_id = ? AND type = 'Expense'`,
        [categoryId, amount, description, transactionDate, transactionId, userId]
    );

    return {
        transactionId: parseInt(transactionId, 10),
        categoryId,
        amount,
        description,
        transactionDate
    };
};

const deleteExpense = async (userId, transactionId) => {
    // Verify ownership
    await getExpenseById(userId, transactionId);

    await dbUtils.executeQuery(
        `DELETE FROM transactions WHERE transaction_id = ? AND user_id = ? AND type = 'Expense'`,
        [transactionId, userId]
    );

    return true;
};

const getExpenseSummary = async (userId) => {
    const summary = await dbUtils.executeQuery(
        `SELECT 
            COALESCE(SUM(amount), 0) AS totalExpense,
            COUNT(transaction_id) AS expenseCount,
            COALESCE(AVG(amount), 0) AS averageExpense
         FROM transactions 
         WHERE user_id = ? AND type = 'Expense'`,
        [userId]
    );

    const currentMonthSummary = await dbUtils.executeQuery(
        `SELECT 
            COALESCE(SUM(amount), 0) AS thisMonthExpense
         FROM transactions 
         WHERE user_id = ? AND type = 'Expense' 
         AND MONTH(transaction_date) = MONTH(CURRENT_DATE()) 
         AND YEAR(transaction_date) = YEAR(CURRENT_DATE())`,
        [userId]
    );

    return {
        totalExpense: parseFloat(summary[0].totalExpense),
        thisMonthExpense: parseFloat(currentMonthSummary[0].thisMonthExpense),
        expenseCount: summary[0].expenseCount,
        averageExpense: parseFloat(summary[0].averageExpense)
    };
};

const getTopCategories = async (userId) => {
    const records = await dbUtils.executeQuery(
        `SELECT 
            c.category_name AS categoryName,
            SUM(t.amount) AS totalAmount,
            COUNT(t.transaction_id) AS transactionCount
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.type = 'Expense'
         GROUP BY c.category_id
         ORDER BY totalAmount DESC
         LIMIT 5`,
        [userId]
    );
    
    // ensure float conversion for amounts
    return records.map(r => ({
        ...r,
        totalAmount: parseFloat(r.totalAmount)
    }));
};

const getMonthlyTrend = async (userId) => {
    // Last 6 months trend
    const records = await dbUtils.executeQuery(
        `SELECT 
            DATE_FORMAT(transaction_date, '%Y-%m') AS monthKey,
            SUM(amount) AS totalAmount
         FROM transactions 
         WHERE user_id = ? AND type = 'Expense' 
         AND transaction_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
         GROUP BY monthKey
         ORDER BY monthKey ASC`,
        [userId]
    );

    return records.map(r => ({
        ...r,
        totalAmount: parseFloat(r.totalAmount)
    }));
};

module.exports = {
    getAllExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseSummary,
    getTopCategories,
    getMonthlyTrend
};
