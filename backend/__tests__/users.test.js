const { request, initTestApp, resetDb, createUser, login } = require("./test-utils/testUtils");

let app;

beforeAll(async () => {
    ({ app } = await initTestApp());
});

beforeEach(async () => {
    await resetDb();
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

    const res = await request(app).post("/api/users").send({ username: "u1", password: "pass1234" });
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
