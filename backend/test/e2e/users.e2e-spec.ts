import {INestApplication} from '@nestjs/common';
import request from 'supertest';
import {getRepositoryToken} from "@nestjs/typeorm";
import {User} from "@src/users";
import {sessionAgent} from "@tests/utils/session-agent";
import {buildTestApp} from "@tests/utils/build-test-app";
import {loginUser, seedUser} from "@tests/utils/seed";
import * as bcrypt from 'bcrypt';

describe('E2E users', () => {
    let app: INestApplication;
    let agentA: ReturnType<typeof sessionAgent>;
    let agentB: ReturnType<typeof sessionAgent>;

    beforeAll(async () => {
        app = await buildTestApp();
        agentA = sessionAgent(app);
        agentB = sessionAgent(app);

        const repo = app.get(getRepositoryToken(User));
        const passHash = bcrypt.hashSync('pass', 10);
        await repo.save([
            repo.create({username: 'a', password: passHash, isAdmin: true}),
            repo.create({username: 'b', password: passHash, isAdmin: false}),
            repo.create({username: 'c', password: passHash, isAdmin: true}),
            repo.create({username: 'd', password: passHash, isAdmin: false}),
        ]);
        await loginUser(agentA, {username: 'a', password: 'pass'});

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
    });

    beforeEach(async () => {
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
        expect(res.body[0].password).toBeUndefined();
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
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toMatch(/not found/i);
    });

    describe('GET /users/stats', () => {

        it('GET /users/stats requires auth', async () => {
            await request(app.getHttpServer()).get('/users/stats').expect(401);
        });

        it('returns exact statistics', async () => {
            const res = await agentA.get('/users/stats').expect(200);

            expect(res.body).toMatchObject({
                totalUsers: 6,
                adminCount: 2,
                adminPercent: 33
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
        const res = await agentA.post('/users').send({username: '', password: '123'});
        expect(res.status).toBe(400);
    });

    it('POST /users rejects forbidden extra fields', async () => {
        const res = await agentA
            .post('/users')
            .send({
                username: 'newuser-extra',
                password: 'pass',
                birthdate: '2000-01-01',
                gender: 'female',
                extra: 'nope',
            });

        expect(res.status).toBe(400);
    });

    it('POST /users returns 201 and safe body when payload is valid', async () => {
        const res = await agentA
            .post('/users')
            .send({
                username: 'newuser',
                password: 'pass',
                birthdate: '2000-01-01',
                gender: 'female',
            })
            .expect(201);

        expect(res.body.username).toBe('newuser');
        expect(res.body.password).toBeUndefined();
        expect(res.body.profilePhoto).toMatch(/^\/uploads\/avatars\//);
    });

    it('POST /users returns 409 and suggestions when username exists', async () => {
        const res = await agentA
            .post('/users')
            .send({
                username: 'alice',
                password: 'pass',
                birthdate: '2000-01-01',
                gender: 'female',
            });

        expect(res.status).toBe(409);
        expect(Array.isArray(res.body.suggestions)).toBe(true);
        expect(res.body.suggestions.length).toBe(3);
    });

    it('DELETE /users/:username allows self delete', async () => {
        const res = await agentB.delete('/users/bob');
        expect(res.status).toBe(204);
    });
});