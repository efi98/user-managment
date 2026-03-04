import 'reflect-metadata';
import {validate} from 'class-validator';
import {LoginDto} from '@src/auth';

describe('LoginDto validation', () => {
    it('valid payload passes', async () => {
        const dto = Object.assign(new LoginDto(), {username: 'alice', password: 'pass'});
        const res = await validate(dto);
        expect(res).toHaveLength(0);
    });

    it('missing fields fail', async () => {
        const dto = Object.assign(new LoginDto(), {});
        const res = await validate(dto);
        expect(res.length).toBeGreaterThan(0);
    });

    it('short password fails', async () => {
        const dto = Object.assign(new LoginDto(), {username: 'alice', password: '123'});
        const res = await validate(dto);
        expect(res[0].constraints).toHaveProperty('minLength');
    });
});