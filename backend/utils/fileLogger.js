const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const errorStream = fs.createWriteStream(path.join(logDir, 'error.log'), { flags: 'a' });
const accessStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });

const getFormattedDate = () => new Date().toISOString();

const error = (message) => {
    const log = `[${getFormattedDate()}] ERROR: ${message}\n`;
    console.error(log.trim());
    errorStream.write(log);
};

const info = (message) => {
    const log = `[${getFormattedDate()}] INFO: ${message}\n`;
    console.log(log.trim());
};

const warn = (message) => {
    const log = `[${getFormattedDate()}] WARN: ${message}\n`;
    console.warn(log.trim());
};

module.exports = {
    error,
    info,
    warn,
    accessStream
};
