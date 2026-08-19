const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'ai_finance_manager.sqlite');
const db = new sqlite3.Database(dbPath);

// Enable Foreign Keys and WAL mode for high performance
db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");
    db.run("PRAGMA journal_mode = WAL;");
    
    // Create Users Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Create Categories Table
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            category_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category_name TEXT NOT NULL,
            category_type TEXT NOT NULL,
            UNIQUE (user_id, category_name, category_type),
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
    `);

    // Create Transactions Table
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            transaction_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            FOREIGN KEY(category_id) REFERENCES categories(category_id)
        );
    `);

    // Create Budgets Table
    db.run(`
        CREATE TABLE IF NOT EXISTS budgets (
            budget_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            budget_limit REAL,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
    `);

    // Create Receipts Table
    db.run(`
        CREATE TABLE IF NOT EXISTS receipts (
            receipt_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            image_url TEXT,
            ocr_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
    `);

    // Create AI Insights Table
    db.run(`
        CREATE TABLE IF NOT EXISTS ai_insights (
            insight_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message TEXT,
            insight_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
    `);

    // Create Voice Entries Table
    db.run(`
        CREATE TABLE IF NOT EXISTS voice_entries (
            voice_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            voice_text TEXT,
            parsed_amount REAL,
            parsed_type TEXT,
            parsed_category TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
    `);

    // Create Notifications Table
    db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
            notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            notification_type TEXT,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
        );
    `);

    // Seed default categories if empty
    db.get("SELECT COUNT(*) as count FROM categories WHERE user_id IS NULL", (err, row) => {
        if (!err && row && row.count === 0) {
            const defaults = [
                ['Food', 'Expense'],
                ['Travel', 'Expense'],
                ['Shopping', 'Expense'],
                ['Medical', 'Expense'],
                ['Education', 'Expense'],
                ['Entertainment', 'Expense'],
                ['Bills', 'Expense'],
                ['Rent', 'Expense'],
                ['Salary', 'Income'],
                ['Freelance', 'Income'],
                ['Business', 'Income'],
                ['Investment', 'Income'],
                ['Bonus', 'Income']
            ];
            const stmt = db.prepare("INSERT OR IGNORE INTO categories (category_name, category_type) VALUES (?, ?)");
            defaults.forEach(d => stmt.run(d[0], d[1]));
            stmt.finalize();
        }
    });
});

/**
 * Converts MySQL specific syntax in queries to SQLite
 */
function translateMySQLToSQLite(sql) {
    let converted = sql;
    
    // Replace CURRENT_DATE / CURRENT_DATE()
    converted = converted.replace(/CURRENT_DATE\(\)/gi, "date('now')");
    converted = converted.replace(/\bCURRENT_DATE\b/gi, "date('now')");
    
    // Replace NOW() - INTERVAL X DAY / DATE_SUB
    converted = converted.replace(/NOW\(\)\s*-\s*INTERVAL\s+(\d+)\s+DAY/gi, "datetime('now', '-$1 days')");
    converted = converted.replace(/CURRENT_DATE\(\)\s*-\s*INTERVAL\s+(\d+)\s+DAY/gi, "date('now', '-$1 days')");
    converted = converted.replace(/DATE_SUB\([^,]+,\s*INTERVAL\s+(\d+)\s+MONTH\)/gi, "date('now', '-$1 months')");
    converted = converted.replace(/DATE_SUB\([^,]+,\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "date('now', '-$1 days')");

    // Replace DATE_FORMAT(col, '%Y-%m')
    converted = converted.replace(/DATE_FORMAT\(([^,]+),\s*['"]%Y-%m['"]\)/gi, "strftime('%Y-%m', $1)");
    converted = converted.replace(/DATE_FORMAT\(([^,]+),\s*['"]%Y-%m-%d['"]\)/gi, "strftime('%Y-%m-%d', $1)");

    // Replace MONTH(...) & YEAR(...)
    converted = converted.replace(/MONTH\(\s*(date\('now'\)|CURRENT_DATE\(\)|CURRENT_DATE|NOW\(\))\s*\)/gi, "strftime('%m', 'now')");
    converted = converted.replace(/YEAR\(\s*(date\('now'\)|CURRENT_DATE\(\)|CURRENT_DATE|NOW\(\))\s*\)/gi, "strftime('%Y', 'now')");
    converted = converted.replace(/MONTH\(([^)]+)\)/gi, "strftime('%m', $1)");
    converted = converted.replace(/YEAR\(([^)]+)\)/gi, "strftime('%Y', $1)");
    
    // Replace NOW()
    converted = converted.replace(/NOW\(\)/gi, "datetime('now')");

    // Replace INSERT IGNORE INTO
    converted = converted.replace(/INSERT\s+IGNORE\s+INTO/gi, "INSERT OR IGNORE INTO");

    return converted;
}

/**
 * Executes a query with MySQL-compatible output
 */
function executeSqliteQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        const cleanSql = translateMySQLToSQLite(sql.trim());
        const isSelect = cleanSql.trim().toUpperCase().startsWith('SELECT') || cleanSql.trim().toUpperCase().startsWith('PRAGMA');

        if (isSelect) {
            db.all(cleanSql, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows || []);
            });
        } else {
            db.run(cleanSql, params, function (err) {
                if (err) {
                    if (err.message && err.message.includes('UNIQUE constraint failed')) {
                        const dupErr = new Error('Duplicate entry');
                        dupErr.code = 'ER_DUP_ENTRY';
                        return reject(dupErr);
                    }
                    return reject(err);
                }
                resolve({
                    insertId: this.lastID,
                    affectedRows: this.changes
                });
            });
        }
    });
}

module.exports = {
    db,
    executeSqliteQuery
};
