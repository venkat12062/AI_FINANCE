const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 1 }))
}));

describe('Dashboard API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch dashboard overview', async () => {
        // Income/Expense sum mock
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Income', totalAmount: 5000 }]);
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Expense', totalAmount: 2000 }]);
        // Budgets mock
        dbUtils.executeQuery.mockResolvedValueOnce([{ budget_id: 1, budget_limit: 1000 }]);
        dbUtils.executeQuery.mockResolvedValueOnce([{ spent: 400 }]);
        // Recent transactions mock
        dbUtils.executeQuery.mockResolvedValueOnce([{ transaction_id: 1, amount: 50, type: 'Expense' }]);

        const res = await request(app)
            .get('/api/dashboard/overview')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalIncome).toBe(5000);
        expect(res.body.data.totalExpense).toBe(2000);
        expect(res.body.data.balance).toBe(3000);
        expect(res.body.data.recentTransactions).toHaveLength(1);
    });
});
