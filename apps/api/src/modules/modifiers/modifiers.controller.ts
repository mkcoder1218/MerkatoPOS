import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import {
  AttachModifierGroupsDto,
  CreateModifierGroupDto,
  CreateModifierOptionDto,
  UpdateModifierGroupDto,
  UpdateModifierOptionDto,
} from './dto/modifier.dto';
import { ModifiersService } from './modifiers.service';

@Controller('modifiers')
export class ModifiersController {
  constructor(private readonly service: ModifiersService) {}

  @Get('groups')
  @RequirePermissions(PERMISSIONS.MODIFIERS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.tenantId);
  }

  @Post('groups')
  @RequirePermissions(PERMISSIONS.MODIFIERS_MANAGE)
  createGroup(@CurrentUser() user: JwtPayload, @Body() dto: CreateModifierGroupDto) {
    return this.service.createGroup(user.tenantId, dto);
  }

  @Patch('groups/:groupId')
  @RequirePermissions(PERMISSIONS.MODIFIERS_MANAGE)
  updateGroup(
    @CurrentUser() user: JwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateModifierGroupDto,
  ) {
    return this.service.updateGroup(user.tenantId, groupId, dto);
  }

  @Post('groups/:groupId/options')
  @RequirePermissions(PERMISSIONS.MODIFIERS_MANAGE)
  addOption(
    @CurrentUser() user: JwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: CreateModifierOptionDto,
  ) {
    return this.service.addOption(user.tenantId, groupId, dto);
  }

  @Patch('options/:optionId')
  @RequirePermissions(PERMISSIONS.MODIFIERS_MANAGE)
  updateOption(
    @CurrentUser() user: JwtPayload,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateModifierOptionDto,
  ) {
    return this.service.updateOption(user.tenantId, optionId, dto);
  }

  @Put('products/:productId/groups')
  @RequirePermissions(PERMISSIONS.MODIFIERS_MANAGE)
  attachGroups(
    @CurrentUser() user: JwtPayload,
    @Param('productId') productId: string,
    @Body() dto: AttachModifierGroupsDto,
  ) {
    return this.service.attachProductGroups(user.tenantId, productId, dto);
  }
}
