const express = require("express");
const cors = require("cors");
const session = require("express-session");
const RedisStore = require('connect-redis').RedisStore;
const {createClient} = require('redis');
require('dotenv').config();

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

const ALLOWED_ORIGIN = 'http://localhost:4001';
const MAX_AGE = 1000 * 60 * 60; // 1 hour

const redisClient = createClient({
    socket: {
        // אם ה-backend רץ מחוץ ל-Docker וה-Valkey עם -p 6379:6379:
        host: '127.0.0.1',
        port: 6379,

        // אם שניהם ב-docker-compose, החלף ל:
        // host: 'valkey',
    },
});

redisClient.on('error', (err) => {
    console.error('Redis/Valkey error', err);
});

redisClient.connect().catch((err) => {
    console.error('Could not connect to Redis/Valkey', err);
});

const corsOptions = {
    origin: ALLOWED_ORIGIN,
    credentials: true
};

const sessionOptions = {
    name: process.env.COOKIE_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        maxAge: MAX_AGE
    },
    store: new RedisStore({
        client: redisClient,
        // optional:
        // prefix: 'sess:',
        // ttl: MAX_AGE / 1000,
    }),
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
    res.json({status: "ok"});
});

app.use('/users', usersRouter);
app.use('/', authRouter);

app.listen(process.env.PORT || 1000, function () {
    console.log("Server is running on port", process.env.PORT || 1000);
});
