import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UsersService } from '@src/users';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CONSTS } from "@consts";

describe('UsersService', () => {
    let service: UsersService;
    let repository: Repository<User>;

    const mockRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        repository = module.get<Repository<User>>(getRepositoryToken(User));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findOne', () => {
        it('should return a user without password', async () => {
            const user = {
                username: 'testuser',
                password: 'hashedpass',
                displayName: 'Test User',
                profilePhoto: null,
            };

            mockRepository.findOne.mockResolvedValue(user);

            const result = await service.findOne('testuser');

            expect(result["password"]).toBeUndefined();
            expect(result.username).toBe('testuser');
            expect(result.profilePhoto).toBe(`/uploads/avatars/${CONSTS.DEFAULT_AVATAR_FILENAME}`);
        });

        it('should throw NotFoundException when user not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('nonexistent')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        it('should throw ConflictException when username exists', async () => {
            mockRepository.findOne.mockResolvedValue({username: 'existing'});
            mockRepository.find.mockResolvedValue([{username: 'existing'}]);

            await expect(
                service.create({username: 'existing', password: 'pass1234'}),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('update', () => {
        it('should hash password when provided', async () => {
            const existingUser = {username: 'u1', password: 'oldhash', displayName: 'U1', profilePhoto: null, updatedAt: ''};
            mockRepository.findOne.mockResolvedValue(existingUser);
            mockRepository.save.mockResolvedValue({...existingUser, password: 'newhash'});

            const bcrypt = require('bcrypt');
            const hashSpy = jest.spyOn(bcrypt, 'hashSync').mockReturnValue('newhash');

            const result = await service.update('u1', {password: 'newpass123'} as any);

            expect(hashSpy).toHaveBeenCalledTimes(1);
            expect(result["password"]).toBeUndefined();

            hashSpy.mockRestore();
        });
    });
});
