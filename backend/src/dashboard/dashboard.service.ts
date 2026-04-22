import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async adminSummary(companyId: string) {
    const [employees, activeUsers, pendingLeaves, payrollProcessed] = await Promise.all([
      this.prisma.employee.count({ where: { companyId } }),
      this.prisma.user.count({ where: { companyId, isActive: true } }),
      this.prisma.leaveRequest.count({ where: { companyId, status: { in: ['PENDING_TEAM_LEAD', 'PENDING_HR'] } } }),
      this.prisma.payrollRecord.count({ where: { companyId, status: 'PROCESSED' } }),
    ]);

    return { employees, activeUsers, pendingLeaves, payrollProcessed };
  }

  async employeeSummary(employeeId: string, companyId: string) {
    const [attendance, leaves, payroll, unreadNotifications] = await Promise.all([
      this.prisma.attendanceRecord.count({ where: { employeeId, companyId } }),
      this.prisma.leaveRequest.count({ where: { employeeId, companyId } }),
      this.prisma.payrollRecord.count({ where: { employeeId, companyId } }),
      this.prisma.notification.count({ where: { employeeId, isRead: false } }),
    ]);

    return { attendance, leaves, payroll, unreadNotifications };
  }
}
