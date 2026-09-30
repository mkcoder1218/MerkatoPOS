import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateUserDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':userId')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(user.tenantId, userId, dto);
  }

  @Post(':userId/reset-password')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  resetPassword(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.service.resetPassword(user.tenantId, userId, dto);
  }
}
