import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionsRequired } from '../auth/decorators/permissions.decorator';
import { Permissions } from '../auth/constants/permissions';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { CreateBranchDto } from './dto/create-branch.dto';

@Controller('organization')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post('departments')
  @PermissionsRequired(Permissions.COMPANY_MANAGE)
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organizationService.createDepartment(dto);
  }

  @Get('departments')
  @PermissionsRequired(Permissions.EMPLOYEE_READ)
  listDepartments(@Query('companyId') companyId: string) {
    return this.organizationService.listDepartments(companyId);
  }

  @Post('teams')
  @PermissionsRequired(Permissions.COMPANY_MANAGE)
  createTeam(@Body() dto: CreateTeamDto) {
    return this.organizationService.createTeam(dto);
  }

  @Get('teams')
  @PermissionsRequired(Permissions.EMPLOYEE_READ)
  listTeams(@Query('companyId') companyId: string) {
    return this.organizationService.listTeams(companyId);
  }

  @Post('branches')
  @PermissionsRequired(Permissions.COMPANY_MANAGE)
  createBranch(@Body() dto: CreateBranchDto) {
    return this.organizationService.createBranch(dto);
  }

  @Get('branches')
  @PermissionsRequired(Permissions.EMPLOYEE_READ)
  listBranches(@Query('companyId') companyId: string) {
    return this.organizationService.listBranches(companyId);
  }
}
