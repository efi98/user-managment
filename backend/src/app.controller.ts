import { Controller, Get } from '@nestjs/common';
import {WELCOME_MESSAGE} from '@consts';

/**
 * Minimal application controller providing root and health endpoints.
 */
@Controller()
export class AppController {
  /**
   * Return a friendly welcome message for the API root.
   */
  @Get()
  getRoot() {
    return WELCOME_MESSAGE;
  }

  /**
   * Basic health check endpoint used by uptime monitoring.
   */
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
