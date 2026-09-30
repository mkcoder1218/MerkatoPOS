import { Injectable } from '@nestjs/common';
import type { UpdatePosSettingsDto } from './dto/update-pos-settings.dto';
import { PosSettingsRepository } from './pos-settings.repository';

@Injectable()
export class PosSettingsService {
  constructor(private readonly repository: PosSettingsRepository) {}

  get(tenantId: string) {
    return this.repository.getOrCreate(tenantId);
  }

  update(tenantId: string, dto: UpdatePosSettingsDto) {
    return this.repository.update(tenantId, {
      ...(dto.requireActiveShift !== undefined
        ? { requireActiveShift: dto.requireActiveShift }
        : {}),
      ...(dto.tablesEnabled !== undefined ? { tablesEnabled: dto.tablesEnabled } : {}),
    });
  }
}
