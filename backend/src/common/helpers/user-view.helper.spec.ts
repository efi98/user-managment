import { ageFromBirthdate, toSafeUser, toSafeUsers } from '@src/common';

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

    it('toSafeUsers maps array', () => {
        const out = toSafeUsers([{ username: 'a', password: 'x', createdAt: 'c', updatedAt: 'u' } as any]);
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