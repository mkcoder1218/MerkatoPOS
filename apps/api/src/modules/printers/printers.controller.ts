import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import {
  AssignReceiptPrinterDto,
  CreateKitchenRouteDto,
  CreatePrinterDto,
  UpdateKitchenRouteDto,
  UpdatePrinterDto,
} from './dto/printer.dto';
import { PrintersService } from './printers.service';

@Controller('printers')
export class PrintersController {
  constructor(private readonly service: PrintersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRINTERS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PRINTERS_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePrinterDto) {
    return this.service.create(user, dto);
  }

  @Patch(':printerId')
  @RequirePermissions(PERMISSIONS.PRINTERS_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('printerId') printerId: string,
    @Body() dto: UpdatePrinterDto,
  ) {
    return this.service.update(user, printerId, dto);
  }

  @Put('receipt-assignment')
  @RequirePermissions(PERMISSIONS.PRINTERS_MANAGE)
  assignReceipt(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AssignReceiptPrinterDto,
  ) {
    return this.service.assignReceiptPrinter(user, dto);
  }

  @Get('kitchen-routes/list')
  @RequirePermissions(PERMISSIONS.PRINTERS_VIEW)
  routes(@CurrentUser() user: JwtPayload) {
    return this.service.listRoutes(user);
  }

  @Post('kitchen-routes')
  @RequirePermissions(PERMISSIONS.PRINTERS_MANAGE)
  createRoute(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateKitchenRouteDto,
  ) {
    return this.service.createRoute(user, dto);
  }

  @Patch('kitchen-routes/:routeId')
  @RequirePermissions(PERMISSIONS.PRINTERS_MANAGE)
  updateRoute(
    @CurrentUser() user: JwtPayload,
    @Param('routeId') routeId: string,
    @Body() dto: UpdateKitchenRouteDto,
  ) {
    return this.service.updateRoute(user, routeId, dto);
  }
}
