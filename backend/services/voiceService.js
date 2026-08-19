'use strict';

const dbUtils = require('../utils/database');
const voiceParser = require('../utils/voiceParser');

// ─── INR formatter ─────────────────────────────────────────────────────────
const inr = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// ─── Shared helpers ─────────────────────────────────────────────────────────
const nowMonth = () => new Date().getMonth() + 1;
const nowYear  = () => new Date().getFullYear();

const parseVoiceText = async (text) => {
    if (!text || !text.trim()) throw new Error('Voice text is required');
    return voiceParser.parseVoiceText(text);
};

/**
 * saveVoiceHistory — inserts into voice_entries table
 * Guards against double-save by accepting an options flag
 */
const saveVoiceHistory = async (userId, voiceText, parsedData) => {
    const amount   = parsedData.amount   || 0;
    const type     = parsedData.type     || parsedData.intent || 'Command';
    const category = parsedData.category || 'General';
    await dbUtils.executeQuery(
        `INSERT INTO voice_entries (user_id, voice_text, parsed_amount, parsed_type, parsed_category)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, voiceText, amount, type, category]
    );
};

/**
 * executeVoiceCommand
 * Handles all voice intents:
 *   query_budget, query_balance, query_monthly_expenses, query_monthly_income,
 *   query_top_expenses, query_category_spend, create_transaction
 */
const executeVoiceCommand = async (userId, voiceText) => {
    if (!voiceText || typeof voiceText !== 'string') {
        return { type: 'unrecognized', answer: 'Please provide a voice command.' };
    }

    const text   = voiceText.trim().substring(0, 1000); // security: cap length
    const parsed = voiceParser.parseVoiceText(text);
    const month  = nowMonth();
    const year   = nowYear();

    // ── A. Budget Status ───────────────────────────────────────────────────
    if (parsed.intent === 'query_budget') {
        const [budgets, expenses] = await Promise.all([
            dbUtils.executeQuery(
                `SELECT COALESCE(SUM(budget_limit), 0) as total_limit
                 FROM budgets WHERE user_id = ? AND month = ? AND year = ?`,
                [userId, month, year]
            ),
            dbUtils.executeQuery(
                `SELECT COALESCE(SUM(amount), 0) as spent
                 FROM transactions WHERE user_id = ? AND type = 'Expense'
                 AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
                [userId, month, year]
            )
        ]);

        const limit     = parseFloat(budgets[0]?.total_limit || 0);
        const spent     = parseFloat(expenses[0]?.spent || 0);
        const remaining = limit - spent;
        const pct       = limit > 0 ? Math.round((spent / limit) * 100) : 0;

        await saveVoiceHistory(userId, text, { intent: 'query_budget', amount: remaining, category: 'Budget' });

        const answer = limit > 0
            ? `Your monthly budget is ₹${inr(limit)}. Spent ₹${inr(spent)} (${pct}%), with ₹${inr(remaining)} remaining.`
            : `You haven't set a monthly budget yet. Your total expenses so far are ₹${inr(spent)}.`;

        return { type: 'query_response', intent: 'query_budget', answer, data: { limit, spent, remaining, pct } };
    }

    // ── B. Balance / Net Savings ───────────────────────────────────────────
    if (parsed.intent === 'query_balance') {
        const [incomeR, expenseR] = await Promise.all([
            dbUtils.executeQuery(
                `SELECT COALESCE(SUM(amount), 0) as total
                 FROM transactions WHERE user_id = ? AND type = 'Income'
                 AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
                [userId, month, year]
            ),
            dbUtils.executeQuery(
                `SELECT COALESCE(SUM(amount), 0) as total
                 FROM transactions WHERE user_id = ? AND type = 'Expense'
                 AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
                [userId, month, year]
            )
        ]);

        const income   = parseFloat(incomeR[0]?.total || 0);
        const expenses = parseFloat(expenseR[0]?.total || 0);
        const balance  = income - expenses;
        const rate     = income > 0 ? Math.round((balance / income) * 100) : 0;

        await saveVoiceHistory(userId, text, { intent: 'query_balance', amount: balance, category: 'Balance' });

        const answer = `This month: Income ₹${inr(income)}, Expenses ₹${inr(expenses)}, Net balance ₹${inr(balance)} (${rate}% savings rate).`;

        return { type: 'query_response', intent: 'query_balance', answer, data: { income, expenses, balance, rate } };
    }

    // ── C. Monthly Total Expenses ──────────────────────────────────────────
    if (parsed.intent === 'query_monthly_expenses') {
        const res = await dbUtils.executeQuery(
            `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
             FROM transactions WHERE user_id = ? AND type = 'Expense'
             AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
            [userId, month, year]
        );

        const total = parseFloat(res[0]?.total || 0);
        const count = parseInt(res[0]?.count || 0);

        await saveVoiceHistory(userId, text, { intent: 'query_monthly_expenses', amount: total, category: 'Expenses' });

        const answer = count > 0
            ? `Your total expenses for this month are ₹${inr(total)} across ${count} transaction${count === 1 ? '' : 's'}.`
            : `No expenses recorded this month yet.`;

        return { type: 'query_response', intent: 'query_monthly_expenses', answer, data: { total, count } };
    }

    // ── D. Monthly Total Income ────────────────────────────────────────────
    if (parsed.intent === 'query_monthly_income') {
        const res = await dbUtils.executeQuery(
            `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count
             FROM transactions WHERE user_id = ? AND type = 'Income'
             AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?`,
            [userId, month, year]
        );

        const total = parseFloat(res[0]?.total || 0);
        const count = parseInt(res[0]?.count || 0);

        await saveVoiceHistory(userId, text, { intent: 'query_monthly_income', amount: total, category: 'Income' });

        const answer = count > 0
            ? `Your total income this month is ₹${inr(total)} from ${count} source${count === 1 ? '' : 's'}.`
            : `No income recorded this month yet.`;

        return { type: 'query_response', intent: 'query_monthly_income', answer, data: { total, count } };
    }

    // ── E. Top Expenses ────────────────────────────────────────────────────
    if (parsed.intent === 'query_top_expenses') {
        const topCats = await dbUtils.executeQuery(
            `SELECT c.category_name, SUM(t.amount) as amount, COUNT(t.transaction_id) as count
             FROM transactions t
             JOIN categories c ON t.category_id = c.category_id
             WHERE t.user_id = ? AND t.type = 'Expense'
             AND MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?
             GROUP BY c.category_id, c.category_name
             ORDER BY amount DESC LIMIT 5`,
            [userId, month, year]
        );

        await saveVoiceHistory(userId, text, { intent: 'query_top_expenses', amount: 0, category: 'Top Spend' });

        const answer = topCats.length > 0
            ? `Your top expenses this month: ${topCats.map((c, i) => `${i + 1}. ${c.category_name} ₹${inr(c.amount)}`).join(', ')}.`
            : `No expenses logged this month yet.`;

        return { type: 'query_response', intent: 'query_top_expenses', answer, data: topCats };
    }

    // ── F. Category Spend Query ────────────────────────────────────────────
    if (parsed.intent === 'query_category_spend') {
        const catRows = await dbUtils.executeQuery(
            `SELECT c.category_name,
                    COALESCE(SUM(t.amount), 0) as total,
                    COUNT(t.transaction_id) as count
             FROM categories c
             LEFT JOIN transactions t
               ON c.category_id = t.category_id
               AND t.user_id = ?
               AND MONTH(t.transaction_date) = ?
               AND YEAR(t.transaction_date) = ?
             WHERE LOWER(c.category_name) = LOWER(?)
             GROUP BY c.category_id, c.category_name
             LIMIT 1`,
            [userId, month, year, parsed.category]
        );

        const total = parseFloat(catRows[0]?.total || 0);
        const count = parseInt(catRows[0]?.count || 0);

        await saveVoiceHistory(userId, text, { intent: 'query_category_spend', amount: total, category: parsed.category });

        const answer = `You have spent ₹${inr(total)} on ${parsed.category} across ${count} transaction${count === 1 ? '' : 's'} this month.`;

        return { type: 'query_response', intent: 'query_category_spend', answer, data: { category: parsed.category, total, count } };
    }

    // ── G. Transaction Creation ────────────────────────────────────────────
    if (!parsed.amount || isNaN(parsed.amount) || parsed.amount <= 0) {
        return {
            type: 'unrecognized',
            answer: `Could not detect an amount. Try: "I spent 500 on Food", "I received 25000 salary", or "What is my remaining budget?"`,
            parsed
        };
    }

    // Find or create category
    let categoryId;
    let finalCategory = parsed.category;

    const exactMatch = await dbUtils.executeQuery(
        `SELECT category_id, category_name FROM categories
         WHERE LOWER(category_name) = LOWER(?) AND category_type = ?`,
        [parsed.category, parsed.type]
    );

    if (exactMatch.length > 0) {
        categoryId    = exactMatch[0].category_id;
        finalCategory = exactMatch[0].category_name;
    } else {
        // Try any category for this type
        const fallback = await dbUtils.executeQuery(
            `SELECT category_id, category_name FROM categories WHERE category_type = ? LIMIT 1`,
            [parsed.type]
        );
        if (fallback.length > 0) {
            categoryId    = fallback[0].category_id;
            finalCategory = fallback[0].category_name;
        } else {
            // Create category if missing
            const newCat  = await dbUtils.executeQuery(
                `INSERT INTO categories (category_name, category_type) VALUES (?, ?)`,
                [parsed.category, parsed.type]
            );
            categoryId = newCat.insertId;
        }
    }

    // Insert transaction
    const insertResult = await dbUtils.executeQuery(
        `INSERT INTO transactions (user_id, category_id, type, amount, transaction_date, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, categoryId, parsed.type, parsed.amount, parsed.date, text]
    );

    const answer = `✅ Added ${parsed.type.toLowerCase()} of ₹${inr(parsed.amount)} for ${finalCategory}.`;

    await saveVoiceHistory(userId, text, {
        amount:   parsed.amount,
        type:     parsed.type,
        category: finalCategory
    });

    return {
        type:          'transaction_created',
        success:       true,
        answer,
        transactionId: insertResult.insertId,
        data: {
            transactionId:   insertResult.insertId,
            amount:          parsed.amount,
            type:            parsed.type,
            category:        finalCategory,
            date:            parsed.date,
            description:     text
        }
    };
};

// ─── History ────────────────────────────────────────────────────────────────
const getVoiceHistory = async (userId, limit = 50, offset = 0) => {
    return await dbUtils.executeQuery(
        `SELECT * FROM voice_entries WHERE user_id = ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset]
    );
};

const deleteVoiceHistory = async (userId, voiceId) => {
    // Security: userId filter prevents cross-user deletion
    await dbUtils.executeQuery(
        `DELETE FROM voice_entries WHERE user_id = ? AND voice_id = ?`,
        [userId, voiceId]
    );
    return true;
};

// ─── Legacy alias ────────────────────────────────────────────────────────────
const createTransactionFromVoice = async (userId, voiceText) =>
    executeVoiceCommand(userId, voiceText);

module.exports = {
    parseVoiceText,
    executeVoiceCommand,
    createTransactionFromVoice,
    getVoiceHistory,
    deleteVoiceHistory
};
