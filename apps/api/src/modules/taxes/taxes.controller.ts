import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateTaxProfileDto, UpdateTaxProfileDto } from './dto/tax.dto';
import { TaxesService } from './taxes.service';

@Controller('taxes')
export class TaxesController {
  constructor(private readonly service: TaxesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TAXES_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TAXES_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTaxProfileDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':taxProfileId')
  @RequirePermissions(PERMISSIONS.TAXES_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('taxProfileId') taxProfileId: string,
    @Body() dto: UpdateTaxProfileDto,
  ) {
    return this.service.update(user.tenantId, taxProfileId, dto);
  }
}
