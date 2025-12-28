const express = require('express');
const bcrypt = require('bcrypt');
const {User, UpdateUser} = require('../user');
const {readUsers, writeUsers} = require('../helpers/db');
const {requireLogin} = require('../middleware/auth');

const SALT_ROUNDS = 10;
const router = express.Router();

router.get('/', requireLogin, (req, res) => {
    const users = readUsers();
    res.json(users);
});

router.get('/stats', (req, res) => {
    const users = readUsers();
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.isAdmin).length;
    const adminPercent = totalUsers > 0 ? Math.round((adminCount / totalUsers) * 100) : 0;
    const recentSignups = users.filter(u => {
        const created = new Date(u.createdAt);
        return (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const genderBreakdown = users.reduce((acc, u) => {
        const g = (u.gender || 'other').toLowerCase();
        acc[g] = (acc[g] || 0) + 1;
        return acc;
    }, {});
    res.json({
        totalUsers,
        adminCount,
        adminPercent,
        recentSignups,
        genderBreakdown
    });
});

router.get('/:username', requireLogin, (req, res) => {
    const users = readUsers();
    const {params} = req;
    const user = users.find(u => u.username === params.username);
    if (!user) {
        return res.status(404).json({error: "User not found"});
    }
    const {password: _, ...userSafe} = user;
    res.json(userSafe);
});

router.post('/', (req, res) => {
    try {
        const users = readUsers();
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
        const newUser = new User(username, passwordHash, displayName, age, gender);
        newUser.validate();
        users.push(newUser);
        writeUsers(users);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

router.patch('/:username', requireLogin, (req, res) => {
    try {
        const users = readUsers();
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
        const updatedUser = new UpdateUser(
            existingUser.username,
            newPasswordHash,
            displayName || existingUser.displayName,
            age || existingUser.age,
            gender || existingUser.gender,
            isAdmin ?? existingUser.isAdmin,
            existingUser.createdAt);
        updatedUser.validate();
        users[index] = updatedUser;
        writeUsers(users);
        const {password: _, ...updatedUserSafe} = updatedUser;
        res.json(updatedUserSafe);
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

router.delete('/:username', requireLogin, (req, res) => {
    const users = readUsers();
    const {params} = req;
    const filteredUsers = users.filter(u => u.username !== params.username);
    if (users.length === filteredUsers.length) {
        return res.status(404).json({error: "User not found"});
    }
    writeUsers(filteredUsers);
    res.status(204).send();
});

module.exports = router;
