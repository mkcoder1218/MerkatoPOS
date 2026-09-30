import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import {
  CompleteSaleDto,
  CreateOrderDto,
  DecideVoidDto,
  RequestVoidDto,
  UpdateOrderDto,
} from './dto/order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ORDERS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user);
  }

  @Get(':orderId')
  @RequirePermissions(PERMISSIONS.ORDERS_VIEW)
  get(@CurrentUser() user: JwtPayload, @Param('orderId') orderId: string) {
    return this.service.get(user, orderId);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ORDERS_CREATE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.service.create(user, dto);
  }

  @Patch(':orderId')
  @RequirePermissions(PERMISSIONS.ORDERS_UPDATE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.service.update(user, orderId, dto);
  }

  @Post(':orderId/complete')
  @RequirePermissions(PERMISSIONS.SALES_COMPLETE)
  complete(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
    @Body() dto: CompleteSaleDto,
  ) {
    return this.service.complete(user, orderId, dto);
  }

  @Post(':orderId/void-request')
  @RequirePermissions(PERMISSIONS.SALES_VOID)
  requestVoid(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
    @Body() dto: RequestVoidDto,
  ) {
    return this.service.requestVoid(user, orderId, dto);
  }

  @Post(':orderId/void-approve')
  @RequirePermissions(PERMISSIONS.SALES_VOID_APPROVE)
  approveVoid(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
    @Body() dto: DecideVoidDto,
  ) {
    return this.service.approveVoid(user, orderId, dto);
  }

  @Post(':orderId/void-reject')
  @RequirePermissions(PERMISSIONS.SALES_VOID_APPROVE)
  rejectVoid(
    @CurrentUser() user: JwtPayload,
    @Param('orderId') orderId: string,
    @Body() dto: DecideVoidDto,
  ) {
    return this.service.rejectVoid(user, orderId, dto);
  }
}
