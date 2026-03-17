import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '@auth/auth.service';
import { LoginDto } from '@auth/dto';
import { AuthGuard } from '@common/guards';
import { destroySessionAndClearCookie } from '@common/helpers/session.helper';

/**
 * Authentication controller: handles login, logout, and retrieving the current user.
 */
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticate a user and store a safe user object on the session.
   *
   * @param loginDto - Credentials for login (username and password)
   * @param req - Express request object (session will be modified)
   * @param res - Express response object (used to return JSON)
   * @returns The safe user object as JSON (HTTP 200)
   */
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userSafe = await this.authService.login(loginDto);
    req.session.user = userSafe;
    return res.json(userSafe);
  }

  /**
   * Logout the current session and clear the session cookie.
   *
   * Returns HTTP 204 No Content.
   */
  @Post('logout')
  @HttpCode(204)
  logout(@Req() req: Request, @Res() res: Response) {
    destroySessionAndClearCookie(req, res);
  }

  /**
   * Return the currently authenticated user from the session.
   *
   * Protected by `AuthGuard`.
   *
   * @param req - Express request with session
   * @returns The safe user object stored on the session
   */
  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: Request) {
    return req.session.user;
  }
}
