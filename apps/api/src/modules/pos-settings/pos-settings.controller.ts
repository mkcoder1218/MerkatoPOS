import { Body, Controller, Get, Patch } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { UpdatePosSettingsDto } from './dto/update-pos-settings.dto';
import { PosSettingsService } from './pos-settings.service';

@Controller('pos-settings')
export class PosSettingsController {
  constructor(private readonly service: PosSettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TENANTS_VIEW)
  get(@CurrentUser() user: JwtPayload) {
    return this.service.get(user.tenantId);
  }

  @Patch()
  @RequirePermissions(PERMISSIONS.TENANTS_MANAGE)
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdatePosSettingsDto) {
    return this.service.update(user.tenantId, dto);
  }
}
