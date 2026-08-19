const dbUtils = require('../utils/database');
const { generateCSV } = require('../utils/csvGenerator');
const { generatePDF } = require('../utils/pdfGenerator');

/**
 * Calculates start and end dates from preset ranges
 */
const resolveDateRange = (preset, customStart, customEnd) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
        const today = fmt(now);
        return { startDate: today, endDate: today };
    }
    if (preset === 'yesterday') {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const yStr = fmt(y);
        return { startDate: yStr, endDate: yStr };
    }
    if (preset === 'last7days') {
        const s = new Date(now);
        s.setDate(s.getDate() - 6);
        return { startDate: fmt(s), endDate: fmt(now) };
    }
    if (preset === 'last30days') {
        const s = new Date(now);
        s.setDate(s.getDate() - 29);
        return { startDate: fmt(s), endDate: fmt(now) };
    }
    if (preset === 'thisMonth') {
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: fmt(s), endDate: fmt(e) };
    }
    if (preset === 'lastMonth') {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0);
        return { startDate: fmt(s), endDate: fmt(e) };
    }
    if (preset === 'last3months') {
        const s = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: fmt(s), endDate: fmt(e) };
    }
    if (preset === 'last6months') {
        const s = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: fmt(s), endDate: fmt(e) };
    }
    if (preset === 'thisYear') {
        const s = new Date(now.getFullYear(), 0, 1);
        const e = new Date(now.getFullYear(), 11, 31);
        return { startDate: fmt(s), endDate: fmt(e) };
    }

    return { startDate: customStart || null, endDate: customEnd || null };
};

const buildDateFilter = (startDate, endDate) => {
    let dateFilter = '';
    const params = [];

    if (startDate) {
        dateFilter += ' AND transaction_date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        dateFilter += ' AND transaction_date <= ?';
        params.push(endDate);
    }
    return { dateFilter, params };
};

const getReportSummary = async (userId, startDate, endDate, preset = null) => {
    const dates = resolveDateRange(preset, startDate, endDate);
    const { dateFilter, params } = buildDateFilter(dates.startDate, dates.endDate);
    
    // Totals
    const query = await dbUtils.executeQuery(
        `SELECT 
            SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) AS totalIncome,
            SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) AS totalExpense,
            COUNT(transaction_id) AS transactionCount
         FROM transactions 
         WHERE user_id = ? ${dateFilter}`,
        [userId, ...params]
    );

    const totalIncome = parseFloat(query[0]?.totalIncome || 0);
    const totalExpense = parseFloat(query[0]?.totalExpense || 0);
    const transactionCount = parseInt(query[0]?.transactionCount || 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;

    // Highest expense category in range
    const topExpRows = await dbUtils.executeQuery(
        `SELECT c.category_name, SUM(t.amount) as amount
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.type = 'Expense' ${dateFilter}
         GROUP BY c.category_id
         ORDER BY amount DESC LIMIT 1`,
        [userId, ...params]
    );

    const highestExpenseCategory = topExpRows.length > 0 ? {
        name: topExpRows[0].category_name,
        amount: parseFloat(topExpRows[0].amount),
        percentage: totalExpense > 0 ? Math.round((parseFloat(topExpRows[0].amount) / totalExpense) * 100) : 0
    } : { name: 'N/A', amount: 0, percentage: 0 };

    // Highest income source in range
    const topIncRows = await dbUtils.executeQuery(
        `SELECT c.category_name, SUM(t.amount) as amount
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.type = 'Income' ${dateFilter}
         GROUP BY c.category_id
         ORDER BY amount DESC LIMIT 1`,
        [userId, ...params]
    );

    const highestIncomeSource = topIncRows.length > 0 ? {
        name: topIncRows[0].category_name,
        amount: parseFloat(topIncRows[0].amount),
        percentage: totalIncome > 0 ? Math.round((parseFloat(topIncRows[0].amount) / totalIncome) * 100) : 0
    } : { name: 'N/A', amount: 0, percentage: 0 };

    // Budget utilization
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const budgetRows = await dbUtils.executeQuery(
        `SELECT budget_limit FROM budgets WHERE user_id = ? AND month = ? AND year = ?`,
        [userId, currentMonth, currentYear]
    );

    let budgetUtilization = 0;
    let budgetLimit = 0;
    if (budgetRows.length > 0) {
        budgetLimit = parseFloat(budgetRows[0].budget_limit);
        budgetUtilization = budgetLimit > 0 ? Math.round((totalExpense / budgetLimit) * 100) : 0;
    }

    return {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate: Math.round(savingsRate * 10) / 10,
        budgetUtilization,
        budgetLimit,
        highestExpenseCategory,
        highestIncomeSource,
        transactionCount,
        filter: {
            startDate: dates.startDate,
            endDate: dates.endDate,
            preset
        }
    };
};

const getCategoryAnalysis = async (userId, startDate, endDate, preset = null) => {
    const dates = resolveDateRange(preset, startDate, endDate);
    const { dateFilter, params } = buildDateFilter(dates.startDate, dates.endDate);

    const incomeRecords = await dbUtils.executeQuery(
        `SELECT 
            c.category_name AS categoryName,
            SUM(t.amount) AS totalAmount
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.type = 'Income' ${dateFilter}
         GROUP BY c.category_id
         ORDER BY totalAmount DESC`,
        [userId, ...params]
    );

    const expenseRecords = await dbUtils.executeQuery(
        `SELECT 
            c.category_name AS categoryName,
            SUM(t.amount) AS totalAmount
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.type = 'Expense' ${dateFilter}
         GROUP BY c.category_id
         ORDER BY totalAmount DESC`,
        [userId, ...params]
    );

    return {
        income: incomeRecords.map(r => ({ category: r.categoryName, amount: parseFloat(r.totalAmount) })),
        expense: expenseRecords.map(r => ({ category: r.categoryName, amount: parseFloat(r.totalAmount) }))
    };
};

const getMonthlyAnalysis = async (userId) => {
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

    return records.map(r => {
        const income = parseFloat(r.income || 0);
        const expense = parseFloat(r.expense || 0);
        const savings = income - expense;
        const rate = income > 0 ? Math.round((savings / income) * 100) : 0;
        return {
            month: r.monthKey,
            income,
            expense,
            savings,
            savingsRate: rate
        };
    });
};

const getTransactions = async (userId, startDate, endDate, preset = null) => {
    const dates = resolveDateRange(preset, startDate, endDate);
    const { dateFilter, params } = buildDateFilter(dates.startDate, dates.endDate);
    
    return await dbUtils.executeQuery(
        `SELECT 
            t.transaction_id,
            t.transaction_date,
            c.category_name,
            t.type,
            t.amount,
            t.description
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? ${dateFilter}
         ORDER BY t.transaction_date DESC, t.transaction_id DESC`,
        [userId, ...params]
    );
};

const generateCSVReport = async (userId, startDate, endDate, preset = null) => {
    const transactions = await getTransactions(userId, startDate, endDate, preset);
    return generateCSV(transactions);
};

const generatePDFReport = async (userId, startDate, endDate, preset = null) => {
    const dates = resolveDateRange(preset, startDate, endDate);
    const transactions = await getTransactions(userId, dates.startDate, dates.endDate);
    const summary = await getReportSummary(userId, dates.startDate, dates.endDate);
    
    return await generatePDF(transactions, summary, dates.startDate, dates.endDate);
};

module.exports = {
    getReportSummary,
    getCategoryAnalysis,
    getMonthlyAnalysis,
    generateCSVReport,
    generatePDFReport,
    resolveDateRange
};
