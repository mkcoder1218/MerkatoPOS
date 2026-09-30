import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import { BranchesRepository } from '../branches/branches.repository';
import type { RegisterDeviceDto } from './dto/register-device.dto';
import { DevicesRepository } from './devices.repository';

@Injectable()
export class DevicesService {
  constructor(
    private readonly repository: DevicesRepository,
    private readonly branchesRepository: BranchesRepository,
  ) {}

  async register(user: JwtPayload, dto: RegisterDeviceDto) {
    if (!user.branchIds.includes(dto.branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const branch = await this.branchesRepository.findForTenant(user.tenantId, dto.branchId);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    return this.repository.register({
      tenantId: user.tenantId,
      branchId: dto.branchId,
      registeredById: user.userId,
      deviceUid: dto.deviceUid.trim(),
      name: dto.name.trim(),
      platform: dto.platform,
      ...(dto.appVersion ? { appVersion: dto.appVersion.trim() } : {}),
    });
  }

  list(user: JwtPayload) {
    return this.repository.listForTenant(user.tenantId);
  }
}
