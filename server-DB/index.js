const express = require("express");
const cors = require("cors");
const session = require("express-session");
require('dotenv').config();

const usersRouter = require('./routes/users');
const {requireLogin} = require('./middleware/auth');
const {readUsers} = require('./helpers/db');

const ALLOWED_ORIGIN = 'http://localhost:4001';
const MAX_AGE = 1000 * 60 * 60; // 1 hour

const corsOptions = {
    origin: ALLOWED_ORIGIN,
    credentials: true
};

const sessionOptions = {
    name: process.env.COOKIE_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: MAX_AGE,
        rolling: true
    }
};

const app = express();

app.use(
    cors(corsOptions),
    express.json(),
    session(sessionOptions)
);

app.get("/", (req, res) => {
    res.send("Welcome to the User Management API");
});

app.get("/health", (req, res) => {
    res.json({ status: "ok"});
});

app.use('/users', usersRouter);

app.post("/login", (req, res) => {
    const users = readUsers();
    const {username, password} = req.body;
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({error: "User not found"});
    }
    const bcrypt = require("bcrypt");
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
        return res.status(401).json({error: "Incorrect password"});
    }
    const {password: _, ...userSafe} = user;
    req.session.user = {...userSafe};
    res.json(userSafe);
});

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({error: "Failed to logout"});
        }
        res.clearCookie(process.env.COOKIE_NAME); // default cookie name
        res.status(204).send();
    });
});

app.get("/me", requireLogin, (req, res) => {
    const user = req.session.user;
    res.json(user);
});

app.listen(process.env.PORT || 1000, function () {
    console.log("Server is running on port", process.env.PORT || 1000);
});
