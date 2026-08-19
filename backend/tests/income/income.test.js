const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 1 }))
}));

describe('Income API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create an income transaction', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ category_type: 'Income' }]); // Category check
        dbUtils.executeQuery.mockResolvedValueOnce({ insertId: 5 }); // Insert

        const res = await request(app)
            .post('/api/income')
            .set('Authorization', 'Bearer valid')
            .send({ categoryId: 1, amount: 1000, description: 'Salary', transactionDate: '2023-10-01' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.transactionId).toBe(5);
    });

    it('should prevent using Expense category for Income', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ category_type: 'Expense' }]); // Category check

        const res = await request(app)
            .post('/api/income')
            .set('Authorization', 'Bearer valid')
            .send({ categoryId: 2, amount: 50, description: 'Food', transactionDate: '2023-10-01' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should fetch income with pagination and filters', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ total: 10 }]); // Count
        dbUtils.executeQuery.mockResolvedValueOnce([{ transactionId: 1, amount: 100 }]); // Fetch

        const res = await request(app)
            .get('/api/income?page=1&limit=5&categoryId=1')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.records).toHaveLength(1);
        expect(res.body.data.pagination.total).toBe(10);
    });
});
