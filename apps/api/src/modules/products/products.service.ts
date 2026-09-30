import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  list(tenantId: string) {
    return this.repository.list(tenantId);
  }

  async create(tenantId: string, dto: CreateProductDto) {
    await this.validateReferences(
      tenantId,
      dto.categoryId,
      dto.unitId,
      dto.taxProfileId,
      dto.branches ?? [],
    );

    return this.repository.create(
      tenantId,
      {
        name: dto.name.trim(),
        categoryId: dto.categoryId,
        unitId: dto.unitId,
        sellingPrice: dto.sellingPrice,
        ...(dto.taxProfileId ? { taxProfileId: dto.taxProfileId } : {}),
        ...(dto.sku ? { sku: dto.sku.trim() } : {}),
        ...(dto.barcode ? { barcode: dto.barcode.trim() } : {}),
        ...(dto.taxExempt !== undefined ? { taxExempt: dto.taxExempt } : {}),
        ...(dto.trackInventory !== undefined
          ? { trackInventory: dto.trackInventory }
          : {}),
      },
      dto.branches ?? [],
    );
  }

  async update(tenantId: string, productId: string, dto: UpdateProductDto) {
    const existing = await this.repository.find(tenantId, productId);
    if (!existing) {
      throw new NotFoundException('Product not found');
    }

    await this.validateReferences(
      tenantId,
      dto.categoryId ?? existing.categoryId,
      dto.unitId ?? existing.unitId,
      dto.taxProfileId ?? existing.taxProfileId ?? undefined,
      dto.branches ?? existing.branches,
    );

    return this.repository.update(
      tenantId,
      productId,
      {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.unitId !== undefined ? { unitId: dto.unitId } : {}),
        ...(dto.taxProfileId !== undefined ? { taxProfileId: dto.taxProfileId } : {}),
        ...(dto.sellingPrice !== undefined ? { sellingPrice: dto.sellingPrice } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku.trim() || null } : {}),
        ...(dto.barcode !== undefined ? { barcode: dto.barcode.trim() || null } : {}),
        ...(dto.taxExempt !== undefined ? { taxExempt: dto.taxExempt } : {}),
        ...(dto.trackInventory !== undefined
          ? { trackInventory: dto.trackInventory }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      dto.branches,
    );
  }

  private async validateReferences(
    tenantId: string,
    categoryId: string,
    unitId: string,
    taxProfileId: string | undefined,
    branches: Array<{ branchId: string }>,
  ): Promise<void> {
    const [category, unit, taxProfile] = await Promise.all([
      this.repository.findCategory(tenantId, categoryId),
      this.repository.findUnit(tenantId, unitId),
      taxProfileId ? this.repository.findTax(tenantId, taxProfileId) : Promise.resolve(null),
    ]);

    if (!category?.isActive) {
      throw new BadRequestException('Active category not found');
    }
    if (!unit?.isActive) {
      throw new BadRequestException('Active unit not found');
    }
    if (taxProfileId && !taxProfile?.isActive) {
      throw new BadRequestException('Active tax profile not found');
    }

    const branchIds = [...new Set(branches.map(({ branchId }) => branchId))];
    const ownedBranches = await this.repository.findBranches(tenantId, branchIds);
    if (ownedBranches.length !== branchIds.length) {
      throw new BadRequestException('One or more product branches are invalid');
    }
  }
}
