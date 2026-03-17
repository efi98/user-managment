import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import {Request} from 'express';
import {API_RESPONSES} from '@api-res';

/**
 * Guard that ensures a request has an authenticated session user.
 *
 * Throws UnauthorizedException when no session user is present on the request.
 */
@Injectable()
export class AuthGuard implements CanActivate {
    /**
     * Allow the request only when an authenticated session user exists.
     *
     * @param context - Nest execution context for the current request
     * @returns true when a session user is present
     * @throws {UnauthorizedException} when the request is unauthenticated
     */
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const {session} = request;

        if (!session?.user) {
            throw new UnauthorizedException(API_RESPONSES.UNAUTHORIZED);
        }

        return true;
    }
}
