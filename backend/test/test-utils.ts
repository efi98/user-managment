import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import {getDataSourceToken, TypeOrmModule} from '@nestjs/typeorm';
import { User } from '@src/users';
import request = require('supertest');
import session = require('express-session');
import {DataSource} from "typeorm";

export async function createTestApp(modules: any[]): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [
            TypeOrmModule.forRoot({
                type: 'sqlite',
                database: process.env.DB_PATH || ':memory:',
                entities: [User],
                synchronize: true,
                logging: false,
            }),
            ...modules,
        ],
    }).compile();

    const app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.use(
        session({
            secret: 'test-secret',
            resave: false,
            saveUninitialized: false,
            cookie: {maxAge: 3600000},
        }),
    );

    await app.init();
    return app;
}

// Normalize supertest callable shape (support ESM default or CommonJS export)
export function http(app: any) {
    // If the module has a default export (ESM transpiled), call that; otherwise call the module itself
    const m: any = request as any;
    return m.default ? m.default(app) : m(app);
}

export function agentFor(app: any) {
    const m: any = request as any;
    return (m.default ? m.default : m).agent(app);
}

export async function createUser(
    app: INestApplication,
    userData: { username: string; password: string; [key: string]: any },
): Promise<any> {
    return http(app.getHttpServer()).post('/users').send(userData);
}

export async function login(
    agent: any,
    username: string,
    password: string,
): Promise<any> {
    return agent.post('/login').send({username, password});
}

export async function resetDb(app: INestApplication) {
    const dataSource = app.get<DataSource>(getDataSourceToken())
    await dataSource.synchronize(true)
}

export async function closeApp(app: INestApplication) {
    await app.close();
}
