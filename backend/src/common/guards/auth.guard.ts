import {CanActivate, ExecutionContext, Injectable, UnauthorizedException,} from '@nestjs/common';
import {Request} from 'express';
import {API_RESPONSES} from '@api-res';

@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const {session} = request;

        if (!session?.user) {
            throw new UnauthorizedException(API_RESPONSES.UNAUTHORIZED);
        }

        return true;
    }
}
