import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { TablesService } from './tables.service';

@Controller('tables')
export class TablesController {
  constructor(private readonly service: TablesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.TABLES_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TABLES_MANAGE)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTableDto) {
    return this.service.create(user, dto);
  }

  @Patch(':tableId')
  @RequirePermissions(PERMISSIONS.TABLES_MANAGE)
  update(
    @CurrentUser() user: JwtPayload,
    @Param('tableId') tableId: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.service.update(user, tableId, dto);
  }
}
