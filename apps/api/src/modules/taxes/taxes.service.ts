import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateTaxProfileDto, UpdateTaxProfileDto } from './dto/tax.dto';
import { TaxesRepository } from './taxes.repository';

@Injectable()
export class TaxesService {
  constructor(private readonly repository: TaxesRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  create(tenantId: string, dto: CreateTaxProfileDto) {
    this.assertPercentage(dto.percentage);
    return this.repository.create(tenantId, {
      name: dto.name.trim(),
      percentage: dto.percentage,
      mode: dto.mode,
      ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
    });
  }

  async update(tenantId: string, taxProfileId: string, dto: UpdateTaxProfileDto) {
    if (!(await this.repository.find(tenantId, taxProfileId))) {
      throw new NotFoundException('Tax profile not found');
    }
    if (dto.percentage !== undefined) {
      this.assertPercentage(dto.percentage);
    }

    return this.repository.update(tenantId, taxProfileId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.percentage !== undefined ? { percentage: dto.percentage } : {}),
      ...(dto.mode !== undefined ? { mode: dto.mode } : {}),
      ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
  }

  private assertPercentage(value: string): void {
    const percentage = Number(value);
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Tax percentage must be between 0 and 100');
    }
  }
}
