import {INestApplication, ValidationPipe} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import path from 'node:path';
import session from 'express-session';
import {TypeOrmModule} from "@nestjs/typeorm";
import * as os from "node:os";
import * as fs from "node:fs";

function ensureTmpDir(prefix: string) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export async function buildTestApp(): Promise<INestApplication> {
    process.env.NODE_ENV ||= 'test';
    process.env.USE_REDIS_SESSION ||= 'false';
    process.env.COOKIE_NAME ||= 'sid';
    process.env.SESSION_SECRET ||= 'test-secret';
    process.env.MAX_AGE_MS ||= String(60 * 60 * 1000);

    process.env.DB_PATH = ':memory:';
    process.env.AVATARS_DIR ||= ensureTmpDir('avatars-');
    fs.mkdirSync(process.env.AVATARS_DIR, { recursive: true });

    const {AppModule} = await import('@src/app.module');

    const modRef = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = modRef.createNestApplication();
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const httpAdapter = app.getHttpAdapter();
    const instance: any = httpAdapter.getInstance();

    if (!instance || typeof instance.use !== 'function') {
        throw new Error('E2E tests expect Express. Your HTTP adapter is not Express.');
    }

    instance.use(
        session({
            name: process.env.COOKIE_NAME,
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            rolling: true,
            cookie: {
                httpOnly: true,
                sameSite: 'lax',
                secure: false,
                path: '/',
                maxAge: Number.parseInt(process.env.MAX_AGE_MS, 10),
            },
        }),
    );

    await app.init();
    return app;
}

type CreateInMemoryModuleOptions = {
    entities: any[];
    featureEntities?: any[];
    imports?: any[];
    providers?: any[];
    controllers?: any[];
};

export async function createInMemoryTestingModule(
    opts: CreateInMemoryModuleOptions,
): Promise<TestingModule> {
    return await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
                type: 'sqlite',
                database: ':memory:',
                entities: opts.entities,
                synchronize: true,
                logging: false,
            }),
            ...(opts.featureEntities?.length ? [TypeOrmModule.forFeature(opts.featureEntities)] : []),
            ...(opts.imports ?? []),
        ],
        providers: opts.providers ?? [],
        controllers: opts.controllers ?? [],
    }).compile();
}