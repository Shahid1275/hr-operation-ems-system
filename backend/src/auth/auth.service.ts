import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { generateToken, hashToken } from '../common/utils/token.util';
import { Role, SignupPortal, SystemRole } from '@prisma/client';

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  // ── Register ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const signupPortal =
      dto.signupPortal === 'admin'
        ? SignupPortal.ADMIN_PORTAL
        : SignupPortal.EMPLOYEE_PORTAL;
    const systemRole =
      dto.signupPortal === 'admin'
        ? SystemRole.COMPANY_ADMIN
        : SystemRole.EMPLOYEE;
    const role = dto.signupPortal === 'admin' ? Role.ADMIN : Role.USER;

    const user = await this.usersService.create({
      email: dto.email.toLowerCase().trim(),
      plainPassword: dto.password,
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      signupPortal,
      systemRole,
      role,
    });

    // Generate and store email verification token
    const rawToken = generateToken();
    await this.usersService.setEmailVerifyToken(
      user.id,
      hashToken(rawToken),
      new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 h
    );

    // Fire-and-forget — never block registration on email failure
    this.emailService
      .sendEmailVerification(user.email, rawToken, user.firstName ?? undefined)
      .catch((err: Error) =>
        console.error(
          `[AuthService] Registration email failed for ${user.email}: ${err.message}. Check backend logs and SMTP_* in .env (Gmail needs an App Password).`,
        ),
      );

    const tokens = await this.issueTokens(user.id, user.email);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
      message: `A verification email has been sent to ${user.email}. Please verify your account before logging in.`,
    };
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase().trim());
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const expectedPortal =
      dto.portal === 'admin'
        ? SignupPortal.ADMIN_PORTAL
        : SignupPortal.EMPLOYEE_PORTAL;
    if (user.signupPortal !== expectedPortal) {
      throw new ForbiddenException(
        user.signupPortal === SignupPortal.ADMIN_PORTAL
          ? 'This account was registered on the Admin portal. Use the Admin portal to sign in.'
          : 'This account was registered on the Employee portal. Use the Employee portal to sign in.',
      );
    }

    const requireVerification =
      this.config.get('REQUIRE_EMAIL_VERIFICATION') === 'true';
    if (requireVerification && !user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in',
      );
    }

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user.id, user.email);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  // ── Refresh token ─────────────────────────────────────────────────────────

  async refreshToken(dto: RefreshTokenDto) {
    const tokenHash = hashToken(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Rotate: delete old token, issue new pair
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(stored.user.id, stored.user.email);
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(userId: number, dto: RefreshTokenDto) {
    const tokenHash = hashToken(dto.refreshToken);
    await this.prisma.refreshToken.deleteMany({
      where: { userId, tokenHash },
    });
    return { message: 'Logged out successfully' };
  }

  // ── Forgot password ───────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email.toLowerCase().trim());

    // Always return the same message — prevents email enumeration
    if (user && user.isActive) {
      const rawToken = generateToken();
      await this.usersService.setPasswordResetToken(
        user.id,
        hashToken(rawToken),
        new Date(Date.now() + 30 * 60 * 1000), // 30 min
      );
      this.emailService
        .sendPasswordReset(user.email, rawToken, user.firstName ?? undefined)
        .catch((err: Error) =>
          console.error(`[AuthService] Password reset email failed for ${user.email}: ${err.message}`),
        );
    }

    return { message: 'If that email exists, a reset link has been sent' };
  }

  // ── Reset password ────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByPasswordResetToken(
      hashToken(dto.token),
    );

    if (
      !user ||
      !user.passwordResetExpiry ||
      user.passwordResetExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, passwordHash);
    await this.usersService.clearPasswordResetToken(user.id);

    // Invalidate all sessions after password change
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return { message: 'Password reset successfully. Please log in again.' };
  }

  async resetPasswordPage(token: string): Promise<string> {
    // Validate token first — show error page right away if bad
    const user = token
      ? await this.usersService.findByPasswordResetToken(hashToken(token)).catch(() => null)
      : null;

    const isValid =
      !!user &&
      !!user.passwordResetExpiry &&
      user.passwordResetExpiry >= new Date();

    if (!isValid) {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Link Expired</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'Inter',Arial,sans-serif;background:linear-gradient(135deg,#fff1f2 0%,#fdf4ff 100%)}
    .card{background:#fff;border-radius:24px;padding:56px 48px 48px;max-width:460px;width:90%;text-align:center;box-shadow:0 8px 48px rgba(220,38,38,0.10);animation:fadeUp 0.6s ease both}
    @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
    .icon-ring{width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#ef4444,#dc2626);display:inline-flex;align-items:center;justify-content:center;margin-bottom:28px;box-shadow:0 6px 28px rgba(220,38,38,0.28)}
    h1{font-size:28px;font-weight:800;color:#1f2937;margin-bottom:12px}
    .subtitle{font-size:16px;color:#6b7280;line-height:1.65;margin-bottom:32px}
    .reasons{background:#fef2f2;border-radius:14px;padding:18px 20px;margin-bottom:32px;text-align:left}
    .reasons p{font-size:13px;font-weight:600;color:#991b1b;margin-bottom:10px}
    .reasons ul{list-style:none}
    .reasons li{font-size:13px;color:#7f1d1d;padding:4px 0 4px 18px;position:relative}
    .reasons li::before{content:"•";position:absolute;left:0;color:#ef4444}
    .btn{display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:50px;box-shadow:0 4px 18px rgba(124,58,237,0.28)}
    .footer-note{font-size:12px;color:#9ca3af;margin-top:28px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-ring">
      <svg width="44" height="44" fill="none" viewBox="0 0 24 24">
        <path d="M6 18L18 6M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
    <h1>Link Expired</h1>
    <p class="subtitle">This password reset link is invalid or has expired. Please request a new one.</p>
    <div class="reasons">
      <p>Possible reasons:</p>
      <ul>
        <li>The link expired (valid for 30 minutes only)</li>
        <li>The link was already used</li>
        <li>The link was copied incorrectly</li>
      </ul>
    </div>
    <a href="http://localhost:3000/docs" class="btn">Back to App</a>
    <p class="footer-note">© ${new Date().getFullYear()} Employee Management System</p>
  </div>
</body>
</html>`;
    }

    // Valid token — show password reset form
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Set New Password</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:'Inter',Arial,sans-serif;background:linear-gradient(135deg,#eef2ff 0%,#f5f3ff 50%,#fdf4ff 100%)}
    .card{background:#fff;border-radius:24px;padding:52px 44px 44px;max-width:460px;width:90%;box-shadow:0 8px 48px rgba(79,70,229,0.13);animation:fadeUp 0.6s ease both}
    @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
    .icon-ring{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:inline-flex;align-items:center;justify-content:center;margin-bottom:24px;box-shadow:0 6px 28px rgba(124,58,237,0.30)}
    .header{text-align:center;margin-bottom:32px}
    h1{font-size:26px;font-weight:800;color:#1e1b4b;margin-bottom:8px;letter-spacing:-0.5px}
    .subtitle{font-size:15px;color:#6b7280;line-height:1.6}
    label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:7px}
    .field{margin-bottom:20px;position:relative}
    .input-wrap{position:relative;display:block}
    .input-wrap input{width:100%;padding:14px 48px 14px 16px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:15px;font-family:inherit;color:#111827;outline:none;transition:border-color 0.2s,box-shadow 0.2s;background:#f9fafb;box-shadow:0 1px 4px rgba(79,70,229,0.06)}
    .input-wrap input:focus{border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,0.13);background:#fff}
    .input-wrap input::placeholder{color:#9ca3af}
    .eye-btn{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px;display:flex;align-items:center}
    .eye-btn:hover{color:#7c3aed}
    .strength-bar{height:4px;border-radius:2px;margin-top:8px;background:#e5e7eb;overflow:hidden}
    .strength-fill{height:100%;border-radius:2px;transition:width 0.3s,background 0.3s;width:0}
    .strength-label{font-size:11px;color:#9ca3af;margin-top:4px}
    .error-msg{font-size:13px;color:#ef4444;margin-top:6px;display:none}
    .btn{width:100%;padding:15px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 18px rgba(124,58,237,0.30);transition:transform 0.15s,box-shadow 0.15s;margin-top:8px}
    .btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(124,58,237,0.38)}
    .btn:disabled{opacity:0.65;cursor:not-allowed}
    .success-state,.error-state{display:none;text-align:center;padding:12px 0}
    .big-icon{font-size:64px;margin-bottom:16px}
    .success-state h2{font-size:24px;font-weight:800;color:#065f46;margin-bottom:10px}
    .error-state h2{font-size:24px;font-weight:800;color:#991b1b;margin-bottom:10px}
    .state-text{font-size:15px;color:#6b7280;line-height:1.6;margin-bottom:28px}
    .link-btn{display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 36px;border-radius:50px;box-shadow:0 4px 18px rgba(124,58,237,0.28)}
    .footer-note{font-size:12px;color:#9ca3af;margin-top:28px;text-align:center}
  </style>
</head>
<body>
<div class="card">
  <div id="form-state">
    <div class="header">
      <div class="icon-ring">
        <svg width="36" height="36" fill="none" viewBox="0 0 24 24">
          <rect x="5" y="11" width="14" height="10" rx="2" fill="rgba(255,255,255,0.25)"/>
          <path d="M8 11V7a4 4 0 018 0v4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </div>
      <h1>Set New Password</h1>
      <p class="subtitle">Choose a strong password for your account.</p>
    </div>
    <form id="resetForm" onsubmit="handleSubmit(event)">
      <div class="field">
        <label for="newPassword">New Password</label>
        <div class="input-wrap">
          <input type="password" id="newPassword" placeholder="Enter new password" oninput="checkStrength(this.value)" required/>
          <button type="button" class="eye-btn" onclick="toggleEye('newPassword', this)">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="strength-bar"><div class="strength-fill" id="strengthFill"></div></div>
        <div class="strength-label" id="strengthLabel"></div>
      </div>
      <div class="field">
        <label for="confirmPassword">Confirm Password</label>
        <div class="input-wrap">
          <input type="password" id="confirmPassword" placeholder="Re-enter new password" required/>
          <button type="button" class="eye-btn" onclick="toggleEye('confirmPassword', this)">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="error-msg" id="matchError">Passwords do not match</div>
      </div>
      <button type="submit" class="btn" id="submitBtn">Reset Password</button>
    </form>
  </div>

  <div class="success-state" id="successState">
    <div class="big-icon">🎉</div>
    <h2>Password Reset!</h2>
    <p class="state-text">Your password has been successfully updated. All active sessions have been signed out for your security.</p>
    <a href="http://localhost:3000/docs" class="link-btn">Go to App</a>
  </div>

  <div class="error-state" id="errorState">
    <div class="big-icon">❌</div>
    <h2>Something Went Wrong</h2>
    <p class="state-text" id="errorText">Could not reset your password. The link may have expired.</p>
    <a href="http://localhost:3000/docs" class="link-btn">Back to App</a>
  </div>

  <p class="footer-note">© ${new Date().getFullYear()} Employee Management System</p>
</div>
<script>
  const TOKEN = '${token}';

  const EYE_ICON = '<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>';
  const EYE_OFF_ICON = '<svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a18.08 18.08 0 015.06-5.94M9.9 4.24A9.77 9.77 0 0112 4c7 0 11 8 11 8a18.13 18.13 0 01-2.13 3.27M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function toggleEye(id, btn) {
    const inp = document.getElementById(id);
    const isHidden = inp.type === 'password';
    inp.type = isHidden ? 'text' : 'password';
    btn.innerHTML = isHidden ? EYE_OFF_ICON : EYE_ICON;
  }

  function checkStrength(val) {
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const colors = ['#ef4444','#f97316','#eab308','#22c55e'];
    const labels = ['Weak','Fair','Good','Strong'];
    const widths = ['25%','50%','75%','100%'];
    if (val.length === 0) { fill.style.width='0'; label.textContent=''; return; }
    fill.style.width = widths[score-1] || '25%';
    fill.style.background = colors[score-1] || '#ef4444';
    label.textContent = labels[score-1] || 'Weak';
    label.style.color = colors[score-1] || '#ef4444';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    const matchErr = document.getElementById('matchError');

    if (newPassword !== confirm) {
      matchErr.style.display = 'block';
      return;
    }
    matchErr.style.display = 'none';

    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = 'Resetting…';

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: TOKEN, newPassword })
      });
      if (res.ok) {
        document.getElementById('form-state').style.display = 'none';
        document.getElementById('successState').style.display = 'block';
      } else {
        const data = await res.json().catch(() => ({}));
        document.getElementById('errorText').textContent = data?.message || 'Could not reset your password. The link may have expired.';
        document.getElementById('form-state').style.display = 'none';
        document.getElementById('errorState').style.display = 'block';
      }
    } catch {
      document.getElementById('errorText').textContent = 'Network error. Please try again.';
      document.getElementById('form-state').style.display = 'none';
      document.getElementById('errorState').style.display = 'block';
    }
  }
</script>
</body>
</html>`;
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.usersService.findByEmailVerifyToken(
      hashToken(dto.token),
    );

    if (
      !user ||
      !user.emailVerifyExpiry ||
      user.emailVerifyExpiry < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.usersService.markEmailVerified(user.id);
    return { message: 'Email verified successfully' };
  }

  async verifyEmailPage(token: string): Promise<string> {
    const fe = (this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
    let success = false;
    let firstName = '';
    try {
      const user = await this.usersService.findByEmailVerifyToken(
        hashToken(token),
      );
      if (user && user.emailVerifyExpiry && user.emailVerifyExpiry >= new Date()) {
        await this.usersService.markEmailVerified(user.id);
        firstName = user.firstName ?? '';
        success = true;
      }
    } catch {
      success = false;
    }

    if (success) {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Email Verified!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Inter', Arial, sans-serif; background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #fdf4ff 100%); }
    .card { background: #fff; border-radius: 24px; padding: 56px 48px 48px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 8px 48px rgba(79,70,229,0.13); animation: fadeUp 0.6s ease both; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
    .icon-ring { width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 28px; box-shadow: 0 6px 28px rgba(79,70,229,0.30); animation: pop 0.5s 0.3s ease both; }
    @keyframes pop { from { transform:scale(0.6); opacity:0; } to { transform:scale(1); opacity:1; } }
    .icon-ring svg { animation: checkDraw 0.5s 0.7s ease both; }
    @keyframes checkDraw { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }
    h1 { font-size: 28px; font-weight: 800; color: #1e1b4b; margin-bottom: 12px; letter-spacing: -0.5px; }
    .subtitle { font-size: 16px; color: #6b7280; line-height: 1.65; margin-bottom: 36px; }
    .highlight { color: #4f46e5; font-weight: 600; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: #ecfdf5; color: #065f46; font-size: 13px; font-weight: 600; border-radius: 20px; padding: 6px 16px; margin-bottom: 36px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 40px; border-radius: 50px; box-shadow: 0 4px 18px rgba(79,70,229,0.30); transition: transform 0.15s, box-shadow 0.15s; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(79,70,229,0.38); }
    .footer-note { font-size: 12px; color: #9ca3af; margin-top: 28px; }
    .steps { display: flex; gap: 12px; margin: 28px 0; }
    .step { flex: 1; background: #f9fafb; border-radius: 12px; padding: 14px 10px; font-size: 13px; color: #374151; }
    .step strong { display: block; font-size: 20px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-ring">
      <svg width="44" height="44" fill="none" viewBox="0 0 24 24">
        <path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h1>Email Verified!</h1>
    <p class="subtitle">
      ${firstName ? `Welcome, <span class="highlight">${firstName}</span>! Your` : 'Your'} email address has been
      successfully verified. Your account is now fully activated.
    </p>
    <span class="badge">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#065f46" stroke-width="2" stroke-linecap="round"/></svg>
      Account Activated
    </span>
    <div class="steps">
      <div class="step"><strong>✅</strong>Verified</div>
      <div class="step"><strong>🔐</strong>Login Now</div>
      <div class="step"><strong>🚀</strong>Get Started</div>
    </div>
    <a href="${fe}/login" class="btn">Go to Sign In</a>
    <p class="footer-note">© ${new Date().getFullYear()} Employee Management System</p>
  </div>
</body>
</html>`;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verification Failed</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    body { min-height:100vh; display:flex; align-items:center; justify-content:center; font-family:'Inter',Arial,sans-serif; background:linear-gradient(135deg,#fff1f2 0%,#fdf4ff 100%); }
    .card { background:#fff; border-radius:24px; padding:56px 48px 48px; max-width:460px; width:90%; text-align:center; box-shadow:0 8px 48px rgba(220,38,38,0.10); animation:fadeUp 0.6s ease both; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:translateY(0);} }
    .icon-ring { width:96px; height:96px; border-radius:50%; background:linear-gradient(135deg,#ef4444,#dc2626); display:inline-flex; align-items:center; justify-content:center; margin-bottom:28px; box-shadow:0 6px 28px rgba(220,38,38,0.28); }
    h1 { font-size:28px; font-weight:800; color:#1f2937; margin-bottom:12px; }
    .subtitle { font-size:16px; color:#6b7280; line-height:1.65; margin-bottom:32px; }
    .reasons { background:#fef2f2; border-radius:14px; padding:18px 20px; margin-bottom:32px; text-align:left; }
    .reasons p { font-size:13px; font-weight:600; color:#991b1b; margin-bottom:10px; }
    .reasons ul { list-style:none; }
    .reasons li { font-size:13px; color:#7f1d1d; padding:4px 0 4px 18px; position:relative; }
    .reasons li::before { content:"•"; position:absolute; left:0; color:#ef4444; }
    .btn { display:inline-block; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; text-decoration:none; font-size:15px; font-weight:600; padding:14px 40px; border-radius:50px; box-shadow:0 4px 18px rgba(79,70,229,0.28); }
    .footer-note { font-size:12px; color:#9ca3af; margin-top:28px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-ring">
      <svg width="44" height="44" fill="none" viewBox="0 0 24 24">
        <path d="M6 18L18 6M6 6l12 12" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
    <h1>Verification Failed</h1>
    <p class="subtitle">
      We couldn't verify your email address. The link may be invalid or expired.
    </p>
    <div class="reasons">
      <p>Possible reasons:</p>
      <ul>
        <li>The verification link has expired (valid for 24 hours)</li>
        <li>The link was already used</li>
        <li>The link was copied incorrectly</li>
      </ul>
    </div>
    <a href="${fe}/pending-verification" class="btn">Request a New Link</a>
    <p class="footer-note">© ${new Date().getFullYear()} Employee Management System</p>
  </div>
</body>
</html>`;
  }

  /**
   * Public: request a new verification email by address (no JWT).
   * Same response whether or not the user exists (anti-enumeration).
   */
  async requestVerificationEmail(email: string) {
    const normalized = email.toLowerCase().trim();
    const generic = {
      message:
        'If an account exists and still needs verification, check your inbox (and spam) for a new link.',
    };

    const user = await this.usersService.findByEmail(normalized);
    if (!user || !user.isActive || user.isEmailVerified) {
      return generic;
    }

    const COOLDOWN_MS = 2 * 60 * 1000;
    if (user.emailVerifyExpiry && user.emailVerifyToken) {
      const assumedIssuedMs =
        user.emailVerifyExpiry.getTime() - 24 * 60 * 60 * 1000;
      if (Date.now() - assumedIssuedMs < COOLDOWN_MS) {
        return {
          message:
            'A verification link was sent recently. Please wait a couple of minutes before requesting again.',
        };
      }
    }

    const rawToken = generateToken();
    await this.usersService.setEmailVerifyToken(
      user.id,
      hashToken(rawToken),
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );

    if (!this.emailService.isSmtpAvailable()) {
      console.warn('[AuthService] requestVerificationEmail: SMTP not configured');
      return generic;
    }

    try {
      await this.emailService.sendEmailVerification(
        user.email,
        rawToken,
        user.firstName ?? undefined,
      );
    } catch (err) {
      console.error(
        `[AuthService] requestVerificationEmail send failed: ${(err as Error).message}`,
      );
    }

    return generic;
  }

  // ── Resend verification ───────────────────────────────────────────────────

  async resendVerification(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Cooldown: block if a token was issued within the last 5 minutes
    const COOLDOWN_MS = 5 * 60 * 1000;
    if (
      user.emailVerifyExpiry &&
      user.emailVerifyExpiry.getTime() - Date.now() > 24 * 60 * 60 * 1000 - COOLDOWN_MS
    ) {
      throw new BadRequestException(
        'A verification email was sent recently. Please wait 5 minutes before requesting another.',
      );
    }

    const rawToken = generateToken();
    await this.usersService.setEmailVerifyToken(
      user.id,
      hashToken(rawToken),
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );

    if (!this.emailService.isSmtpAvailable()) {
      throw new ServiceUnavailableException(
        'Email is not configured (set SMTP_HOST, SMTP_USER, and SMTP_PASS in the server .env). For local testing without mail, clear SMTP_HOST.',
      );
    }

    try {
      await this.emailService.sendEmailVerification(
        user.email,
        rawToken,
        user.firstName ?? undefined,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[AuthService] Resend verification email failed for ${user.email}: ${msg}`);
      throw new ServiceUnavailableException(
        `Could not send email: ${msg}. For Gmail use an App Password (not your normal password) and ensure MAIL_FROM matches SMTP_USER.`,
      );
    }

    return { message: 'Verification email sent. Please check your inbox (and spam).' };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async issueTokens(userId: number, email: string) {
    const user = await this.usersService.findById(userId);
    const accessToken = this.jwtService.sign({
      sub: userId,
      email,
      systemRole: user?.systemRole,
    });

    const rawRefreshToken = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

    await this.prisma.refreshToken.create({
      data: { tokenHash: hashToken(rawRefreshToken), userId, expiresAt },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private sanitizeUser(user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    systemRole?: string;
    signupPortal?: string;
    status?: string;
    companyId?: string | null;
    isEmailVerified: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      systemRole: user.systemRole,
      signupPortal: user.signupPortal,
      status: user.status,
      companyId: user.companyId,
      isEmailVerified: user.isEmailVerified,
    };
  }
}

