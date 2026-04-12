# Employee Management System — NestJS Backend
### Complete Production Reference Guide

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Environment Variables (.env)](#4-environment-variables-env)
5. [Database & Prisma Schema](#5-database--prisma-schema)
6. [Authentication System (Full Flow)](#6-authentication-system-full-flow)
   - [Register](#61-register)
   - [Email Verification](#62-email-verification)
   - [Login](#63-login)
   - [Refresh Token](#64-refresh-token)
   - [Logout / Logout All](#65-logout--logout-all)
   - [Forgot Password](#66-forgot-password)
   - [Reset Password](#67-reset-password)
   - [Resend Verification Email](#68-resend-verification-email)
   - [Get Profile](#69-get-profile)
7. [JWT Strategy & Guards](#7-jwt-strategy--guards)
8. [Role-Based Access Control (RBAC)](#8-role-based-access-control-rbac)
9. [Email Service](#9-email-service)
10. [Security Hardening](#10-security-hardening)
11. [API Endpoints Reference](#11-api-endpoints-reference)
12. [Running the Project](#12-running-the-project)
13. [Production Deployment Checklist](#13-production-deployment-checklist)
14. [Common Errors & Fixes](#14-common-errors--fixes)

---

## 1. Project Overview

This is a **production-grade NestJS REST API** for an Employee Management System. It provides:

- **Complete JWT authentication** — register, login, logout, token refresh
- **Email verification** — accounts must verify email before logging in
- **Password reset** — secure token-based reset via email link
- **Role-based access control** — `USER` and `ADMIN` roles
- **Beautiful HTML email templates** — styled emails for verification & password reset
- **Interactive HTML pages** — browser-friendly pages for email actions (verify, reset password form)
- **Swagger UI** — full API documentation at `/docs`
- **Production security** — Helmet headers, CORS, graceful shutdown, no-fallback secrets

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 (Express adapter) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Authentication | Passport.js + JWT (passport-jwt) |
| Password Hashing | bcrypt (cost factor 10) |
| Email | Nodemailer (Gmail SMTP / any SMTP) |
| API Docs | Swagger (@nestjs/swagger) |
| Validation | class-validator + class-transformer |
| Security | Helmet (HTTP headers) |
| Token Generation | Node.js built-in `crypto` module |

---

## 3. Folder Structure

```
src/
├── main.ts                         # App bootstrap: Helmet, CORS, Swagger, shutdown
├── app.module.ts                   # Root module — wires everything together
├── app.controller.ts               # Root routes: redirects /reset-password & /verify-email
├── app.service.ts                  # Health check
│
├── auth/                           # Everything authentication-related
│   ├── auth.controller.ts          # HTTP endpoints for all auth routes
│   ├── auth.service.ts             # Business logic + HTML page generation
│   ├── auth.module.ts              # Module wiring (JWT, Passport, UsersModule)
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser() — reads req.user
│   │   └── roles.decorator.ts          # @Roles(Role.ADMIN) — metadata setter
│   ├── dto/
│   │   ├── register.dto.ts         # POST /auth/register body
│   │   ├── login.dto.ts            # POST /auth/login body
│   │   ├── refresh-token.dto.ts    # POST /auth/refresh body
│   │   ├── forgot-password.dto.ts  # POST /auth/forgot-password body
│   │   ├── reset-password.dto.ts   # POST /auth/reset-password body
│   │   └── verify-email.dto.ts     # POST /auth/verify-email body
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       # Validates Bearer token on protected routes
│   │   └── roles.guard.ts          # Checks user.role matches @Roles() metadata
│   └── strategies/
│       └── jwt.strategy.ts         # Passport JWT strategy — validates token & loads user
│
├── users/
│   ├── users.module.ts
│   ├── users.service.ts            # All database operations on the User model
│   └── user.entity.ts
│
├── common/
│   ├── email/
│   │   ├── email.module.ts
│   │   └── email.service.ts        # Nodemailer + beautiful HTML templates
│   ├── filters/
│   │   └── global-exception.filter.ts  # Catches ALL unhandled exceptions
│   └── utils/
│       └── token.util.ts           # generateToken() and hashToken()
│
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts           # Prisma client wrapper

prisma/
├── schema.prisma                   # Database models: User, RefreshToken
└── migrations/                     # Auto-generated SQL migration history
```

---

## 4. Environment Variables (.env)

All configuration lives in `.env`. **Never commit this file to git.**

```env
# ── JWT ──────────────────────────────────────────────────────────────────────
# REQUIRED: Must be a random 64-char string in production.
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<your-64-char-random-string>
JWT_EXPIRES_IN=15m          # Access token lifetime (15 minutes recommended)

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
# If password contains special chars, URL-encode them: @ -> %40, # -> %23

# ── App ───────────────────────────────────────────────────────────────────────
APP_URL=http://localhost:3000          # Used in email links — set to real domain in prod
REQUIRE_EMAIL_VERIFICATION=true       # true = block login until email verified
CORS_ORIGINS=                         # Comma-separated allowed origins (empty = allow all)

# ── Email / SMTP ──────────────────────────────────────────────────────────────
# Leave SMTP_HOST empty -> dev mode (tokens logged to console, no real emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false                     # true = port 465 (SSL), false = port 587 (STARTTLS)
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx        # Gmail App Password (not your real password!)
MAIL_FROM=your@gmail.com
MAIL_FROM_NAME=Employee Management System
```

### Gmail App Password Setup
1. Go to `myaccount.google.com` → Security → 2-Step Verification (must be ON)
2. Go to Security → App Passwords
3. Create a new App Password for "Mail"
4. Copy the 16-character password (spaces are OK) into `SMTP_PASS`

---

## 5. Database & Prisma Schema

### Models

#### `User`
| Field | Type | Details |
|-------|------|---------|
| `id` | Int | Auto-increment primary key |
| `email` | String | Unique, always stored lowercase |
| `passwordHash` | String | bcrypt hash (cost 10) |
| `firstName` | String? | Optional |
| `lastName` | String? | Optional |
| `role` | Role enum | `USER` or `ADMIN`, default `USER` |
| `isActive` | Boolean | Default `true`. Set `false` to disable account |
| `isEmailVerified` | Boolean | Default `false`. Must be `true` to login |
| `lastLoginAt` | DateTime? | Updated on each successful login |
| `passwordResetToken` | String? | SHA-256 hash of reset token (unique) |
| `passwordResetExpiry` | DateTime? | Token expires after 15 minutes |
| `emailVerifyToken` | String? | SHA-256 hash of verify token (unique) |
| `emailVerifyExpiry` | DateTime? | Token expires after 24 hours |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated |

#### `RefreshToken`
| Field | Type | Details |
|-------|------|---------|
| `id` | Int | Auto-increment primary key |
| `tokenHash` | String | SHA-256 hash of refresh token (unique) |
| `userId` | Int | FK → User.id (cascade delete) |
| `expiresAt` | DateTime | 30 days from issuance |
| `createdAt` | DateTime | Auto-set on creation |

### Prisma Commands
```bash
# Apply migrations to database
npx prisma migrate dev

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Regenerate Prisma Client after schema changes
npx prisma generate

# Reset database (drops all data!)
npx prisma migrate reset
```

---

## 6. Authentication System (Full Flow)

### 6.1 Register

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "MyPass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**What happens:**
1. Email is normalized to lowercase + trimmed
2. `UsersService.create()` checks for duplicate email (throws `409` if exists)
3. Password is hashed with `bcrypt` (cost factor 10)
4. User is saved to database with `isEmailVerified: false`
5. A `emailVerifyToken` is generated:
   - `generateToken()` creates 32 random bytes as 64-char hex string
   - Stored in DB as `SHA-256(rawToken)` — the raw token is **never stored**
   - Expires in 24 hours
6. **Verification email is sent** (fire-and-forget — registration never blocks on email failure)
7. JWT access token + refresh token are issued immediately
8. Response includes `accessToken`, `refreshToken`, `user` object, and a `message`

**Response (201):**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "a3f4b7...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER",
    "isEmailVerified": false
  },
  "message": "A verification email has been sent to john@example.com. Please verify your account before logging in."
}
```

---

### 6.2 Email Verification

**Verification Email Link:**
`GET /api/auth/verify-email?token=<raw-token>`
(also reachable via shortcut `/verify-email?token=...` which auto-redirects)

**What happens:**
1. Raw token from URL is SHA-256 hashed
2. Database lookup by `emailVerifyToken` hash
3. Checks token exists AND `emailVerifyExpiry > now`
4. Marks user: `isEmailVerified: true`, clears token fields
5. Returns a **beautiful HTML success page** in the browser

**If token expired or invalid:** Returns a **beautiful HTML error page** with reasons listed.

**API version (for mobile/SPA clients):**
`POST /api/auth/verify-email`
```json
{ "token": "raw-token-from-email" }
```
Returns JSON `{ "message": "Email verified successfully" }`

---

### 6.3 Login

**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "MyPass123!"
}
```

**What happens:**
1. Email normalized to lowercase
2. User looked up by email — returns `401 Invalid credentials` if not found (not "user not found" — prevents enumeration)
3. Checks `isActive` — returns `401 Account is disabled` if false
4. `bcrypt.compare()` checks password — returns `401 Invalid credentials` if wrong
5. If `REQUIRE_EMAIL_VERIFICATION=true` and `isEmailVerified=false` → returns `401 Please verify your email address before logging in`
6. `lastLoginAt` updated
7. New access + refresh token pair issued

**Response (200):**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "a3f4b7...",
  "user": { ... }
}
```

---

### 6.4 Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Body:**
```json
{ "refreshToken": "old-refresh-token" }
```

**What happens:**
1. Old token is SHA-256 hashed and looked up in `refresh_tokens` table
2. If not found or expired — deletes it, returns `401`
3. Checks user is still active
4. **Token rotation:** old token deleted, new access + refresh pair issued
5. Each refresh token can only be used **once**

**Why token rotation?** If a refresh token is stolen and used before the real user, the real user's next `POST /refresh` will fail (token already deleted), alerting them to re-login.

---

### 6.5 Logout / Logout All

**Endpoint:** `POST /api/auth/logout` *(requires Bearer token)*

**Body:**
```json
{ "refreshToken": "current-session-refresh-token" }
```
Deletes only this session's refresh token from DB.

**Endpoint:** `POST /api/auth/logout-all` *(requires Bearer token)*

No body required. Deletes ALL refresh tokens for this user — logs out from every device.

---

### 6.6 Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

**Body:**
```json
{ "email": "john@example.com" }
```

**What happens:**
1. Email normalized to lowercase
2. User looked up silently (never reveals if email exists)
3. If user found and `isActive=true`:
   - Reset token generated (32 random bytes, 64-char hex)
   - SHA-256 hash stored in DB with 15-minute expiry
   - Beautiful HTML password reset email sent with link to `GET /api/auth/reset-password?token=...`
4. **Always returns the same 200 response** regardless of whether email exists (prevents user enumeration)

**Response (200):**
```json
{ "message": "If that email exists, a reset link has been sent" }
```

---

### 6.7 Reset Password

**Browser link from email:**
`GET /api/auth/reset-password?token=<raw-token>`

Shows a **beautiful interactive HTML form** with:
- Password strength indicator (Weak / Fair / Good / Strong with color bar)
- Show/hide password toggle (eye icon changes to eye-slash when visible)
- Confirm password match validation
- Submits via `fetch()` to `POST /api/auth/reset-password`
- Shows animated success or error page based on result

**API endpoint:**
`POST /api/auth/reset-password`
```json
{
  "token": "raw-token-from-email",
  "newPassword": "NewStrongPass456!"
}
```

**What happens:**
1. Token hashed, looked up in DB
2. Checks token exists AND `passwordResetExpiry > now`
3. New password bcrypt-hashed and saved
4. `passwordResetToken` and `passwordResetExpiry` cleared from user
5. **All refresh tokens for this user are deleted** — forces re-login on all devices for security

**Response (200):**
```json
{ "message": "Password reset successfully. Please log in again." }
```

---

### 6.8 Resend Verification Email

**Endpoint:** `POST /api/auth/resend-verification` *(requires Bearer token)*

**Cooldown:** 5 minutes between requests (prevents email spam abuse).

**What happens:**
1. Loads user from JWT
2. Checks not already verified (returns `400` if already verified)
3. Checks cooldown — if a token was issued within the last 5 minutes, returns `400` with message
4. Generates new token, overwrites old one in DB (old link becomes invalid)
5. Sends verification email

---

### 6.9 Get Profile

**Endpoint:** `GET /api/auth/profile` *(requires Bearer token)*

Returns the user object attached to `req.user` from the JWT strategy — no extra DB call needed at this point.

**Response (200):**
```json
{
  "id": 1,
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "isActive": true,
  "isEmailVerified": true,
  "lastLoginAt": "2026-04-10T10:00:00.000Z",
  "createdAt": "2026-04-10T09:00:00.000Z",
  "updatedAt": "2026-04-10T10:00:00.000Z"
}
```
Note: `passwordHash` and all token fields are **stripped** before returning — never exposed.

---

## 7. JWT Strategy & Guards

### How it works end-to-end

1. Client sends `Authorization: Bearer <accessToken>` header on any protected request
2. `JwtAuthGuard` (extends `AuthGuard('jwt')`) triggers Passport
3. `JwtStrategy.validate()` is called with decoded payload `{ sub: userId, email }`
4. Strategy loads full user from DB using `userId`
5. Checks `isActive` — throws `401 Account not found or disabled` if false
6. Strips all sensitive fields (`passwordHash`, all token fields)
7. Returns clean user object which is attached to `req.user`
8. `@CurrentUser()` decorator reads `req.user` in any controller

### Fail-fast security
`JwtStrategy` constructor **throws an error at startup** if:
- `JWT_SECRET` is not set in `.env`
- `JWT_SECRET` is still the placeholder value

This prevents accidentally running in production with an insecure secret.

### Token security model
- **Access token:** Short-lived (15 min), stateless JWT. Cannot be revoked individually.
- **Refresh token:** Long-lived (30 days), stored as SHA-256 hash in DB. Rotated on every use.
- **Logout** works by deleting the refresh token hash — future refreshes fail immediately.

---

## 8. Role-Based Access Control (RBAC)

### Adding roles to a new route

```typescript
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@Get('admin-only')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
adminRoute() {
  return { message: 'only admins see this' };
}
```

### How it works
1. `@Roles(Role.ADMIN)` uses NestJS `SetMetadata` to tag the route
2. `RolesGuard` reads that metadata via `Reflector`
3. Compares `req.user.role` against the required roles
4. Returns `403 Insufficient permissions` if role does not match
5. If no `@Roles()` decorator: guard passes through (all authenticated users allowed)

### Promoting a user to ADMIN
No API endpoint exists for this (intentional — admins don't self-promote). Use the DB directly:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
```

Or via Prisma Studio:
```bash
npx prisma studio
```

---

## 9. Email Service

### Dev mode vs Production mode

| Scenario | Condition | Behavior |
|----------|-----------|----------|
| **Dev mode** | `SMTP_HOST` not set in `.env` | Token is logged to console. No real email sent. |
| **Production** | `SMTP_HOST` is set | Real email sent via SMTP. Startup verifies connection. |

### Startup SMTP verification
On every app start, `EmailService.onModuleInit()` runs `transporter.verify()`:
- **Success:** logs `SMTP connection verified successfully`
- **Failure:** logs a detailed error, sets `transporter = null` (falls back to dev/console mode), **does NOT crash the app**

### Email templates overview

#### Verification Email
- Subject: `Verify your email — Employee Management System`
- Purple/indigo gradient header with checkmark SVG icon
- Personalized greeting with user's first name
- "Verify My Email" button (links to `GET /api/auth/verify-email?token=...`)
- "Expires in 24 hours" warning badge
- Fallback plain-text link

#### Password Reset Email
- Subject: `Reset your password — Employee Management System`
- Lock icon with gradient header
- "Reset My Password" button (links to `GET /api/auth/reset-password?token=...`)
- "Expires in 15 minutes" warning badge
- Red security warning box: "If you didn't request this, ignore this email"
- Fallback plain-text link

### Resend verification cooldown
The `POST /api/auth/resend-verification` endpoint enforces a **5-minute cooldown**. This prevents:
- Email flooding / spam
- SMTP provider rate-limit bans
- Denial-of-service via automated requests

---

## 10. Security Hardening

### HTTP Security Headers (Helmet)
Applied globally at app startup. Key headers:

| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options: nosniff` | Prevents MIME type sniffing |
| `X-Frame-Options: SAMEORIGIN` | Prevents clickjacking |
| `Strict-Transport-Security` | Forces HTTPS in production |
| `X-XSS-Protection: 1; mode=block` | Blocks reflected XSS in older browsers |
| `Content-Security-Policy` | Restricts resources (allows Google Fonts + inline styles for HTML pages) |

### CORS
Configured in `main.ts`:
- **Dev:** `CORS_ORIGINS` not set → allows all origins
- **Production:** Set `CORS_ORIGINS=https://yourfrontend.com` in `.env`. Multiple origins: comma-separated.

Credentials (cookies, Authorization header) are allowed (`credentials: true`).

### Token Security (no raw token in DB)
```
Registration → generateToken() → raw 64-char hex string
                                        |
                                  SHA-256 hash
                                        |
                             Stored in DB (passwordResetToken / emailVerifyToken)
                                        
Email link  → raw token in URL → user clicks link
                                        |
                                  SHA-256 hash
                                        |
                              DB lookup matches hash
```
If the database is ever leaked, the hashes cannot be reversed to usable tokens.

### Password Security
- `bcrypt` with cost factor 10 (~100ms per hash, safe against GPU brute force)
- Minimum 8 characters enforced by DTO
- After password reset: **all refresh tokens invalidated** (forces re-login everywhere)

### Email Enumeration Prevention
- `POST /api/auth/forgot-password` always returns `200` with the same message
- `POST /api/auth/login` returns `Invalid credentials` for both "user not found" and "wrong password"
- Neither endpoint reveals whether an email is registered

### Input Validation
`ValidationPipe` with:
- `whitelist: true` — strips any extra properties not in the DTO
- `forbidNonWhitelisted: true` — returns `400` if extra properties are sent
- `transform: true` — auto-converts strings to numbers, etc.

### Graceful Shutdown
`app.enableShutdownHooks()` — on `SIGTERM` or `SIGINT`, Prisma closes DB connections cleanly before process exits. Important for containerized deployments (Docker, Kubernetes).

---

## 11. API Endpoints Reference

| Method | Path | Auth Required | Description |
|--------|------|:---:|-------------|
| `POST` | `/api/auth/register` | No | Register new user, sends verification email |
| `POST` | `/api/auth/login` | No | Login, returns access + refresh tokens |
| `POST` | `/api/auth/refresh` | No | Rotate refresh token, get new pair |
| `POST` | `/api/auth/logout` | Bearer JWT | Logout this session (deletes refresh token) |
| `POST` | `/api/auth/logout-all` | Bearer JWT | Logout all devices |
| `GET` | `/api/auth/profile` | Bearer JWT | Get authenticated user's profile |
| `POST` | `/api/auth/forgot-password` | No | Request password reset email |
| `GET` | `/api/auth/reset-password?token=` | No | Browser: show HTML password reset form |
| `POST` | `/api/auth/reset-password` | No | API: submit new password |
| `GET` | `/api/auth/verify-email?token=` | No | Browser: verify email, show HTML result |
| `POST` | `/api/auth/verify-email` | No | API/mobile: verify email with token |
| `POST` | `/api/auth/resend-verification` | Bearer JWT | Resend verification email (5min cooldown) |
| `GET` | `/api` | No | Health check / welcome |
| `GET` | `/reset-password?token=` | No | Redirects → `/api/auth/reset-password?token=` |
| `GET` | `/verify-email?token=` | No | Redirects → `/api/auth/verify-email?token=` |
| `GET` | `/docs` | No | Swagger UI (interactive API documentation) |

---

## 12. Running the Project

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- A Gmail account with 2FA enabled (for real emails)

### First-time setup
```bash
# 1. Install all dependencies
npm install

# 2. Create .env file with your values (see Section 4)

# 3. Apply database migrations
npx prisma migrate dev

# 4. Start development server (hot-reload)
npm run start:dev
```

### Available npm scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Watch mode — auto-restarts on file changes |
| `npm run start:prod` | Start from compiled `dist/` folder |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run lint` | ESLint check + auto-fix |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage report |

### Accessing the app
| URL | Description |
|-----|-------------|
| http://localhost:3000/api | API root / health check |
| http://localhost:3000/docs | Swagger UI — try all endpoints visually |

---

## 13. Production Deployment Checklist

Complete each item before going live:

- [ ] `JWT_SECRET` is a random 64-char hex string — not the placeholder
- [ ] `DATABASE_URL` points to production PostgreSQL instance
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` configured and tested
- [ ] `APP_URL` set to your real public domain (e.g. `https://api.yourcompany.com`)
- [ ] `REQUIRE_EMAIL_VERIFICATION=true`
- [ ] `CORS_ORIGINS` set to your frontend domain(s)
- [ ] `NODE_ENV=production` set in the process environment
- [ ] Run `npm run build` — no TypeScript errors
- [ ] Run `npx prisma migrate deploy` in production (not `migrate dev`)
- [ ] `.env` is in `.gitignore` — never committed to version control
- [ ] HTTPS enabled on your server (nginx reverse proxy or Cloudflare)
- [ ] Database backups scheduled
- [ ] Set `PORT` env var if deploying to a platform that assigns ports dynamically

---

## 14. Common Errors & Fixes

### `Error: JWT_SECRET is not set or is using the default placeholder`
**Cause:** `JWT_SECRET` in `.env` is empty or still the example value.
**Fix:** Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` and update `.env`.

### `SMTP connection failed — emails will NOT be sent`
**Cause:** SMTP credentials wrong, or Gmail blocked the connection.
**Fix:**
1. Confirm `SMTP_USER` and `SMTP_PASS` in `.env`
2. Use a Gmail **App Password** (not your real password). Requires 2-Factor Authentication enabled.
3. Check you're using `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`

### `Cannot GET /verify-email?token=...` (404)
**Cause:** Old email sent before the path was fixed.
**Fix:** `AppController` now auto-redirects `/verify-email` → `/api/auth/verify-email`. Ensure server is running the latest code.

### `Cannot GET /reset-password?token=...` (404)
**Cause:** Same — old email path.
**Fix:** `AppController` auto-redirects `/reset-password` → `/api/auth/reset-password`.

### `Email already registered` (409 on register)
**Cause:** Email is already in the database.
**Fix:** Use a different email, or use `POST /api/auth/forgot-password` to recover the existing account.

### `Please verify your email address before logging in` (401)
**Cause:** `REQUIRE_EMAIL_VERIFICATION=true` and user has not verified yet.
**Fix:** Check inbox + spam folder for the verification email. Use `POST /api/auth/resend-verification` with the access token from registration to get a new link.

### `A verification email was sent recently. Please wait 5 minutes` (400)
**Cause:** Resend requested within 5-minute cooldown window.
**Fix:** Wait 5 minutes and try again.

### `Invalid or expired refresh token` (401)
**Cause:** Token already used (rotation), expired (30 days), or user logged out.
**Fix:** Login again with `POST /api/auth/login` to get a fresh token pair.

### `EADDRINUSE: address already in use :::3000`
**Cause:** Another Node.js process is running on port 3000.
**Fix (Windows PowerShell):**
```powershell
Stop-Process -Name node -Force
npm run start:dev
```

### Prisma `P2002` Unique constraint violation
**Cause:** Trying to insert a duplicate value in a unique column.
**Fix:** `UsersService.create()` already handles `P2002` and throws `409 ConflictException`. For custom code, catch `PrismaClientKnownRequestError` with code `P2002`.

### Password reset form — fields lose styling when eye is clicked
**Cause:** Was using `input[type=password]` CSS selector which stopped matching when input type switched to `text`.
**Fix:** CSS now uses `.input-wrap input` selector, which applies regardless of input type.
# NestJS Backend — Deep Dive Explanation

---

## 1. Why NestJS at All?

NestJS is a **framework built on top of Node.js + Express** (or Fastify), written in **TypeScript**. You chose it because:

- It enforces **architecture** — modules, services, controllers are not optional, they are mandatory patterns. This keeps code organised as it grows.
- It uses **Decorators** (`@Controller`, `@Injectable`, `@Get`) which are the same pattern Angular uses — readable and declarative.
- It has **first-class support** for Dependency Injection (DI), meaning classes don't create their own dependencies, the framework injects them — making code testable and loosely coupled.
- It has official, battle-tested packages for everything you need: JWT, Passport, TypeORM, Config, Validation.

---

## 2. From Scratch — How This Project Was Born

```bash
# 1. Install the NestJS CLI globally
npm install -g @nestjs/cli

# 2. Create a new project
nest new "NestJS Backend"

# 3. Install all the packages this project uses
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/typeorm
npm install typeorm pg bcrypt passport passport-jwt passport-local
npm install class-validator class-transformer
npm install --save-dev @types/bcrypt @types/passport-jwt

# 4. Run in development mode (auto-restarts on file save)
npm run start:dev

# 5. Build for production
npm run build
npm run start:prod
```

---

## 3. The Full Folder Structure — Why Every File Exists

```
src/
├── main.ts                      ← Entry point. Boots the app.
├── app.module.ts                ← Root module. Wires everything together.
├── app.controller.ts            ← Root GET /api route.
├── app.service.ts               ← Root service (currently minimal).
│
├── auth/
│   ├── auth.module.ts           ← Declares and wires auth-specific pieces.
│   ├── auth.controller.ts       ← HTTP routes: /register, /login, /profile.
│   ├── auth.service.ts          ← Business logic: hash, compare, sign JWT.
│   ├── dto/
│   │   ├── register.dto.ts      ← Shape + validation rules for register body.
│   │   └── login.dto.ts         ← Shape + validation rules for login body.
│   ├── guards/
│   │   └── jwt-auth.guard.ts    ← Protects routes — rejects if no valid JWT.
│   └── strategies/
│       └── jwt.strategy.ts      ← Tells Passport how to verify a JWT token.
│
└── users/
    ├── users.module.ts          ← Declares and exports UsersService.
    ├── users.service.ts         ← Database operations: create, findByEmail, findById.
    └── user.entity.ts           ← Defines the `users` table schema in PostgreSQL.

test/
├── app.e2e-spec.ts              ← End-to-end test for the whole running app.
└── jest-e2e.json                ← Jest config specifically for e2e tests.
```

---

## 4. main.ts — The Entry Point

```typescript
const app = await NestFactory.create(AppModule, { logger: new FilteredLogger() });
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.setGlobalPrefix('api');
await app.listen(3000);
```

**Line by line:**

| What | Why |
|---|---|
| `NestFactory.create(AppModule)` | Bootstraps the entire DI container starting from AppModule |
| `FilteredLogger` | Custom logger that silences internal NestJS noise — only your logs show |
| `ValidationPipe` | Automatically validates every incoming request body against the DTO rules |
| `whitelist: true` | Strips any extra fields the client sends that are not in the DTO |
| `forbidNonWhitelisted: true` | Rejects the request entirely if unknown fields are sent |
| `transform: true` | Auto-converts types (e.g. string `"5"` → number `5`) |
| `setGlobalPrefix('api')` | Every route is prefixed with `/api` — so `/auth/login` becomes `/api/auth/login` |

---

## 5. app.module.ts — The Root Module (The Brain)

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),   // .env file loaded everywhere
    TypeOrmModule.forRootAsync({ ... }),          // PostgreSQL connection
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
```

**Why `ConfigModule.forRoot({ isGlobal: true })`?**

Without this, you'd hardcode database passwords in your code. With this, you have a `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=NestJSAuth
DB_USERNAME=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
```

`isGlobal: true` means you don't have to import ConfigModule in every single module — it's available everywhere automatically.

**Why `TypeOrmModule.forRootAsync`?**

`forRootAsync` (not `forRoot`) is used because the database credentials come from `ConfigService`, which is loaded asynchronously. It:
1. Creates a `DataSource` (the actual PostgreSQL connection)
2. Connects to the database
3. Maps TypeScript classes (`User`) to database tables automatically

---

## 6. Why Modules? (.module.ts files)

NestJS is built around **modules** — think of them as self-contained bundles of related functionality.

```
AppModule
├── UsersModule   (handles everything about users)
└── AuthModule    (handles everything about authentication)
```

**Without modules**, all your controllers, services, and dependencies live in one giant file. That becomes impossible to maintain at 10+ features.

**With modules**, each feature:
- Declares its own controllers and services
- Imports only what it needs
- Exports only what other modules need from it

```typescript
// UsersModule exports UsersService so AuthModule can use it
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService],   // ← without this, AuthModule cannot inject UsersService
})
export class UsersModule {}
```

This is **encapsulation** — just like in object-oriented design.

---

## 7. user.entity.ts — The Database Table

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) email: string;
  @Column() password: string;
  @Column({ nullable: true }) firstName: string;
  @Column({ nullable: true }) lastName: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
```

This TypeScript class **IS** your database table. TypeORM reads the decorators and:
- Creates the `users` table when `synchronize: true`
- Maps every query result row into a `User` object automatically
- Handles `createdAt` and `updatedAt` timestamps for you automatically

You never write `CREATE TABLE users (...)` SQL manually. TypeORM does it.

---

## 8. Why DTOs? (Data Transfer Objects)

A DTO is a class that describes the **exact shape and validation rules** for incoming data.

```typescript
// register.dto.ts
export class RegisterDto {
  @IsEmail()           email: string;       // must be valid email format
  @IsString()
  @MinLength(8)        password: string;    // must be string, min 8 chars
  @IsOptional()
  @IsString()          firstName?: string;  // optional
  @IsOptional()
  @IsString()          lastName?: string;   // optional
}
```

**Why not just use `req.body` directly?**

| Plain `req.body` | DTO + ValidationPipe |
|---|---|
| No guarantees on types | TypeScript types enforced at runtime |
| Anyone can send `{ isAdmin: true }` | Extra fields are stripped/rejected |
| Validation logic scattered in service | Validation declared in one place |
| SQL injection risk from unvalidated data | `class-validator` sanitizes first |

DTOs are your **first line of defence** at the system boundary (the HTTP layer).

---

## 9. auth.service.ts — The Business Logic

```typescript
async register(dto: RegisterDto) {
  // 1. Creates user (UsersService checks for duplicate email)
  const user = await this.usersService.create(dto.email, dto.password, ...);
  // 2. Signs a JWT token
  const token = this.signToken(user.id, user.email);
  // 3. Returns token + user info (never the password)
  return { accessToken: token, user: { id, email, firstName, lastName } };
}

async login(dto: LoginDto) {
  // 1. Find user by email
  const user = await this.usersService.findByEmail(dto.email);
  // 2. Compare plain password vs bcrypt hash
  const match = await bcrypt.compare(dto.password, user.password);
  // 3. Sign and return JWT
}
```

**Why bcrypt?**

Passwords are never stored as plain text. `bcrypt.hash('password', 10)` produces something like:
```
$2b$10$X9kJ2mQ8pL3nR7vS1tW0u.eYzABCDEF...
```

The `10` is the **salt rounds** — how many times the hashing algorithm loops. More rounds = slower = harder to brute force. Even if your database is stolen, the attacker cannot recover the original password.

**Why JWT?**

JWT (JSON Web Token) is **stateless authentication**. After login, the server returns a token. The client sends it with every request via `Authorization: Bearer <token>`. The server verifies the token's signature without touching the database — this is what makes it scalable.

```
Header.Payload.Signature

Payload contains: { sub: userId, email: "user@example.com", exp: ... }
```

---

## 10. jwt.strategy.ts — How Token Verification Works

```typescript
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(...) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // reads Authorization header
      ignoreExpiration: false,                                   // rejects expired tokens
      secretOrKey: configService.get('JWT_SECRET'),             // verifies signature
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    return user; // attached to req.user
  }
}
```

**Flow when a protected route is hit:**

```
Client sends:  GET /api/auth/profile
               Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

1. JwtAuthGuard intercepts the request
2. JwtStrategy extracts the token from the header
3. Verifies the signature with JWT_SECRET
4. Checks the token hasn't expired
5. Calls validate() → fetches user from DB
6. Attaches user to req.user
7. Controller receives req.user and returns it
```

---

## 11. jwt-auth.guard.ts — The Bodyguard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

This is deliberately minimal. It delegates everything to Passport's `jwt` strategy. You use it like:

```typescript
@UseGuards(JwtAuthGuard)  // ← this route now requires a valid JWT
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

Without the guard, anyone can hit `/profile` without a token. With it, a 401 Unauthorized is returned automatically.

---

## 12. The test/ Folder — Why It Exists

```
test/
├── app.e2e-spec.ts     ← End-to-end test: actually starts the server and hits HTTP routes
└── jest-e2e.json       ← Separate Jest config for e2e (different from unit test config)
```

**Types of tests in this project:**

| Type | File | What it tests |
|---|---|---|
| Unit test | `src/*.spec.ts` | Individual service/controller in isolation |
| E2E test | `test/*.e2e-spec.ts` | Full HTTP request cycle through the entire app |

**Run them:**

```bash
npm run test          # unit tests
npm run test:e2e      # end-to-end tests
npm run test:cov      # unit tests + coverage report
```

---

## 13. Is This Scalable for 1000+ Users?

**Short answer: Yes, with some conditions.**

### What already scales well:

| Feature | Why it scales |
|---|---|
| **JWT authentication** | Stateless — no session stored in server memory. 1000 users each with a JWT don't increase server memory usage. |
| **PostgreSQL + TypeORM** | PostgreSQL handles thousands of concurrent connections. TypeORM uses a connection pool. |
| **NestJS + Express** | Node.js is non-blocking (event loop). A single request waiting for a DB query doesn't block other requests. |
| **bcrypt async** | `bcrypt.hash()` and `bcrypt.compare()` are called with `await` — they don't block the event loop. |
| **Dependency Injection** | Services are singletons by default — one instance shared across all requests, not one per request. |

### What to improve for production scale:

| Problem | Solution |
|---|---|
| `synchronize: true` in TypeORM | Disable in production. Use TypeORM migrations instead. It can drop columns on schema changes. |
| No rate limiting | Add `@nestjs/throttler` — prevents brute force on `/login`. |
| No connection pooling config | Set `extra: { max: 10 }` in TypeORM config to control PostgreSQL connections. |
| JWT_SECRET fallback | The strategy has `'fallback-secret'` as fallback. In production, crash if it's missing. |
| No HTTPS | In production, run behind a reverse proxy (Nginx) with SSL. |
| Single process | Use `PM2` with cluster mode or deploy to a container (Docker + Kubernetes) for multi-core usage. |

### Rough capacity estimate:

- A single NestJS/Node.js process can handle **~1,000–5,000 concurrent** light requests/second on modern hardware.
- For 1,000 simultaneous users, this backend will handle it comfortably as-is.
- For 10,000+, you'd horizontally scale (multiple instances behind a load balancer).

---

## 14. The Full Request Lifecycle (Register Example)

```
POST /api/auth/register
Body: { "email": "user@test.com", "password": "secret123" }

1. Express receives the HTTP request
2. NestJS router matches it to AuthController.register()
3. ValidationPipe runs RegisterDto validation
   - Is email a valid email? ✓
   - Is password >= 8 chars? ✓
   - Are there unknown fields? No → strip them
4. AuthController calls authService.register(dto)
5. AuthService calls usersService.create(email, password)
6. UsersService queries DB: does this email already exist?
   - If yes → throw ConflictException (409)
   - If no → bcrypt.hash(password, 10)
7. TypeORM INSERTs the new row into `users` table
8. AuthService calls jwtService.sign({ sub: id, email })
9. Returns { accessToken: "eyJ...", user: { id, email, firstName, lastName } }
10. NestJS serializes to JSON, sends 201 response
```

---

## 15. Environment Variables Reference

Create a `.env` file in the project root:

```env
# Database (individual vars — kept for reference)
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=NestJSAuth
DB_USERNAME=postgres
DB_PASSWORD=your_password_here

# Prisma connection URL — REQUIRED
# If your password contains @ encode it as %40
DATABASE_URL="postgresql://postgres:your_password_here@localhost:5432/NestJSAuth?schema=public"

# JWT
JWT_SECRET=a-very-long-random-secret-string-here
JWT_EXPIRES_IN=7d

# App
PORT=3000
```

Never commit this file to Git. Add `.env` to `.gitignore`.

---

## 16. Summary — Why This Architecture?

```
Request → Controller → Service → Repository → Database
              ↑             ↑
             DTO          Entity
          (validate)    (DB table)
```

| Layer | Responsibility | File |
|---|---|---|
| **Controller** | Receive HTTP, delegate — no business logic | `auth.controller.ts` |
| **Service** | Business logic — hashing, token signing | `auth.service.ts` |
| **Repository** | Database queries only | `users.service.ts` (via Prisma) |
| **Entity/Model** | Database table definition | `prisma/schema.prisma` |
| **DTO** | Input validation + shape | `register.dto.ts`, `login.dto.ts` |
| **Guard** | Route protection | `jwt-auth.guard.ts` |
| **Strategy** | Token verification logic | `jwt.strategy.ts` |
| **Module** | Wires a feature together | `*.module.ts` |

This separation means:
- You can change the database without touching controllers
- You can add new routes without touching services
- You can change validation rules without touching the database
- You can test each layer in isolation

---

## 17. Phase 1 — Core Foundation (What's Implemented)

This section covers every Phase 1 item, what it does in this project, and why.

### ✅ 1. Project Setup

```bash
npm install -g @nestjs/cli
nest new "NestJS Backend"
npm run start:dev
```

NestJS CLI scaffolds the full folder structure automatically. Everything under `src/` was generated by the CLI and then extended.

---

### ✅ 2. Prisma Setup (replacing TypeORM)

**Why Prisma over TypeORM?**

| TypeORM | Prisma |
|---|---|
| Entity classes with decorators | Clean `schema.prisma` file |
| Manual query builder (error-prone) | Auto-generated, fully typed client |
| Migrations require extra config | `npx prisma migrate dev` just works |
| No type inference on query results | Full TypeScript inference on every query |
| Runtime errors from wrong column names | Compile-time errors if schema changes |

**Install Prisma:**

```bash
npm install @prisma/client
npm install --save-dev prisma
```

**Initialize:**

```bash
npx prisma init        # creates prisma/schema.prisma and .env DATABASE_URL
npx prisma generate    # generates the TypeScript client into node_modules/@prisma/client
```

**After every schema change:**

```bash
npx prisma migrate dev --name your_migration_name   # in development
npx prisma migrate deploy                            # in production
npx prisma generate                                  # re-generate client after schema changes
```

**The schema file (`prisma/schema.prisma`):**

```prisma
generator client {
  provider = "prisma-client-js"     // generates TypeScript types
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")    // reads from .env — never hardcoded
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique        // unique constraint on DB level
  password  String
  firstName String?                 // ? means nullable
  lastName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt     // auto-updated on every save
  @@map("users")                    // maps to table named "users"
}
```

**PrismaService (`src/prisma/prisma.service.ts`):**

```typescript
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit()    { await this.$connect();    }  // connects when module loads
  async onModuleDestroy() { await this.$disconnect(); }  // disconnects on shutdown
}
```

`PrismaService` extends `PrismaClient`, so you get `prisma.user.findUnique(...)`, `prisma.user.create(...)` etc. directly.

**PrismaModule (`src/prisma/prisma.module.ts`):**

```typescript
@Global()  // ← makes PrismaService available everywhere without re-importing
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

`@Global()` means any module can inject `PrismaService` without importing `PrismaModule` itself.

**How to use Prisma in any service:**

```typescript
// Inject PrismaService
constructor(private readonly prisma: PrismaService) {}

// Create a record
const user = await this.prisma.user.create({ data: { email, password } });

// Find one (returns null if not found)
const user = await this.prisma.user.findUnique({ where: { email } });

// Find many
const users = await this.prisma.user.findMany();

// Update
await this.prisma.user.update({ where: { id }, data: { firstName: 'John' } });

// Delete
await this.prisma.user.delete({ where: { id } });

// Select specific fields only
const user = await this.prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, firstName: true },
  // password is NOT selected — never leaks
});
```

**Useful Prisma CLI commands:**

```bash
npx prisma studio          # open browser GUI to view/edit DB records
npx prisma db push         # push schema to DB without creating a migration file (dev only)
npx prisma migrate dev     # create and apply a migration
npx prisma migrate reset   # wipe DB and re-apply all migrations (dev only!)
npx prisma generate        # regenerate TypeScript client after schema changes
```

---

### ✅ 3. PostgreSQL Connection

With Prisma, the entire connection is managed via `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

If your password contains special characters like `@`, encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`

Example with password `admin@123`:
```env
DATABASE_URL="postgresql://postgres:admin%40123@localhost:5432/NestJSAuth?schema=public"
```

`PrismaService.onModuleInit()` establishes the connection when the app starts. Prisma manages an internal connection pool automatically.

---

### ✅ 4. Config/Env Setup

```typescript
// app.module.ts
ConfigModule.forRoot({ isGlobal: true })
```

NestJS `ConfigModule` reads your `.env` file and exposes values via `ConfigService`:

```typescript
constructor(private config: ConfigService) {}
const secret = this.config.get<string>('JWT_SECRET');
```

`isGlobal: true` — loaded once, available in every module without re-importing.

**Never hardcode secrets.** Always pull from `ConfigService` or `process.env`.

---

### ✅ 5. Global Validation

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,             // strip unknown fields automatically
  forbidNonWhitelisted: true,  // reject request if unknown fields sent
  transform: true,             // auto-convert types (string → number etc.)
}));
```

Combined with DTOs decorated with `class-validator`:

```typescript
export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
```

If the request body fails validation, NestJS automatically returns:
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be at least 8 characters"],
  "error": "Bad Request"
}
```

No manual validation code needed in controllers or services.

---

### ✅ 6. Global Error Handling

```typescript
// src/common/filters/global-exception.filter.ts
@Catch()  // catches ALL exceptions
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // HttpException → controlled error (401, 404, 409...)
    // anything else → 500 Internal Server Error
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

Registered globally in `main.ts`:
```typescript
app.useGlobalFilters(new GlobalExceptionFilter());
```

**Without this**, an unhandled error in any service would return a cryptic Express stack trace to the client — exposing internal details and being a security risk.

**With this**, every error — whether it's a 401 from `throw new UnauthorizedException()` or an unexpected runtime crash — returns a clean, consistent JSON response.

Example responses:

```json
// 409 from throw new ConflictException()
{ "statusCode": 409, "message": "Email already registered", "path": "/api/auth/register" }

// 500 from unexpected error
{ "statusCode": 500, "message": "Internal server error", "path": "/api/auth/login" }
```

---

### ✅ 7. Swagger Docs

Swagger is an interactive API documentation UI automatically generated from your code.

**Access it at:** `http://localhost:3000/docs`

**Setup in `main.ts`:**

```typescript
const swaggerConfig = new DocumentBuilder()
  .setTitle('NestJS Auth API')
  .setDescription('...')
  .setVersion('1.0')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
  .build();

const document = SwaggerModule.createDocument(app, swaggerConfig);
SwaggerModule.setup('docs', app, document);  // available at /docs
```

**On controllers:**
```typescript
@ApiTags('Auth')               // groups routes under "Auth" in the UI
@ApiOperation({ summary: '...' })   // describes the route
@ApiResponse({ status: 201, description: '...' })  // documents responses
@ApiBearerAuth('JWT')          // shows the padlock icon — route requires JWT
```

**On DTOs:**
```typescript
@ApiProperty({ example: 'user@example.com' })  // shows example values in UI
email: string;
```

**Why Swagger?**
- Frontend developers can test all endpoints without Postman
- Auto-documents request/response shapes
- The "Authorize" button in the UI lets you paste a JWT and test protected routes
- Always in sync with the code — no manual documentation maintenance

---

## 18. Updated Folder Structure (Phase 1 Complete)

```
src/
├── main.ts                           ← Entry point + Swagger + GlobalFilter
├── app.module.ts                     ← Root: ConfigModule + PrismaModule
├── app.controller.ts
├── app.service.ts
│
├── prisma/                           ← NEW
│   ├── prisma.service.ts             ← Extends PrismaClient, manages connection
│   └── prisma.module.ts              ← @Global module, exports PrismaService
│
├── common/                           ← NEW
│   └── filters/
│       └── global-exception.filter.ts ← Catches all errors, returns clean JSON
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts            ← @ApiTags, @ApiOperation, @ApiBearerAuth
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── register.dto.ts           ← @ApiProperty added
│   │   └── login.dto.ts              ← @ApiProperty added
│   ├── guards/jwt-auth.guard.ts
│   └── strategies/jwt.strategy.ts
│
└── users/
    ├── users.module.ts               ← Removed TypeORM, uses PrismaService
    ├── users.service.ts              ← Uses prisma.user.* instead of Repository
    └── user.entity.ts                ← No longer used (Prisma schema replaces it)

prisma/                               ← NEW (root level)
└── schema.prisma                     ← Single source of truth for DB schema
```
