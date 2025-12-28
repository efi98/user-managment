const express = require('express');
const bcrypt = require('bcrypt');
const {readUsers} = require('../helpers/db');
const {requireLogin} = require('../middleware/auth');

const router = express.Router();

router.post("/login", async (req, res) => {
    const users = await readUsers();
    const {username, password} = req.body;
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({error: "User not found"});
    }
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
        return res.status(401).json({error: "Incorrect password"});
    }
    const {password: _, ...userSafe} = user;
    req.session.user = {...userSafe};
    res.json(userSafe);
});

router.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({error: "Failed to logout"});
        }
        res.clearCookie(process.env.COOKIE_NAME);
        res.status(204).send();
    });
});

router.get("/me", requireLogin, (req, res) => {
    const user = req.session.user;
    res.json(user);
});

module.exports = router;
