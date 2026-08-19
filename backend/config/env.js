require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
    PORT: process.env.PORT || 5000,
    DB_HOST: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || '3306', 10),
    DB_USER: process.env.MYSQLUSER || process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
    DB_NAME: process.env.MYSQLDATABASE || process.env.DB_NAME || 'ai_finance_manager',
    DATABASE_URL: process.env.MYSQL_URL || process.env.DATABASE_URL || null,
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET || 'secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h'
};
