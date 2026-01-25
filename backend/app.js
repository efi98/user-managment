const express = require("express");
const cors = require("cors");
const session = require("express-session");
const RedisStore = require("connect-redis").RedisStore;
const {createClient} = require("redis");

const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");

const ALLOWED_ORIGIN = "http://localhost:4001";
const MAX_AGE = 1000 * 60 * 60; // 1 hour
const isProduction = process.env.NODE_ENV === "production";

const corsOptions = {
    origin: ALLOWED_ORIGIN,
    credentials: true,
};

// In tests we should prefer memory session.
// We'll keep the existing logic, but allow forcing memory via env.
let redisClient;
let sessionMiddleware;

function buildSessionMiddleware() {
    const baseSessionOptions = {
        name: process.env.COOKIE_NAME,
        secret: process.env.SESSION_SECRET || "test-secret",
        resave: false,
        proxy: isProduction,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: isProduction,
            path: "/",
            maxAge: MAX_AGE,
        },
    };

    const memorySession = session({...baseSessionOptions});

    // For tests (or if explicitly disabled), skip redis completely
    if (process.env.USE_REDIS_SESSION === "false" || process.env.NODE_ENV === "test") {
        return memorySession;
    }

    redisClient = createClient({
        socket: {
            host: process.env.VALKEY_HOST,
            port: process.env.VALKEY_PORT,
        },
    });

    redisClient.on("error", (err) => {
        console.error("Redis/Valkey error", err);
    });

    redisClient.connect().catch((err) => {
        console.error("Could not connect to Redis/Valkey:", err.message);
    });

    const redisStore = new RedisStore({client: redisClient});
    const redisSession = session({...baseSessionOptions, store: redisStore});

    return function (req, res, next) {
        if (redisClient.isReady) return redisSession(req, res, next);
        return memorySession(req, res, next);
    };
}

function createApp() {
    const app = express();
    app.set("trust proxy", 1);

    sessionMiddleware = buildSessionMiddleware();

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(sessionMiddleware);

    // Static uploads (needed for avatar viewing)
    const path = require("node:path");
    app.use("/uploads", express.static(path.join(process.cwd(), "assets/uploads")));

    const apiRouter = express.Router();
    apiRouter.get("/", (req, res) => res.send("Welcome to the User Management API"));
    apiRouter.get("/health", (req, res) => res.json({status: "ok"}));
    apiRouter.use("/users", usersRouter);
    apiRouter.use("/", authRouter);

    app.use("/", apiRouter);

    return app;
}

module.exports = {createApp};
