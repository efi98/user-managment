const path = require("node:path");
const fs = require("node:fs");
const {request, initTestApp, resetDb, createUser, login} = require('./test-utils/testUtils');

let app;

beforeAll(async () => {
    ({app} = await initTestApp());
});

beforeEach(async () => {
    await resetDb();
});

test("non-admin cannot change isAdmin", async () => {
    const agent = request.agent(app);

    // create two users
    await createUser(request(app), {username: "u1", password: "pass1234"});
    await createUser(request(app), {username: "u2", password: "pass1234"});

    // login as u1 (non-admin)
    await login(agent, "u1", "pass1234");

    // attempt to make u2 admin
    const res = await agent
        .patch("/api/users/u2")
        .send({isAdmin: true});

    expect(res.status).toBe(403);
});

test("admin cannot change own isAdmin (self-demotion protection)", async () => {
    const adminAgent = request.agent(app);

    // Create admin user
    await createUser(request(app), {username: "admin", password: "pass1234"});

    // Login to create session
    await login(adminAgent, "admin", "pass1234");

    // Promote admin via direct DB write (or via a helper route if you have one)
    // For simplicity, patch as-if already admin won't work unless your logic allows it.
    // Better: update DB in test using repository:
    const {AppDataSource} = require("../helpers/db");
    const {UserEntity} = require("../user");
    const repo = AppDataSource.getRepository(UserEntity);
    const adminUser = await repo.findOneBy({username: "admin"});
    adminUser.isAdmin = true;
    await repo.save(adminUser);

    // Refresh session user if your session stores user snapshot.
    // Re-login so req.session.user has isAdmin: true.
    await login(adminAgent, "admin", "pass1234");

    const res = await adminAgent.patch("/api/users/admin").send({isAdmin: false});
    expect(res.status).toBe(403);
});

test("non-admin cannot patch other user's profile fields", async () => {
    const agent = request.agent(app);
    await createUser(request(app), {username: "u1", password: "pass1234"});
    await createUser(request(app), {username: "u2", password: "pass1234"});

    await login(agent, "u1", "pass1234");

    const res = await agent.patch("/api/users/u2").send({displayName: "hacked"});
    expect(res.status).toBe(403);
});
