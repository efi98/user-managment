import request from 'supertest';
import type {INestApplication} from '@nestjs/common';

export type SessionAgent = ReturnType<typeof request.agent>;

export function sessionAgent(app: INestApplication): SessionAgent {
    return request.agent(app.getHttpServer());
}