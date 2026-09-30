import { Module } from '@nestjs/common';
import { PrintJobsController } from './print-jobs.controller';
import { PrintJobsRepository } from './print-jobs.repository';
import { PrintJobsService } from './print-jobs.service';
import { PrintPayloadService } from './print-payload.service';

@Module({
  controllers: [PrintJobsController],
  providers: [PrintJobsRepository, PrintJobsService, PrintPayloadService],
  exports: [PrintPayloadService],
})
export class PrintJobsModule {}
