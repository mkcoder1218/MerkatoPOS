import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsRepository } from './discounts.repository';
import { DiscountsService } from './discounts.service';

@Module({
  controllers: [DiscountsController],
  providers: [DiscountsRepository, DiscountsService],
})
export class DiscountsModule {}
