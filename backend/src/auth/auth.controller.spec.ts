import { Test } from '@nestjs/testing';
import { ERRORS } from '@errors';
import {AuthController} from "@auth/auth.controller";
import {AuthService} from "@auth/auth.service";

describe('AuthController', () => {
    let controller: AuthController;
    let authService: { login: jest.Mock };

    beforeEach(async () => {
        authService = { login: jest.fn() };

        const mod = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: authService }],
        }).compile();

        controller = mod.get(AuthController);
    });

    it('login sets session user and returns json', async () => {
        const safeUser = { username: 'alice', isAdmin: false } as any;
        authService.login.mockResolvedValue(safeUser);

        const req: any = { session: {} };
        const res: any = { json: jest.fn().mockReturnValue('OK') };

        const out = await controller.login({ username: 'alice', password: 'pass' }, req, res);

        expect(authService.login).toHaveBeenCalled();
        expect(req.session.user).toEqual(safeUser);
        expect(res.json).toHaveBeenCalledWith(safeUser);
        expect(out).toBe('OK');
    });

    it('logout returns 204 on success and clears cookie', () => {
        process.env.COOKIE_NAME = 'sid';

        const destroy = jest.fn((cb: any) => cb(null));
        const req: any = { session: { destroy } };
        const res: any = {
            clearCookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
        };

        controller.logout(req, res);

        expect(res.clearCookie).toHaveBeenCalledWith('sid');
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    it('logout returns error payload if destroy fails', () => {
        const destroy = jest.fn((cb: any) => cb(new Error('fail')));
        const req: any = { session: { destroy } };
        const res: any = {
            clearCookie: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn(),
        };

        controller.logout(req, res);

        expect(res.status).toHaveBeenCalledWith(ERRORS.FAILED_LOGOUT.status);
        expect(res.json).toHaveBeenCalledWith({
            error: ERRORS.FAILED_LOGOUT.message,
            code: ERRORS.FAILED_LOGOUT.code,
        });
    });

    it('me returns session user', () => {
        const req: any = { session: { user: { username: 'alice' } } };
        expect(controller.getMe(req)).toEqual({ username: 'alice' });
    });
});