import {ForbiddenException} from '@nestjs/common';
import {AdminChangeGuard} from '@src/common';

function makeCtx(req: any) {
    return {
        switchToHttp: () => ({getRequest: () => req}),
    } as any;
}

describe('AdminChangeGuard', () => {
    it('allows when isAdmin not in body', () => {
        const guard = new AdminChangeGuard();
        expect(
            guard.canActivate(
                makeCtx({session: {user: {username: 'bob', isAdmin: false}}, params: {username: 'alice'}, body: {}}),
            ),
        ).toBe(true);
    });

    it('throws when non admin tries to change isAdmin', () => {
        const guard = new AdminChangeGuard();
        expect(() =>
            guard.canActivate(
                makeCtx({
                    session: {user: {username: 'bob', isAdmin: false}},
                    params: {username: 'alice'},
                    body: {isAdmin: true},
                }),
            ),
        ).toThrow(ForbiddenException);
    });

    it('throws when non admin tries to change own isAdmin', () => {
        const guard = new AdminChangeGuard();
        expect(() =>
            guard.canActivate(
                makeCtx({
                    session: {user: {username: 'bob', isAdmin: false}},
                    params: {username: 'bob'},
                    body: {isAdmin: true},
                }),
            ),
        ).toThrow(ForbiddenException);
    });

    it('throws when admin tries to change own isAdmin', () => {
        const guard = new AdminChangeGuard();
        expect(() =>
            guard.canActivate(
                makeCtx({
                    session: {user: {username: 'admin', isAdmin: true}},
                    params: {username: 'admin'},
                    body: {isAdmin: false},
                }),
            ),
        ).toThrow(ForbiddenException);
    });

    it('allows when admin changes other user isAdmin', () => {
        const guard = new AdminChangeGuard();
        expect(
            guard.canActivate(
                makeCtx({
                    session: {user: {username: 'admin', isAdmin: true}},
                    params: {username: 'alice'},
                    body: {isAdmin: true},
                }),
            ),
        ).toBe(true);
    });
});