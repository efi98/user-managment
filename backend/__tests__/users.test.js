const {
    request,
    initTestApp,
    resetDb,
    closeDb,
    createUser,
    login,
} = require("./test-utils/testUtils");

let app;

beforeAll(async () => {
    ({ app } = await initTestApp());
});

beforeEach(async () => {
    await resetDb();
});

afterAll(async () => {
    await closeDb();
});

test("GET /api/users returns 401 when not logged in", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
});

test("GET /api/users returns safe users (no password) when logged in", async () => {
    await createUser(request(app), { username: "u1", password: "pass1234" });

    const agent = request.agent(app);
    await login(agent, "u1", "pass1234");

    const res = await agent.get("/api/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].password).toBeUndefined();
    expect(res.body[0].profilePhoto).toMatch(/^\/uploads\/avatars\//);
});

test("GET /api/users/:username returns 404 when user not found", async () => {
    await createUser(request(app), { username: "u1", password: "pass1234" });

    const agent = request.agent(app);
    await login(agent, "u1", "pass1234");

    const res = await agent.get("/api/users/nope");
    expect(res.status).toBe(404);
});

test("POST /api/users returns 409 and suggestions when username exists", async () => {
    await createUser(request(app), { username: "u1", password: "pass1234" });

    const res = await request(app)
        .post("/api/users")
        .send({ username: "u1", password: "pass1234" });
    expect(res.status).toBe(409);
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBe(3);
});

test("PATCH /api/users/:username rejects forbidden fields", async () => {
    await createUser(request(app), { username: "u1", password: "pass1234" });

    const agent = request.agent(app);
    await login(agent, "u1", "pass1234");

    const res = await agent.patch("/api/users/u1").send({ unknownField: 123 });
    expect(res.status).toBe(400);
});

// Add to __tests__/users.test.js
// Covers routes/users.js:
// - POST /api/users forbidden extra fields (400)
// - POST /api/users suggestions loop (force Math.random collision)
// - PATCH /api/users/:username password hashing branch + normal success
// - DELETE /api/users/:username success
// routes/users.js :contentReference[oaicite:1]{index=1}

describe("users routes - missing coverage", () => {
    const {
        request,
        initTestApp,
        resetDb,
        closeDb,
        createUser,
        login,
    } = require("./test-utils/testUtils");

    let app;

    beforeAll(async () => {
        ({ app } = await initTestApp());
    });

    beforeEach(async () => {
        await resetDb();
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await closeDb();
    });

    test("POST /api/users returns 400 for forbidden extra fields", async () => {
        const res = await request(app)
            .post("/api/users")
            .send({ username: "u1", password: "pass1234", bad: 1 });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Forbidden fields:/);
        expect(res.body.error).toMatch(/'bad'/);
    });

    test("POST /api/users 409 suggestions loop: handles collisions until unique", async () => {
        // create existing usernames so first suggestion collides, second collides, third ok
        await createUser(request(app), { username: "u1", password: "pass1234" });
        await createUser(request(app), { username: "taken0", password: "pass1234" });
        await createUser(request(app), { username: "taken1", password: "pass1234" });

        // Force Math.random to produce 0 then ~0.001 then ~0.002
        // suggestion = `${username}${floor(random*1000)}`
        // for username="taken" -> taken0, taken1 collide, taken2 succeeds
        jest
            .spyOn(Math, "random")
            .mockReturnValueOnce(0) // -> 0
            .mockReturnValueOnce(0.001) // -> 1
            .mockReturnValueOnce(0.002) // -> 2
            .mockReturnValueOnce(0.003) // keep going if needed
            .mockReturnValueOnce(0.004);

        // Attempt to create user with existing username "u1" (to trigger 409 block),
        // but we want the suggestions loop to run against "taken" instead to ensure collisions.
        // So: create "taken" already and retry create "taken".
        const res = await request(app)
            .post("/api/users")
            .send({ username: "taken", password: "pass1234" });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe("Username already exists");
        expect(res.body.suggestions).toEqual(["taken2", "taken3", "taken4"]);
    });

    test("PATCH /api/users/:username hashes when password provided (password branch)", async () => {
        await createUser(request(app), { username: "u1", password: "pass1234" });

        const agent = request.agent(app);
        await login(agent, "u1", "pass1234");

        const bcrypt = require("bcrypt");
        const hashSpy = jest.spyOn(bcrypt, "hashSync");

        const res = await agent
            .patch("/api/users/u1")
            .send({ password: "newpass123" });

        expect(res.status).toBe(200);
        expect(res.body.password).toBeUndefined();
        expect(hashSpy).toHaveBeenCalledTimes(1);
    });

    test("DELETE /api/users/:username removes user (delete route)", async () => {
        await createUser(request(app), { username: "u1", password: "pass1234" });

        const agent = request.agent(app);
        await login(agent, "u1", "pass1234");

        const del = await agent.delete("/api/users/u1");
        expect(del.status).toBe(204);

        const list = await agent.get("/api/users");
        expect(list.status).toBe(200);
        expect(list.body).toEqual([]);
    });
});

// Covers GET /api/users/stats edge cases (adminPercent=0 when no users, gender blank mapping, ageStats null/median calc)
// routes/users.js :contentReference[oaicite:3]{index=3}

describe("GET /api/users/stats coverage", () => {
    const { request, initTestApp, resetDb, closeDb, createUser, login } = require("./test-utils/testUtils");
    const { AppDataSource } = require("../helpers/db");
    const { UserEntity } = require("../user");

    let app;

    beforeAll(async () => {
        ({ app } = await initTestApp());
    });

    beforeEach(async () => {
        await resetDb();
    });

    afterAll(async () => {
        await closeDb();
    });

    test("stats with zero users", async () => {
        // need login to access stats; create 1 user then delete it via repo (so still have a session user if needed)
        await createUser(request(app), { username: "u1", password: "pass1234" });
        const agent = request.agent(app);
        await login(agent, "u1", "pass1234");

        // wipe table so totalUsers=0
        const repo = AppDataSource.getRepository(UserEntity);
        await repo.clear();

        const res = await agent.get("/api/users/stats");
        expect(res.status).toBe(200);
        expect(res.body.totalUsers).toBe(0);
        expect(res.body.adminCount).toBe(0);
        expect(res.body.adminPercent).toBe(0);
        expect(res.body.recentSignups).toBe(0);
        expect(res.body.genderBreakdown).toEqual({});
        expect(res.body.ageStats).toBeNull();
    });

    test("stats computes genderBreakdown, recentSignups, and ageStats (median even/odd)", async () => {
        await createUser(request(app), { username: "admin", password: "pass1234" });

        const agent = request.agent(app);
        await login(agent, "admin", "pass1234");

        const repo = AppDataSource.getRepository(UserEntity);

        const now = Date.now();
        const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
        const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();

        // Seed directly to control fields createdAt/age/gender/isAdmin
        await repo.clear();
        await repo.save([
            { username: "a", password: "x", createdAt: twoDaysAgo, updatedAt: twoDaysAgo, gender: "", age: 10, isAdmin: true, profilePhoto: null },
            { username: "b", password: "x", createdAt: twoDaysAgo, updatedAt: twoDaysAgo, gender: "MALE", age: 20, isAdmin: false, profilePhoto: null },
            { username: "c", password: "x", createdAt: eightDaysAgo, updatedAt: eightDaysAgo, gender: null, age: 30, isAdmin: false, profilePhoto: null },
            { username: "d", password: "x", createdAt: twoDaysAgo, updatedAt: twoDaysAgo, gender: "female", age: "nope", isAdmin: false, profilePhoto: null },
        ]);

        const res = await agent.get("/api/users/stats");
        expect(res.status).toBe(200);

        expect(res.body.totalUsers).toBe(4);
        expect(res.body.adminCount).toBe(1);
        expect(res.body.adminPercent).toBe(25); // 1/4

        // recentSignups counts those within 7 days: a,b,d = 3
        expect(res.body.recentSignups).toBe(3);

        // genderBreakdown: "" -> blank, null -> blank, "MALE" -> "male", "female" -> "female"
        expect(res.body.genderBreakdown.blank).toBe(2);
        expect(res.body.genderBreakdown.male).toBe(1);
        expect(res.body.genderBreakdown.female).toBe(1);

        // ages: only numeric => [10,20,30], avg=20, min=10, max=30, median=20
        expect(res.body.ageStats).toEqual({ avg: 20, min: 10, max: 30, median: 20 });
    });
});
