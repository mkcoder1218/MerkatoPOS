import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateUnitConversionDto,
  CreateUnitDto,
  UpdateUnitDto,
} from './dto/unit.dto';
import { UnitsRepository } from './units.repository';

@Injectable()
export class UnitsService {
  constructor(private readonly repository: UnitsRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  listConversions(tenantId: string) {
    return this.repository.listConversions(tenantId);
  }

  create(tenantId: string, dto: CreateUnitDto) {
    return this.repository.create(tenantId, dto.name.trim(), dto.symbol.trim());
  }

  async update(tenantId: string, unitId: string, dto: UpdateUnitDto) {
    if (!(await this.repository.find(tenantId, unitId))) {
      throw new NotFoundException('Unit not found');
    }

    await this.repository.update(tenantId, unitId, {
      ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      ...(dto.symbol !== undefined ? { symbol: dto.symbol.trim() } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
    return this.repository.find(tenantId, unitId);
  }

  async upsertConversion(tenantId: string, dto: CreateUnitConversionDto) {
    if (dto.fromUnitId === dto.toUnitId) {
      throw new BadRequestException('A unit cannot convert to itself');
    }

    const [fromUnit, toUnit] = await Promise.all([
      this.repository.find(tenantId, dto.fromUnitId),
      this.repository.find(tenantId, dto.toUnitId),
    ]);

    if (!fromUnit || !toUnit) {
      throw new BadRequestException('Both units must belong to the tenant');
    }
    if (Number(dto.multiplier) <= 0) {
      throw new BadRequestException('Conversion multiplier must be greater than zero');
    }

    return this.repository.upsertConversion(
      tenantId,
      dto.fromUnitId,
      dto.toUnitId,
      dto.multiplier,
    );
  }
}
