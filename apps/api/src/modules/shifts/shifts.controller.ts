import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CloseShiftDto, OpenShiftDto } from './dto/shift.dto';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
export class ShiftsController {
  constructor(private readonly service: ShiftsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SHIFTS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user);
  }

  @Post('open')
  @RequirePermissions(PERMISSIONS.SHIFTS_OPEN)
  open(@CurrentUser() user: JwtPayload, @Body() dto: OpenShiftDto) {
    return this.service.open(user, dto);
  }

  @Post(':shiftId/close')
  @RequirePermissions(PERMISSIONS.SHIFTS_CLOSE)
  close(
    @CurrentUser() user: JwtPayload,
    @Param('shiftId') shiftId: string,
    @Body() dto: CloseShiftDto,
  ) {
    return this.service.close(user, shiftId, dto);
  }
}
