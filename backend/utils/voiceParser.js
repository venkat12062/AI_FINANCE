'use strict';

// ─── Expense transaction trigger words ─────────────────────────────────────
const expenseKeywords = [
    'spent', 'spend', 'paid', 'pay', 'bought', 'buy', 'purchase', 'purchased',
    'expense', 'expenses', 'debit', 'debited', 'cost', 'costed', 'outflow', 'lost',
    'add expense', 'record expense', 'new expense'
];

// ─── Income transaction trigger words ──────────────────────────────────────
const incomeKeywords = [
    'received', 'receive', 'earned', 'earn', 'salary', 'income', 'inflow',
    'bonus', 'freelance', 'got', 'credited', 'credit', 'deposit', 'deposited',
    'won', 'dividend', 'profit', 'yield', 'add income', 'record income', 'new income',
    'got paid', 'made money'
];

// ─── Category keyword map ──────────────────────────────────────────────────
const categoryKeywords = {
    // Food
    food: 'Food', groceries: 'Food', grocery: 'Food', dining: 'Food',
    restaurant: 'Food', lunch: 'Food', dinner: 'Food', breakfast: 'Food',
    snacks: 'Food', snack: 'Food', coffee: 'Food', cafe: 'Food', tea: 'Food',
    chai: 'Food', pizza: 'Food', burger: 'Food', swiggy: 'Food', zomato: 'Food',
    meal: 'Food', meals: 'Food', drinks: 'Food', biscuit: 'Food', biscuits: 'Food',

    // Travel
    travel: 'Travel', cab: 'Travel', taxi: 'Travel', uber: 'Travel', ola: 'Travel',
    auto: 'Travel', rickshaw: 'Travel', flight: 'Travel', flights: 'Travel',
    train: 'Travel', bus: 'Travel', metro: 'Travel', fuel: 'Travel', petrol: 'Travel',
    diesel: 'Travel', gas: 'Travel', toll: 'Travel', commute: 'Travel',
    ticket: 'Travel', tickets: 'Travel', rapido: 'Travel', transport: 'Travel',

    // Shopping
    shopping: 'Shopping', shop: 'Shopping', clothes: 'Shopping', cloth: 'Shopping',
    shirt: 'Shopping', shoes: 'Shopping', dress: 'Shopping', pants: 'Shopping',
    amazon: 'Shopping', flipkart: 'Shopping', myntra: 'Shopping', mall: 'Shopping',
    electronics: 'Shopping', phone: 'Shopping', mobile: 'Shopping', laptop: 'Shopping',
    gadget: 'Shopping', watch: 'Shopping', accessories: 'Shopping', cosmetics: 'Shopping',

    // Medical
    medical: 'Medical', doctor: 'Medical', hospital: 'Medical', medicine: 'Medical',
    medicines: 'Medical', pharmacy: 'Medical', clinic: 'Medical', health: 'Medical',
    dentist: 'Medical', pills: 'Medical', tablet: 'Medical', tablets: 'Medical',
    surgery: 'Medical', treatment: 'Medical', labs: 'Medical', pathology: 'Medical',

    // Education
    education: 'Education', tuition: 'Education', course: 'Education', courses: 'Education',
    books: 'Education', book: 'Education', fees: 'Education', school: 'Education',
    college: 'Education', classes: 'Education', study: 'Education', exam: 'Education',
    coaching: 'Education', udemy: 'Education', coursera: 'Education',

    // Entertainment
    entertainment: 'Entertainment', movie: 'Entertainment', movies: 'Entertainment',
    cinema: 'Entertainment', netflix: 'Entertainment', spotify: 'Entertainment',
    prime: 'Entertainment', hotstar: 'Entertainment', games: 'Entertainment',
    game: 'Entertainment', concert: 'Entertainment', party: 'Entertainment',
    outing: 'Entertainment', club: 'Entertainment', pub: 'Entertainment',

    // Bills
    bills: 'Bills', bill: 'Bills', electricity: 'Bills', power: 'Bills',
    water: 'Bills', wifi: 'Bills', internet: 'Bills', broadband: 'Bills',
    recharge: 'Bills', utility: 'Bills', maintenance: 'Bills', subscription: 'Bills',

    // Rent
    rent: 'Rent', apartment: 'Rent', flat: 'Rent', room: 'Rent', house: 'Rent',
    hostel: 'Rent', pg: 'Rent', accommodation: 'Rent',

    // Income Categories
    salary: 'Salary', paycheck: 'Salary', wage: 'Salary', wages: 'Salary', stipend: 'Salary',
    freelance: 'Freelance', gig: 'Freelance', client: 'Freelance', consulting: 'Freelance', contract: 'Freelance',
    business: 'Business', sales: 'Business', revenue: 'Business',
    investment: 'Investment', investments: 'Investment', stocks: 'Investment',
    shares: 'Investment', sip: 'Investment', crypto: 'Investment', dividend: 'Investment', interest: 'Investment',
    bonus: 'Bonus', reward: 'Bonus', gift: 'Bonus', cashback: 'Bonus', incentive: 'Bonus',
    commission: 'Bonus', rebate: 'Bonus'
};

// ─── Income-type categories ─────────────────────────────────────────────────
const incomeCats = new Set(['Salary', 'Freelance', 'Business', 'Investment', 'Bonus']);

/**
 * parseAmount — robust multi-pattern amount extractor
 * Fixes the critical bug where "1200" was parsed as "120" due to \d{1,3} greedy match
 */
