const dbUtils = require('../utils/database');
const { ValidationError, NotFoundError } = require('../utils/AppError');

const getAllIncome = async (userId, queryParams) => {
    let { page, limit, categoryId, startDate, endDate, search, sortBy, sortOrder } = queryParams;
    
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;
    
    let baseQuery = `
        FROM transactions t
        JOIN categories c ON t.category_id = c.category_id
        WHERE t.user_id = ? AND t.type = 'Income'
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

const getIncomeById = async (userId, transactionId) => {
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
         WHERE t.transaction_id = ? AND t.user_id = ? AND t.type = 'Income'`,
        [transactionId, userId]
    );

    if (!records || records.length === 0) {
        throw new NotFoundError('Income record not found or access denied');
    }

    return records[0];
};

const createIncome = async (userId, categoryId, amount, description, transactionDate) => {
    // Validate category exists and is 'Income'
    const categories = await dbUtils.executeQuery(
        'SELECT category_type FROM categories WHERE category_id = ?',
        [categoryId]
    );

    if (!categories || categories.length === 0) {
        throw new ValidationError('Category does not exist');
    }

    if (categories[0].category_type !== 'Income') {
        throw new ValidationError('Category must be of type Income');
    }

    const result = await dbUtils.executeQuery(
        `INSERT INTO transactions 
        (user_id, category_id, amount, type, description, transaction_date) 
        VALUES (?, ?, ?, 'Income', ?, ?)`,
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

const updateIncome = async (userId, transactionId, categoryId, amount, description, transactionDate) => {
    // Verify ownership
    await getIncomeById(userId, transactionId);

    // Validate category exists and is 'Income'
    const categories = await dbUtils.executeQuery(
        'SELECT category_type FROM categories WHERE category_id = ?',
        [categoryId]
    );

    if (!categories || categories.length === 0) {
        throw new ValidationError('Category does not exist');
    }

    if (categories[0].category_type !== 'Income') {
        throw new ValidationError('Category must be of type Income');
    }

    await dbUtils.executeQuery(
        `UPDATE transactions 
         SET category_id = ?, amount = ?, description = ?, transaction_date = ? 
         WHERE transaction_id = ? AND user_id = ? AND type = 'Income'`,
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

const deleteIncome = async (userId, transactionId) => {
    // Verify ownership
    await getIncomeById(userId, transactionId);

    await dbUtils.executeQuery(
        `DELETE FROM transactions WHERE transaction_id = ? AND user_id = ? AND type = 'Income'`,
        [transactionId, userId]
    );

    return true;
};

const getIncomeSummary = async (userId) => {
    const summary = await dbUtils.executeQuery(
        `SELECT 
            COALESCE(SUM(amount), 0) AS totalIncome,
            COUNT(transaction_id) AS incomeCount,
            COALESCE(AVG(amount), 0) AS averageIncome
         FROM transactions 
         WHERE user_id = ? AND type = 'Income'`,
        [userId]
    );

    const currentMonthSummary = await dbUtils.executeQuery(
        `SELECT 
            COALESCE(SUM(amount), 0) AS thisMonthIncome
         FROM transactions 
         WHERE user_id = ? AND type = 'Income' 
         AND MONTH(transaction_date) = MONTH(CURRENT_DATE()) 
         AND YEAR(transaction_date) = YEAR(CURRENT_DATE())`,
        [userId]
    );

    return {
        totalIncome: parseFloat(summary[0].totalIncome),
        thisMonthIncome: parseFloat(currentMonthSummary[0].thisMonthIncome),
        incomeCount: summary[0].incomeCount,
        averageIncome: parseFloat(summary[0].averageIncome)
    };
};

module.exports = {
    getAllIncome,
    getIncomeById,
    createIncome,
    updateIncome,
    deleteIncome,
    getIncomeSummary
};
