import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { RolePermissionMatrix } from '../auth/constants/permissions';

@Controller('access-control')
@UseGuards(JwtAuthGuard)
export class AccessControlController {
  @Get('me')
  getMyAccess(@CurrentUser() user: AuthUser & { permissions?: string[] }) {
    return {
      systemRole: user.systemRole,
      permissions: user.permissions ?? [],
    };
  }

  @Get('matrix')
  getMatrix() {
    return RolePermissionMatrix;
  }
}
