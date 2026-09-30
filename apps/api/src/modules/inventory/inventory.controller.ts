import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import {
  CreateInventoryItemDto,
  RecordStockMovementDto,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.INVENTORY_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.INVENTORY_ADJUST)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateInventoryItemDto) {
    return this.service.create(user, dto);
  }

  @Get(':itemId/movements')
  @RequirePermissions(PERMISSIONS.INVENTORY_VIEW)
  movements(@CurrentUser() user: JwtPayload, @Param('itemId') itemId: string) {
    return this.service.listMovements(user, itemId);
  }

  @Post(':itemId/movements')
  @RequirePermissions(PERMISSIONS.INVENTORY_ADJUST)
  recordMovement(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') itemId: string,
    @Body() dto: RecordStockMovementDto,
  ) {
    return this.service.recordMovement(user, itemId, dto);
  }
}
