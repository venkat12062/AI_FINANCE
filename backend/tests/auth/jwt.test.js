const request = require('supertest');
const app = require('../../server');

describe('JWT Middleware', () => {
    it('should fail on missing token', async () => {
        const res = await request(app)
            .get('/api/profile'); // Protected route

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should fail on malformed token', async () => {
        const res = await request(app)
            .get('/api/profile')
            .set('Authorization', 'Bearer invalid.token.format');

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
