import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionsRequired } from '../auth/decorators/permissions.decorator';
import { Permissions } from '../auth/constants/permissions';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesDto } from './dto/list-employees.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @PermissionsRequired(Permissions.EMPLOYEE_MANAGE)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Get()
  @PermissionsRequired(Permissions.EMPLOYEE_READ)
  list(@Query() query: ListEmployeesDto) {
    return this.employeesService.list(query);
  }
}
