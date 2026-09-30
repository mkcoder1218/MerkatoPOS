import { Module } from '@nestjs/common';
import { BranchesModule } from '../branches/branches.module';
import { DevicesController } from './devices.controller';
import { DevicesRepository } from './devices.repository';
import { DevicesService } from './devices.service';

@Module({
  imports: [BranchesModule],
  controllers: [DevicesController],
  providers: [DevicesRepository, DevicesService],
})
export class DevicesModule {}
