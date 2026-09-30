import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  AttachModifierGroupsDto,
  CreateModifierGroupDto,
  CreateModifierOptionDto,
  UpdateModifierGroupDto,
  UpdateModifierOptionDto,
} from './dto/modifier.dto';
import { ModifiersRepository } from './modifiers.repository';

@Injectable()
export class ModifiersService {
  constructor(private readonly repository: ModifiersRepository) {}

  list(tenantId: string) {
    return this.repository.listGroups(tenantId);
  }

  createGroup(tenantId: string, dto: CreateModifierGroupDto) {
    this.assertSelectionRange(dto.minSelect ?? 0, dto.maxSelect ?? 1);
    return this.repository.createGroup(tenantId, {
      name: dto.name.trim(),
      ...(dto.minSelect !== undefined ? { minSelect: dto.minSelect } : {}),
      ...(dto.maxSelect !== undefined ? { maxSelect: dto.maxSelect } : {}),
    });
  }

  async updateGroup(tenantId: string, groupId: string, dto: UpdateModifierGroupDto) {
    const group = await this.repository.findGroup(tenantId, groupId);
    if (!group) {
      throw new NotFoundException('Modifier group not found');
    }

    this.assertSelectionRange(
      dto.minSelect ?? group.minSelect,
      dto.maxSelect ?? group.maxSelect,
    );

    await this.repository.updateGroup(tenantId, groupId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.minSelect !== undefined ? { minSelect: dto.minSelect } : {}),
      ...(dto.maxSelect !== undefined ? { maxSelect: dto.maxSelect } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
    return this.repository.findGroup(tenantId, groupId);
  }

  async addOption(tenantId: string, groupId: string, dto: CreateModifierOptionDto) {
    if (!(await this.repository.findGroup(tenantId, groupId))) {
      throw new NotFoundException('Modifier group not found');
    }
    return this.repository.createOption(
      tenantId,
      groupId,
      dto.name.trim(),
      dto.priceDelta,
    );
  }

  async updateOption(
    tenantId: string,
    optionId: string,
    dto: UpdateModifierOptionDto,
  ) {
    if (!(await this.repository.findOption(tenantId, optionId))) {
      throw new NotFoundException('Modifier option not found');
    }
    await this.repository.updateOption(tenantId, optionId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.priceDelta !== undefined ? { priceDelta: dto.priceDelta } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
    return this.repository.findOption(tenantId, optionId);
  }

  async attachProductGroups(
    tenantId: string,
    productId: string,
    dto: AttachModifierGroupsDto,
  ) {
    if (!(await this.repository.findProduct(tenantId, productId))) {
      throw new NotFoundException('Product not found');
    }

    const ids = [...new Set(dto.modifierGroupIds)];
    const groups = await this.repository.findGroups(tenantId, ids);
    if (groups.length !== ids.length) {
      throw new BadRequestException('One or more modifier groups are invalid');
    }

    return this.repository.replaceProductGroups(productId, ids);
  }

  private assertSelectionRange(minSelect: number, maxSelect: number): void {
    if (minSelect > maxSelect) {
      throw new BadRequestException('minSelect cannot exceed maxSelect');
    }
  }
}
