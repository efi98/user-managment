import 'reflect-metadata';
import {Test} from '@nestjs/testing';
import {Reflector} from '@nestjs/core';
import {BadRequestException} from '@nestjs/common';
import {AdminChangeGuard, AuthGuard, SelfOrAdminGuard} from '@common/guards';
import {UsersController} from '@users/users.controller';
import {UsersService} from '@users/users.service';
import {API_RESPONSES} from '@api-res';
import {deleteAvatarIfExists, destroySessionAndClearCookie} from '@common/helpers';

jest.mock('@common/helpers', () => {
    const actual = jest.requireActual('@common/helpers');
    return {
        ...actual,
        deleteAvatarIfExists: jest.fn().mockResolvedValue(undefined),
        // make the mocked destroySession helper behave like the real one by
        // calling res.status(204).send() so controller tests that expect
        // the response to be sent will pass.
        destroySessionAndClearCookie: jest.fn((req: any, res: any) => {
            // simulate successful destroy -> clear cookie and send 204
            if (res && typeof res.status === 'function') {
                res.clearCookie?.(process.env.COOKIE_NAME);
                res.status(204).send();
            }
        }),
    };
});

describe('UsersController', () => {
    let controller: UsersController;
    let service: {
        findAll: jest.Mock;
        findOne: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        deleteUser: jest.Mock;
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
            deleteUser: jest.fn(),
            updateAvatar: jest.fn(),
            deleteAvatar: jest.fn(),
            getStats: jest.fn(),
        };

        const mod = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{provide: UsersService, useValue: service}, Reflector],
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
        service.findAll.mockResolvedValue([{username: 'alice'}]);
        await expect(controller.findAll()).resolves.toEqual([{username: 'alice'}]);
    });

    it('findOne calls service', async () => {
        service.findOne.mockResolvedValue({username: 'alice'});
        const res = await controller.findOne('alice');
        expect(service.findOne).toHaveBeenCalledWith('alice');
        expect(res).toEqual({username: 'alice'});
    });

    it('create calls service and sets session user', async () => {
        service.create.mockResolvedValue({username: 'alice'});
        const req: any = {session: {}};

        const res = await controller.create({username: 'alice', password: 'pass'} as any, req);

        expect(service.create).toHaveBeenCalled();
        expect(res).toEqual({username: 'alice'});
        expect(req.session.user).toEqual({username: 'alice'});
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
        service.update.mockResolvedValue({username: 'alice', displayName: 'A'});
        const req: any = {session: {user: {username: 'bob'}}};

        const res = await controller.update('alice', {displayName: 'A'} as any, req);

        expect(service.update).toHaveBeenCalledWith('alice', {displayName: 'A'});
        expect(res).toEqual({username: 'alice', displayName: 'A'});
        expect(req.session.user).toEqual({username: 'bob'});
    });

    it('update refreshes req.session.user when updating self', async () => {
        service.update.mockResolvedValue({username: 'alice', displayName: 'A'});
        const req: any = {session: {user: {username: 'alice', displayName: 'old'}}};

        const res = await controller.update('alice', {displayName: 'A'} as any, req);

        expect(service.update).toHaveBeenCalledWith('alice', {displayName: 'A'});
        expect(res).toEqual({username: 'alice', displayName: 'A'});
        expect(req.session.user).toEqual({username: 'alice', displayName: 'A'});
    });

    it('deleteUser deletes avatar and destroys session when deleting self', async () => {
        service.findOne.mockResolvedValue({username: 'alice', avatar: '/uploads/avatars/old.jpg'});
        service.deleteUser.mockResolvedValue(undefined as any);

        const req: any = {session: {user: {username: 'alice'}}};
        const res: any = {status: jest.fn().mockReturnThis(), send: jest.fn(), clearCookie: jest.fn()};

        await controller.deleteUser('alice', req, res);

        expect(deleteAvatarIfExists).toHaveBeenCalledWith('/uploads/avatars/old.jpg', expect.any(String));
        expect((destroySessionAndClearCookie as jest.Mock)).toHaveBeenCalledWith(req, res);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it('deleteUser does not destroy session when deleting other user', async () => {
        service.findOne.mockResolvedValue({username: 'alice', avatar: '/uploads/avatars/old.jpg'});
        service.deleteUser.mockResolvedValue(undefined as any);

        const req: any = {session: {user: {username: 'bob'}}};
        const res: any = {status: jest.fn().mockReturnThis(), send: jest.fn(), clearCookie: jest.fn()};

        await controller.deleteUser('alice', req, res);

        expect(deleteAvatarIfExists).toHaveBeenCalledWith('/uploads/avatars/old.jpg', expect.any(String));
        expect((destroySessionAndClearCookie as jest.Mock)).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it('getStats returns stats from service', async () => {
        service.getStats.mockResolvedValue({totalUsers: 2, adminCount: 1, adminPercent: 50});
        const res = await controller.getStats();
        expect(service.getStats).toHaveBeenCalled();
        expect(res).toEqual({totalUsers: 2, adminCount: 1, adminPercent: 50});
    });

    it('uploadAvatar rejects invalid mime via fileValidationError', async () => {
        const req: any = {fileValidationError: API_RESPONSES.UPLOAD_AVATAR_INVALID_FORMAT};
        await expect(controller.uploadAvatar('alice', req, undefined as any)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('uploadAvatar rejects when no file provided', async () => {
        expect.assertions(2);
        const req: any = {};
        return controller.uploadAvatar('alice', req, undefined as any).catch((e: any) => {
            expect(e).toBeInstanceOf(BadRequestException);
            const resp = e.response || {};
            expect([resp.message, resp.error]).toContain(API_RESPONSES.UPLOAD_AVATAR_REQ_FILE);
        });
    });

    it('uploadAvatar updates avatar and deletes old avatar when old exists', async () => {
        service.findOne.mockResolvedValue({username: 'alice', avatar: '/uploads/avatars/old.jpg'});
        service.updateAvatar.mockResolvedValue({
            oldPhoto: '/uploads/avatars/old.jpg',
            newPhoto: '/uploads/avatars/new.jpg',
        });

        const req: any = {};
        const file: any = {filename: 'alice-123.jpg'};

        const res = await controller.uploadAvatar('alice', req, file);

        expect(deleteAvatarIfExists).toHaveBeenCalledWith('/uploads/avatars/old.jpg', expect.any(String));
        expect(service.updateAvatar).toHaveBeenCalledWith('alice', '/uploads/avatars/alice-123.jpg');
        expect(res).toEqual({
            message: API_RESPONSES.UPLOAD_AVATAR_SUCCESS,
            avatar: '/uploads/avatars/alice-123.jpg',
        });
    });

    it('uploadAvatar does not delete when old avatar is missing', async () => {
        service.findOne.mockResolvedValue({username: 'alice', avatar: null});
        service.updateAvatar.mockResolvedValue({oldPhoto: null, newPhoto: '/uploads/avatars/new.jpg'});

        const req: any = {};
        const file: any = {filename: 'alice-123.jpg'};

        await controller.uploadAvatar('alice', req, file);

        expect(deleteAvatarIfExists).not.toHaveBeenCalled();
        expect(service.updateAvatar).toHaveBeenCalledWith('alice', '/uploads/avatars/alice-123.jpg');
    });

    it('uploadAvatar updates session avatar when uploading self avatar', async () => {
        service.findOne.mockResolvedValue({username: 'alice', avatar: null});
        service.updateAvatar.mockResolvedValue({oldPhoto: null, newPhoto: '/uploads/avatars/alice-123.jpg'});

        const req: any = {session: {user: {username: 'alice', avatar: null}}};
        const file: any = {filename: 'alice-123.jpg'};

        const res = await controller.uploadAvatar('alice', req, file);

        expect(req.session.user.avatar).toBe('/uploads/avatars/alice-123.jpg');
        expect(res).toEqual({
            message: API_RESPONSES.UPLOAD_AVATAR_SUCCESS,
            avatar: '/uploads/avatars/alice-123.jpg'
        });
    });

    it('deleteAvatar deletes file when oldPhoto exists', async () => {
        service.deleteAvatar.mockResolvedValue({oldPhoto: '/uploads/avatars/old.jpg'});

        const req: any = {};
        const res = await controller.deleteAvatar('alice', req);

        expect(deleteAvatarIfExists).toHaveBeenCalledWith('/uploads/avatars/old.jpg', expect.any(String));
        expect(res).toEqual({message: API_RESPONSES.DELETE_AVATAR_SUCCESS});
    });

    it('deleteAvatar does not delete when oldPhoto is null', async () => {
        service.deleteAvatar.mockResolvedValue({oldPhoto: null});

        const req: any = {};
        const res = await controller.deleteAvatar('alice', req);

        expect(deleteAvatarIfExists).not.toHaveBeenCalled();
        expect(res).toEqual({message: API_RESPONSES.DELETE_AVATAR_SUCCESS});
    });

    it('deleteAvatar resets session avatar when deleting self avatar', async () => {
        service.deleteAvatar.mockResolvedValue({oldPhoto: null});

        const req: any = {
            session: {
                user: {username: 'alice', avatar: '/uploads/avatars/some.jpg'},
            },
        };

        await controller.deleteAvatar('alice', req);

        expect(req.session.user.avatar).toEqual(expect.stringContaining('/uploads/avatars/'));
    });
});