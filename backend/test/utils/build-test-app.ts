import {INestApplication, ValidationPipe} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import path from 'node:path';
import {TypeOrmModule} from "@nestjs/typeorm";
import * as os from "node:os";
import * as fs from "node:fs";

function ensureTmpDir(prefix: string) {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export async function buildTestApp(): Promise<INestApplication> {
    process.env.NODE_ENV ||= 'test';
    process.env.DB_PATH = ':memory:';
    process.env.COOKIE_NAME ||= 'sid';
    process.env.AVATARS_DIR ||= ensureTmpDir('avatars-');

    const {AppModule} = await import('@src/app.module');

    const modRef = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = modRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true, transform: true}));
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