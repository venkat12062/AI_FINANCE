const dbUtils = require('../utils/database');
const insightEngine = require('./insightEngine');

const generateInsights = async (userId) => {
    // Generate new insights
    const generated = await insightEngine.runRules(userId);
    
    // Clear old insights for user to keep it fresh
    await dbUtils.executeQuery(`DELETE FROM ai_insights WHERE user_id = ?`, [userId]);
    
    // Insert new insights
    for (const ins of generated) {
        await dbUtils.executeQuery(
            `INSERT INTO ai_insights (user_id, message, insight_type) VALUES (?, ?, ?)`,
            [userId, JSON.stringify(ins), ins.category || ins.type]
        );
    }
    
    // Fetch and return formatted
    const records = await dbUtils.executeQuery(
        `SELECT message, insight_type AS type, created_at FROM ai_insights WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
    );
    
    return records.map(r => {
        try {
            const parsed = JSON.parse(r.message);
            return {
                ...parsed,
                created_at: r.created_at
            };
        } catch (e) {
            return {
                title: r.type,
                message: r.message,
                category: r.type,
                type: r.type,
                created_at: r.created_at
            };
        }
    });
};

const calculateHealthScore = async (userId) => {
    const { currentMonth, previousMonth } = await insightEngine.getMoMData(userId);
    const budgetInfo = await insightEngine.getBudgetUsage(userId);
    
    const currentSavings = currentMonth.income - currentMonth.expense;
    const savingsRate = currentMonth.income > 0 ? (currentSavings / currentMonth.income) * 100 : 0;
    
    const expenseGrowth = previousMonth.expense > 0 
        ? ((currentMonth.expense - previousMonth.expense) / previousMonth.expense) * 100 
        : 0;

    const incomeGrowth = previousMonth.income > 0 
        ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100 
        : 0;

    // 1. Savings Score (0 - 100)
    let savingsScore = 50;
    if (savingsRate >= 30) savingsScore = 95;
    else if (savingsRate >= 20) savingsScore = 85;
    else if (savingsRate >= 10) savingsScore = 70;
    else if (savingsRate >= 0) savingsScore = 50;
    else savingsScore = 25;

    // 2. Budget Discipline Score (0 - 100)
    let budgetScore = 75; // baseline if no budget set
    if (budgetInfo) {
        if (budgetInfo.percentage <= 70) budgetScore = 95;
        else if (budgetInfo.percentage <= 85) budgetScore = 80;
        else if (budgetInfo.percentage <= 100) budgetScore = 60;
        else budgetScore = 30;
    }

    // 3. Expense Discipline Score (0 - 100)
    let expenseScore = 70;
    if (expenseGrowth < -10) expenseScore = 95;
    else if (expenseGrowth <= 5) expenseScore = 80;
    else if (expenseGrowth <= 20) expenseScore = 60;
    else expenseScore = 40;

    // 4. Income Stability Score (0 - 100)
    let incomeScore = 70;
    if (currentMonth.income > 0) {
        if (incomeGrowth >= 10) incomeScore = 95;
        else if (incomeGrowth >= 0) incomeScore = 85;
        else incomeScore = 65;
    } else {
        incomeScore = 40;
    }

    // Overall Weighted Score
    const overallScore = Math.round(
        (savingsScore * 0.35) +
        (budgetScore * 0.25) +
        (expenseScore * 0.20) +
        (incomeScore * 0.20)
    );

    let status = 'Poor';
    let label = 'Needs Improvement';
    if (overallScore >= 80) {
        status = 'Excellent';
        label = 'Top 10% Financial Discipline';
    } else if (overallScore >= 60) {
        status = 'Good';
        label = 'Healthy Financial Trajectory';
    } else if (overallScore >= 40) {
        status = 'Average';
        label = 'Moderate Stability';
    }

    return {
        healthScore: overallScore,
        status,
        label,
        dimensions: {
            savingsScore,
            budgetScore,
            expenseScore,
            incomeScore
        },
        metrics: {
            savingsRate: Math.round(savingsRate * 10) / 10,
            monthlySavings: currentSavings,
            expenseGrowth: Math.round(expenseGrowth),
            incomeGrowth: Math.round(incomeGrowth)
        }
    };
};

const analyzeSpending = async (userId) => {
    const { currentMonth, previousMonth } = await insightEngine.getMoMData(userId);
    const categoryConcentration = await insightEngine.getCategoryConcentration(userId, currentMonth.expense);
    const recurring = await insightEngine.detectRecurringExpenses(userId);

    const expenseGrowth = previousMonth.expense > 0 
        ? ((currentMonth.expense - previousMonth.expense) / previousMonth.expense) * 100 
        : 0;

    let highestCategory = 'N/A';
    let highestAmount = 0;
    
    if (categoryConcentration.length > 0) {
        highestCategory = categoryConcentration[0].category;
        highestAmount = categoryConcentration[0].amount;
    }

    return {
        highestCategory,
        highestAmount,
        monthlyGrowth: Math.round(expenseGrowth),
        topCategories: categoryConcentration.slice(0, 5),
        recurringSubscriptions: recurring
    };
};

const generateRecommendations = async (userId) => {
    const rules = await insightEngine.runRules(userId);
    return rules.filter(r => r.category === 'Recommendation' || r.type === 'Recommendation');
};

module.exports = {
    generateInsights,
    calculateHealthScore,
    analyzeSpending,
    generateRecommendations
};
