import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateRoleDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':roleId')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.service.update(user.tenantId, roleId, dto);
  }

  @Delete(':roleId')
  @RequirePermissions(PERMISSIONS.ROLES_MANAGE)
  remove(@CurrentUser() user: JwtPayload, @Param('roleId') roleId: string) {
    return this.service.remove(user.tenantId, roleId);
  }
}
