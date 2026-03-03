import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@src/common';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
  });

  it('should throw UnauthorizedException when session.user is missing', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          session: {},
        }),
      }),
    } as ExecutionContext;

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(
      UnauthorizedException,
    );
  });

  it('should return true when user is logged in', () => {
    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          session: {
            user: { username: 'testuser' },
          },
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(mockExecutionContext)).toBe(true);
  });
});
