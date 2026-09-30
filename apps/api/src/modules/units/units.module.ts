import { Module } from '@nestjs/common';
import { UnitsController } from './units.controller';
import { UnitsRepository } from './units.repository';
import { UnitsService } from './units.service';

@Module({
  controllers: [UnitsController],
  providers: [UnitsRepository, UnitsService],
  exports: [UnitsRepository],
})
export class UnitsModule {}
