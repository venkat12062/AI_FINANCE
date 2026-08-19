const dbUtils = require('../utils/database');
const aiService = require('./aiService'); // We need this to check health score and savings rate

// Helper: Check if duplicate exists within the last 24 hours
const isDuplicate = async (userId, title) => {
    const records = await dbUtils.executeQuery(
        `SELECT notification_id FROM notifications 
         WHERE user_id = ? AND title = ? AND created_at >= NOW() - INTERVAL 1 DAY`,
        [userId, title]
    );
    return records.length > 0;
};

const createNotification = async (userId, title, message, type) => {
    const duplicate = await isDuplicate(userId, title);
    if (duplicate) return; // Skip if recently created

    await dbUtils.executeQuery(
        `INSERT INTO notifications (user_id, title, message, notification_type) VALUES (?, ?, ?, ?)`,
        [userId, title, message, type]
    );
};

const checkBudgetAlerts = async (userId) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const budgets = await dbUtils.executeQuery(
        `SELECT b.budget_limit, COALESCE(SUM(t.amount), 0) as spent
         FROM budgets b
         LEFT JOIN transactions t ON b.user_id = t.user_id 
            AND t.type = 'Expense' 
            AND MONTH(t.transaction_date) = ? 
            AND YEAR(t.transaction_date) = ?
         WHERE b.user_id = ? AND b.month = ? AND b.year = ?
         GROUP BY b.budget_id`,
        [currentMonth, currentYear, userId, currentMonth, currentYear]
    );

    if (budgets.length > 0) {
        const { budget_limit, spent } = budgets[0];
        const usage = (spent / budget_limit) * 100;

        if (usage > 100) {
            await createNotification(userId, 'Budget Exceeded', `You have exceeded your monthly budget by ${Math.round(usage - 100)}%.`, 'Critical');
        } else if (usage >= 90) {
            await createNotification(userId, 'Budget Critical', `You have used ${Math.round(usage)}% of your monthly budget.`, 'Critical');
        } else if (usage >= 75) {
            await createNotification(userId, 'Budget Warning', `You have used ${Math.round(usage)}% of your monthly budget.`, 'Warning');
        }
    }
};

const checkFinancialHealthAndSavings = async (userId) => {
    try {
        const score = await aiService.calculateHealthScore(userId);
        
        // RULE 6: Health score > 80
        if (score >= 80) {
            await createNotification(userId, 'Excellent Financial Health', `Your financial health score is ${score}. Great job!`, 'Success');
        }

        // We need to fetch savings rate manually since calculateHealthScore doesn't export it cleanly
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const transactions = await dbUtils.executeQuery(
            `SELECT type, COALESCE(SUM(amount), 0) as total FROM transactions 
             WHERE user_id = ? AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ? 
             GROUP BY type`,
            [userId, currentMonth, currentYear]
        );

        let income = 0;
        let expense = 0;

        transactions.forEach(t => {
            if (t.type === 'Income') income = t.total;
            if (t.type === 'Expense') expense = t.total;
        });

        if (income > 0) {
            const savingsRate = ((income - expense) / income) * 100;
            // RULE 4: Savings rate < 10%
            if (savingsRate < 10) {
                await createNotification(userId, 'Low Savings Rate', `Your savings rate is dropping below 10%. Consider cutting back on expenses.`, 'Warning');
            }
        }
    } catch (e) {
        console.error("Health check error in notifications:", e);
    }
};

const checkInactivity = async (userId) => {
    // RULE 5: No transactions for 7 days
    const recent = await dbUtils.executeQuery(
        `SELECT transaction_id FROM transactions WHERE user_id = ? AND transaction_date >= NOW() - INTERVAL 7 DAY LIMIT 1`,
        [userId]
    );

    if (recent.length === 0) {
        await createNotification(userId, 'Inactivity Reminder', `You haven't logged any transactions in the last 7 days. Keep your tracker updated!`, 'Info');
    }
};

const generateNotifications = async (userId) => {
    await checkBudgetAlerts(userId);
    await checkFinancialHealthAndSavings(userId);
    await checkInactivity(userId);
    
    // Note: RULE 7 (New AI Insight) can be triggered whenever insights are generated, 
    // or we can simulate it here if we want to ensure generation on this endpoint call.
    // For this module, we will assume generating new insights manually triggers the rule.
};

module.exports = {
    generateNotifications,
    createNotification
};
