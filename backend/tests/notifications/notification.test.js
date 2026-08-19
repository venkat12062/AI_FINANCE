const request = require('supertest');
const app = require('../../server');
const dbUtils = require('../../utils/database');

jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(() => ({ userId: 1 }))
}));

describe('Notifications API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should generate notifications without crashing', async () => {
        dbUtils.executeQuery.mockResolvedValue([]); // Mock all queries empty
        
        const res = await request(app)
            .post('/api/notifications/generate')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should get unread count', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce([{ count: 5 }]);
        
        const res = await request(app)
            .get('/api/notifications/unread-count')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.count).toBe(5);
    });

    it('should mark all read', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce({});
        
        const res = await request(app)
            .put('/api/notifications/read-all')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should mark one read', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce({});
        
        const res = await request(app)
            .put('/api/notifications/1/read')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should delete notification', async () => {
        dbUtils.executeQuery.mockResolvedValueOnce({});
        
        const res = await request(app)
            .delete('/api/notifications/1')
            .set('Authorization', 'Bearer valid');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
