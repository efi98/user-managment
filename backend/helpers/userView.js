const DEFAULT_AVATAR = '/uploads/avatars/default.jpg';

function toSafeUser(user) {
    if (!user) return null;

    const {
        password,
        ...safeUser
    } = user;

    return {
        ...safeUser,
        profilePhoto: safeUser.profilePhoto || DEFAULT_AVATAR
    };
}

function toSafeUsers(users) {
    return users.map(toSafeUser);
}

module.exports = {
    toSafeUser,
    toSafeUsers
};
