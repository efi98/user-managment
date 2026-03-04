import { Controller, Get } from '@nestjs/common';
import { CONSTS } from '@consts';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return CONSTS.WELCOME_MESSAGE;
  }

  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
