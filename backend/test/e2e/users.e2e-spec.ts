import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {buildTestApp} from '../utils/build-test-app';
import {sessionAgent} from '../utils/session-agent';
import {loginUser, seedUser} from '../utils/seed';
import {resetDb} from "../utils/reset-db";
import {getRepositoryToken} from "@nestjs/typeorm";
import {User} from "@src/users";

describe('E2E users', () => {
    let app: INestApplication;
    let agentA: ReturnType<typeof sessionAgent>;
    let agentB: ReturnType<typeof sessionAgent>;

    beforeAll(async () => {
        app = await buildTestApp();
        agentA = sessionAgent(app);
        agentB = sessionAgent(app);

        await seedUser(agentA, {
            username: 'alice',
            password: 'pass',
            birthdate: '2000-01-01',
            gender: 'female',
        });

        await seedUser(agentB, {
            username: 'bob',
            password: 'pass',
            birthdate: '2000-01-01',
            gender: 'male',
        });

        await loginUser(agentA, {username: 'alice', password: 'pass'});
        await loginUser(agentB, {username: 'bob', password: 'pass'});
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET /users requires auth', async () => {
        await request(app.getHttpServer()).get('/users').expect(401);
    });

    it('GET /users returns list', async () => {
        const res = await agentA.get('/users').expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('GET /users/:username requires auth', async () => {
        await request(app.getHttpServer()).get('/users/alice').expect(401);
    });

    it('GET /users/:username returns safe user', async () => {
        const res = await agentA.get('/users/alice').expect(200);

        expect(res.body).toHaveProperty('username', 'alice');
        expect(res.body).not.toHaveProperty('password');
    });

    it('GET /users/:username returns 404 for missing user', async () => {
        const res = await agentA.get('/users/does-not-exist').expect(404);

        expect(res.body).toHaveProperty('error');
        expect(res.body.error).toMatch(/not found/i);
    });

    describe('GET /users/stats', () => {
        beforeEach(async () => {
            await resetDb(app);

            // seed exact dataset for stats
            agentA = sessionAgent(app);
            const repo = app.get(getRepositoryToken(User));
            await repo.save([
                repo.create({ username: 'a', password: 'x', isAdmin: true }),
                repo.create({ username: 'b', password: 'x', isAdmin: false }),
                repo.create({ username: 'c', password: 'x', isAdmin: true }),
                repo.create({ username: 'd', password: 'x', isAdmin: false }),
            ]);
            await loginUser(agentA, {username: 'a', password: 'x'});
        });

        it('GET /users/stats requires auth', async () => {
            await request(app.getHttpServer()).get('/users/stats').expect(401);
        });

        it('returns exact statistics', async () => {
            const res = await agentA.get('/users/stats').expect(200);

            expect(res.body).toEqual({
                totalUsers: 4,
                adminCount: 2,
                adminPercent: 50,
            });
        });
    });

    it('PATCH /users/:username is blocked for other users', async () => {
        const res = await agentB.patch('/users/alice').send({displayName: 'Hacked'});
        expect(res.status).toBe(403);
    });

    it('PATCH /users/:username allows self update', async () => {
        const res = await agentA.patch('/users/alice').send({displayName: 'Alice2'}).expect(200);
        expect(res.body).toHaveProperty('displayName', 'Alice2');
    });

    it('POST /users rejects invalid DTO', async () => {
        const res = await request(app.getHttpServer()).post('/users').send({username: '', password: '123'})
        expect(res.status).toBe(400);
    });

    it('DELETE /users/:username allows self delete', async () => {
        const res = await agentB.delete('/users/bob');
        expect(res.status).toBe(204);
    });
});