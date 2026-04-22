import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './common/email/email.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './platform/config/env.validation';
import { QueueModule } from './platform/queue/queue.module';
import { RedisModule } from './platform/redis/redis.module';
import { HealthModule } from './health/health.module';
import { StructuredLogger } from './platform/logging/structured-logger.service';
import { AccessControlModule } from './access-control/access-control.module';
import { OrganizationModule } from './organization/organization.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveModule } from './leave/leave.module';
import { PayrollModule } from './payroll/payroll.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SettingsModule } from './settings/settings.module';
import { DocumentsModule } from './documents/documents.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    PrismaModule,
    RedisModule,
    QueueModule,
    EmailModule,
    UsersModule,
    AuthModule,
    HealthModule,
    AccessControlModule,
    OrganizationModule,
    EmployeesModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    NotificationsModule,
    DashboardModule,
    SettingsModule,
    DocumentsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService, StructuredLogger],
})
export class AppModule {}
