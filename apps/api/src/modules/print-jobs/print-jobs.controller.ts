import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PERMISSIONS } from '@merkatopos/shared';
import type { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ClaimPrintJobDto, FailPrintJobDto, ReprintJobDto } from './dto/print-job.dto';
import { PrintJobsService } from './print-jobs.service';

@Controller('print-jobs')
export class PrintJobsController {
  constructor(private readonly service: PrintJobsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PRINT_JOBS_VIEW)
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user);
  }

  @Post('claim')
  @RequirePermissions(PERMISSIONS.PRINT_AGENT)
  claim(@CurrentUser() user: JwtPayload, @Body() dto: ClaimPrintJobDto) {
    return this.service.claim(user, dto);
  }

  @Post(':jobId/printed')
  @RequirePermissions(PERMISSIONS.PRINT_AGENT)
  printed(@CurrentUser() user: JwtPayload, @Param('jobId') jobId: string) {
    return this.service.markPrinted(user, jobId);
  }

  @Post(':jobId/failed')
  @RequirePermissions(PERMISSIONS.PRINT_AGENT)
  failed(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() dto: FailPrintJobDto,
  ) {
    return this.service.markFailed(user, jobId, dto);
  }

  @Post(':jobId/retry')
  @RequirePermissions(PERMISSIONS.PRINT_JOBS_REPRINT)
  retry(@CurrentUser() user: JwtPayload, @Param('jobId') jobId: string) {
    return this.service.retry(user, jobId);
  }

  @Post(':jobId/reprint')
  @RequirePermissions(PERMISSIONS.PRINT_JOBS_REPRINT)
  reprint(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() dto: ReprintJobDto,
  ) {
    return this.service.reprint(user, jobId, dto);
  }
}
