import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PermissionsRequired } from '../auth/decorators/permissions.decorator';
import { Permissions } from '../auth/constants/permissions';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company')
  @PermissionsRequired(Permissions.EMPLOYEE_READ)
  getCompany(@Query('companyId') companyId: string) {
    return this.settingsService.getCompany(companyId);
  }

  @Patch('company')
  @PermissionsRequired(Permissions.SETTINGS_MANAGE)
  updateCompany(
    @Query('companyId') companyId: string,
    @Body() dto: UpdateCompanySettingsDto,
  ) {
    return this.settingsService.updateCompany(companyId, dto);
  }
}
