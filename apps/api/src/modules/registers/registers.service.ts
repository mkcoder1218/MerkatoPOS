import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import { BranchesRepository } from '../branches/branches.repository';
import type { CreateRegisterDto } from './dto/create-register.dto';
import type { UpdateRegisterDto } from './dto/update-register.dto';
import { RegistersRepository } from './registers.repository';

@Injectable()
export class RegistersService {
  constructor(
    private readonly repository: RegistersRepository,
    private readonly branchesRepository: BranchesRepository,
  ) {}

  list(user: JwtPayload) {
    return this.repository.listForTenant(user.tenantId);
  }

  async create(user: JwtPayload, dto: CreateRegisterDto) {
    await this.assertBranch(user, dto.branchId);
    if (dto.deviceId) {
      await this.assertDevice(user.tenantId, dto.branchId, dto.deviceId);
    }

    return this.repository.create(user.tenantId, {
      branchId: dto.branchId,
      name: dto.name.trim(),
      code: dto.code.trim(),
      ...(dto.deviceId ? { deviceId: dto.deviceId } : {}),
    });
  }

  async update(user: JwtPayload, registerId: string, dto: UpdateRegisterDto) {
    const register = await this.repository.findForTenant(user.tenantId, registerId);
    if (!register) {
      throw new NotFoundException('Register not found');
    }

    const targetBranchId = dto.branchId ?? register.branchId;
    if (dto.branchId !== undefined) {
      await this.assertBranch(user, dto.branchId);
    }

    if (dto.deviceId !== undefined) {
      await this.assertDevice(user.tenantId, targetBranchId, dto.deviceId);
    }

    await this.repository.update(user.tenantId, registerId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
      ...(dto.branchId !== undefined ? { branchId: dto.branchId } : {}),
      ...(dto.deviceId !== undefined ? { deviceId: dto.deviceId || null } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    return this.repository.findForTenant(user.tenantId, registerId);
  }

  private async assertBranch(user: JwtPayload, branchId: string): Promise<void> {
    if (!user.branchIds.includes(branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }
    const branch = await this.branchesRepository.findForTenant(user.tenantId, branchId);
    if (!branch || !branch.isActive) {
      throw new NotFoundException('Active branch not found');
    }
  }

  private async assertDevice(
    tenantId: string,
    branchId: string,
    deviceId: string,
  ): Promise<void> {
    const device = await this.repository.findDevice(tenantId, deviceId);
    if (!device || device.status !== 'ACTIVE') {
      throw new BadRequestException('Active device not found');
    }
    if (device.branchId !== branchId) {
      throw new BadRequestException('Device and register must belong to the same branch');
    }
  }
}
