jest.mock('../utils/database', () => ({
    executeQuery: jest.fn(),
}));

jest.mock('../utils/cache', () => ({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    clear: jest.fn(),
}));

// Also mock logger to prevent console spam during tests
jest.mock('../utils/fileLogger', () => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    accessStream: { write: jest.fn() }
}));

jest.mock('../middleware/sanitizeInput', () => {
    return (req, res, next) => next();
});
