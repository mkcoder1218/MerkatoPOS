import { Controller, Get } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PERMISSIONS_VIEW)
  list() {
    return this.service.list();
  }
}
