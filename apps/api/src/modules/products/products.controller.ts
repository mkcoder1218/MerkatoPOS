import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRODUCTS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PRODUCTS_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':productId')
  @RequirePermissions(PERMISSIONS.PRODUCTS_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(user.tenantId, productId, dto);
  }
}
