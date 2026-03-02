import {INestApplication, ValidationPipe} from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import {join} from 'node:path';
import {TypeOrmModule} from "@nestjs/typeorm";

export async function buildTestApp(): Promise<INestApplication> {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';
    process.env.DB_PATH = process.env.DB_PATH || join(__dirname, '..', '..', 'assets', 'test.sqlite');
    process.env.COOKIE_NAME = process.env.COOKIE_NAME || 'sid';
    process.env.AVATARS_DIR =
        process.env.AVATARS_DIR || join(__dirname, '..', '..', 'assets', 'test-uploads', 'avatars');
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