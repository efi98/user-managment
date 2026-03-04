import 'reflect-metadata';
import { validate } from 'class-validator';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '@src/users';
import {API_RESPONSES} from "@api-res";

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
        expect(msg).toBe(API_RESPONSES.PASSWORD_MIN_LENGTH.message);
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

    it('extra property is rejected by ValidationPipe forbidNonWhitelisted', async () => {
        const pipe = new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        });

        const payload: any = {
            username: 'alice',
            password: 'pass',
            birthdate: '2000-01-01',
            gender: 'female',
            extra: 'nope',
        };

        await expect(
            pipe.transform(payload, {
                type: 'body',
                metatype: CreateUserDto,
                data: '',
            } as any),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('extra property is stripped when forbidNonWhitelisted is false', async () => {
        const pipe = new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
        });

        const payload: any = {
            username: 'alice',
            password: 'pass',
            birthdate: '2000-01-01',
            gender: 'female',
            extra: 'nope',
        };

        const out = await pipe.transform(payload, {
            type: 'body',
            metatype: CreateUserDto,
            data: '',
        } as any);

        expect((out as any).extra).toBeUndefined();
        expect(out).toBeInstanceOf(CreateUserDto);
        expect((out as any).username).toBe('alice');
    });
});