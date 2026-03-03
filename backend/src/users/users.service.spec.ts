import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '@users/entities';
import { ERRORS } from '@errors';

jest.mock('bcrypt', () => ({
  compareSync: jest.fn(),
  hashSync: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
    let service: UsersService;
    let repo: jest.Mocked<Partial<Repository<User>>>;

    beforeEach(async () => {
        repo = {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
        };

        const mod = await Test.createTestingModule({
            providers: [
                UsersService,
                {provide: getRepositoryToken(User), useValue: repo},
            ],
        }).compile();

        service = mod.get(UsersService);
        jest.clearAllMocks();

    });

    it('findAll returns safe users list', async () => {
        repo.find!.mockResolvedValue([
            {username: 'alice', password: 'x', isAdmin: 0, createdAt: 'c', updatedAt: 'u'},
            {username: 'bob', password: 'y', isAdmin: 1, createdAt: 'c', updatedAt: 'u'},
        ] as any);

        const res = await service.findAll();

        expect(Array.isArray(res)).toBe(true);
        expect(res).toHaveLength(2);
        expect(res[0]).toHaveProperty('username', 'alice');
        expect((res[0] as any).password).toBeUndefined();
    });

    it('findOne returns safe user on success', async () => {
        repo.findOne!.mockResolvedValue({
            username: 'alice',
            password: 'x',
            isAdmin: 0,
            createdAt: 'c',
            updatedAt: 'u',
        } as any);

        const res = await service.findOne('alice');

        expect(res).toHaveProperty('username', 'alice');
        expect((res as any).password).toBeUndefined();
    });

    it('findOne throws if user missing', async () => {
        repo.findOne!.mockResolvedValue(null);

        await expect(service.findOne('missing')).rejects.toMatchObject(
            new NotFoundException({
                code: ERRORS.USER_NOT_FOUND.code,
                message: ERRORS.USER_NOT_FOUND.message,
            }),
        );
    });

  it('create throws ConflictException with suggestions if username exists', async () => {
    repo.findOne!.mockResolvedValue({ username: 'taken' } as any);
    repo.find!.mockResolvedValue([{ username: 'taken' }] as any);

    await expect(service.create({ username: 'taken', password: 'pass' } as any)).rejects.toBeInstanceOf(
      ConflictException,
    );

    try {
      await service.create({ username: 'taken', password: 'pass' } as any);
    } catch (e: any) {
      expect(e.response).toHaveProperty('suggestions');
      expect(Array.isArray(e.response.suggestions)).toBe(true);
      expect(e.response.code).toBe(ERRORS.USERNAME_EXISTS.code);
    }
  });

    it('create hashes password and saves new user', async () => {
        repo.findOne!.mockResolvedValue(null);
        repo.find!.mockResolvedValue([] as any);

    (bcrypt.hashSync as unknown as jest.Mock).mockReturnValue('hashed');
    repo.create!.mockImplementation((x: any) => x);
    repo.save!.mockImplementation(async (x: any) => x);

        const res = await service.create({
            username: 'alice',
            password: 'pass',
            birthdate: '2000-01-01',
            gender: 'female',
        } as any);

    expect(repo.save).toHaveBeenCalled();
    expect(res.username).toBe('alice');
    expect((res as any).password).toBeUndefined();
  });

    it('update throws NotFoundException when user missing', async () => {
        repo.findOne!.mockResolvedValue(null);

        await expect(service.update('missing', {displayName: 'X'} as any)).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('update hashes password when provided', async () => {
        repo.findOne!.mockResolvedValue({username: 'alice', password: 'old', updatedAt: 'x'} as any);
        (bcrypt.hashSync as unknown as jest.Mock).mockReturnValue('newhash');
        repo.save!.mockImplementation(async (x: any) => x);

        const res = await service.update('alice', {password: 'newpass'} as any);

        expect(res.username).toBe('alice');
        expect((res as any).password).toBeUndefined();
    });

    it('remove succeeds and returns void', async () => {
        const entity = {username: 'alice'} as any;
        repo.findOne!.mockResolvedValue(entity);
        repo.remove!.mockResolvedValue(entity);

        await expect(service.remove('alice')).resolves.toBeUndefined();
        expect(repo.remove).toHaveBeenCalledWith(entity);
    });

    it('remove throws if user missing', async () => {
        repo.findOne!.mockResolvedValue(null);

        await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('getStats returns totals and percent', async () => {
        repo.find!.mockResolvedValue([
            {username: 'a', isAdmin: true},
            {username: 'b', isAdmin: false},
            {username: 'c', isAdmin: true},
            {username: 'd', isAdmin: false},
        ] as any);

        const stats = await service.getStats();

        expect(stats.totalUsers).toBe(4);
        expect(stats.adminCount).toBe(2);
        expect(stats.adminPercent).toBe(50);
    });

    it('updateAvatar throws NotFoundException when user missing', async () => {
        repo.findOne!.mockResolvedValue(null);

        await expect(service.updateAvatar('missing', '/uploads/new.jpg')).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('updateAvatar stores photo and returns oldPhoto', async () => {
        repo.findOne!.mockResolvedValue({username: 'alice', profilePhoto: '/uploads/old.jpg'} as any);
        repo.save!.mockImplementation(async (x: any) => x);

        const res = await service.updateAvatar('alice', '/uploads/new.jpg');

        expect(res).toEqual({oldPhoto: '/uploads/old.jpg', newPhoto: '/uploads/new.jpg'});
    });

  it('deleteAvatar sets profilePhoto to null and returns oldPhoto', async () => {
    repo.findOne!.mockResolvedValue({ username: 'alice', profilePhoto: '/uploads/old.jpg' } as any);
    repo.save!.mockImplementation(async (x: any) => x);

        const res = await service.deleteAvatar('alice');

        expect(res).toEqual({oldPhoto: '/uploads/old.jpg'});
    });
});