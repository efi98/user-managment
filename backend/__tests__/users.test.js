const {
    request,
    initTestApp,
    resetDb,
    closeDb,
    createUser,
    login,
} = require("./test-utils/testUtils");
const {AppDataSource} = require("../helpers/db");
const {UserEntity} = require("../user");

let app;

beforeAll(async () => {
    ({app} = await initTestApp());
});

beforeEach(async () => {
    await resetDb();
});

afterAll(async () => {
    await closeDb();
});

test("GET /users returns 401 when not logged in", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(401);
});

test("GET /users returns safe users (no password) when logged in", async () => {
    await createUser(request(app), {username: "u1", password: "pass1234"});

    const agent = request.agent(app);
    await login(agent, "u1", "pass1234");

    const res = await agent.get("/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].password).toBeUndefined();
    expect(res.body[0].profilePhoto).toMatch(/^\/uploads\/avatars\//);
});

// New tests: verify per-user route auth behavior
test("GET /users/:username returns 401 when user not logged in", async () => {
    // create the user first
    await createUser(request(app), {username: "u1", password: "pass1234"});

    // unauthenticated request should be forbidden
    const res = await request(app).get("/users/u1");
    expect(res.status).toBe(401);
});

test("GET /users/:username returns 200 when all is good", async () => {
    await createUser(request(app), {username: "u1", password: "pass1234"});

    const agent = request.agent(app);
    await login(agent, "u1", "pass1234");

    const res = await agent.get("/users/u1");
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("u1");
    expect(res.body.password).toBeUndefined();
    expect(res.body.profilePhoto).toMatch(/^\/uploads\/avatars\//);
});

test("GET /users/:username returns 404 when user not found", async () => {
    await createUser(request(app), {username: "u1", password: "pass1234"});

    const agent = request.agent(app);
    await login(agent, "u1", "pass1234");

    const res = await agent.get("/users/nope");
    expect(res.status).toBe(404);
});

test("POST /users returns 409 and suggestions when username exists", async () => {
    await createUser(request(app), {username: "u1", password: "pass1234"});

    const res = await request(app)
        .post("/users")
        .send({username: "u1", password: "pass1234"});
    expect(res.status).toBe(409);
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBe(3);
});

test("PATCH /users/:username rejects forbidden fields", async () => {
    await createUser(request(app), {username: "u1", password: "pass1234"});

    const agent = request.agent(app);
    await login(agent, "u1", "pass1234");

    const res = await agent.patch("/users/u1").send({unknownField: 123});
    expect(res.status).toBe(400);
});

// New PATCH authorization / edge-case tests
describe("PATCH /users/:username authorization and edge cases", () => {
    const {request, initTestApp, resetDb, closeDb, createUser, login} = require("./test-utils/testUtils");

    let app;

    beforeAll(async () => {
        ({app} = await initTestApp());
    });

    beforeEach(async () => {
        await resetDb();
    });

    afterAll(async () => {
        await closeDb();
    });

    test("PATCH /users/:username logged in as admin can edit another user (200)", async () => {
        // create admin and target
        await createUser(request(app), {username: "admin", password: "pass1234"});
        await createUser(request(app), {username: "target", password: "pass1234"});
        // set admin flag directly in DB before login
        const repo = AppDataSource.getRepository(UserEntity);
        await repo.update({username: "admin"}, {isAdmin: true});
        const agent = request.agent(app);
        await login(agent, "admin", "pass1234");
        const res = await agent.patch("/users/target").send({displayName: "New Name"});
        expect(res.status).toBe(200);
        expect(res.body.displayName).toBe("New Name");
    });

    test("POST /users returns 400 for forbidden extra fields", async () => {
        const res = await request(app)
            .post("/users")
            .send({username: "u1", password: "pass1234", bad: 1});

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Forbidden fields:/);
        expect(res.body.error).toMatch(/'bad'/);
    });

    test("POST /users returns 400 when required fields are missing (username)", async () => {
        const res = await request(app)
            .post('/users')
            .send({password: 'pass1234'});

        expect(res.status).toBe(400);
        // router catches validation errors and returns the message
        expect(res.body.error).toMatch(/Username is required/);
    });

    test("POST /users returns 400 when required fields are missing (password)", async () => {
        const res = await request(app)
            .post('/users')
            .send({username: 'newuser'});

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Password is required/);
    });

    test("PATCH /users/:username Not logged in returns 401", async () => {
        const res = await request(app).patch("/users/u1").send({displayName: "X"});
        expect(res.status).toBe(401);
    });
    test("POST /users returns 201 and safe body when payload is valid", async () => {
        const payload = {username: 'newuser', password: 'pass1234', displayName: 'New User', age: 25, gender: 'male'};
        const res = await request(app)
            .post('/users')
            .send(payload);

        expect(res.status).toBe(201);
        expect(res.body.username).toBe('newuser');
        expect(res.body.password).toBeUndefined();
        // profilePhoto should be present (default or provided) and start with uploads path
        expect(res.body.profilePhoto).toMatch(/^\/uploads\/avatars\//);
    });

    test("PATCH /users/:username Editing someone else while not admin -> 403", async () => {
        await createUser(request(app), {username: "a", password: "pass1234"});
        await createUser(request(app), {username: "b", password: "pass1234"});
        const agent = request.agent(app);
        await login(agent, "a", "pass1234");
        const res = await agent.patch("/users/b").send({displayName: "hacked"});
        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Forbidden");
    });

    test("POST /users 409 suggestions loop: handles collisions until unique", async () => {
        // create existing usernames so first suggestion collides, second collides, third ok
        await createUser(request(app), {username: "u1", password: "pass1234"});
        await createUser(request(app), {username: "taken0", password: "pass1234"});
        await createUser(request(app), {username: "taken1", password: "pass1234"});

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
            .post("/users")
            .send({username: "taken", password: "pass1234"});

        // Assertions for the suggestions behavior
        expect(res.status).toBe(409);
        expect(res.body.error).toBe("Username already exists");
        expect(Array.isArray(res.body.suggestions)).toBe(true);
        expect(res.body.suggestions.length).toBe(3);
    });

    test("PATCH /users/:username Non-admin trying to change isAdmin -> 403", async () => {
        // create a non-admin user and login
        await createUser(request(app), {username: "u1", password: "pass1234"});
        const agent = request.agent(app);
        await login(agent, "u1", "pass1234");

        const res = await agent.patch("/users/u1").send({isAdmin: true});
        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Only admins can change isAdmin");
    });

    test("PATCH /users/:username admin trying to change his own isAdmin -> 403", async () => {
        // create admin user and mark as admin in DB
        await createUser(request(app), {username: "admin", password: "pass1234"});
        const repo = AppDataSource.getRepository(UserEntity);
        await repo.update({username: "admin"}, {isAdmin: true});

        const agent = request.agent(app);
        await login(agent, "admin", "pass1234");

        // admin attempts to change their own isAdmin flag
        const res = await agent.patch("/users/admin").send({isAdmin: false});
        expect(res.status).toBe(403);
        expect(res.body.error).toBe("Admins cannot change their own isAdmin");
    });

    test("PATCH /users/:username hashes when password provided (password branch)", async () => {
        await createUser(request(app), {username: "u1", password: "pass1234"});

        const agent = request.agent(app);
        await login(agent, "u1", "pass1234");

        const bcrypt = require("bcrypt");
        const hashSpy = jest.spyOn(bcrypt, "hashSync");

        const res = await agent
            .patch("/users/u1")
            .send({password: "newpass123"});

        expect(res.status).toBe(200);
        expect(res.body.password).toBeUndefined();
        expect(hashSpy).toHaveBeenCalledTimes(1);
    });

    test("PATCH /users/:username Target user missing -> 404", async () => {
        // create and login as someone so requireLogin passes
        const res = await agent.patch("/users/nope").send({displayName: "x"});
        expect(res.status).toBe(404);
        expect(res.body.error).toBe("User not found");
    });

    test("DELETE /users/:username removes user (delete route)", async () => {
        await createUser(request(app), {username: "u1", password: "pass1234"});
        // unauthenticated delete should be forbidden
        const unauthDel = await request(app).delete("/users/u1");
        expect(unauthDel.status).toBe(401);
        const agent = request.agent(app);
        await login(agent, "u1", "pass1234");

        const del = await agent.delete("/users/u1");
        expect(del.status).toBe(204);

        const list = await agent.get("/users");
        expect(list.status).toBe(200);
        expect(list.body).toEqual([]);
    });
});

describe("GET /users/stats coverage", () => {
    const {request, initTestApp, resetDb, closeDb, createUser, login} = require("./test-utils/testUtils");
    const {AppDataSource} = require("../helpers/db");
    const {UserEntity} = require("../user");

    let app;

    beforeAll(async () => {
        ({app} = await initTestApp());
    });

    beforeEach(async () => {
        await resetDb();
    });

    afterAll(async () => {
        await closeDb();
    });

    test("stats with zero users", async () => {
        // need login to access stats; create 1 user then delete it via repo (so still have a session user if needed)
        await createUser(request(app), {username: "u1", password: "pass1234"});

        // Verify unauthenticated access is forbidden
        const unauth = await request(app).get("/users/stats");
        expect(unauth.status).toBe(401);

        const agent = request.agent(app);
        await login(agent, "u1", "pass1234");

        // wipe table so totalUsers=0
        const repo = AppDataSource.getRepository(UserEntity);
        await repo.clear();

        const res = await agent.get("/users/stats");
        expect(res.status).toBe(200);
        expect(res.body.totalUsers).toBe(0);
        expect(res.body.adminCount).toBe(0);
        expect(res.body.adminPercent).toBe(0);
        expect(res.body.recentSignups).toBe(0);
        expect(res.body.genderBreakdown).toEqual({});
        expect(res.body.ageStats).toBeNull();
    });

    test("stats computes genderBreakdown, recentSignups, and ageStats (median even/odd)", async () => {
        await createUser(request(app), {username: "admin", password: "pass1234"});

        // Verify unauthenticated access is forbidden
        const unauth = await request(app).get("/users/stats");
        expect(unauth.status).toBe(401);

        const agent = request.agent(app);
        await login(agent, "admin", "pass1234");

        const repo = AppDataSource.getRepository(UserEntity);

        const now = Date.now();
        const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
        const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();

        // Seed directly to control fields createdAt/age/gender/isAdmin
        await repo.clear();
        await repo.save([
            {
                username: "a",
                password: "x",
                createdAt: twoDaysAgo,
                updatedAt: twoDaysAgo,
                gender: "",
                age: 10,
                isAdmin: true,
                profilePhoto: null
            },
            {
                username: "b",
                password: "x",
                createdAt: twoDaysAgo,
                updatedAt: twoDaysAgo,
                gender: "MALE",
                age: 20,
                isAdmin: false,
                profilePhoto: null
            },
            {
                username: "c",
                password: "x",
                createdAt: eightDaysAgo,
                updatedAt: eightDaysAgo,
                gender: null,
                age: 30,
                isAdmin: false,
                profilePhoto: null
            },
            {
                username: "d",
                password: "x",
                createdAt: twoDaysAgo,
                updatedAt: twoDaysAgo,
                gender: "female",
                age: "nope",
                isAdmin: false,
                profilePhoto: null
            },
        ]);

        const res = await agent.get("/users/stats");
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
        expect(res.body.ageStats).toEqual({avg: 20, min: 10, max: 30, median: 20});
    });
});
