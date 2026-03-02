import {Test} from '@nestjs/testing';
import {getRepositoryToken} from '@nestjs/typeorm';
import {NotFoundException, UnauthorizedException} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {Repository} from 'typeorm';
import {AuthService} from './auth.service';
import {User} from '@users/entities';
import {ERRORS} from '@errors';

describe('AuthService', () => {
    let service: AuthService;
    let repo: jest.Mocked<Partial<Repository<User>>>;

    beforeEach(async () => {
        repo = {
            findOne: jest.fn(),
        };

        const mod = await Test.createTestingModule({
            providers: [
                AuthService,
                {provide: getRepositoryToken(User), useValue: repo},
            ],
        }).compile();

        service = mod.get(AuthService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('login returns safe user on valid credentials', async () => {
        const user = {
            username: 'alice',
            password: 'hashed',
            isAdmin: false,
            displayName: 'Alice',
            createdAt: '2020-01-01',
            updatedAt: '2020-01-01',
            birthdate: null,
            gender: null,
            profilePhoto: null,
        } as User;

        repo.findOne!.mockResolvedValue(user);
        jest.spyOn(bcrypt, 'compareSync').mockReturnValue(true);

        const res = await service.login({username: 'alice', password: 'pass'});

        expect(res).toEqual(
            expect.objectContaining({
                username: 'alice',
                isAdmin: false,
            }),
        );
        expect((res as any).password).toBeUndefined();
    });

    it('login throws NotFoundException when user not found', async () => {
        repo.findOne!.mockResolvedValue(null);

        await expect(
            service.login({username: 'missing', password: 'pass'}),
        ).rejects.toMatchObject(
            new NotFoundException({
                code: ERRORS.USER_NOT_FOUND.code,
                message: ERRORS.USER_NOT_FOUND.message,
            }),
        );
    });

    it('login throws UnauthorizedException on wrong password', async () => {
        repo.findOne!.mockResolvedValue({username: 'alice', password: 'hashed'} as any);
        jest.spyOn(bcrypt, 'compareSync').mockReturnValue(false);

        await expect(
            service.login({username: 'alice', password: 'wrong'}),
        ).rejects.toMatchObject(
            new UnauthorizedException({
                code: ERRORS.INCORRECT_PASSWORD.code,
                message: ERRORS.INCORRECT_PASSWORD.message,
            }),
        );
    });
});