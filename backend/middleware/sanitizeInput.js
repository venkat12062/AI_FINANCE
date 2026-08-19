// Note: xss-clean and hpp are incompatible with Express 5 (they mutate req.query which is read-only)
// Input sanitization is handled manually in validators instead

const sanitizeInput = [
    // Both xss() and hpp() are disabled - Express 5 made req.query read-only
    // xss() - disabled
    // hpp() - disabled
];

module.exports = sanitizeInput;
