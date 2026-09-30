import { Controller, Get } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get('current')
  @RequirePermissions(PERMISSIONS.TENANTS_VIEW)
  getCurrent(@CurrentUser() user: JwtPayload) {
    return this.service.getCurrentTenant(user.tenantId);
  }
}
