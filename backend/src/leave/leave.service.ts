import { Injectable } from '@nestjs/common';
import { LeaveRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { CreateLeavePolicyDto } from './dto/create-leave-policy.dto';
import { AllocateLeaveBalanceDto } from './dto/allocate-leave-balance.dto';

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  createPolicy(dto: CreateLeavePolicyDto) {
    return this.prisma.leavePolicy.upsert({
      where: { companyId_leaveType: { companyId: dto.companyId, leaveType: dto.leaveType } },
      create: dto,
      update: dto,
    });
  }

  listPolicies(companyId: string) {
    return this.prisma.leavePolicy.findMany({
      where: { companyId },
      orderBy: { leaveType: 'asc' },
    });
  }

  allocateBalance(dto: AllocateLeaveBalanceDto) {
    return this.prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveType_year: {
          employeeId: dto.employeeId,
          leaveType: dto.leaveType,
          year: dto.year,
        },
      },
      create: {
        ...dto,
        usedDays: 0,
        remainingDays: dto.allocatedDays,
      },
      update: {
        allocatedDays: dto.allocatedDays,
        remainingDays: dto.allocatedDays,
      },
    });
  }

  listBalances(companyId: string, employeeId?: string) {
    return this.prisma.leaveBalance.findMany({
      where: { companyId, employeeId },
      orderBy: [{ year: 'desc' }, { leaveType: 'asc' }],
    });
  }

  async create(dto: CreateLeaveRequestDto) {
    const overlap = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId: dto.employeeId,
        status: { in: [LeaveRequestStatus.PENDING_TEAM_LEAD, LeaveRequestStatus.PENDING_HR, LeaveRequestStatus.APPROVED] },
        OR: [
          { startDate: { lte: new Date(dto.endDate) }, endDate: { gte: new Date(dto.startDate) } },
        ],
      },
    });

    if (overlap) {
      throw new Error('Overlapping leave request already exists');
    }

    const leave = await this.prisma.leaveRequest.create({
      data: {
        employeeId: dto.employeeId,
        companyId: dto.companyId,
        leaveType: dto.leaveType,
        reason: dto.reason,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        totalDays: dto.totalDays,
      },
    });

    await this.prisma.notification.create({
      data: {
        employeeId: dto.employeeId,
        companyId: dto.companyId,
        type: 'leave.submitted',
        title: 'Leave request submitted',
        message: `Your leave request (${dto.leaveType}) is pending team lead approval.`,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'leave.request.created',
        resource: 'leave_request',
        resourceId: leave.id,
      },
    });
    return leave;
  }

  async teamLeadDecision(dto: UpdateLeaveStatusDto) {
    const nextStatus =
      dto.decision === 'approve'
        ? LeaveRequestStatus.PENDING_HR
        : LeaveRequestStatus.REJECTED;
    const updated = await this.prisma.leaveRequest.update({
      where: { id: dto.leaveRequestId },
      data: { status: nextStatus, teamLeadComments: dto.comments },
    });
    await this.prisma.auditLog.create({
      data: {
        action: `leave.request.team_lead.${dto.decision}`,
        resource: 'leave_request',
        resourceId: updated.id,
      },
    });
    return updated;
  }

  async hrDecision(dto: UpdateLeaveStatusDto) {
    const nextStatus =
      dto.decision === 'approve'
        ? LeaveRequestStatus.APPROVED
        : LeaveRequestStatus.REJECTED;
    const updated = await this.prisma.leaveRequest.update({
      where: { id: dto.leaveRequestId },
      data: { status: nextStatus, hrComments: dto.comments },
    });

    if (nextStatus === LeaveRequestStatus.APPROVED) {
      const year = updated.startDate.getUTCFullYear();
      const existing = await this.prisma.leaveBalance.findFirst({
        where: {
          employeeId: updated.employeeId,
          leaveType: updated.leaveType,
          year,
        },
      });
      if (existing) {
        await this.prisma.leaveBalance.update({
          where: { id: existing.id },
          data: {
            usedDays: { increment: updated.totalDays },
            remainingDays: { decrement: updated.totalDays },
          },
        });
      }
    }
    return updated;
  }

  list(companyId: string, employeeId?: string) {
    return this.prisma.leaveRequest.findMany({
      where: { companyId, employeeId },
      include: { employee: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async calendar(companyId: string, month: string) {
    const [year, monthNumber] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 0, 23, 59, 59));
    return this.prisma.leaveRequest.findMany({
      where: {
        companyId,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: { employee: { include: { user: true } } },
      orderBy: { startDate: 'asc' },
    });
  }
}
