const { request, initTestApp, resetDb, createUser, login } = require("./test-utils/testUtils");

let app;

beforeAll(async () => {
    ({ app } = await initTestApp());
});

beforeEach(async () => {
    await resetDb();
});

test("GET /api/me returns 401 when not logged in", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
});

test("POST /api/login returns 404 for non-existing user", async () => {
    const res = await request(app).post("/api/login").send({ username: "nope", password: "pass1234" });
    expect(res.status).toBe(404);
});

test("POST /api/login returns 401 for wrong password", async () => {
    await createUser(request(app), { username: "u1", password: "pass1234" });

    const res = await request(app).post("/api/login").send({ username: "u1", password: "wrong" });
    expect(res.status).toBe(401);
});

test("login -> me -> logout -> me", async () => {
    await createUser(request(app), { username: "u1", password: "pass1234" });

    const agent = request.agent(app);

    const loginRes = await login(agent, "u1", "pass1234");
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.username).toBe("u1");
    expect(loginRes.body.password).toBeUndefined();

    const meRes = await agent.get("/api/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.username).toBe("u1");
    expect(meRes.body.password).toBeUndefined();

    const logoutRes = await agent.post("/api/logout");
    expect(logoutRes.status).toBe(204);

    const meAfter = await agent.get("/api/me");
    expect(meAfter.status).toBe(401);
});
