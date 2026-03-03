import {INestApplication} from '@nestjs/common';
import {closeApp, createTestApp, createUser, login, resetDb, agentFor} from './test-utils';
import {UsersModule} from '@src/users';
import {AuthModule} from '@src/auth';
import {DataSource} from "typeorm";
import {getDataSourceToken} from "@nestjs/typeorm";
import {ERRORS} from "@errors";

describe('Permissions (e2e)', () => {
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

    it('user cannot change isAdmin field', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});
        await createUser(app, {username: 'u2', password: 'pass1234'});

        const agent = agentFor(app.getHttpServer());
        await login(agent, 'u1', 'pass1234');

        const res = await agent.patch('/users/u2').send({isAdmin: true});
        expect(res.status).toBe(403);
        expect(res.body.message).toContain('Only admins can change isAdmin');
    });

    it('non-admin trying to change own isAdmin should be rejected', async () => {
        await createUser(app, {username: 'self', password: 'pass1234'});

        const agent = agentFor(app.getHttpServer());
        await login(agent, 'self', 'pass1234');

        const res = await agent.patch('/users/self').send({isAdmin: true});
        expect(res.status).toBe(403);
        // Guard throws permission denied for non-admins
        expect(res.body.message).toContain(ERRORS.PERMISSION_DENIED.message);
    });

    it('admin can change isAdmin field of other users', async () => {
        // Create admin user and another user
        await createUser(app, {username: 'admin', password: 'pass1234'});
        await createUser(app, {username: 'u2', password: 'pass1234'});

        // Promote 'admin' to isAdmin directly in the database so we can test admin behavior
        const dataSource = app.get<DataSource>(getDataSourceToken());
        const userRepo = dataSource.getRepository('User');
        const admin = await userRepo.findOne({where: {username: 'admin'}});
        admin.isAdmin = true;
        await userRepo.save(admin);

        const agent = agentFor(app.getHttpServer());
        await login(agent, 'admin', 'pass1234');

        // Admin promoting u2 to admin should succeed
        const promoteRes = await agent.patch('/users/u2').send({isAdmin: true});
        expect(promoteRes.status).toBe(200);
        expect(promoteRes.body.isAdmin).toBe(true);
    });

    it('admin trying to change his own isAdmin should be rejected', async () => {
        // create admin user
        await createUser(app, {username: 'selfadmin', password: 'pass1234'});

        // mark as admin directly in DB
        const dataSource = app.get<DataSource>(getDataSourceToken());
        const userRepo = dataSource.getRepository('User');
        const admin = await userRepo.findOne({where: {username: 'selfadmin'}});
        admin.isAdmin = true;
        await userRepo.save(admin);

        const agent = agentFor(app.getHttpServer());
        await login(agent, 'selfadmin', 'pass1234');

        const res = await agent.patch('/users/selfadmin').send({isAdmin: false});
        expect(res.status).toBe(403);
        expect(res.body.message).toContain('Admins cannot change their own isAdmin');
    });

    it('user cannot update another user profile', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});
        await createUser(app, {username: 'u2', password: 'pass1234'});

        const agent = agentFor(app.getHttpServer());
        await login(agent, 'u1', 'pass1234');

        const res = await agent.patch('/users/u2').send({displayName: 'Hacked'});
        expect(res.status).toBe(403);
    });

    it('user can update own profile', async () => {
        await createUser(app, {username: 'u1', password: 'pass1234'});

        const agent = agentFor(app.getHttpServer());
        await login(agent, 'u1', 'pass1234');

        const res = await agent.patch('/users/u1').send({displayName: 'New Name'});
        expect(res.status).toBe(200);
        expect(res.body.displayName).toBe('New Name');
    });
});
