const requestTimer = (req, res, next) => {
    const start = process.hrtime();

    const originalSend = res.send;
    res.send = function (body) {
        if (!res.headersSent) {
            const diff = process.hrtime(start);
            const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);
            res.setHeader('X-Response-Time', `${timeInMs}ms`);
        }
        originalSend.call(this, body);
    };

    next();
};

module.exports = requestTimer;
