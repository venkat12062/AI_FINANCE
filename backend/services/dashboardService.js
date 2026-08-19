const dbUtils = require('../utils/database');

const getOverview = async (userId) => {
    // Total Income & Expense
    const totalsQuery = await dbUtils.executeQuery(
        `SELECT 
            SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) AS totalIncome,
            SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) AS totalExpense
         FROM transactions 
         WHERE user_id = ?`,
        [userId]
    );

    // Monthly Income & Expense
    const monthlyQuery = await dbUtils.executeQuery(
        `SELECT 
            SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) AS monthlyIncome,
            SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) AS monthlyExpense
         FROM transactions 
         WHERE user_id = ? 
         AND MONTH(transaction_date) = MONTH(CURRENT_DATE()) 
         AND YEAR(transaction_date) = YEAR(CURRENT_DATE())`,
        [userId]
    );

    const totalIncome = parseFloat(totalsQuery[0].totalIncome || 0);
    const totalExpense = parseFloat(totalsQuery[0].totalExpense || 0);
    const monthlyIncome = parseFloat(monthlyQuery[0].monthlyIncome || 0);
    const monthlyExpense = parseFloat(monthlyQuery[0].monthlyExpense || 0);

    const currentBalance = totalIncome - totalExpense;
    const monthlySavings = monthlyIncome - monthlyExpense;

    return {
        totalIncome,
        totalExpense,
        currentBalance,
        monthlyIncome,
        monthlyExpense,
        monthlySavings
    };
};

const getRecentTransactions = async (userId, limit = 10) => {
    const records = await dbUtils.executeQuery(
        `SELECT 
            t.transaction_id AS transactionId,
            t.transaction_date AS date,
            c.category_name AS category,
            t.type,
            t.amount,
            t.description
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ?
         ORDER BY t.transaction_date DESC, t.transaction_id DESC
         LIMIT ?`,
        [userId, limit]
    );

    return records.map(r => ({
        ...r,
        amount: parseFloat(r.amount)
    }));
};

const getMonthlySummary = async (userId) => {
    // Last 12 months
    const records = await dbUtils.executeQuery(
        `SELECT 
            DATE_FORMAT(transaction_date, '%Y-%m') AS monthKey,
            SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) AS expense
         FROM transactions 
         WHERE user_id = ? 
         AND transaction_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
         GROUP BY monthKey
         ORDER BY monthKey ASC`,
        [userId]
    );

    return records.map(r => ({
        month: r.monthKey,
        income: parseFloat(r.income || 0),
        expense: parseFloat(r.expense || 0)
    }));
};

const getCategoryBreakdown = async (userId) => {
    const incomeRecords = await dbUtils.executeQuery(
        `SELECT 
            c.category_name AS categoryName,
            SUM(t.amount) AS totalAmount
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.type = 'Income'
         AND MONTH(t.transaction_date) = MONTH(CURRENT_DATE()) 
         AND YEAR(t.transaction_date) = YEAR(CURRENT_DATE())
         GROUP BY c.category_id
         ORDER BY totalAmount DESC`,
        [userId]
    );

    const expenseRecords = await dbUtils.executeQuery(
        `SELECT 
            c.category_name AS categoryName,
            SUM(t.amount) AS totalAmount
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.type = 'Expense'
         AND MONTH(t.transaction_date) = MONTH(CURRENT_DATE()) 
         AND YEAR(t.transaction_date) = YEAR(CURRENT_DATE())
         GROUP BY c.category_id
         ORDER BY totalAmount DESC`,
        [userId]
    );

    return {
        income: incomeRecords.map(r => ({ category: r.categoryName, amount: parseFloat(r.totalAmount) })),
        expense: expenseRecords.map(r => ({ category: r.categoryName, amount: parseFloat(r.totalAmount) }))
    };
};

const getBudgetOverview = async (userId) => {
    const date = new Date();
    const currentMonth = date.getMonth() + 1;
    const currentYear = date.getFullYear();

    const budgets = await dbUtils.executeQuery(
        `SELECT budget_limit
         FROM budgets
         WHERE user_id = ? AND month = ? AND year = ?`,
        [userId, currentMonth, currentYear]
    );

    if (!budgets || budgets.length === 0) {
        return null;
    }

    const budgetLimit = parseFloat(budgets[0].budget_limit);

    const expenseQuery = await dbUtils.executeQuery(
        `SELECT COALESCE(SUM(amount), 0) AS spentAmount
         FROM transactions
         WHERE user_id = ? AND type = 'Expense' 
         AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
        [userId, currentMonth, currentYear]
    );

    const spentAmount = parseFloat(expenseQuery[0].spentAmount);
    const remainingAmount = budgetLimit - spentAmount;
    const percentageUsed = budgetLimit > 0 ? (spentAmount / budgetLimit) * 100 : 0;

    return {
        budgetLimit,
        spentAmount,
        remainingAmount,
        percentageUsed: Math.round(percentageUsed * 100) / 100
    };
};

module.exports = {
    getOverview,
    getRecentTransactions,
    getMonthlySummary,
    getCategoryBreakdown,
    getBudgetOverview
};
