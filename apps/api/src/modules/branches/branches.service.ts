import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateBranchDto } from './dto/create-branch.dto';
import type { UpdateBranchDto } from './dto/update-branch.dto';
import { BranchesRepository } from './branches.repository';

@Injectable()
export class BranchesService {
  constructor(private readonly repository: BranchesRepository) {}

  list(tenantId: string) {
    return this.repository.listForTenant(tenantId);
  }

  create(tenantId: string, dto: CreateBranchDto) {
    return this.repository.create(tenantId, {
      name: dto.name.trim(),
      ...(dto.code ? { code: dto.code.trim() } : {}),
    });
  }

  async update(tenantId: string, branchId: string, dto: UpdateBranchDto) {
    const existing = await this.repository.findForTenant(tenantId, branchId);
    if (!existing) {
      throw new NotFoundException('Branch not found');
    }

    await this.repository.update(tenantId, branchId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    return this.repository.findForTenant(tenantId, branchId);
  }
}
