const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 1 }))
}));

describe('Category API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a category', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([]); // Duplicate check
        dbUtils.executeQuery.mockResolvedValueOnce({ insertId: 10 }); // Insert

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', 'Bearer validtoken')
            .send({ categoryName: 'Food', categoryType: 'Expense' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.categoryId).toBe(10);
    });

    it('should prevent duplicate categories', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ category_id: 1 }]); // Exists

        const res = await request(app)
            .post('/api/categories')
            .set('Authorization', 'Bearer validtoken')
            .send({ categoryName: 'Food', categoryType: 'Expense' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should delete a category', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ category_id: 1 }]); // Ownership check
        dbUtils.executeQuery.mockResolvedValueOnce([{ count: 0 }]); // Usage check
        dbUtils.executeQuery.mockResolvedValueOnce({}); // Delete

        const res = await request(app)
            .delete('/api/categories/1')
            .set('Authorization', 'Bearer validtoken');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should prevent deleting a used category', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ category_id: 1 }]); // Ownership check
        dbUtils.executeQuery.mockResolvedValueOnce([{ count: 5 }]); // Usage check: Used in 5 transactions

        const res = await request(app)
            .delete('/api/categories/1')
            .set('Authorization', 'Bearer validtoken');

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });
});
