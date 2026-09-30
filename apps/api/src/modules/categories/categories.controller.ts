import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CATEGORIES_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CATEGORIES_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':categoryId')
  @RequirePermissions(PERMISSIONS.CATEGORIES_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.update(user.tenantId, categoryId, dto);
  }
}
