import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestVerificationEmailDto } from './dto/request-verification-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Register ─────────────────────────────────────────────────────────────

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Requires signupPortal: admin | employee. Admin → COMPANY_ADMIN (login only via admin portal). Employee → EMPLOYEE (login only via employee portal).',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns accessToken, refreshToken, and user object. A verification email is sent.',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Returns accessToken (15 min) and refreshToken (30 days)',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account disabled' })
  @ApiResponse({
    status: 403,
    description: 'Wrong portal — account was registered on the other portal (admin vs employee)',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('request-verification-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request verification email by address (no login required)',
    description:
      'Use when you cannot log in yet because email is unverified. Rate-limited by cooldown on the server.',
  })
  @ApiResponse({ status: 200, description: 'Generic success message (anti-enumeration)' })
  requestVerificationEmail(@Body() dto: RequestVerificationEmailDto) {
    return this.authService.requestVerificationEmail(dto.email);
  }

  // ── Refresh token ─────────────────────────────────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange refresh token for new access + refresh tokens',
    description: 'Tokens are rotated on every call — the old refresh token is invalidated.',
  })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout current session (invalidates this refresh token)' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@CurrentUser() user: AuthUser, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(user.id, dto);
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  @Get('profile')
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns user object (no sensitive fields)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: AuthUser) {
    return user;
  }

  // ── Forgot password ───────────────────────────────────────────────────────

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a password reset email',
    description: 'Always returns 200 to prevent email enumeration. Token expires in 30 min.',
  })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // ── Reset password ────────────────────────────────────────────────────────

  @Get('reset-password')
  @ApiOperation({ summary: 'Redirect password reset link to frontend page' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend reset-password route' })
  async resetPasswordPage(@Query('token') token: string, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token ?? '')}`;
    return res.redirect(302, redirectUrl);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using token received in email',
    description: 'All active sessions are invalidated after a successful reset.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ── Email verification ────────────────────────────────────────────────────

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email via link from email (browser redirect)' })
  @ApiResponse({ status: 200, description: 'Returns HTML success or error page' })
  async verifyEmailLink(@Query('token') token: string, @Res() res: Response) {
    const html = await this.authService.verifyEmailPage(token ?? '');
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email using token received in email (API)' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Resend the email verification link' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  resendVerification(@CurrentUser() user: AuthUser) {
    return this.authService.resendVerification(user.id);
  }
}

