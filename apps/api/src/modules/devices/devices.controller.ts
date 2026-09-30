import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { DevicesService } from './devices.service';
import { DeviceHeartbeatDto } from './dto/device-heartbeat.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly service: DevicesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.DEVICES_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user);
  }

  @Post('register')
  @RequirePermissions(PERMISSIONS.DEVICES_REGISTER)
  register(@CurrentUser() user: JwtPayload, @Body() dto: RegisterDeviceDto) {
    return this.service.register(user, dto);
  }

  @Patch(':deviceId')
  @RequirePermissions(PERMISSIONS.DEVICES_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('deviceId') deviceId: string,
    @Body() dto: UpdateDeviceDto,
  ) {
    return this.service.update(user, deviceId, dto);
  }

  @Post(':deviceId/heartbeat')
  heartbeat(
    @CurrentUser() user: JwtPayload,
    @Param('deviceId') deviceId: string,
    @Body() dto: DeviceHeartbeatDto,
  ) {
    return this.service.heartbeat(user, deviceId, dto);
  }
}
