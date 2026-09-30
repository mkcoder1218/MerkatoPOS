import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/auth.types';
import type { CreateTableDto, UpdateTableDto } from './dto/table.dto';
import { TablesRepository } from './tables.repository';

@Injectable()
export class TablesService {
  constructor(private readonly repository: TablesRepository) {}

  async list(user: JwtPayload) {
    const settings = await this.repository.getSettings(user.tenantId);
    if (!settings.tablesEnabled) {
      return [];
    }
    return this.repository.list(user.tenantId, user.branchIds);
  }

  async create(user: JwtPayload, dto: CreateTableDto) {
    const settings = await this.repository.getSettings(user.tenantId);
    if (!settings.tablesEnabled) {
      throw new BadRequestException('Table workflow is disabled');
    }
    this.assertBranchAccess(user, dto.branchId);

    if (!(await this.repository.findBranch(user.tenantId, dto.branchId))) {
      throw new NotFoundException('Active branch not found');
    }

    return this.repository.create(user.tenantId, {
      branchId: dto.branchId,
      name: dto.name.trim(),
      code: dto.code.trim(),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
    });
  }

  async update(user: JwtPayload, tableId: string, dto: UpdateTableDto) {
    const table = await this.repository.find(user.tenantId, tableId);
    if (!table) {
      throw new NotFoundException('Table not found');
    }
    this.assertBranchAccess(user, table.branchId);

    await this.repository.update(user.tenantId, tableId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
      ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });

    return this.repository.find(user.tenantId, tableId);
  }

  private assertBranchAccess(user: JwtPayload, branchId: string): void {
    if (!user.branchIds.includes(branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }
  }
}
