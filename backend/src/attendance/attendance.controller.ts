import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionsRequired } from '../auth/decorators/permissions.decorator';
import { Permissions } from '../auth/constants/permissions';
import { ClockInOutDto } from './dto/clock-in-out.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @PermissionsRequired(Permissions.ATTENDANCE_MANAGE)
  clockIn(@Body() dto: ClockInOutDto) {
    return this.attendanceService.clockIn(dto);
  }

  @Post('clock-out')
  @PermissionsRequired(Permissions.ATTENDANCE_MANAGE)
  clockOut(@Body() dto: ClockInOutDto) {
    return this.attendanceService.clockOut(dto);
  }

  @Get('history')
  @PermissionsRequired(Permissions.ATTENDANCE_READ)
  history(@Query('companyId') companyId: string, @Query('employeeId') employeeId?: string) {
    return this.attendanceService.history(companyId, employeeId);
  }
}
