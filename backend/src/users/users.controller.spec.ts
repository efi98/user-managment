import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { BadRequestException } from '@nestjs/common';
import { AdminChangeGuard, AuthGuard, SelfOrAdminGuard } from '@common/guards';
import { UsersController } from '@users/users.controller';
import { UsersService } from '@users/users.service';
import { ERRORS } from '@errors';

jest.mock('@common/helpers', () => {
  const actual = jest.requireActual('@common/helpers');
  return {
    ...actual,
    deleteAvatarIfExists: jest.fn().mockResolvedValue(undefined),
  };
});

import { deleteAvatarIfExists } from '@common/helpers';

describe('UsersController', () => {
  let controller: UsersController;
  let service: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    updateAvatar: jest.Mock;
    deleteAvatar: jest.Mock;
    getStats: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      updateAvatar: jest.fn(),
      deleteAvatar: jest.fn(),
      getStats: jest.fn(),
    };

    const mod = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }, Reflector],
    }).compile();

    controller = mod.get(UsersController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll has AuthGuard', () => {
    const reflector = new Reflector();
    const guards = reflector.getAllAndOverride<any[]>('__guards__', [
      (UsersController as any).prototype.findAll,
      UsersController,
    ]);
    expect(guards).toEqual(expect.arrayContaining([AuthGuard]));
  });

  it('findAll returns service result', async () => {
    service.findAll.mockResolvedValue([{ username: 'alice' }]);
    await expect(controller.findAll()).resolves.toEqual([{ username: 'alice' }]);
  });

  it('findOne calls service', async () => {
    service.findOne.mockResolvedValue({ username: 'alice' });
    const res = await controller.findOne('alice');
    expect(service.findOne).toHaveBeenCalledWith('alice');
    expect(res).toEqual({ username: 'alice' });
  });

  it('create calls service and sets session user', async () => {
    service.create.mockResolvedValue({ username: 'alice' });
    const req: any = { session: {} };

    const res = await controller.create({ username: 'alice', password: 'pass' } as any, req);

    expect(service.create).toHaveBeenCalled();
    expect(res).toEqual({ username: 'alice' });
    expect(req.session.user).toEqual({ username: 'alice' });
  });

  it('update has SelfOrAdminGuard and AdminChangeGuard', () => {
    const reflector = new Reflector();
    const guards = reflector.getAllAndOverride<any[]>('__guards__', [
      (UsersController as any).prototype.update,
      UsersController,
    ]);
    expect(guards).toEqual(expect.arrayContaining([SelfOrAdminGuard, AdminChangeGuard]));
  });

  it('update calls service with username and dto and does not change session when not self', async () => {
    service.update.mockResolvedValue({ username: 'alice', displayName: 'A' });
    const req: any = { session: { user: { username: 'bob' } } };

    const res = await controller.update('alice', { displayName: 'A' } as any, req);

    expect(service.update).toHaveBeenCalledWith('alice', { displayName: 'A' });
    expect(res).toEqual({ username: 'alice', displayName: 'A' });
    expect(req.session.user).toEqual({ username: 'bob' });
  });

  it('update refreshes req.session.user when updating self', async () => {
    service.update.mockResolvedValue({ username: 'alice', displayName: 'A' });
    const req: any = { session: { user: { username: 'alice', displayName: 'old' } } };

    const res = await controller.update('alice', { displayName: 'A' } as any, req);

    expect(service.update).toHaveBeenCalledWith('alice', { displayName: 'A' });
    expect(res).toEqual({ username: 'alice', displayName: 'A' });
    expect(req.session.user).toEqual({ username: 'alice', displayName: 'A' });
  });

  it('getStats returns stats from service', async () => {
    service.getStats.mockResolvedValue({ totalUsers: 2, adminCount: 1, adminPercent: 50 });
    const res = await controller.getStats();
    expect(service.getStats).toHaveBeenCalled();
    expect(res).toEqual({ totalUsers: 2, adminCount: 1, adminPercent: 50 });
  });

  it('uploadAvatar rejects invalid mime via fileValidationError', async () => {
    const req: any = { fileValidationError: ERRORS.AVATAR_INVALID_FORMAT.message };
    await expect(controller.uploadAvatar('alice', req, undefined as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('uploadAvatar rejects when no file provided', async () => {
    const req: any = {};
    await expect(controller.uploadAvatar('alice', req, undefined as any)).rejects.toMatchObject({
      response: { error: ERRORS.NO_FILE_UPLOADED.message },
    });
  });

  it('uploadAvatar updates profilePhoto and deletes old avatar when old exists', async () => {
    service.findOne.mockResolvedValue({ username: 'alice', profilePhoto: '/uploads/avatars/old.jpg' });
    service.updateAvatar.mockResolvedValue({
      oldPhoto: '/uploads/avatars/old.jpg',
      newPhoto: '/uploads/avatars/new.jpg',
    });

    const req: any = {};
    const file: any = { filename: 'alice-123.jpg' };

    const res = await controller.uploadAvatar('alice', req, file);

    expect(deleteAvatarIfExists).toHaveBeenCalledWith('/uploads/avatars/old.jpg', expect.any(String));
    expect(service.updateAvatar).toHaveBeenCalledWith('alice', '/uploads/avatars/alice-123.jpg');
    expect(res).toEqual({
      message: ERRORS.AVATAR_UPLOADED.message,
      profilePhoto: '/uploads/avatars/alice-123.jpg',
    });
  });

  it('uploadAvatar does not delete when old avatar is missing', async () => {
    service.findOne.mockResolvedValue({ username: 'alice', profilePhoto: null });
    service.updateAvatar.mockResolvedValue({ oldPhoto: null, newPhoto: '/uploads/avatars/new.jpg' });

    const req: any = {};
    const file: any = { filename: 'alice-123.jpg' };

    await controller.uploadAvatar('alice', req, file);

    expect(deleteAvatarIfExists).not.toHaveBeenCalled();
    expect(service.updateAvatar).toHaveBeenCalledWith('alice', '/uploads/avatars/alice-123.jpg');
  });

  it('deleteAvatar deletes file when oldPhoto exists', async () => {
    service.deleteAvatar.mockResolvedValue({ oldPhoto: '/uploads/avatars/old.jpg' });

    const req: any = {};
    const res = await controller.deleteAvatar('alice', req);

    expect(deleteAvatarIfExists).toHaveBeenCalledWith('/uploads/avatars/old.jpg', expect.any(String));
    expect(res).toEqual({ message: ERRORS.AVATAR_DELETED.message });
  });

  it('deleteAvatar does not delete when oldPhoto is null', async () => {
    service.deleteAvatar.mockResolvedValue({ oldPhoto: null });

    const req: any = {};
    const res = await controller.deleteAvatar('alice', req);

    expect(deleteAvatarIfExists).not.toHaveBeenCalled();
    expect(res).toEqual({ message: ERRORS.AVATAR_DELETED.message });
  });

  it('deleteAvatar resets session profilePhoto when deleting self avatar', async () => {
    service.deleteAvatar.mockResolvedValue({ oldPhoto: null });

    const req: any = {
      session: {
        user: { username: 'alice', profilePhoto: '/uploads/avatars/some.jpg' },
      },
    };

    await controller.deleteAvatar('alice', req);

    expect(req.session.user.profilePhoto).toEqual(expect.stringContaining('/uploads/avatars/'));
  });
});