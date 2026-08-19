const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 1 }))
}));

describe('Expense API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create an expense transaction', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ category_type: 'Expense' }]); // Category check
        dbUtils.executeQuery.mockResolvedValueOnce({ insertId: 5 }); // Insert

        const res = await request(app)
            .post('/api/expenses')
            .set('Authorization', 'Bearer valid')
            .send({ categoryId: 1, amount: 50, description: 'Lunch', transactionDate: '2023-10-01' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.transactionId).toBe(5);
    });

    it('should delete an expense transaction', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ transaction_id: 1 }]); // Ownership check
        dbUtils.executeQuery.mockResolvedValueOnce({}); // Delete

        const res = await request(app)
            .delete('/api/expenses/1')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should fetch analytics summary', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ totalExpense: 500, expenseCount: 10, averageExpense: 50 }]); 
        dbUtils.executeQuery.mockResolvedValueOnce([{ thisMonthExpense: 200 }]); 

        const res = await request(app)
            .get('/api/expenses/summary')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalExpense).toBe(500);
    });
});
