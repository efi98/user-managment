/**
 * Guard that prevents unauthorized changes to a user's `isAdmin` flag.
 *
 * Behavior:
 * - If the request body does not include `isAdmin`, the change is allowed.
 * - Only users with `isAdmin === true` may change another user's `isAdmin`.
 * - An admin may not change their own `isAdmin` flag.
 *
 * When a request is not permitted this guard throws a ForbiddenException
 * with a descriptive message from `API_RESPONSES`.
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { API_RESPONSES } from '@api-res';

@Injectable()
export class AdminChangeGuard implements CanActivate {
  /**
   * Determines whether the current request is allowed to change the target user's `isAdmin` flag.
   *
   * @param context - Nest execution context for the current request
   * @returns `true` when the change is allowed
   * @throws {ForbiddenException} when the requester is not allowed to change `isAdmin`
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const {body, session, params} = request;
    const sessionUser = session?.user;
    const targetUsername = params.username;

    // If isAdmin is not being changed, allow
    if (body.isAdmin === undefined) {
      return true;
    }

    // Only admins can change isAdmin
    if (!sessionUser.isAdmin) {
      throw new ForbiddenException(API_RESPONSES.CANNOT_CHANGE_ISADMIN_NOT_ADMIN);
    }

    // Admins cannot change their own isAdmin status
    if (sessionUser.username === targetUsername) {
      throw new ForbiddenException(API_RESPONSES.CANNOT_CHANGE_ISADMIN_SELF);
    }

    return true;
  }
}
