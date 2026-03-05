import {SafeUser} from '@src/users';
import {DEFAULT_AVATAR} from "@consts";

export function toSafeUser(user: any): SafeUser | null {
    if (!user) return null;

    const {password, ...safeUser} = user;

    return {
        username: safeUser.username,
        displayName: safeUser.displayName || safeUser.username,
        birthdate: safeUser.birthdate ?? null,
        profilePhoto: safeUser.profilePhoto || DEFAULT_AVATAR,
        gender: safeUser.gender ?? null,
        isAdmin: !!safeUser.isAdmin,
        createdAt: safeUser.createdAt,
        updatedAt: safeUser.updatedAt,
    } as SafeUser;
}

export function toSafeUsers(users: any[]): SafeUser[] {
    return users.map((u) => toSafeUser(u));
}

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
