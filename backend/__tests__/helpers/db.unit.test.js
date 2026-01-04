jest.mock("../../helpers/db-orm", () => ({
    AppDataSource: {
        getRepository: jest.fn(),
    },
}));

jest.mock("../../user", () => ({
    UserEntity: function UserEntity() {},
}));

const { AppDataSource } = require("../../helpers/db-orm");
const { readUsers, writeUsers } = require("../../helpers/db");

describe("helpers/db", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("readUsers returns [] when repo.find() returns non-array", async () => {
        const repo = { find: jest.fn().mockResolvedValue(null) };
        AppDataSource.getRepository.mockReturnValue(repo);

        await expect(readUsers()).resolves.toEqual([]);
        expect(repo.find).toHaveBeenCalledTimes(1);
    });

    test("readUsers returns the array from repo.find()", async () => {
        const repo = { find: jest.fn().mockResolvedValue([{ username: "u1" }]) };
        AppDataSource.getRepository.mockReturnValue(repo);

        await expect(readUsers()).resolves.toEqual([{ username: "u1" }]);
    });

    test("writeUsers clears then saves only whitelisted fields", async () => {
        const repo = {
            clear: jest.fn().mockResolvedValue(),
            save: jest.fn().mockResolvedValue(),
        };
        AppDataSource.getRepository.mockReturnValue(repo);

        const users = [
            {
                username: "u1",
                password: "p",
                displayName: "U1",
                age: 10,
                gender: "x",
                isAdmin: true,
                profilePhoto: "/x.jpg",
                createdAt: "c",
                updatedAt: "u",
                extra: "SHOULD_NOT_PASS",
            },
        ];

        await writeUsers(users);

        expect(repo.clear).toHaveBeenCalledTimes(1);
        expect(repo.save).toHaveBeenCalledTimes(1);

        const saved = repo.save.mock.calls[0][0];
        expect(saved).toEqual([
            {
                username: "u1",
                password: "p",
                displayName: "U1",
                age: 10,
                gender: "x",
                isAdmin: true,
                profilePhoto: "/x.jpg",
                createdAt: "c",
                updatedAt: "u",
            },
        ]);
    });
});
