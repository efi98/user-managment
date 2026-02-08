import { SafeUser } from '@src/users';
import { CONSTS } from "@consts";

const DEFAULT_AVATAR = `/uploads/avatars/${CONSTS.DEFAULT_AVATAR_FILENAME}`;

export function toSafeUser(user: any): SafeUser | null {
  if (!user) return null;

  const { password, ...safeUser } = user;

  return {
    username: safeUser.username,
    displayName: safeUser.displayName ?? safeUser.username,
    age: typeof safeUser.age === 'number' ? safeUser.age : null,
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
