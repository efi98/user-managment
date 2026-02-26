import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { closeApp, createTestApp, createUser, login, resetDb } from './test-utils';
import { AuthModule } from '@src/auth';
import { UsersModule } from '@src/users';

describe('Auth (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestApp([AuthModule, UsersModule]);
    });

    beforeEach(async () => {
        await resetDb(app);
    });

    afterAll(async () => {
        await closeApp(app);
    });

    it('GET /me returns 401 when not logged in', async () => {
        const res = await request(app.getHttpServer()).get('/me');
        expect(res.status).toBe(401);
    });

    it('POST /login returns 404 for non-existing user', async () => {
        const res = await request(app.getHttpServer())
            .post('/login')
            .send({username: 'nope', password: 'pass1234'});
        expect(res.status).toBe(404);
    });

    it('POST /login returns 401 for wrong password', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});

        const res = await request(app.getHttpServer())
            .post('/login')
            .send({username: 'u1', password: 'wrong'});
        expect(res.status).toBe(401);
    });

    it('login -> me -> logout -> me', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});

        const agent = request.agent(app.getHttpServer());

        const loginRes = await login(agent, 'u1', 'pass1234');
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.username).toBe('u1');
        expect(loginRes.body.password).toBeUndefined();

        const meRes = await agent.get('/me');
        expect(meRes.status).toBe(200);
        expect(meRes.body.username).toBe('u1');
        expect(meRes.body.password).toBeUndefined();

        const logoutRes = await agent.post('/logout');
        expect(logoutRes.status).toBe(204);

        const meAfter = await agent.get('/me');
        expect(meAfter.status).toBe(401);
    });
});
