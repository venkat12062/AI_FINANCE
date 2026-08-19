const dbUtils = require('../utils/database');

/**
 * Calculates Month-over-Month (MoM) income and expense comparison
 */
const getMoMData = async (userId) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // Current Month
    const currRes = await dbUtils.executeQuery(
        `SELECT 
            SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) AS expense,
            COUNT(transaction_id) as txCount
         FROM transactions
         WHERE user_id = ? 
         AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
        [userId, currentMonth, currentYear]
    );

    // Previous Month
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
    }

    const prevRes = await dbUtils.executeQuery(
        `SELECT 
            SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) AS expense,
            COUNT(transaction_id) as txCount
         FROM transactions
         WHERE user_id = ? 
         AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
        [userId, prevMonth, prevYear]
    );

    const curr = {
        income: parseFloat(currRes[0]?.income || 0),
        expense: parseFloat(currRes[0]?.expense || 0),
        txCount: parseInt(currRes[0]?.txCount || 0)
    };

    const prev = {
        income: parseFloat(prevRes[0]?.income || 0),
        expense: parseFloat(prevRes[0]?.expense || 0),
        txCount: parseInt(prevRes[0]?.txCount || 0)
    };

    return { currentMonth: curr, previousMonth: prev };
};

/**
 * Calculates current month budget status
 */
