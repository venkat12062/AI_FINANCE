const getFormattedDate = () => {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `[${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
};

const logger = {
    info: (message) => console.log(`${getFormattedDate()} INFO: ${message}`),
    warn: (message) => console.warn(`${getFormattedDate()} WARN: ${message}`),
    error: (message) => console.error(`${getFormattedDate()} ERROR: ${message}`),
    success: (message) => console.log(`${getFormattedDate()} SUCCESS: ${message}`)
};

module.exports = logger;
