import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { PermissionKey } from '../constants/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<{
      user?: { permissions?: PermissionKey[] };
    }>();
    const granted = request.user?.permissions ?? [];
    const hasAll = required.every((permission) => granted.includes(permission));

    if (!hasAll) {
      throw new ForbiddenException('Missing required permission');
    }

    return true;
  }
}
