import { CONSTS, toSafeUser, toSafeUsers } from '@src/common';

describe('UserView Helper', () => {
    describe('toSafeUser', () => {
        it('should remove password from user object', () => {
            const user = {
                username: 'testuser',
                password: 'secret123',
                displayName: 'Test User',
                birthdate: '1998-01-01',
            };

            const safeUser = toSafeUser(user);

            expect(safeUser['password']).toBeUndefined();
            expect(safeUser.username).toBe('testuser');
            expect(safeUser.displayName).toBe('Test User');
        });

        it('should add default avatar if profilePhoto is missing', () => {
            const user = {
                username: 'testuser',
                password: 'secret123',
            };

            const safeUser = toSafeUser(user);

            expect(safeUser.profilePhoto).toBe(`/uploads/avatars/${CONSTS.DEFAULT_AVATAR_FILENAME}`);
        });

        it('should keep existing profilePhoto', () => {
            const user = {
                username: 'testuser',
                password: 'secret123',
                profilePhoto: '/uploads/avatars/custom.jpg',
            };

            const safeUser = toSafeUser(user);

            expect(safeUser.profilePhoto).toBe('/uploads/avatars/custom.jpg');
        });

        it('should return null for null input', () => {
            expect(toSafeUser(null)).toBeNull();
        });
    });

    describe('toSafeUsers', () => {
        it('should convert array of users to safe users', () => {
            const users = [
                {username: 'user1', password: 'pass1'},
                {username: 'user2', password: 'pass2'},
            ];

            const safeUsers = toSafeUsers(users);

            expect(safeUsers).toHaveLength(2);
            expect(safeUsers[0]["password"]).toBeUndefined();
            expect(safeUsers[1]["password"]).toBeUndefined();
            expect(safeUsers[0].profilePhoto).toBe(`/uploads/avatars/${CONSTS.DEFAULT_AVATAR_FILENAME}`);
        });
    });
});
