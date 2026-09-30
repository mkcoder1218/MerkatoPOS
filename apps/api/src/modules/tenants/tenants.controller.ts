import { Body, Controller, Get, Patch } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get('current')
  @RequirePermissions(PERMISSIONS.TENANTS_VIEW)
  getCurrent(@CurrentUser() user: JwtPayload) {
    return this.service.getCurrentTenant(user.tenantId);
  }

  @Patch('current')
  @RequirePermissions(PERMISSIONS.TENANTS_MANAGE)
  updateCurrent(@CurrentUser() user: JwtPayload, @Body() dto: UpdateTenantDto) {
    return this.service.updateCurrentTenant(user.tenantId, dto);
  }
}
