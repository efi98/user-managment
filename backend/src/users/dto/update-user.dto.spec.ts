import 'reflect-metadata';
import { validate } from 'class-validator';
import { UpdateUserDto } from '@src/users';

describe('UpdateUserDto validation', () => {
    it('allows partial fields', async () => {
        const dto = Object.assign(new UpdateUserDto(), { displayName: 'Alice' } as any);
        const res = await validate(dto);
        expect(res).toHaveLength(0);
    });

    it('isAdmin must be boolean', async () => {
        const dto = Object.assign(new UpdateUserDto(), { isAdmin: 'true' } as any);
        const res = await validate(dto);
        expect(res[0].constraints).toHaveProperty('isBoolean');
    });
});