const express = require('express');
const bcrypt = require('bcrypt');
const {User, UpdateUser} = require('../user');
const {readUsers, writeUsers} = require('../helpers/db');
const {requireLogin} = require('../middleware/auth');
const {toSafeUser, toSafeUsers} = require('../helpers/userView');
const {uploadAvatar, avatarsDir, deleteAvatarIfExists} = require("../helpers/avatar");
const router = express.Router();

const SALT_ROUNDS = 10;

router.get('/', requireLogin, async (req, res) => {
    const users = await readUsers();
    res.json(toSafeUsers(users));
});

router.get('/stats', requireLogin, async (req, res) => {
    const users = await readUsers();
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.isAdmin).length;
    const adminPercent = totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0;
    const recentSignups = users.filter(u => {
        const created = new Date(u.createdAt);
        return (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const genderBreakdown = users.reduce((acc, u) => {
        let g = u.gender;
        if (g === undefined || g === null || g === "") {
            g = "blank";
        } else {
            g = g.toLowerCase();
        }
        acc[g] = (acc[g] || 0) + 1;
        return acc;
    }, {});
    // Age stats
    const ages = users.map(u => typeof u.age === 'number' ? u.age : null).filter(a => a !== null);
    let ageStats = null;
    if (ages.length > 0) {
        const sum = ages.reduce((a, b) => a + b, 0);
        const avg = Math.round((sum / ages.length) * 10) / 10;
        const min = Math.min(...ages);
        const max = Math.max(...ages);
        const sorted = [...ages].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0 ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10 : sorted[mid];
        ageStats = {avg, min, max, median};
    }
    res.json({
        totalUsers,
        adminCount,
        adminPercent,
        recentSignups,
        genderBreakdown,
        ageStats
    });
});

router.get('/:username', requireLogin, async (req, res) => {
    const users = await readUsers();
    const {params} = req;
    const user = users.find(u => u.username === params.username);
    if (!user) {
        return res.status(404).json({error: "User not found"});
    }
    res.json(toSafeUser(user));
});

router.post('/', async (req, res) => {
    try {
        const users = await readUsers();
        const {body} = req;
        const {username, password, displayName, age, gender, ...extraFields} = body;
        if (Object.keys(extraFields).length > 0) {
            return res.status(400).json({
                error: `Forbidden fields: ${Object.keys(extraFields).map(f => `'${f}'`).join(', ')}.`
            });
        }
        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            const suggestions = [];
            while (suggestions.length < 3) {
                const suggestion = `${username}${Math.floor(Math.random() * 1000)}`;
                if (!users.some(u => u.username === suggestion)) {
                    suggestions.push(suggestion);
                }
            }
            return res.status(409).json({
                error: "Username already exists",
                suggestions
            });
        }
        const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
        const newUser = new User({
            username,
            password: passwordHash,
            displayName,
            age,
            gender
        });
        newUser.validate();
        users.push(newUser);
        await writeUsers(users);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

router.patch('/:username', requireLogin, async (req, res) => {
    try {
        const users = await readUsers();
        const {params, body} = req;
        const index = users.findIndex(u => u.username === params.username);
        if (index === -1) {
            return res.status(404).json({error: "User not found"});
        }
        const existingUser = users[index];
        const {password, displayName, age, gender, isAdmin, ...extraFields} = body;
        if (Object.keys(extraFields).length > 0) {
            return res.status(400).json({
                error: `Forbidden fields: ${Object.keys(extraFields).map(f => `'${f}'`).join(', ')}.`
            });
        }
        let newPasswordHash = existingUser.password;
        if (password) {
            newPasswordHash = bcrypt.hashSync(password, SALT_ROUNDS);
        }
        const updatedUser = new UpdateUser({
            username: existingUser.username,
            password: newPasswordHash,
            displayName: displayName ?? existingUser.displayName,
            age: age ?? existingUser.age,
            gender: gender ?? existingUser.gender,
            isAdmin: isAdmin ?? existingUser.isAdmin,
            createdAt: existingUser.createdAt
        });
        updatedUser.validate();
        users[index] = updatedUser;
        await writeUsers(users);
        res.json(toSafeUser(updatedUser));
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

router.delete('/:username', requireLogin, async (req, res) => {
    const users = await readUsers();
    const {params} = req;
    const filteredUsers = users.filter(u => u.username !== params.username);
    if (users.length === filteredUsers.length) {
        return res.status(404).json({error: "User not found"});
    }
    await writeUsers(filteredUsers);
    res.status(204).send();
});

router.post(
    '/:username/avatar',
    requireLogin,
    uploadAvatar.single('avatar'),
    async (req, res) => {
        const {username} = req.params;

        const users = await readUsers();
        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex === -1) {
            return res.status(404).json({error: 'User not found'});
        }

        if (
            req.session.user.username !== username &&
            !req.session.user.isAdmin
        ) {
            return res.status(403).json({error: 'Forbidden'});
        }

        const user = users[userIndex];

        await deleteAvatarIfExists(user.profilePhoto, avatarsDir);

        const publicPath = `/uploads/avatars/${req.file.filename}`;
        user.profilePhoto = publicPath;
        user.updatedAt = new Date().toISOString();

        users[userIndex] = user;
        await writeUsers(users);

        res.status(200).json({
            message: 'Profile image uploaded successfully',
            profilePhoto: publicPath
        });
    }
);




module.exports = router;
