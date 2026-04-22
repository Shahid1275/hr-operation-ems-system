import { Injectable } from '@nestjs/common';
import { PayrollStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePayrollRecordDto } from './dto/create-payroll-record.dto';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { CreatePayrollRevisionDto } from './dto/create-payroll-revision.dto';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  createCycle(dto: CreatePayrollCycleDto) {
    return this.prisma.payrollCycle.create({
      data: {
        ...dto,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
      },
    });
  }

  create(dto: CreatePayrollRecordDto) {
    const netPay = dto.basicSalary + dto.allowances - dto.deductions;
    return this.prisma.payrollRecord.upsert({
      where: {
        employeeId_payrollMonth: {
          employeeId: dto.employeeId,
          payrollMonth: dto.payrollMonth,
        },
      },
      create: {
        employeeId: dto.employeeId,
        companyId: dto.companyId,
        payrollMonth: dto.payrollMonth,
        basicSalary: dto.basicSalary,
        allowances: dto.allowances,
        deductions: dto.deductions,
        netPay,
        status: PayrollStatus.PROCESSED,
      },
      update: {
        basicSalary: dto.basicSalary,
        allowances: dto.allowances,
        deductions: dto.deductions,
        netPay,
        status: PayrollStatus.PROCESSED,
      },
    });
  }

  list(companyId: string, employeeId?: string) {
    return this.prisma.payrollRecord.findMany({
      where: { companyId, employeeId },
      include: { employee: { include: { user: true } } },
      orderBy: [{ payrollMonth: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  createRevision(dto: CreatePayrollRevisionDto) {
    return this.prisma.$transaction(async (tx) => {
      const revision = await tx.payrollRevision.create({
        data: dto,
      });
      const record = await tx.payrollRecord.findUniqueOrThrow({
        where: { id: dto.payrollRecordId },
      });
      await tx.payrollRecord.update({
        where: { id: dto.payrollRecordId },
        data: {
          netPay: Number(record.netPay) + dto.amountDelta,
        },
      });
      await tx.auditLog.create({
        data: {
          action: 'payroll.revision.created',
          resource: 'payroll_record',
          resourceId: dto.payrollRecordId,
        },
      });
      return revision;
    });
  }

  listCycles(companyId: string) {
    return this.prisma.payrollCycle.findMany({
      where: { companyId },
      orderBy: { periodStart: 'desc' },
    });
  }

  listRevisions(companyId: string, employeeId?: string) {
    return this.prisma.payrollRevision.findMany({
      where: { companyId, employeeId },
      include: { employee: { include: { user: true } }, payrollRecord: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async payslip(payrollRecordId: string) {
    const record = await this.prisma.payrollRecord.findUniqueOrThrow({
      where: { id: payrollRecordId },
      include: {
        employee: { include: { user: true, department: true, branch: true } },
        revisions: true,
      },
    });
    return {
      payrollRecordId: record.id,
      payrollMonth: record.payrollMonth,
      employee: {
        name: `${record.employee.user.firstName ?? ''} ${record.employee.user.lastName ?? ''}`.trim(),
        email: record.employee.user.email,
        employeeCode: record.employee.employeeCode,
        department: record.employee.department?.name ?? '-',
        branch: record.employee.branch?.name ?? '-',
      },
      earnings: {
        basicSalary: record.basicSalary,
        allowances: record.allowances,
      },
      deductions: {
        totalDeductions: record.deductions,
      },
      netPay: record.netPay,
      revisions: record.revisions,
    };
  }
}
