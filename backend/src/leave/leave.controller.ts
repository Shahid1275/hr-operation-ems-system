import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionsRequired } from '../auth/decorators/permissions.decorator';
import { Permissions } from '../auth/constants/permissions';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveStatusDto } from './dto/update-leave-status.dto';
import { CreateLeavePolicyDto } from './dto/create-leave-policy.dto';
import { AllocateLeaveBalanceDto } from './dto/allocate-leave-balance.dto';

@Controller('leave')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post('policies')
  @PermissionsRequired(Permissions.LEAVE_APPROVE_HR)
  createPolicy(@Body() dto: CreateLeavePolicyDto) {
    return this.leaveService.createPolicy(dto);
  }

  @Get('policies')
  @PermissionsRequired(Permissions.LEAVE_READ)
  listPolicies(@Query('companyId') companyId: string) {
    return this.leaveService.listPolicies(companyId);
  }

  @Post('balances/allocate')
  @PermissionsRequired(Permissions.LEAVE_APPROVE_HR)
  allocateBalance(@Body() dto: AllocateLeaveBalanceDto) {
    return this.leaveService.allocateBalance(dto);
  }

  @Get('balances')
  @PermissionsRequired(Permissions.LEAVE_READ)
  listBalances(@Query('companyId') companyId: string, @Query('employeeId') employeeId?: string) {
    return this.leaveService.listBalances(companyId, employeeId);
  }

  @Post('requests')
  @PermissionsRequired(Permissions.LEAVE_REQUEST)
  create(@Body() dto: CreateLeaveRequestDto) {
    return this.leaveService.create(dto);
  }

  @Post('approve/team-lead')
  @PermissionsRequired(Permissions.LEAVE_APPROVE_TEAM)
  teamLeadDecision(@Body() dto: UpdateLeaveStatusDto) {
    return this.leaveService.teamLeadDecision(dto);
  }

  @Post('approve/hr')
  @PermissionsRequired(Permissions.LEAVE_APPROVE_HR)
  hrDecision(@Body() dto: UpdateLeaveStatusDto) {
    return this.leaveService.hrDecision(dto);
  }

  @Get('requests')
  @PermissionsRequired(Permissions.LEAVE_READ)
  list(@Query('companyId') companyId: string, @Query('employeeId') employeeId?: string) {
    return this.leaveService.list(companyId, employeeId);
  }

  @Get('calendar')
  @PermissionsRequired(Permissions.LEAVE_READ)
  calendar(@Query('companyId') companyId: string, @Query('month') month: string) {
    return this.leaveService.calendar(companyId, month);
  }
}
