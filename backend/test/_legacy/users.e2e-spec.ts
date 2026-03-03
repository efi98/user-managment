import { INestApplication } from '@nestjs/common';
import { agentFor, closeApp, createTestApp, createUser, http, login, resetDb } from './test-utils';
import { UsersModule } from '@src/users';
import { AuthModule } from '@src/auth';
import * as bcrypt from 'bcrypt';
import {getDataSourceToken} from "@nestjs/typeorm";
import {DataSource} from "typeorm";

function birthdateFromAge(age: number): string {
    const now = new Date();
    const y = now.getFullYear() - age;
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

describe('Users (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await createTestApp([UsersModule, AuthModule]);
    });

    beforeEach(async () => {
        await resetDb(app);
    });

    afterAll(async () => {
        await closeApp(app);
    });

    it('GET /users returns 401 when not logged in', async () => {
        const res = await http(app.getHttpServer()).get('/users');
        expect(res.status).toBe(401);
    });

    it('GET /users returns safe users (no password) when logged in', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});

        const agent = agentFor(app.getHttpServer());
        await login(agent, 'u1', 'pass1234');

        const res = await agent.get('/users');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].password).toBeUndefined();
        expect(res.body[0].profilePhoto).toMatch(/^\/uploads\/avatars\//);
    });

    it('GET /users/:username returns 200 when all is good', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});

        const agent = agentFor(app.getHttpServer());
        await login(agent, 'u1', 'pass1234');

        const res = await agent.get('/users/u1');
        expect(res.status).toBe(200);
        expect(res.body.username).toBe('u1');
        expect(res.body.password).toBeUndefined();
        expect(res.body.profilePhoto).toMatch(/^\/uploads\/avatars\//);
    });

    it('GET /users/:username returns 404 when user not found', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});

        const agent = agentFor(app.getHttpServer());
        await login(agent, 'u1', 'pass1234');

        const res = await agent.get('/users/nope');
        expect(res.status).toBe(404);
    });

    it('POST /users returns 409 and suggestions when username exists', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});

        const res = await http(app.getHttpServer())
            .post('/users')
            .send({username: 'u1', password: 'pass1234'});
        expect(res.status).toBe(409);
        expect(Array.isArray(res.body.suggestions)).toBe(true);
        expect(res.body.suggestions.length).toBe(3);
    });

    it('POST /users returns 201 and safe body when payload is valid', async () => {
        const payload = {username: 'newuser', password: 'pass1234', displayName: 'New User', birthdate: birthdateFromAge(25), gender: 'male'};
        const res = await http(app.getHttpServer())
            .post('/users')
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.username).toBe('newuser');
        expect(res.body.password).toBeUndefined();
        expect(res.body.profilePhoto).toMatch(/^\/uploads\/avatars\//);
    });

    it('POST /users returns 400 when required fields are missing', async () => {
        const res = await http(app.getHttpServer())
            .post('/users')
            .send({username: 'incomplete'});
        expect(res.status).toBe(400);
    });

    it('POST /users returns 400 for forbidden extra fields', async () => {
        const res = await http(app.getHttpServer())
            .post('/users')
            .send({username: 'newuser', password: 'pass1234', bad: 1});
        expect(res.status).toBe(400);
    });

    it('POST /users/:username/avatar self allowed, saves profilePhoto', async () => {
        const agent = agentFor(app.getHttpServer());
        await createUser(app, {username: 'u1', password: 'pass1234'});
        await login(agent, 'u1', 'pass1234');

        const path = require('node:path');
        const fs = require('node:fs');
        const imgPath = path.join(__dirname, '..', 'assets', 'test-uploads', 'avatars', 'default.jpg');

        const res = await agent.post('/users/u1/avatar').attach('avatar', imgPath);

        expect(res.status).toBe(200);
        expect(res.body.profilePhoto).toMatch(/^\/uploads\/avatars\/.+/);

        const filename = path.basename(res.body.profilePhoto);
        const avatarsDir = path.resolve(process.env.AVATARS_DIR || 'assets/test-uploads/avatars');
        const diskPath = path.join(avatarsDir, filename);
        expect(fs.existsSync(diskPath)).toBe(true);
    });

    it('POST /users/:username/avatar non-image rejected', async () => {
        const agent = agentFor(app.getHttpServer());
        await createUser(app, {username: 'u1', password: 'pass1234'});
        await login(agent, 'u1', 'pass1234');

        // attach an in-memory non-image file to trigger validation rejection deterministically
        const res = await agent.post('/users/u1/avatar').attach('avatar', Buffer.from('not an image'), 'dummy.txt');
        expect(res.status).toBe(400);
    });


    it('POST /users/:username/avatar returns 400 when no file uploaded', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});
        const agent = agentFor(app.getHttpServer());
        await login(agent, 'u1', 'pass1234');

        const res = await agent.post('/users/u1/avatar').field('dummy', '1');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({error: 'No file uploaded (field name should be "avatar")'});
    });

    it('DELETE /users/:username/avatar returns 200 and clears profilePhoto', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});
        const agent = agentFor(app.getHttpServer());
        await login(agent, 'u1', 'pass1234');

        const path = require('node:path');
        const imgPath = path.join(__dirname, '..', 'assets', 'test-uploads', 'avatars', 'default.jpg');

        const up = await agent.post('/users/u1/avatar').attach('avatar', imgPath);
        expect(up.status).toBe(200);

        const del = await agent.delete('/users/u1/avatar');
        expect(del.status).toBe(200);
        expect(del.body).toEqual({message: 'Avatar deleted'});

        const user = await agent.get('/users/u1');
        expect(user.status).toBe(200);
        expect(user.body.profilePhoto).toBe('/uploads/avatars/default.jpg');
    });

    it('GET /users/stats returns correct statistics', async () => {

        const dataSource = app.get<DataSource>(getDataSourceToken());
        const userRepo = dataSource.getRepository('User');

        const now = Date.now();
        const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
        const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();

        // Clear and insert deterministic users for stats
        await userRepo.clear();
        await userRepo.save([
            {
                username: 'a',
                password: bcrypt.hashSync('pass1234', 10),
                createdAt: twoDaysAgo,
                updatedAt: twoDaysAgo,
                gender: '',
                birthdate: birthdateFromAge(10),
                isAdmin: true,
                profilePhoto: null,
            },
            {
                username: 'b',
                password: bcrypt.hashSync('pass1234', 10),
                createdAt: twoDaysAgo,
                updatedAt: twoDaysAgo,
                gender: 'MALE',
                birthdate: birthdateFromAge(20),
                isAdmin: false,
                profilePhoto: null,
            },
            {
                username: 'c',
                password: bcrypt.hashSync('pass1234', 10),
                createdAt: eightDaysAgo,
                updatedAt: eightDaysAgo,
                gender: null,
                birthdate: birthdateFromAge(30),
                isAdmin: false,
                profilePhoto: null,
            },
            {
                username: 'd',
                password: bcrypt.hashSync('pass1234', 10),
                createdAt: twoDaysAgo,
                updatedAt: twoDaysAgo,
                gender: 'female',
                birthdate: 'nope',
                isAdmin: false,
                profilePhoto: null,
            },
        ]);

        // Log in as an existing seeded user to get an authenticated agent
        const agentA = agentFor(app.getHttpServer());
        const loginRes = await login(agentA, 'a', 'pass1234');
        expect(loginRes.status).toBe(200);
        expect(loginRes.body.username).toBe('a');
        const meRes = await agentA.get('/me');
        expect(meRes.status).toBe(200);
        expect(meRes.body.username).toBe('a');
        const res = await agentA.get('/users/stats');
        expect(res.status).toBe(200);

        // Basic counts
        expect(res.body.totalUsers).toBe(4);
        expect(res.body.adminCount).toBe(1);
        expect(res.body.adminPercent).toBe(25);

        // lastSignups: most recent 10 users by createdAt (sorted desc)
        expect(Array.isArray(res.body.lastSignups)).toBe(true);
        expect(res.body.lastSignups.length).toBe(4);

        // genderBreakdown: '' -> blank, null -> blank, 'MALE' -> 'male', 'female' -> 'female'
        expect(res.body.genderBreakdown.blank).toBe(2);
        expect(res.body.genderBreakdown.male).toBe(1);
        expect(res.body.genderBreakdown.female).toBe(1);

        // ages: only numeric => [10,20,30], avg=20, min=10, max=30, median=20
        expect(res.body.ageStats).toEqual({avg: 20, min: 10, max: 30, median: 20});

        // Now test fractional age statistics with two users
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
        await userRepo.clear();
        await userRepo.save([
            {username: 'e1', password: bcrypt.hashSync('pass1234', 10), createdAt: oneDayAgo, updatedAt: oneDayAgo, gender: 'male', birthdate: birthdateFromAge(10), isAdmin: false, profilePhoto: null},
            {username: 'e2', password: bcrypt.hashSync('pass1234', 10), createdAt: oneDayAgo, updatedAt: oneDayAgo, gender: 'female', birthdate: birthdateFromAge(21), isAdmin: false, profilePhoto: null},
        ]);

        // Log in as one of the seeded users to get an authenticated agent
        const agentE = agentFor(app.getHttpServer());
        const loginRes2 = await login(agentE, 'e1', 'pass1234');
        expect(loginRes2.status).toBe(200);
        expect(loginRes2.body.username).toBe('e1');
        const meRes2 = await agentE.get('/me');
        expect(meRes2.status).toBe(200);
        expect(meRes2.body.username).toBe('e1');

        const res2 = await agentE.get('/users/stats');
        expect(res2.status).toBe(200);

        // ages numeric [10,21] -> avg = 15.5, min = 10, max = 21, median = (10+21)/2 = 15.5
        expect(res2.body.ageStats).toEqual({avg: 15.5, min: 10, max: 21, median: 15.5});
    });
});
