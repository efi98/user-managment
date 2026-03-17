import {CanActivate, ExecutionContext, ForbiddenException, Injectable,} from '@nestjs/common';
import {Request} from 'express';
import {API_RESPONSES} from '@api-res';

/**
 * Guard that allows access only to the resource owner (self) or an admin.
 *
 * Throws a ForbiddenException when the current session user is neither the
 * owner of the target resource nor an admin.
 */
@Injectable()
export class SelfOrAdminGuard implements CanActivate {
    /**
     * Check whether the current session user is the owner indicated by
     * `params.username` or has `isAdmin === true`.
     *
     * @param context - Nest execution context for the current request
     * @returns true when the requester is the owner or an admin
     * @throws {ForbiddenException} when the requester is not authorized
     */
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const {session, params} = request;
        const sessionUser = session?.user;
        const targetUsername = params.username;

        if (!sessionUser || (sessionUser.username !== targetUsername && !sessionUser.isAdmin)) {
            throw new ForbiddenException(API_RESPONSES.NOT_OWNER_OR_ADMIN);
        }

        return true;
    }
}
