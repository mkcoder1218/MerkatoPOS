import { Module } from '@nestjs/common';
import { BranchesModule } from '../branches/branches.module';
import { RegistersController } from './registers.controller';
import { RegistersRepository } from './registers.repository';
import { RegistersService } from './registers.service';

@Module({
  imports: [BranchesModule],
  controllers: [RegistersController],
  providers: [RegistersRepository, RegistersService],
})
export class RegistersModule {}
