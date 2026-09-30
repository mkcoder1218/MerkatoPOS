import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import { PricingService } from './pricing.service';
import { SalesRepository } from './sales.repository';

@Module({
  controllers: [OrdersController],
  providers: [OrdersRepository, OrdersService, PricingService, SalesRepository],
})
export class OrdersModule {}
