import { Module } from '@nestjs/common';
import { ModifiersController } from './modifiers.controller';
import { ModifiersRepository } from './modifiers.repository';
import { ModifiersService } from './modifiers.service';

@Module({
  controllers: [ModifiersController],
  providers: [ModifiersRepository, ModifiersService],
})
export class ModifiersModule {}
