import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ERRORS } from '@errors';

@Injectable()
export class AdminChangeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionUser = request.session?.user;
    const targetUsername = request.params.username;
    const body = request.body;

    // If isAdmin is not being changed, allow
    if (body.isAdmin === undefined) {
      return true;
    }

    // Only admins can change isAdmin
    if (!sessionUser.isAdmin) {
      throw new ForbiddenException(ERRORS.PERMISSION_DENIED.message);
    }

    // Admins cannot change their own isAdmin status
    if (sessionUser.username === targetUsername) {
      throw new ForbiddenException('Admins cannot change their own isAdmin');
    }

    return true;
  }
}
