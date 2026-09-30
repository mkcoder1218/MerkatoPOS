import { Module } from '@nestjs/common';
import { PrintJobsModule } from '../print-jobs/print-jobs.module';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { PricingService } from './pricing.service';
import { SalesRepository } from './sales.repository';

@Module({
  imports: [PrintJobsModule],
  controllers: [OrdersController],
  providers: [OrdersRepository, OrdersService, PricingService, SalesRepository],
})
export class OrdersModule {}
