import { Controller, Get } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PaymentsRepository } from './payments.repository';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly repository: PaymentsRepository) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAYMENTS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.repository.list(user.tenantId, user.branchIds);
  }
}
