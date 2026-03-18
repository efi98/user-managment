import {Test} from '@nestjs/testing';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {AuthService} from './auth.service';
import { UsersService } from '@users/users.service';
import {User} from '@users/entities';
import {API_RESPONSES} from '@api-res';

jest.mock('bcrypt', () => ({
  compareSync: jest.fn(),
  hashSync: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let repo: jest.Mocked<Partial<Repository<User>>>;

    beforeEach(async () => {
        repo = {
            findOne: jest.fn(),
        };

        const usersServiceMock = {
            getByUsernameOrThrow: jest.fn(),
        } as any;

        const mod = await Test.createTestingModule({
            providers: [
                AuthService,
                {provide: UsersService, useValue: usersServiceMock},
                {provide: getRepositoryToken(User), useValue: repo},
            ],
        }).compile();

    service = mod.get(AuthService);
    jest.clearAllMocks();
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
            avatar: null,
        } as User;

    // stub the injected UsersService used by AuthService
    (service as any).usersService.getByUsernameOrThrow = jest.fn().mockResolvedValue(user);
    (bcrypt.compareSync as unknown as jest.Mock).mockReturnValue(true);

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
        (service as any).usersService.getByUsernameOrThrow.mockRejectedValue(
            new Error(API_RESPONSES.USER_NOT_FOUND('missing')),
        );

        await expect(
            service.login({username: 'missing', password: 'pass'}),
        ).rejects.toThrow(API_RESPONSES.USER_NOT_FOUND('missing'));
    });

  it('login throws UnauthorizedException on wrong password', async () => {
    (service as any).usersService.getByUsernameOrThrow.mockResolvedValue({ username: 'alice', password: 'hashed' } as any);
    (bcrypt.compareSync as unknown as jest.Mock).mockReturnValue(false);

        await expect(
            service.login({username: 'alice', password: 'wrong'}),
        ).rejects.toThrow(API_RESPONSES.INCORRECT_PASSWORD);
    });
});