import { Module } from '@nestjs/common';
import { PosSettingsController } from './pos-settings.controller';
import { PosSettingsRepository } from './pos-settings.repository';
import { PosSettingsService } from './pos-settings.service';

@Module({
  controllers: [PosSettingsController],
  providers: [PosSettingsRepository, PosSettingsService],
  exports: [PosSettingsRepository],
})
export class PosSettingsModule {}
