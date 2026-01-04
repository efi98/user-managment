const path = require("node:path");

jest.mock("node:fs", () => ({
    unlink: jest.fn((_, cb) => cb(null)),
}));

const fs = require("node:fs");
const { deleteAvatarIfExists } = require("../../helpers/avatarFiles");

describe("helpers/avatarFiles.deleteAvatarIfExists", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns early when profilePhoto is falsy", async () => {
        await deleteAvatarIfExists("", "/avatars");
        await deleteAvatarIfExists(null, "/avatars");
        await deleteAvatarIfExists(undefined, "/avatars");
        expect(fs.unlink).not.toHaveBeenCalled();
    });

    test("returns early when filename is default.png", async () => {
        await deleteAvatarIfExists("/uploads/avatars/default.png", "/avatars");
        expect(fs.unlink).not.toHaveBeenCalled();
    });

    test("calls unlink for non-default filename and joins avatarsDir + basename", async () => {
        await deleteAvatarIfExists("/uploads/avatars/u1.png", "/avatars");
        expect(fs.unlink).toHaveBeenCalledTimes(1);

        const calledPath = fs.unlink.mock.calls[0][0];
        expect(calledPath).toBe(path.join("/avatars", "u1.png"));
    });

    test("ignores ENOENT unlink error", async () => {
        fs.unlink.mockImplementationOnce((_, cb) =>
            cb(Object.assign(new Error("missing"), { code: "ENOENT" }))
        );

        await expect(
            deleteAvatarIfExists("/uploads/avatars/missing.png", "/avatars")
        ).resolves.toBeUndefined();
    });

    test("rethrows unlink error when not ENOENT", async () => {
        fs.unlink.mockImplementationOnce((_, cb) =>
            cb(Object.assign(new Error("fail"), { code: "EACCES" }))
        );

        await expect(
            deleteAvatarIfExists("/uploads/avatars/x.png", "/avatars")
        ).rejects.toThrow("fail");
    });
});
