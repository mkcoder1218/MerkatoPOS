import { Module } from '@nestjs/common';
import { PrintersController } from './printers.controller';
import { PrintersRepository } from './printers.repository';
import { PrintersService } from './printers.service';

@Module({
  controllers: [PrintersController],
  providers: [PrintersRepository, PrintersService],
})
export class PrintersModule {}
