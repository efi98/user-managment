const { readUsers } = require('../helpers/db');

/**
 * Load a user by :username param and attach:
 * - req.users       (all users array)
 * - req.userIndex   (index in array)
 * - req.targetUser  (the matched user object)
 *
 * Assumes requireLogin already ran.
 */
async function loadUserByUsername(req, res, next) {
    try {
        const { username } = req.params;

        const users = await readUsers();
        const userIndex = users.findIndex((u) => u.username === username);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        req.users = users;
        req.userIndex = userIndex;
        req.targetUser = users[userIndex];

        return next();
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

/**
 * Allow updating regular profile fields
 * Only the user himself or an admin may proceed.
 *
 * Assumes:
 * - requireLogin already ran
 * - loadUserByUsername already ran
 */
function requireSelfOrAdmin(req, res, next) {
    const sessionUser = req.session?.user;
    const targetUsername = req.targetUser.username;

    if (sessionUser.username !== targetUsername && !sessionUser.isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    return next();
}

/**
 * Allow changing isAdmin only if:
 * - requester is admin
 * - requester is NOT modifying himself
 *
 * If isAdmin is not present in the request body,
 * this middleware does nothing.
 *
 * Assumes:
 * - requireLogin already ran
 * - loadUserByUsername already ran
 */
function requireAdminToChangeIsAdmin(req, res, next) {
    if (req.body.isAdmin === undefined) {
        return next();
    }

    const sessionUser = req.session.user;
    const targetUsername = req.targetUser.username;

    if (!sessionUser.isAdmin) {
        return res.status(403).json({ error: 'Only admins can change isAdmin' });
    }

    if (sessionUser.username === targetUsername) {
        return res.status(403).json({
            error: 'Admins cannot change their own isAdmin'
        });
    }

    return next();
}

module.exports = {
    loadUserByUsername,
    requireSelfOrAdmin,
    requireAdminToChangeIsAdmin
};