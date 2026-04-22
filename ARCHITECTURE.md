# HRMS SaaS Architecture Blueprint

## Platform Strategy

- Deployment model: single-tenant per deployment in v1, with tenant-aware domain boundaries to enable multi-tenant evolution later.
- Architecture style: modular monolith (NestJS + Next.js) with strict module boundaries and shared platform capabilities.
- API style: REST-first with versioned endpoints (`/api/v1` target), Swagger/OpenAPI contracts, and consistent response envelopes.
- Security baseline: JWT access + refresh token rotation, RBAC + permissions, request validation, rate limiting, audit logging, and secure file handling.
- Scalability baseline: PostgreSQL + Prisma, Redis cache/session primitives, BullMQ async jobs, and event-driven notification flows.

## Backend Module Breakdown

- `platform`: config, logging, exception handling, response envelope, health checks, cache/redis, queue bootstrap, shared utilities.
- `identity`: auth, session/refresh tokens, password lifecycle, email verification, account security policies.
- `access-control`: roles, permissions, role-permission matrix, policy evaluation, guard/decorator layer.
- `organization`: company profile, branches, departments, designations, teams, shifts, work calendars.
- `workforce`: employees, profiles, onboarding, reporting manager mapping, status transitions, documents.
- `attendance`: shift attendance, corrections, analytics, late/early/overtime primitives.
- `leave`: leave policy, balances, leave requests, multi-step approvals, calendars.
- `payroll`: salary structures, monthly runs, payslip data, revisions, restricted finance/HR visibility.
- `notifications`: in-app + email notification pipelines with BullMQ jobs.
- `audit`: immutable audit/event streams and admin traceability.
- `reports`: dashboard metrics, trend analytics, role-specific data aggregation.
- `settings`: company branding, security knobs, workflow settings, notification preferences.

## Frontend Module Breakdown

- `app`: Next.js App Router route groups by domain and role.
- `core`: providers, app shell, route guards, API client, state stores, theme/accessibility.
- `features/auth`: auth flows, security settings, session management.
- `features/employee`: employee CRUD++, profile timeline, onboarding workflows.
- `features/attendance`, `features/leave`, `features/payroll`, `features/notifications`.
- `features/admin`: organization setup, permissions matrix, settings, audit logs.
- `features/dashboard`: role-based dashboards, analytics cards/charts, activity streams.
- `shared/ui`: design system components, motion primitives, table/form abstractions.
- `shared/lib`: API adapters, schema validators, utilities, constants.

## Prisma Schema Plan (Target)

- Core access entities: `User`, `Session`, `Role`, `Permission`, `RolePermission`, `UserRole`.
- Organization entities: `Company`, `Branch`, `Department`, `Designation`, `Team`, `Shift`, `Holiday`, `WorkCalendar`.
- Employee entities: `Employee`, `EmployeeProfile`, `EmergencyContact`, `EmployeeDocument`, `ReportingLine`, `EmployeeEvent`.
- Attendance entities: `AttendanceRecord`, `AttendanceAdjustment`, `AttendancePolicy`.
- Leave entities: `LeaveType`, `LeavePolicy`, `LeaveBalance`, `LeaveRequest`, `LeaveApprovalStep`.
- Payroll entities: `SalaryStructure`, `SalaryComponent`, `PayrollCycle`, `PayrollRecord`, `PayrollAdjustment`.
- Notification entities: `Notification`, `NotificationPreference`, `EmailTemplate`, `OutboxEvent`.
- Compliance entities: `AuditLog`, `SecurityEvent`.
- Cross-cutting conventions: UUID primary keys for new models, `createdAt`, `updatedAt`, `deletedAt` for soft delete capable entities, explicit indexes on lookup/filter fields.

## Key Production Decisions

- Strict env validation on startup; app fails fast on invalid critical configuration.
- Refresh token hashing + rotation, per-device sessions, revocation support.
- Structured JSON logs for ingestion by ELK/Datadog/Loki.
- Global exception filter and response envelope contract.
- Redis-backed queue + cache strategy for notifications and costly report workloads.
- File storage abstraction (local now, S3-compatible later) with metadata + access controls.
- Policy-driven authorization (role + permission checks with contextual guards).
- Database migration discipline via Prisma migrations and seeded baseline entities.