const getBudgetUsage = async (userId) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const budgets = await dbUtils.executeQuery(
        `SELECT budget_limit FROM budgets WHERE user_id = ? AND month = ? AND year = ?`,
        [userId, currentMonth, currentYear]
    );

    if (budgets.length === 0) return null;

    const budgetLimit = parseFloat(budgets[0].budget_limit);

    const expenses = await dbUtils.executeQuery(
        `SELECT COALESCE(SUM(amount), 0) AS spent
         FROM transactions
         WHERE user_id = ? AND type = 'Expense'
         AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
        [userId, currentMonth, currentYear]
    );

    const spent = parseFloat(expenses[0]?.spent || 0);
    const usage = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;

    return {
        budgetLimit,
        spent,
        remaining: budgetLimit - spent,
        percentage: Math.round(usage * 10) / 10
    };
};

/**
 * Category breakdown & MoM category delta
 */
const getCategoryConcentration = async (userId, currentMonthExpense) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const currCats = await dbUtils.executeQuery(
        `SELECT c.category_name, SUM(t.amount) AS total
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.type = 'Expense'
         AND MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?
         GROUP BY c.category_id
         ORDER BY total DESC`,
        [userId, currentMonth, currentYear]
    );

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
    }

    const prevCats = await dbUtils.executeQuery(
        `SELECT c.category_name, SUM(t.amount) AS total
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ? AND t.type = 'Expense'
         AND MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?
         GROUP BY c.category_id`,
        [userId, prevMonth, prevYear]
    );

    const prevMap = {};
    prevCats.forEach(r => {
        prevMap[r.category_name] = parseFloat(r.total);
    });

    return currCats.map(r => {
        const total = parseFloat(r.total);
        const prevTotal = prevMap[r.category_name] || 0;
        let delta = 0;
        if (prevTotal > 0) {
            delta = Math.round(((total - prevTotal) / prevTotal) * 100);
        }

        return {
            category: r.category_name,
            amount: total,
            percentage: currentMonthExpense > 0 ? Math.round((total / currentMonthExpense) * 100) : 0,
            deltaPercentage: delta
        };
    });
};

/**
 * Detects potential recurring expenses
 */
const detectRecurringExpenses = async (userId) => {
    const rows = await dbUtils.executeQuery(
        `SELECT description, amount, COUNT(DISTINCT MONTH(transaction_date)) as months_count
         FROM transactions
         WHERE user_id = ? AND type = 'Expense' AND description IS NOT NULL AND description != ''
         GROUP BY description, amount
         HAVING months_count >= 2
         ORDER BY amount DESC LIMIT 5`,
        [userId]
    );

    return rows.map(r => ({
        description: r.description,
        amount: parseFloat(r.amount),
        frequency: 'Monthly Recurring'
    }));
};

/**
 * Comprehensive Financial Advisor Rule Engine in Rupees (₹)
 */
const runRules = async (userId) => {
    const insights = [];

    const { currentMonth, previousMonth } = await getMoMData(userId);
    const budgetInfo = await getBudgetUsage(userId);
    const categories = await getCategoryConcentration(userId, currentMonth.expense);
    const recurring = await detectRecurringExpenses(userId);

    const netSavings = currentMonth.income - currentMonth.expense;
    const savingsRate = currentMonth.income > 0 ? (netSavings / currentMonth.income) * 100 : 0;

    const expenseGrowth = previousMonth.expense > 0 
        ? ((currentMonth.expense - previousMonth.expense) / previousMonth.expense) * 100 
        : 0;

    const incomeGrowth = previousMonth.income > 0 
        ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100 
        : 0;

    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    // 1. Budget Burnout & Velocity Prediction
    if (budgetInfo) {
        if (budgetInfo.percentage > 100) {
            insights.push({
                type: 'Warning',
                category: 'Prediction',
                title: 'Budget Exceeded',
                message: `You have exceeded your monthly budget by ${Math.round(budgetInfo.percentage - 100)}%. We recommend pausing non-essential expenses for the remaining ${daysRemaining} days.`,
                impact: 'High',
                icon: 'fa-triangle-exclamation'
            });
        } else {
            const dailyBurnRate = dayOfMonth > 0 ? (budgetInfo.spent / dayOfMonth) : 0;
            const daysUntilExhausted = dailyBurnRate > 0 ? Math.floor(budgetInfo.remaining / dailyBurnRate) : 99;

            if (daysUntilExhausted < daysRemaining && daysUntilExhausted > 0) {
                insights.push({
                    type: 'Warning',
                    category: 'Prediction',
                    title: 'Budget Burnout Risk',
                    message: `At your current spending rate of ₹${dailyBurnRate.toFixed(2)}/day, your budget is projected to be exhausted in ${daysUntilExhausted} days.`,
                    impact: 'High',
                    icon: 'fa-hourglass-half'
                });
            } else if (budgetInfo.percentage >= 80) {
                insights.push({
                    type: 'Warning',
                    category: 'Warning',
                    title: 'Approaching Budget Ceiling',
                    message: `You have consumed ${budgetInfo.percentage}% of your monthly limit. You have ₹${budgetInfo.remaining.toFixed(2)} left for this month.`,
                    impact: 'Medium',
                    icon: 'fa-gauge-high'
                });
            } else {
                insights.push({
                    type: 'Achievement',
                    category: 'Achievement',
                    title: 'Budget Discipline on Track',
                    message: `You have used only ${budgetInfo.percentage}% of your monthly budget with ${daysRemaining} days left. Great financial discipline!`,
                    impact: 'Positive',
                    icon: 'fa-circle-check'
                });
            }
        }
    }

    // 2. Category Concentration & Delta Insights
    categories.forEach(cat => {
        if (cat.percentage >= 35) {
            insights.push({
                type: 'Warning',
                category: 'Warning',
                title: `High ${cat.category} Concentration`,
                message: `You spent ${cat.percentage}% (₹${cat.amount.toFixed(2)}) of your total money on ${cat.category} this month.`,
                impact: 'Medium',
                icon: 'fa-chart-pie'
            });
        }

        if (cat.deltaPercentage >= 15) {
            insights.push({
                type: 'Recommendation',
                category: 'Recommendation',
                title: `${cat.category} Surge`,
                message: `${cat.category} spending increased by ${cat.deltaPercentage}% compared to last month. Review recent transactions for opportunities to optimize.`,
                impact: 'Medium',
                icon: 'fa-arrow-trend-up'
            });
        } else if (cat.deltaPercentage <= -15 && cat.amount > 0) {
            insights.push({
                type: 'Achievement',
                category: 'Achievement',
                title: `${cat.category} Optimization`,
                message: `Great job! You cut ${cat.category} spending by ${Math.abs(cat.deltaPercentage)}% compared to last month.`,
                impact: 'Positive',
                icon: 'fa-award'
            });
        }
    });

    // 3. Savings Rate & Cashflow Insights
    if (savingsRate >= 25) {
        insights.push({
            type: 'Achievement',
            category: 'Achievement',
            title: 'Outstanding Savings Rate',
            message: `Your savings rate is ${Math.round(savingsRate)}%, which is significantly higher than average benchmark (20%).`,
            impact: 'Positive',
            icon: 'fa-piggy-bank'
        });
    } else if (savingsRate < 10 && currentMonth.income > 0) {
        insights.push({
            type: 'Recommendation',
            category: 'Recommendation',
            title: 'Boost Emergency Reserves',
            message: `Your savings rate is currently ${Math.round(savingsRate)}%. Setting aside an additional 10% will help build a 6-month safety net.`,
            impact: 'High',
            icon: 'fa-shield-halved'
        });
    }

    // 4. Overall Spending Velocity vs Income
    if (expenseGrowth > 20 && previousMonth.expense > 0) {
        insights.push({
            type: 'Warning',
            category: 'Warning',
            title: 'Accelerated Outflow',
            message: `Your overall expenditure grew ${Math.round(expenseGrowth)}% faster than last month.`,
            impact: 'Medium',
            icon: 'fa-bolt'
        });
    }

    // 5. Recurring Subscriptions
    if (recurring.length > 0) {
        const totalRecurring = recurring.reduce((sum, r) => sum + r.amount, 0);
        insights.push({
            type: 'Recommendation',
            category: 'Recommendation',
            title: 'Recurring Subscriptions Detected',
            message: `You have ${recurring.length} recurring expenses totaling ₹${totalRecurring.toFixed(2)}/month (${recurring.map(r => r.description).join(', ')}).`,
            impact: 'Low',
            icon: 'fa-arrows-rotate'
        });
    }

    // Fallback baseline insight
    if (insights.length === 0) {
        insights.push({
            type: 'Recommendation',
            category: 'Recommendation',
            title: 'Financial Health Stable',
            message: 'Your transactions are balanced. Continue tracking regular expenses to receive deeper AI recommendations.',
            impact: 'Neutral',
            icon: 'fa-chart-line'
        });
    }

    return insights;
};

module.exports = {
    runRules,
    getMoMData,
    getBudgetUsage,
    getCategoryConcentration,
    detectRecurringExpenses
};
