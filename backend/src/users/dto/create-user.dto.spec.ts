import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateUserDto } from '@src/users';
import { CONSTS } from '@consts';

describe('CreateUserDto validation', () => {
    it('valid payload passes', async () => {
        const dto = Object.assign(new CreateUserDto(), {
            username: 'alice',
            password: 'pass',
            birthdate: '2000-01-01',
            gender: 'female',
        });

        const res = await validate(dto);
        expect(res).toHaveLength(0);
    });

    it('password length uses custom message', async () => {
        const dto = Object.assign(new CreateUserDto(), { username: 'alice', password: '123' });
        const res = await validate(dto);
        const msg = Object.values(res[0].constraints || {})[0];
        expect(msg).toBe(CONSTS.PASSWORD_MIN_LENGTH_MSG);
    });

    it('birthdate pattern fails on bad format', async () => {
        const dto = Object.assign(new CreateUserDto(), {
            username: 'alice',
            password: 'pass',
            birthdate: '01-01-2000',
        });

        const res = await validate(dto);
        expect(res[0].constraints).toHaveProperty('matches');
    });

    it('gender must be in enum list', async () => {
        const dto = Object.assign(new CreateUserDto(), {
            username: 'alice',
            password: 'pass',
            gender: 'x',
        });

        const res = await validate(dto);
        expect(res[0].constraints).toHaveProperty('isIn');
    });
    // todo add test case for extra property
});