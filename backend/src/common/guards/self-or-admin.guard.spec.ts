import {ForbiddenException} from '@nestjs/common';
import {SelfOrAdminGuard} from '@src/common';

function makeCtx(req: any) {
    return {
        switchToHttp: () => ({getRequest: () => req}),
    } as any;
}

describe('SelfOrAdminGuard', () => {
    it('throws when no session user', () => {
        const guard = new SelfOrAdminGuard();
        expect(() =>
            guard.canActivate(makeCtx({session: {}, params: {username: 'alice'}})),
        ).toThrow(ForbiddenException);
    });

    it('allows when same username', () => {
        const guard = new SelfOrAdminGuard();
        expect(
            guard.canActivate(
                makeCtx({session: {user: {username: 'alice', isAdmin: false}}, params: {username: 'alice'}}),
            ),
        ).toBe(true);
    });

    it('allows when admin', () => {
        const guard = new SelfOrAdminGuard();
        expect(
            guard.canActivate(
                makeCtx({session: {user: {username: 'boss', isAdmin: true}}, params: {username: 'alice'}}),
            ),
        ).toBe(true);
    });

    it('throws when different user and not admin', () => {
        const guard = new SelfOrAdminGuard();
        expect(() =>
            guard.canActivate(
                makeCtx({session: {user: {username: 'bob', isAdmin: false}}, params: {username: 'alice'}}),
            ),
        ).toThrow(ForbiddenException);
    });
});