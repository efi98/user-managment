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

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('logout')
  @HttpCode(204)
  logout(@Req() req: Request, @Res() res: Response) {
    destroySessionAndClearCookie(req, res);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: Request) {
    return req.session.user;
  }
}
