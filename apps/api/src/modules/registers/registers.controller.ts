import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateRegisterDto } from './dto/create-register.dto';
import { UpdateRegisterDto } from './dto/update-register.dto';
import { RegistersService } from './registers.service';

@Controller('registers')
export class RegistersController {
  constructor(private readonly service: RegistersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.REGISTERS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.REGISTERS_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateRegisterDto) {
    return this.service.create(user, dto);
  }

  @Patch(':registerId')
  @RequirePermissions(PERMISSIONS.REGISTERS_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('registerId') registerId: string,
    @Body() dto: UpdateRegisterDto,
  ) {
    return this.service.update(user, registerId, dto);
  }
}
