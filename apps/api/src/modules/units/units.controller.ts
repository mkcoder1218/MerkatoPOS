import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import {
  CreateUnitConversionDto,
  CreateUnitDto,
  UpdateUnitDto,
} from './dto/unit.dto';
import { UnitsService } from './units.service';

@Controller('units')
export class UnitsController {
  constructor(private readonly service: UnitsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.UNITS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.UNITS_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateUnitDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':unitId')
  @RequirePermissions(PERMISSIONS.UNITS_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('unitId') unitId: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.service.update(user.tenantId, unitId, dto);
  }

  @Get('conversions')
  @RequirePermissions(PERMISSIONS.UNITS_VIEW)
  conversions(@CurrentUser() user: JwtPayload) {
    return this.service.listConversions(user.tenantId);
  }

  @Post('conversions')
  @RequirePermissions(PERMISSIONS.UNITS_MANAGE)
  upsertConversion(@CurrentUser() user: JwtPayload, @Body() dto: CreateUnitConversionDto) {
    return this.service.upsertConversion(user.tenantId, dto);
  }
}
