module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'backend/**/*.js',
        '!backend/tests/**',
        '!backend/database/database-init.js'
    ],
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
    setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js'],
    testMatch: ['**/tests/**/*.test.js'],
    clearMocks: true,
};
