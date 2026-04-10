import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: config.get<number>('SMTP_PORT') ?? 587,
        secure: config.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASS'),
        },
      });
    } else {
      console.warn('[EmailService] SMTP_HOST not set — running in dev mode. Emails will be logged to console only.');
    }
  }

  /** Verify SMTP connection on startup so misconfiguration is caught early */
  async onModuleInit() {
    if (this.transporter) {
      try {
        await this.transporter.verify();
        console.log('[EmailService] SMTP connection verified successfully');
      } catch (err) {
        console.error(
          `[EmailService] SMTP connection failed — emails will NOT be sent. Check SMTP_* env vars. Error: ${(err as Error).message}`,
        );
        // Do NOT throw — app should still start; emails just won't send
        this.transporter = null;
      }
    }
  }

  async sendPasswordReset(
    email: string,
    rawToken: string,
    firstName?: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const url = `${appUrl}/api/auth/reset-password?token=${rawToken}`;
    const name = firstName ?? 'there';
    const subject = '🔐 Reset your password — Employee Management System';
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset Your Password</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f0f4ff; font-family: 'Inter', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 30px rgba(60,80,180,0.10); }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 44px 40px 36px; text-align: center; }
    .header-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 18px; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.80); font-size: 14px; margin-top: 6px; }
    .body { padding: 40px 40px 32px; }
    .greeting { font-size: 17px; font-weight: 600; color: #1e1b4b; margin-bottom: 14px; }
    .text { font-size: 15px; color: #4b5563; line-height: 1.7; margin-bottom: 20px; }
    .btn-wrap { text-align: center; margin: 32px 0 28px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff !important; text-decoration: none; font-size: 16px; font-weight: 600; padding: 15px 44px; border-radius: 50px; letter-spacing: 0.2px; box-shadow: 0 4px 18px rgba(124,58,237,0.35); }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .link-fallback { font-size: 13px; color: #6b7280; line-height: 1.6; }
    .link-fallback a { color: #7c3aed; word-break: break-all; }
    .expires { display: inline-block; background: #fef3c7; color: #92400e; font-size: 13px; font-weight: 500; border-radius: 20px; padding: 5px 14px; margin-bottom: 24px; }
    .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
    .warning-box p { font-size: 13px; color: #7f1d1d; }
    .footer { background: #f9fafb; padding: 22px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(255,255,255,0.25)"/>
          <path d="M8 11V7a4 4 0 018 0v4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </div>
      <h1>Reset Your Password</h1>
      <p>Employee Management System</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${name} 👋</p>
      <p class="text">
        We received a request to reset your password. Click the button below to create a new password.
        This link is valid for <strong>15 minutes</strong> only.
      </p>
      <span class="expires">⏰ Expires in 15 minutes</span>
      <div class="btn-wrap">
        <a href="${url}" class="btn">Reset My Password</a>
      </div>
      <div class="warning-box">
        <p>🔒 If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
      <hr class="divider" />
      <p class="link-fallback">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${url}">${url}</a>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Employee Management System · All rights reserved</p>
      <p style="margin-top:4px;">This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
    await this.send(email, subject, html, rawToken);
  }

  async sendEmailVerification(
    email: string,
    rawToken: string,
    firstName?: string,
  ): Promise<void> {
    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const url = `${appUrl}/api/auth/verify-email?token=${rawToken}`;
    const name = firstName ?? 'there';
    const subject = '— Employee Management System';
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify Your Email</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f0f4ff; font-family: 'Inter', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 30px rgba(60,80,180,0.10); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 44px 40px 36px; text-align: center; }
    .header-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.15); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 18px; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.80); font-size: 14px; margin-top: 6px; }
    .body { padding: 40px 40px 32px; }
    .greeting { font-size: 17px; font-weight: 600; color: #1e1b4b; margin-bottom: 14px; }
    .text { font-size: 15px; color: #4b5563; line-height: 1.7; margin-bottom: 20px; }
    .btn-wrap { text-align: center; margin: 32px 0 28px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff !important; text-decoration: none; font-size: 16px; font-weight: 600; padding: 15px 44px; border-radius: 50px; letter-spacing: 0.2px; box-shadow: 0 4px 18px rgba(79,70,229,0.35); }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .link-fallback { font-size: 13px; color: #6b7280; line-height: 1.6; }
    .link-fallback a { color: #4f46e5; word-break: break-all; }
    .expires { display: inline-block; background: #fef3c7; color: #92400e; font-size: 13px; font-weight: 500; border-radius: 20px; padding: 5px 14px; margin-bottom: 24px; }
    .footer { background: #f9fafb; padding: 22px 40px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-icon">
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.25)"/><path d="M8 12.5l3 3 5-6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <h1>Verify Your Email Address</h1>
      <p>Employee Management System</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${name} 👋</p>
      <p class="text">
        Welcome aboard! You're just one step away from accessing your account.
        Please click the button below to verify your email address and activate your account.
      </p>
      <span class="expires">⏰ This link expires in 24 hours</span>
      <div class="btn-wrap">
        <a href="${url}" class="btn">Verify My Email</a>
      </div>
      <hr class="divider" />
      <p class="link-fallback">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${url}">${url}</a>
      </p>
      <hr class="divider" />
      <p class="text" style="font-size:13px; color:#9ca3af;">
        If you did not create an account with Employee Management System, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Employee Management System · All rights reserved</p>
      <p style="margin-top:4px;">This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;
    await this.send(email, subject, html, rawToken);
  }

  private async send(
    to: string,
    subject: string,
    html: string,
    devToken?: string,
  ): Promise<void> {
    if (!this.transporter) {
      // Dev mode — SMTP not configured, log token to console for testing
      console.warn(`[DEV EMAIL] To: ${to} | Subject: "${subject}"`);
      if (devToken) {
        console.warn(`[DEV EMAIL] Token: ${devToken}`);
      }
      return;
    }

    const from = `"${this.config.get('MAIL_FROM_NAME', 'App')}" <${this.config.get('MAIL_FROM')}>`;
    try {
      await this.transporter.sendMail({ from, to, subject, html });
      console.log(`[EmailService] Email sent → ${to} | ${subject}`);
    } catch (err) {
      console.error(
        `[EmailService] Failed to send email to ${to} | Subject: "${subject}" | Error: ${(err as Error).message}`,
      );
      throw err; // Re-throw so callers using .catch() can handle it
    }
  }
}
