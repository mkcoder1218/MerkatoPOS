import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import { BranchesRepository } from '../branches/branches.repository';
import type { DeviceHeartbeatDto } from './dto/device-heartbeat.dto';
import type { RegisterDeviceDto } from './dto/register-device.dto';
import type { UpdateDeviceDto } from './dto/update-device.dto';
import { DevicesRepository } from './devices.repository';

@Injectable()
export class DevicesService {
  constructor(
    private readonly repository: DevicesRepository,
    private readonly branchesRepository: BranchesRepository,
  ) {}

  async register(user: JwtPayload, dto: RegisterDeviceDto) {
    await this.assertBranchAccess(user, dto.branchId);

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

  async update(user: JwtPayload, deviceId: string, dto: UpdateDeviceDto) {
    const device = await this.repository.findForTenant(user.tenantId, deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }

    if (dto.branchId !== undefined) {
      await this.assertBranchAccess(user, dto.branchId);
    }

    await this.repository.update(user.tenantId, deviceId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.branchId !== undefined ? { branchId: dto.branchId } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    });

    return this.repository.findForTenant(user.tenantId, deviceId);
  }

  async heartbeat(user: JwtPayload, deviceId: string, dto: DeviceHeartbeatDto) {
    const device = await this.repository.findForTenant(user.tenantId, deviceId);
    if (!device) {
      throw new NotFoundException('Device not found');
    }
    if (!user.branchIds.includes(device.branchId)) {
      throw new ForbiddenException('You do not have access to this device branch');
    }

    await this.repository.heartbeat(
      user.tenantId,
      deviceId,
      dto.appVersion?.trim(),
    );
    return this.repository.findForTenant(user.tenantId, deviceId);
  }

  private async assertBranchAccess(user: JwtPayload, branchId: string): Promise<void> {
    if (!user.branchIds.includes(branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }

    const branch = await this.branchesRepository.findForTenant(user.tenantId, branchId);
    if (!branch || !branch.isActive) {
      throw new NotFoundException('Active branch not found');
    }
  }
}