const parseAmount = (rawText) => {
    const text = rawText.toLowerCase().trim();

    // 1. Lakh / lac forms  (e.g. "1.5 lakh", "2 lac")
    const lakhM = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|lacs)\b/i);
    if (lakhM) return parseFloat(lakhM[1]) * 100_000;

    // 2. Crore (e.g. "1 crore")
    const croreM = text.match(/(\d+(?:\.\d+)?)\s*crore/i);
    if (croreM) return parseFloat(croreM[1]) * 10_000_000;

    // 3. K / thousand  (e.g. "50k", "5 thousand")
    const kM = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (kM) return parseFloat(kM[1]) * 1_000;

    const thousM = text.match(/(\d+(?:\.\d+)?)\s*thousand/i);
    if (thousM) return parseFloat(thousM[1]) * 1_000;

    // 4. ₹ / Rs / rupees — strip currency prefix, then parse the number greedily
    //    Pattern: optional-currency-prefix then GREEDY integer/decimal
    //    FIXED: use \d+ (not \d{1,3}) as primary so "1200" never truncates to "12"
    const currM = text.match(/(?:[₹$]|rs\.?|rupees?)\s*(\d[\d,]*(?:\.\d+)?)/i);
    if (currM) {
        const val = parseFloat(currM[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) return val;
    }

    // 5. Plain number — pick the LARGEST number in the sentence
    //    (avoids grabbing "5" from "5 on 500" etc.)
    const allNums = [...text.matchAll(/\b(\d[\d,]*(?:\.\d+)?)\b/g)].map(m => {
        const v = parseFloat(m[1].replace(/,/g, ''));
        return isNaN(v) ? 0 : v;
    }).filter(v => v > 0);

    if (allNums.length === 0) return null;

    // Heuristic: prefer numbers > 99 (likely amounts, not "5 on food" index)
    const bigNums = allNums.filter(v => v >= 1);
    return bigNums.length > 0 ? Math.max(...bigNums) : null;
};

/**
 * parseVoiceText — NLP parser for finance voice commands
 * Handles: transactions, budget queries, income queries, balance queries
 */
const parseVoiceText = (text) => {
    if (!text || typeof text !== 'string') return { intent: 'unknown', text: '' };

    const clean = text.trim().substring(0, 1000); // cap length
    const lower = clean.toLowerCase();

    // ── A. QUERY INTENTS ──────────────────────────────────────────────────────

    // A1. Budget / remaining budget
    if (/budget|remaining budget|how much budget|budget status|budget left/i.test(lower)) {
        return {
            intent: 'query_budget',
            rawText: clean,
            speechText: 'Checking your budget status for this month.'
        };
    }

    // A2. Balance / net savings / how much money
    if (/balance|net savings|how much money|total savings|my savings|overall balance/i.test(lower)) {
        return {
            intent: 'query_balance',
            rawText: clean,
            speechText: 'Calculating your current balance and net savings.'
        };
    }

    // A3. Monthly total spend ("how much did I spend this month", "total expenses")
    if (/how much.*spend.*this month|how much.*spent.*this month|show.*expenses.*this month|my expenses this month|total expenses.*month|monthly.*expense/i.test(lower)) {
        return {
            intent: 'query_monthly_expenses',
            rawText: clean,
            speechText: 'Retrieving your total expenses for this month.'
        };
    }

    // A4. Show income
    if (/show.*income|my income|total income|how much.*earn|income.*this month|income.*month/i.test(lower)) {
        return {
            intent: 'query_monthly_income',
            rawText: clean,
            speechText: 'Checking your total income for this month.'
        };
    }

    // A5. Top expenses
    if (/top expense|highest expense|biggest spend|biggest expense|most spent/i.test(lower)) {
        return {
            intent: 'query_top_expenses',
            rawText: clean,
            speechText: 'Fetching your top expense categories.'
        };
    }

    // A6. Category-specific spend query (before transaction parsing to avoid false positives)
    for (const [key, val] of Object.entries(categoryKeywords)) {
        const isQuery = /how much|what did i spend|what have i spent|show.*spend|tell me.*spend/i.test(lower);
        const hasCategory = new RegExp(`\\b${key}\\b`, 'i').test(lower);
        const notTransaction = !/\b(spent|paid|bought|purchase|add|record|log)\b/i.test(lower);
        if (isQuery && hasCategory && notTransaction) {
            return {
                intent: 'query_category_spend',
                category: val,
                rawText: clean,
                speechText: `Calculating your spending on ${val} this month.`
            };
        }
    }

    // ── B. TRANSACTION INTENT ─────────────────────────────────────────────────
    const amount = parseAmount(lower);
    let type = 'Expense';
    let category = null;
    const date = (() => {
        const d = new Date();
        if (/yesterday/i.test(lower)) d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    })();

    // Detect type — income keywords take precedence if no expense keyword present
    const hasExpenseKw = expenseKeywords.some(k => lower.includes(k));
    const hasIncomeKw  = incomeKeywords.some(k => lower.includes(k));

    if (hasIncomeKw && !hasExpenseKw) type = 'Income';
    else if (hasExpenseKw) type = 'Expense';
    // else default stays 'Expense'

    // Detect category
    for (const [key, val] of Object.entries(categoryKeywords)) {
        if (new RegExp(`\\b${key}\\b`, 'i').test(lower)) {
            category = val;
            if (incomeCats.has(category)) type = 'Income';
            break;
        }
    }

    // Fallback category
    if (!category) category = type === 'Income' ? 'Salary' : 'Food';

    return {
        intent: 'create_transaction',
        amount,
        type,
        category,
        date,
        rawText: clean,
        confidence: amount ? 'high' : 'low',
        speechText: amount
            ? `Logging ${type.toLowerCase()} of ₹${amount.toLocaleString('en-IN')} for ${category}.`
            : 'Could not detect amount. Please say the amount clearly, e.g. "I spent 500 on Food".'
    };
};

module.exports = { parseVoiceText, parseAmount, categoryKeywords, incomeCats };
