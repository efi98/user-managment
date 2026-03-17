import {SafeUser} from '@src/users';
import {DEFAULT_AVATAR} from "@consts";

    /**
     * Convert an internal user object to a SafeUser view object that can be
     * sent to clients. The returned object omits sensitive fields like
     * `password` and normalizes optional fields to null where appropriate.
     *
     * @param user - The source user object (entity or plain object).
     * @returns A `SafeUser` view object or `null` when input is falsy.
     */
export function toSafeUser(user: any): SafeUser | null {
    if (!user) return null;

    const {password, ...safeUser} = user;

    return {
        username: safeUser.username,
        displayName: safeUser.displayName || null,
        birthdate: safeUser.birthdate ?? null,
        avatar: safeUser.avatar || DEFAULT_AVATAR,
        gender: safeUser.gender ?? null,
        isAdmin: !!safeUser.isAdmin,
        createdAt: safeUser.createdAt,
        updatedAt: safeUser.updatedAt,
    } as SafeUser;
}

    /**
     * Map an array of user objects to an array of `SafeUser` view objects.
     *
     * @param users - Array of user entities or plain objects.
     * @returns Array of `SafeUser` objects (entries may be `null` if input
     *   entries were falsy).
     */
export function toSafeUsers(users: any[]): SafeUser[] {
    return users.map((u) => toSafeUser(u));
}

    /**
     * Calculate age (years) from a birthdate string or Date. Accepts
     * 'YYYY-MM-DD' strings or Date instances. Returns `null` for invalid or
     * future birthdates.
     *
     * @param birthdate - Birthdate as ISO 'YYYY-MM-DD' string or Date or null.
     * @param now - Optional reference date (used for tests); defaults today.
     * @returns Age in years or null when birthdate is invalid or in the future.
     */
export function ageFromBirthdate(birthdate: string | Date | null, now = new Date()): number | null {
    if (!birthdate) return null;

    let by: number;
    let bm: number;
    let bd: number;

    if (birthdate instanceof Date) {
        if (Number.isNaN(birthdate.getTime())) return null;

        by = birthdate.getFullYear();
        bm = birthdate.getMonth() + 1;
        bd = birthdate.getDate();
    } else if (typeof birthdate === 'string') {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthdate);
        if (!m) return null;

        by = Number(m[1]);
        bm = Number(m[2]);
        bd = Number(m[3]);
    } else {
        return null;
    }

    const ny = now.getFullYear();
    const nm = now.getMonth() + 1;
    const nd = now.getDate();

    let age = ny - by;
    if (nm < bm || (nm === bm && nd < bd)) age -= 1;

    return age >= 0 ? age : null;
}
