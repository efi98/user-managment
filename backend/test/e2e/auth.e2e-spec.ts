import {INestApplication} from '@nestjs/common';
import {sessionAgent, SessionAgent} from "@tests/utils/session-agent";
import {buildTestApp} from "@tests/utils/build-test-app";
import {loginUser, logoutUser, seedUser} from "@tests/utils/seed";

describe('E2E auth flow', () => {
    let app: INestApplication;
    let agent: SessionAgent;

    beforeAll(async () => {
        app = await buildTestApp();
        agent = sessionAgent(app);
    });

    afterAll(async () => {
        await app.close();
    });

    it('me is protected', async () => {
        const meRes = await agent.get('/me');
        expect(meRes.status).toBe(401);
    });

    it('create user then login then me works', async () => {
        await seedUser(agent, {
            username: 'alice',
            password: 'pass',
            birthdate: '2000-01-01',
            gender: 'female',
        });

        await loginUser(agent, {username: 'alice', password: 'pass'});

        const meRes = await agent.get('/me').expect(200);
        expect(meRes.body).toHaveProperty('username', 'alice');
    });

    it('login fails on wrong password', async () => {
        await agent.post('/login').send({username: 'alice', password: 'nope'}).expect(401);
    });

  it('login fails on non existing user', async () => {
    await agent.post('/login').send({ username: 'does-not-exist', password: 'pass' }).expect(404);
  });

    it('logout clears session', async () => {
        await logoutUser(agent);
        await agent.get('/me').expect(401);
    });

    it('login works again after logout', async () => {
        await loginUser(agent, {username: 'alice', password: 'pass'});
        await agent.get('/me').expect(200);
        await logoutUser(agent);
    });
});