import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

function frontendBase(): string {
  return (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('login')
  redirectLogin(@Query() query: Record<string, string | string[] | undefined>, @Res() res: Response) {
    const fe = frontendBase();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      const val = Array.isArray(v) ? v[0] : v;
      if (val !== undefined) qs.set(k, val);
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return res.redirect(302, `${fe}/login${suffix}`);
  }

  @Get('register')
  redirectRegister(@Query() query: Record<string, string | string[] | undefined>, @Res() res: Response) {
    const fe = frontendBase();
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      const val = Array.isArray(v) ? v[0] : v;
      if (val !== undefined) qs.set(k, val);
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return res.redirect(302, `${fe}/register${suffix}`);
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
