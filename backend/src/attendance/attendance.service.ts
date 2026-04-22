import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClockInOutDto } from './dto/clock-in-out.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private todayDateUtc() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  async clockIn(dto: ClockInOutDto) {
    const today = this.todayDateUtc();
    return this.prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: dto.employeeId, date: today } },
      create: {
        employeeId: dto.employeeId,
        companyId: dto.companyId,
        date: today,
        clockInAt: new Date(),
        remarks: dto.remarks,
      },
      update: {
        clockInAt: new Date(),
        remarks: dto.remarks,
      },
    });
  }

  async clockOut(dto: ClockInOutDto) {
    const today = this.todayDateUtc();
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: dto.employeeId, date: today } },
    });
    if (!record?.clockInAt) {
      throw new Error('Clock-in required before clock-out');
    }
    const clockOutAt = new Date();
    const workedMins = Math.max(0, Math.floor((clockOutAt.getTime() - record.clockInAt.getTime()) / 60000));
    return this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { clockOutAt, workedMins, remarks: dto.remarks ?? record.remarks },
    });
  }

  history(companyId: string, employeeId?: string) {
    return this.prisma.attendanceRecord.findMany({
      where: { companyId, employeeId },
      include: { employee: { include: { user: true } } },
      orderBy: { date: 'desc' },
      take: 60,
    });
  }
}
