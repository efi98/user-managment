import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { API_RESPONSES } from '@api-res';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionUser = request.session?.user;
    const targetUsername = request.params.username;

    if (!sessionUser) {
      throw new ForbiddenException(API_RESPONSES.PERMISSION_DENIED.message);
    }

    if (sessionUser.username !== targetUsername && !sessionUser.isAdmin) {
      throw new ForbiddenException(API_RESPONSES.PERMISSION_DENIED.message);
    }

    return true;
  }
}
