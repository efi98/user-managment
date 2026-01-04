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

test("non-admin cannot change isAdmin", async () => {
    const agent = request.agent(app);

    await createUser(request(app), { username: "u1", password: "pass1234" });
    await createUser(request(app), { username: "u2", password: "pass1234" });

    await login(agent, "u1", "pass1234");

    const res = await agent.patch("/api/users/u2").send({ isAdmin: true });
    expect(res.status).toBe(403);
});

test("admin cannot change own isAdmin (self-demotion protection)", async () => {
    const adminAgent = request.agent(app);

    await createUser(request(app), { username: "admin", password: "pass1234" });
    await login(adminAgent, "admin", "pass1234");

    // promote in DB
    const { AppDataSource } = require("../helpers/db");
    const { UserEntity } = require("../user");
    const repo = AppDataSource.getRepository(UserEntity);
    const adminUser = await repo.findOneBy({ username: "admin" });
    adminUser.isAdmin = true;
    await repo.save(adminUser);

    // ensure session has isAdmin=true
    await login(adminAgent, "admin", "pass1234");

    const res = await adminAgent.patch("/api/users/admin").send({ isAdmin: false });
    expect(res.status).toBe(403);
});

test("non-admin cannot patch other user's profile fields", async () => {
    const agent = request.agent(app);

    await createUser(request(app), { username: "u1", password: "pass1234" });
    await createUser(request(app), { username: "u2", password: "pass1234" });

    await login(agent, "u1", "pass1234");

    const res = await agent.patch("/api/users/u2").send({ displayName: "hacked" });
    expect(res.status).toBe(403);
});

describe("middleware/users (unit)", () => {
    const makeRes = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    test("loadUserByUsername -> 404 when user not found", async () => {
        jest.resetModules();
        jest.doMock("../helpers/db", () => ({
            readUsers: jest.fn().mockResolvedValue([{ username: "a" }]),
        }));

        const { loadUserByUsername } = require("../middleware/users"); // middleware/users.js :contentReference[oaicite:2]{index=2}

        const req = { params: { username: "missing" } };
        const res = makeRes();
        const next = jest.fn();

        await loadUserByUsername(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
        expect(next).not.toHaveBeenCalled();
    });

    test("loadUserByUsername -> attaches req.users/userIndex/targetUser and calls next", async () => {
        jest.resetModules();
        jest.doMock("../helpers/db", () => ({
            readUsers: jest.fn().mockResolvedValue([
                { username: "a" },
                { username: "b" },
            ]),
        }));

        const { loadUserByUsername } = require("../middleware/users"); // :contentReference[oaicite:3]{index=3}

        const req = { params: { username: "b" } };
        const res = makeRes();
        const next = jest.fn();

        await loadUserByUsername(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(req.users).toHaveLength(2);
        expect(req.userIndex).toBe(1);
        expect(req.targetUser).toEqual({ username: "b" });
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("loadUserByUsername -> 500 on readUsers error (catch branch)", async () => {
        jest.resetModules();
        jest.doMock("../helpers/db", () => ({
            readUsers: jest.fn().mockRejectedValue(new Error("db down")),
        }));

        const { loadUserByUsername } = require("../middleware/users"); // :contentReference[oaicite:4]{index=4}

        const req = { params: { username: "a" } };
        const res = makeRes();
        const next = jest.fn();

        await loadUserByUsername(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "db down" });
        expect(next).not.toHaveBeenCalled();
    });

    test("requireSelfOrAdmin -> 403 when not self and not admin", () => {
        const { requireSelfOrAdmin } = require("../middleware/users"); // :contentReference[oaicite:5]{index=5}

        const req = {
            session: { user: { username: "u1", isAdmin: false } },
            targetUser: { username: "u2" },
        };
        const res = makeRes();
        const next = jest.fn();

        requireSelfOrAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Forbidden" });
        expect(next).not.toHaveBeenCalled();
    });

    test("requireSelfOrAdmin -> allows self", () => {
        const { requireSelfOrAdmin } = require("../middleware/users"); // :contentReference[oaicite:6]{index=6}

        const req = {
            session: { user: { username: "u1", isAdmin: false } },
            targetUser: { username: "u1" },
        };
        const res = makeRes();
        const next = jest.fn();

        requireSelfOrAdmin(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("requireSelfOrAdmin -> allows admin", () => {
        const { requireSelfOrAdmin } = require("../middleware/users"); // :contentReference[oaicite:7]{index=7}

        const req = {
            session: { user: { username: "admin", isAdmin: true } },
            targetUser: { username: "u2" },
        };
        const res = makeRes();
        const next = jest.fn();

        requireSelfOrAdmin(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("requireAdminToChangeIsAdmin -> calls next when req.body.isAdmin is undefined (uncovered next() branch)", () => {
        const { requireAdminToChangeIsAdmin } = require("../middleware/users"); // :contentReference[oaicite:8]{index=8}

        const req = {
            body: {}, // isAdmin undefined
            session: { user: { username: "admin", isAdmin: true } },
            targetUser: { username: "u2" },
        };
        const res = makeRes();
        const next = jest.fn();

        requireAdminToChangeIsAdmin(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });

    test("requireAdminToChangeIsAdmin -> 403 when requester not admin", () => {
        const { requireAdminToChangeIsAdmin } = require("../middleware/users"); // :contentReference[oaicite:9]{index=9}

        const req = {
            body: { isAdmin: true },
            session: { user: { username: "u1", isAdmin: false } },
            targetUser: { username: "u2" },
        };
        const res = makeRes();
        const next = jest.fn();

        requireAdminToChangeIsAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Only admins can change isAdmin" });
        expect(next).not.toHaveBeenCalled();
    });

    test("requireAdminToChangeIsAdmin -> 403 when admin tries to change own isAdmin", () => {
        const { requireAdminToChangeIsAdmin } = require("../middleware/users"); // :contentReference[oaicite:10]{index=10}

        const req = {
            body: { isAdmin: false },
            session: { user: { username: "admin", isAdmin: true } },
            targetUser: { username: "admin" },
        };
        const res = makeRes();
        const next = jest.fn();

        requireAdminToChangeIsAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Admins cannot change their own isAdmin" });
        expect(next).not.toHaveBeenCalled();
    });

    test("requireAdminToChangeIsAdmin -> allows admin changing someone else", () => {
        const { requireAdminToChangeIsAdmin } = require("../middleware/users"); // :contentReference[oaicite:11]{index=11}

        const req = {
            body: { isAdmin: true },
            session: { user: { username: "admin", isAdmin: true } },
            targetUser: { username: "u2" },
        };
        const res = makeRes();
        const next = jest.fn();

        requireAdminToChangeIsAdmin(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });
});
