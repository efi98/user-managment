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

test("GET /me returns 401 when not logged in", async () => {
    const res = await request(app).get("/me");
    expect(res.status).toBe(401);
});

test("POST /login returns 404 for non-existing user", async () => {
    const res = await request(app)
        .post("/login")
        .send({ username: "nope", password: "pass1234" });
    expect(res.status).toBe(404);
});

test("POST /login returns 401 for wrong password", async () => {
    await createUser(request(app), { username: "u1", password: "pass1234" });

    const res = await request(app)
        .post("/login")
        .send({ username: "u1", password: "wrong" });
    expect(res.status).toBe(401);
});

test("login -> me -> logout -> me", async () => {
    await createUser(request(app), { username: "u1", password: "pass1234" });

    const agent = request.agent(app);

    const loginRes = await login(agent, "u1", "pass1234");
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.username).toBe("u1");
    expect(loginRes.body.password).toBeUndefined();

    const meRes = await agent.get("/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.username).toBe("u1");
    expect(meRes.body.password).toBeUndefined();

    const logoutRes = await agent.post("/logout");
    expect(logoutRes.status).toBe(204);

    const meAfter = await agent.get("/me");
    expect(meAfter.status).toBe(401);
});

describe("middleware/auth.requireLogin (unit)", () => {
    test("returns 401 when req.session.user missing", () => {
        const { requireLogin } = require("../middleware/auth"); // middleware/auth.js :contentReference[oaicite:0]{index=0}

        const req = { session: {} };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const next = jest.fn();

        requireLogin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Not logged in" });
        expect(next).not.toHaveBeenCalled();
    });

    test("calls next when logged in", () => {
        const { requireLogin } = require("../middleware/auth"); // :contentReference[oaicite:1]{index=1}

        const req = { session: { user: { username: "u1" } } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        const next = jest.fn();

        requireLogin(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });
});
