import {UnauthorizedException} from '@nestjs/common';
import {AuthGuard} from '@src/common';

function makeCtx(req: any) {
    return {
        switchToHttp: () => ({getRequest: () => req}),
    } as any;
}

describe('AuthGuard', () => {
    it('throws if no session user', () => {
        const guard = new AuthGuard();
        expect(() => guard.canActivate(makeCtx({session: {}}))).toThrow(UnauthorizedException);
    });

    it('allows when session user exists', () => {
        const guard = new AuthGuard();
        expect(guard.canActivate(makeCtx({session: {user: {username: 'a'}}}))).toBe(true);
    });
});