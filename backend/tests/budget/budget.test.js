const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 1 }))
}));

describe('Budget API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a budget', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([]); // Duplicate check
        dbUtils.executeQuery.mockResolvedValueOnce({ insertId: 2 }); // Insert

        const res = await request(app)
            .post('/api/budgets')
            .set('Authorization', 'Bearer valid')
            .send({ month: 10, year: 2023, budgetLimit: 1000 });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.budgetId).toBe(2);
    });

    it('should fail on duplicate budget for same month', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ budget_id: 1 }]); // Duplicate check finds one

        const res = await request(app)
            .post('/api/budgets')
            .set('Authorization', 'Bearer valid')
            .send({ month: 10, year: 2023, budgetLimit: 1000 });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should calculate budget progress', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{
            budget_id: 1,
            month: 10,
            year: 2023,
            budget_limit: 1000
        }]); // getBudgets
        dbUtils.executeQuery.mockResolvedValueOnce([{ spentAmount: 400 }]); // getSpentAmount

        const res = await request(app)
            .get('/api/budgets/progress')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data[0].spentAmount).toBe(400);
        expect(res.body.data[0].percentageUsed).toBe(40);
        expect(res.body.data[0].remainingAmount).toBe(600);
    });
});
