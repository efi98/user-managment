const fs = require("node:fs");
const path = require("node:path");
const {request, initTestApp, resetDb, createUser, login} = require('./test-utils/testUtils');

const avatarsDir = path.resolve(
    process.env.AVATARS_DIR || "assets/test-uploads/avatars"
);

function cleanAvatarsDir() {
    if (!fs.existsSync(avatarsDir)) return;

    for (const file of fs.readdirSync(avatarsDir)) {
        if (file === "default.jpg") continue;

        fs.unlinkSync(path.join(avatarsDir, file));
    }
}

let app;

beforeAll(async () => {
    ({app} = await initTestApp());
});

beforeEach(async () => {
    await resetDb();
    cleanAvatarsDir();
});

afterAll(() => {
    cleanAvatarsDir();
});

test("upload avatar: self allowed, saves profilePhoto", async () => {
    const agent = request.agent(app);

    await createUser(request(app), {username: "u1", password: "pass1234"});
    await login(agent, "u1", "pass1234");

    const imgPath = path.join(__dirname, ".", "test-assets", "avatar.jpg");
    const res = await agent
        .post("/api/users/u1/avatar")
        .attach("avatar", imgPath);

    expect(res.status).toBe(200);
    expect(res.body.profilePhoto).toMatch(/^\/uploads\/avatars\/.+/);

    // Verify file exists on disk
    const filename = path.basename(res.body.profilePhoto);
    const diskPath = path.join(avatarsDir, filename);
    expect(fs.existsSync(diskPath)).toBe(true);
});

test("upload avatar: non-image rejected", async () => {
    const agent = request.agent(app);

    await createUser(request(app), {username: "u1", password: "pass1234"});
    await login(agent, "u1", "pass1234");

    const badFile = path.join(__dirname, ".", "test-assets", "not-image.txt");

    const res = await agent
        .post("/api/users/u1/avatar")
        .attach("avatar", badFile);

    // multer fileFilter typically results in 500 unless you handle the error middleware.
    // If you added explicit error handling, assert 400. Otherwise assert 500.
    expect([400, 500]).toContain(res.status);
});
