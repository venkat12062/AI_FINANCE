'use strict';
/**
 * receiptParser.js — robust OCR text parser for Indian receipts
 * Handles: ₹, Rs., INR, amounts with commas, multiple date formats,
 *          merchant detection, category suggestion
 */

// ─── Amount Extraction ──────────────────────────────────────────────────────
// BUG FIX: was using \d{1,3} which truncated "1200" → "120"
// Now uses greedy \d+ and picks the LARGEST amount found (usually the total)
const parseAmount = (text) => {
    if (!text) return null;
    const clean = text.replace(/\n/g, ' ');
    const candidates = [];

    // Pattern 1: ₹ / Rs. / Rs / INR prefix
    const prefixed = [...clean.matchAll(
        /(?:₹|rs\.?|inr|rupees?)\s*(\d[\d,]*(?:\.\d{1,2})?)/gi
    )];
    for (const m of prefixed) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) candidates.push(val);
    }

    // Pattern 2: number followed by /- or /-  (Indian receipt style: "Total: 1200/-")
    const suffixed = [...clean.matchAll(/(\d[\d,]*(?:\.\d{1,2})?)\s*\/-/g)];
    for (const m of suffixed) {
        const val = parseFloat(m[1].replace(/,/g, ''));
        if (!isNaN(val) && val > 0) candidates.push(val);
    }

    // Pattern 3: Lines containing "total", "amount", "grand total", "net payable"
    const totalLines = clean.split(/\n/).filter(l =>
        /total|amount due|grand total|net payable|bill amount|subtotal|to pay/i.test(l)
    );
    for (const line of totalLines) {
        const m = line.match(/(\d[\d,]*(?:\.\d{1,2})?)/g);
        if (m) {
            for (const n of m) {
                const val = parseFloat(n.replace(/,/g, ''));
                if (!isNaN(val) && val > 0) candidates.push(val);
            }
        }
    }

    // Pattern 4: Fallback — all standalone numbers
    if (candidates.length === 0) {
        const allNums = [...clean.matchAll(/\b(\d[\d,]*(?:\.\d{1,2})?)\b/g)];
        for (const m of allNums) {
            const val = parseFloat(m[1].replace(/,/g, ''));
            if (!isNaN(val) && val >= 1 && val <= 10_000_000) candidates.push(val);
        }
    }

    if (candidates.length === 0) return null;
    // Return largest candidate (typically the grand total)
    return Math.max(...candidates);
};

// ─── Date Extraction ────────────────────────────────────────────────────────
const parseDate = (text) => {
    if (!text) return new Date().toISOString().split('T')[0];

    const patterns = [
        // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
        { re: /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g, fn: (d,m,y) => `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` },
        // YYYY/MM/DD or YYYY-MM-DD
        { re: /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/g, fn: (y,m,d) => `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}` },
        // DD Month YYYY (e.g. "19 Aug 2026", "19 August 2026")
        { re: /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})\b/gi,
          fn: (d, mon, y) => {
              const months = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
              return `${y}-${months[mon.toLowerCase().substring(0,3)]}-${d.padStart(2,'0')}`;
          }
        },
        // Month DD, YYYY  (e.g. "Aug 19, 2026")
        { re: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/gi,
          fn: (mon, d, y) => {
              const months = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
              return `${y}-${months[mon.toLowerCase().substring(0,3)]}-${d.padStart(2,'0')}`;
          }
        },
    ];

    for (const { re, fn } of patterns) {
        const m = re.exec(text);
        if (m) {
            const dateStr = fn(m[1], m[2], m[3]);
            const d = new Date(dateStr);
            // Validate — reject obviously invalid dates
            if (!isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2030) {
                return dateStr;
            }
        }
    }

    return new Date().toISOString().split('T')[0];
};

// ─── Merchant Detection ─────────────────────────────────────────────────────
const parseMerchant = (text) => {
    if (!text) return null;
    const textLower = text.toLowerCase();

    const merchants = [
        'amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho',
        'uber', 'ola', 'rapido', 'redbus', 'irctc', 'makemytrip',
        'swiggy', 'zomato', 'dunzo', 'blinkit', 'bigbasket', 'grofers', 'zepto',
        'apollo pharmacy', 'medplus', 'pharmeasy', '1mg', 'netmeds',
        'mcdonalds', 'kfc', 'dominos', 'pizza hut', 'subway', 'starbucks',
        'reliance', 'dmart', 'bigbazaar', 'big bazaar', 'more', 'spencer',
        'hdfc', 'icici', 'sbi', 'axis bank', 'kotak',
        'airtel', 'jio', 'vi ', 'bsnl',
        'netflix', 'hotstar', 'spotify', 'amazon prime',
        'makemytrip', 'cleartrip', 'goibibo',
    ];

    for (const m of merchants) {
        if (textLower.includes(m)) {
            // Return proper case
            return m.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
    }

    // Try to extract from first non-empty line (usually the merchant header)
    const firstLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && !/^\d/.test(l));
    if (firstLines.length > 0) {
        const candidate = firstLines[0].substring(0, 40);
        // Only return if it looks like a name (has letters, not just numbers/symbols)
        if (/[a-zA-Z]{3,}/.test(candidate)) return candidate;
    }

    return null;
};

// ─── Category Suggestion ────────────────────────────────────────────────────
const suggestCategory = (text, merchant) => {
    const t = (text || '').toLowerCase() + ' ' + (merchant || '').toLowerCase();

    const rules = [
        { keywords: ['restaurant','swiggy','zomato','food','cafe','coffee','pizza','burger','kfc','mcdonalds','domino','subway','hotel','dining','lunch','dinner','breakfast','meal','snack','biryani','starbucks'], cat: 'Food' },
        { keywords: ['uber','ola','rapido','cab','taxi','train','flight','bus','metro','fuel','petrol','diesel','toll','makemytrip','cleartrip','irctc','redbus','goibibo'], cat: 'Travel' },
        { keywords: ['pharmacy','medical','apollo','medplus','pharmeasy','hospital','clinic','doctor','medicine','1mg','netmeds','health'], cat: 'Medical' },
        { keywords: ['amazon','flipkart','myntra','ajio','nykaa','meesho','reliance','dmart','big bazaar','bigbazaar','mall','shop','store','mart','supermarket','grocery','bigbasket','grofers','zepto','blinkit'], cat: 'Shopping' },
        { keywords: ['electricity','water','wifi','internet','airtel','jio','bsnl','broadband','recharge','bill','utility'], cat: 'Bills' },
        { keywords: ['netflix','hotstar','spotify','prime','entertainment','movie','cinema','game'], cat: 'Entertainment' },
        { keywords: ['school','college','course','tuition','book','fee','udemy','coursera','education'], cat: 'Education' },
        { keywords: ['rent','apartment','flat','room','house','pg','hostel'], cat: 'Rent' },
    ];

    for (const { keywords, cat } of rules) {
        if (keywords.some(kw => t.includes(kw))) return cat;
    }

    return 'Shopping'; // reasonable default for receipts
};

// ─── Main Parser ────────────────────────────────────────────────────────────
const parseReceiptText = (text) => {
    const amount   = parseAmount(text);
    const date     = parseDate(text);
    const merchant = parseMerchant(text);
    const suggestedCategory = suggestCategory(text, merchant);

    return { amount, date, merchant, suggestedCategory, rawText: text };
};

module.exports = { parseReceiptText, parseAmount, parseDate, parseMerchant, suggestCategory };
