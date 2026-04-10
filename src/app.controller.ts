import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Redirect short links from emails to the correct API paths
  @Get('reset-password')
  redirectResetPassword(@Query('token') token: string, @Res() res: Response) {
    return res.redirect(302, `/api/auth/reset-password?token=${token ?? ''}`);
  }

  @Get('verify-email')
  redirectVerifyEmail(@Query('token') token: string, @Res() res: Response) {
    return res.redirect(302, `/api/auth/verify-email?token=${token ?? ''}`);
  }
}
