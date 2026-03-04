import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {createClient} from 'redis';
import {ValidationPipe} from '@nestjs/common';
import session = require('express-session');
import type {RequestHandler} from 'express';
import {RedisStore} from "connect-redis";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const MAX_AGE = Number.parseInt(process.env.MAX_AGE_MS, 10);

let redisClient: ReturnType<typeof createClient> | undefined;

function buildSessionMiddleware(baseSessionOptions: session.SessionOptions): RequestHandler {
    const memorySession = session({...baseSessionOptions});

    const redisEnabled =
        process.env.USE_REDIS_SESSION !== 'false' &&
        process.env.NODE_ENV !== 'test' &&
        !!process.env.VALKEY_HOST;

    if (!redisEnabled) return memorySession;

    const port = Number.parseInt(process.env.VALKEY_PORT || '6379', 10);

    redisClient = createClient({
        socket: {
            host: process.env.VALKEY_HOST,
            port,
            reconnectStrategy: () => false,
        },
    });

    redisClient.connect().catch(() => {
        console.error('Redis unavailable, using memory session store');
    });

    const redisStore = new RedisStore({client: redisClient});
    const redisSession = session({...baseSessionOptions, store: redisStore});

    // Per request: use redis only when ready, otherwise memory
    return (req, res, next) => {
        if (redisClient?.isReady) return redisSession(req, res, next);
        return memorySession(req, res, next);
    };
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('/');

    app.enableCors({
        origin: ALLOWED_ORIGIN,
        credentials: true,
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const isProduction = process.env.NODE_ENV === 'production';

    const baseSessionOptions: session.SessionOptions = {
        name: process.env.COOKIE_NAME,
        secret: process.env.SESSION_SECRET || 'test-secret',
        resave: false,
        proxy: isProduction,
        saveUninitialized: false,
        rolling: true,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: isProduction,
            path: '/',
            maxAge: MAX_AGE,
        },
    };

    app.use(buildSessionMiddleware(baseSessionOptions));

    app.getHttpAdapter().getInstance().set('trust proxy', 1);

    const port = process.env.PORT || 1000;
    await app.listen(port);
    console.log(`Server is running on port ${port}`);
}

bootstrap();