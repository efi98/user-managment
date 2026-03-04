import {ageFromBirthdate, toSafeUser, toSafeUsers} from '@src/common';
import {CONSTS} from '@consts';

describe('user-view.helper', () => {
    it('toSafeUser returns null for null input', () => {
        expect(toSafeUser(null as any)).toBeNull();
    });

    it('toSafeUser strips password and fills defaults', () => {
        const u: any = {
            username: 'alice',
            password: 'secret',
            isAdmin: 0,
            createdAt: 'c',
            updatedAt: 'u',
        };

        const s = toSafeUser(u)!;
        expect((s as any).password).toBeUndefined();
        expect(s.displayName).toBe('alice');
        expect(s.isAdmin).toBe(false);
        expect(s.profilePhoto).toContain('/uploads/avatars/');
    });

    it('toSafeUser adds default avatar when profilePhoto is missing', () => {
        const u: any = {
            username: 'alice',
            password: 'secret',
            profilePhoto: null,
            createdAt: 'c',
            updatedAt: 'u',
        };

        const s = toSafeUser(u)!;
        expect(s.profilePhoto).toBe(`/uploads/avatars/${CONSTS.DEFAULT_AVATAR_FILENAME}`);
    });

    it('toSafeUser keeps existing profilePhoto', () => {
        const u: any = {
            username: 'alice',
            password: 'secret',
            profilePhoto: '/uploads/avatars/custom.jpg',
            createdAt: 'c',
            updatedAt: 'u',
        };

        const s = toSafeUser(u)!;
        expect(s.profilePhoto).toBe('/uploads/avatars/custom.jpg');
    });

    it('toSafeUsers maps array', () => {
        const out = toSafeUsers([{username: 'a', password: 'x', createdAt: 'c', updatedAt: 'u'} as any]);
        expect(out).toHaveLength(1);
        expect(out[0].username).toBe('a');
    });

    it('ageFromBirthdate returns null for invalid formats', () => {
        expect(ageFromBirthdate('01-01-2000' as any)).toBeNull();
        expect(ageFromBirthdate(new Date('invalid'))).toBeNull();
    });

    it('ageFromBirthdate computes age with month day cutoff', () => {
        const now = new Date(2026, 1, 28);
        expect(ageFromBirthdate('2000-03-01', now)).toBe(25);
        expect(ageFromBirthdate('2000-02-27', now)).toBe(26);
    });
});