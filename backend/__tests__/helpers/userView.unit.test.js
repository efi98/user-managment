const { toSafeUser, toSafeUsers } = require("../../helpers/userView");

describe("helpers/userView", () => {
    test("toSafeUser returns null for falsy user", () => {
        expect(toSafeUser(null)).toBeNull();
        expect(toSafeUser(undefined)).toBeNull();
    });

    test("toSafeUser strips password and defaults profilePhoto", () => {
        const input = {
            username: "u1",
            password: "secret",
            displayName: "User 1",
            profilePhoto: "",
        };

        const safe = toSafeUser(input);
        expect(safe.password).toBeUndefined();
        expect(safe.username).toBe("u1");
        expect(safe.profilePhoto).toBe("/uploads/avatars/default.jpg");
    });

    test("toSafeUser preserves profilePhoto if set", () => {
        const input = {
            username: "u1",
            password: "secret",
            profilePhoto: "/uploads/avatars/u1.jpg",
        };

        const safe = toSafeUser(input);
        expect(safe.password).toBeUndefined();
        expect(safe.profilePhoto).toBe("/uploads/avatars/u1.jpg");
    });

    test("toSafeUsers maps via toSafeUser (including null elements)", () => {
        const users = [
            { username: "a", password: "p" },
            null,
            { username: "b", password: "p", profilePhoto: "/x.jpg" },
        ];

        const result = toSafeUsers(users);
        expect(result).toHaveLength(3);
        expect(result[0].password).toBeUndefined();
        expect(result[0].profilePhoto).toBe("/uploads/avatars/default.jpg");
        expect(result[1]).toBeNull();
        expect(result[2].profilePhoto).toBe("/x.jpg");
    });
});
