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
    const {session, params} = request;
    const sessionUser = session?.user;
    const targetUsername = params.username;

    if (sessionUser.username !== targetUsername && !sessionUser.isAdmin) {
      throw new ForbiddenException(API_RESPONSES.NOT_OWNER_OR_ADMIN);
    }

    return true;
  }
}
