const dbUtils = require('../utils/database');

const enrichBudgetWithUsage = async (userId, budget) => {
    // Sum expenses for this month and year
    const expenseQuery = await dbUtils.executeQuery(
        `SELECT COALESCE(SUM(amount), 0) AS spentAmount
         FROM transactions
         WHERE user_id = ? AND type = 'Expense' 
         AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
        [userId, budget.month, budget.year]
    );

    const spentAmount = parseFloat(expenseQuery[0].spentAmount);
    const budgetLimit = parseFloat(budget.budget_limit || budget.budgetLimit);
    const remainingAmount = budgetLimit - spentAmount;
    const percentageUsed = budgetLimit > 0 ? (spentAmount / budgetLimit) * 100 : 0;

    return {
        budgetId: budget.budget_id || budget.budgetId,
        month: budget.month,
        year: budget.year,
        budgetLimit: budgetLimit,
        spentAmount: spentAmount,
        remainingAmount: remainingAmount,
        percentageUsed: Math.round(percentageUsed * 100) / 100 // Round to 2 decimal places
    };
};

const getAllBudgets = async (userId) => {
    const budgets = await dbUtils.executeQuery(
        `SELECT budget_id, month, year, budget_limit
         FROM budgets
         WHERE user_id = ?
         ORDER BY year DESC, month DESC`,
        [userId]
    );

    const enrichedBudgets = [];
    for (const budget of budgets) {
        enrichedBudgets.push(await enrichBudgetWithUsage(userId, budget));
    }
    return enrichedBudgets;
};

const getBudgetById = async (userId, budgetId) => {
    const budgets = await dbUtils.executeQuery(
        `SELECT budget_id, month, year, budget_limit
         FROM budgets
         WHERE budget_id = ? AND user_id = ?`,
        [budgetId, userId]
    );

    if (!budgets || budgets.length === 0) {
        const error = new Error('Budget not found or access denied');
        error.statusCode = 404;
        throw error;
    }

    return await enrichBudgetWithUsage(userId, budgets[0]);
};

const createBudget = async (userId, month, year, budgetLimit) => {
    // Prevent duplicates for month+year+user
    const existing = await dbUtils.executeQuery(
        `SELECT budget_id FROM budgets WHERE user_id = ? AND month = ? AND year = ?`,
        [userId, month, year]
    );

    if (existing && existing.length > 0) {
        const error = new Error('A budget for this month and year already exists');
        error.statusCode = 400;
        throw error;
    }

    const result = await dbUtils.executeQuery(
        `INSERT INTO budgets (user_id, month, year, budget_limit) VALUES (?, ?, ?, ?)`,
        [userId, month, year, budgetLimit]
    );

    return await enrichBudgetWithUsage(userId, {
        budget_id: result.insertId,
        month,
        year,
        budget_limit: budgetLimit
    });
};

const updateBudget = async (userId, budgetId, month, year, budgetLimit) => {
    // Verify ownership
    await getBudgetById(userId, budgetId);

    // Prevent duplicate month/year for another budget
    const existing = await dbUtils.executeQuery(
        `SELECT budget_id FROM budgets WHERE user_id = ? AND month = ? AND year = ? AND budget_id != ?`,
        [userId, month, year, budgetId]
    );

    if (existing && existing.length > 0) {
        const error = new Error('Another budget for this month and year already exists');
        error.statusCode = 400;
        throw error;
    }

    await dbUtils.executeQuery(
        `UPDATE budgets SET month = ?, year = ?, budget_limit = ? WHERE budget_id = ? AND user_id = ?`,
        [month, year, budgetLimit, budgetId, userId]
    );

    return await enrichBudgetWithUsage(userId, {
        budget_id: budgetId,
        month,
        year,
        budget_limit: budgetLimit
    });
};

const deleteBudget = async (userId, budgetId) => {
    // Verify ownership
    await getBudgetById(userId, budgetId);

    await dbUtils.executeQuery(
        `DELETE FROM budgets WHERE budget_id = ? AND user_id = ?`,
        [budgetId, userId]
    );

    return true;
};

const getBudgetSummary = async (userId) => {
    const budgets = await getAllBudgets(userId);
    
    let totalBudget = 0;
    let totalSpent = 0;

    for (const b of budgets) {
        totalBudget += b.budgetLimit;
        totalSpent += b.spentAmount;
    }

    const remainingBudget = totalBudget - totalSpent;
    const overallUsagePercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
        totalBudget,
        totalSpent,
        remainingBudget,
        overallUsagePercent: Math.round(overallUsagePercent * 100) / 100
    };
};

const getCurrentBudget = async (userId) => {
    const date = new Date();
    const currentMonth = date.getMonth() + 1;
    const currentYear = date.getFullYear();

    const budgets = await dbUtils.executeQuery(
        `SELECT budget_id, month, year, budget_limit
         FROM budgets
         WHERE user_id = ? AND month = ? AND year = ?`,
        [userId, currentMonth, currentYear]
    );

    if (!budgets || budgets.length === 0) {
        return null; // No budget set for current month
    }

    return await enrichBudgetWithUsage(userId, budgets[0]);
};

const getBudgetAlerts = async (userId) => {
    const budgets = await getAllBudgets(userId);
    const alerts = [];

    const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    for (const b of budgets) {
        const monthName = monthNames[b.month];
        const { percentageUsed } = b;
        
        let type = null;
        let message = null;

        if (percentageUsed >= 100) {
            type = 'critical';
            message = `You have exceeded your ${monthName} ${b.year} budget by ${Math.abs(b.remainingAmount)}. (${percentageUsed}%)`;
        } else if (percentageUsed >= 90) {
            type = 'warning';
            message = `You have used ${percentageUsed}% of your ${monthName} ${b.year} budget. Almost exhausted.`;
        } else if (percentageUsed >= 75) {
            type = 'info';
            message = `You have used ${percentageUsed}% of your ${monthName} ${b.year} budget.`;
        }

        if (type) {
            alerts.push({ type, message, budgetId: b.budgetId });
        }
    }

    return alerts;
};

module.exports = {
    getAllBudgets,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget,
    getBudgetSummary,
    getCurrentBudget,
    getBudgetAlerts
};
