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
const isProduction = process.env.NODE_ENV === 'production'

const corsOptions = {
    origin: ALLOWED_ORIGIN,
    credentials: true
};

const redisClient = createClient({
    socket: {
        host: process.env.VALKEY_HOST,
        port: process.env.VALKEY_PORT
    },
});

redisClient.on('error', (err) => {
    console.error('Redis/Valkey error', err);
});

redisClient.connect().catch((err) => {
    console.error("Could not connect to Redis/Valkey:", err.message);
});

const baseSessionOptions = {
    name: process.env.COOKIE_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    proxy: isProduction,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
        path: '/',
        maxAge: MAX_AGE
    }
};

const memorySession = session({
    ...baseSessionOptions
});

const redisStore = new RedisStore({client: redisClient});
const redisSession = session({
    ...baseSessionOptions,
    store: redisStore
});

// wrapper that chooses at runtime
function sessionMiddleware(req, res, next) {
    if (redisClient.isReady) {
        return redisSession(req, res, next);
    } else {
        return memorySession(req, res, next);
    }
}

const app = express();

app.set('trust proxy', 1);

app.use(
    cors(corsOptions),
    express.json(),
    sessionMiddleware
    // session(sessionOptions)
);

const apiRouter = express.Router();

apiRouter.get("/", (req, res) => {
    res.send("Welcome to the User Management API");
});

apiRouter.get("/health", (req, res) => {
    res.json({status: "ok"});
});

apiRouter.use('/users', usersRouter);
apiRouter.use('/', authRouter);

app.use('/api', apiRouter);

app.listen(process.env.PORT || 1000, function () {
    console.log("Server is running on port", process.env.PORT || 1000);
});
