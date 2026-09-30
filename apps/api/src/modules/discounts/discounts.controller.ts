import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import {
  CreateProductDiscountDto,
  UpdateProductDiscountDto,
} from './dto/discount.dto';
import { DiscountsService } from './discounts.service';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly service: DiscountsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.DISCOUNTS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.DISCOUNTS_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDiscountDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':discountId')
  @RequirePermissions(PERMISSIONS.DISCOUNTS_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('discountId') discountId: string,
    @Body() dto: UpdateProductDiscountDto,
  ) {
    return this.service.update(user.tenantId, discountId, dto);
  }
}
