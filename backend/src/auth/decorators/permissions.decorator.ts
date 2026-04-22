import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '../constants/permissions';

export const PERMISSIONS_KEY = 'permissions';
export const PermissionsRequired = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
