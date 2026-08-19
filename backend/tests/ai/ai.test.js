const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 1 }))
}));

describe('AI API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should calculate health score', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Income', totalAmount: 5000 }]);
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Expense', totalAmount: 2000 }]);

        const res = await request(app)
            .get('/api/ai/health')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.healthScore).toBeGreaterThanOrEqual(0);
        expect(res.body.data.healthScore).toBeLessThanOrEqual(100);
    });

    it('should generate recommendations', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Income', totalAmount: 5000 }]);
        dbUtils.executeQuery.mockResolvedValueOnce([{ type: 'Expense', totalAmount: 4800 }]); // High expense

        const res = await request(app)
            .get('/api/ai/recommendations')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
