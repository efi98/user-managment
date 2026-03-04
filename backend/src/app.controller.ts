import { Controller, Get } from '@nestjs/common';
import {WELCOME_MESSAGE} from '@consts';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return WELCOME_MESSAGE;
  }

  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
