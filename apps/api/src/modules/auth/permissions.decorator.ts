import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '@merkatopos/shared';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (
  ...permissions: PermissionCode[]
): MethodDecorator & ClassDecorator => SetMetadata(PERMISSIONS_KEY, permissions);
