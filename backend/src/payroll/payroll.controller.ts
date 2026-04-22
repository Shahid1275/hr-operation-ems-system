import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionsRequired } from '../auth/decorators/permissions.decorator';
import { Permissions } from '../auth/constants/permissions';
import { CreatePayrollRecordDto } from './dto/create-payroll-record.dto';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { CreatePayrollRevisionDto } from './dto/create-payroll-revision.dto';

@Controller('payroll')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('cycles')
  @PermissionsRequired(Permissions.PAYROLL_MANAGE)
  createCycle(@Body() dto: CreatePayrollCycleDto) {
    return this.payrollService.createCycle(dto);
  }

  @Post('records')
  @PermissionsRequired(Permissions.PAYROLL_MANAGE)
  create(@Body() dto: CreatePayrollRecordDto) {
    return this.payrollService.create(dto);
  }

  @Get('records')
  @PermissionsRequired(Permissions.PAYROLL_READ_ALL)
  list(@Query('companyId') companyId: string, @Query('employeeId') employeeId?: string) {
    return this.payrollService.list(companyId, employeeId);
  }

  @Post('revisions')
  @PermissionsRequired(Permissions.PAYROLL_MANAGE)
  createRevision(@Body() dto: CreatePayrollRevisionDto) {
    return this.payrollService.createRevision(dto);
  }

  @Get('cycles')
  @PermissionsRequired(Permissions.PAYROLL_READ_ALL)
  listCycles(@Query('companyId') companyId: string) {
    return this.payrollService.listCycles(companyId);
  }

  @Get('revisions')
  @PermissionsRequired(Permissions.PAYROLL_READ_ALL)
  listRevisions(@Query('companyId') companyId: string, @Query('employeeId') employeeId?: string) {
    return this.payrollService.listRevisions(companyId, employeeId);
  }

  @Get('payslip')
  @PermissionsRequired(Permissions.PAYROLL_READ_ALL)
  payslip(@Query('payrollRecordId') payrollRecordId: string) {
    return this.payrollService.payslip(payrollRecordId);
  }
}
