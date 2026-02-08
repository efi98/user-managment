import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createClient } from 'redis';
import { ValidationPipe } from '@nestjs/common';
import session = require('express-session');
import connectRedis = require('connect-redis');

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const MAX_AGE = Number.parseInt(process.env.MAX_AGE_MS, 10);

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('/');

    // Enable CORS
    app.enableCors({
        origin: ALLOWED_ORIGIN,
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Session configuration
    const isProduction = process.env.NODE_ENV === 'production';

    const baseSessionOptions: session.SessionOptions = {
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
            maxAge: MAX_AGE,
        },
    };

    // Setup session with Redis or memory store
    if (process.env.USE_REDIS_SESSION !== 'false' && process.env.NODE_ENV !== 'test') {
        try {
            const redisClient = createClient({
                socket: {
                    host: process.env.VALKEY_HOST,
                    port: Number.parseInt(process.env.VALKEY_PORT || '6379'),
                },
            });

            redisClient.on('error', (err) => {
                console.error('Redis/Valkey error', err);
            });

            await redisClient.connect();

            // connect-redis returns a factory function; pass the session module to get the Store class.
            const RedisStore = connectRedis.RedisStore;
            const redisStore = new RedisStore({client: redisClient});
            app.use(session({...baseSessionOptions, store: redisStore}));
            console.log('Using Redis session store');
        } catch (err) {
            console.error('Could not connect to Redis/Valkey:', err.message);
            app.use(session(baseSessionOptions));
            console.log('Using memory session store');
        }
    } else {
        app.use(session(baseSessionOptions));
        console.log('Using memory session store');
    }

    // Trust proxy
    app.getHttpAdapter().getInstance().set('trust proxy', 1);

    const port = process.env.PORT || 1000;
    await app.listen(port);
    console.log(`Server is running on port ${port}`);
}

bootstrap();
