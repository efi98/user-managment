import request from 'supertest';
import {INestApplication} from '@nestjs/common';
import {buildTestApp} from '../utils/build-test-app';

describe('E2E app', () => {
    let app: INestApplication;

    beforeAll(async () => {
        app = await buildTestApp();
    });

    afterAll(async () => {
        await app.close();
    });

    it('GET / returns welcome string', async () => {
        const res = await request(app.getHttpServer()).get('/').expect(200);
        expect(typeof res.text === 'string' || typeof res.body === 'string').toBe(true);
    });

    it('GET /health returns ok', async () => {
        await request(app.getHttpServer()).get('/health').expect(200).expect({status: 'ok'});
    });
});