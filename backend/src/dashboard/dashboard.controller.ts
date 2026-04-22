import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionsRequired } from '../auth/decorators/permissions.decorator';
import { Permissions } from '../auth/constants/permissions';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin-summary')
  @PermissionsRequired(Permissions.EMPLOYEE_READ)
  adminSummary(@Query('companyId') companyId: string) {
    return this.dashboardService.adminSummary(companyId);
  }

  @Get('employee-summary')
  @PermissionsRequired(Permissions.EMPLOYEE_READ)
  employeeSummary(
    @Query('employeeId') employeeId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.dashboardService.employeeSummary(employeeId, companyId);
  }
}
