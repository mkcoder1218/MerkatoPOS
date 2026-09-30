import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type StockMovementType } from '@prisma/client';
import type { JwtPayload } from '../auth/auth.types';
import type {
  CreateInventoryItemDto,
  RecordStockMovementDto,
} from './dto/inventory.dto';
import { InventoryRepository } from './inventory.repository';

const POSITIVE_MOVEMENTS: readonly StockMovementType[] = [
  'PURCHASE',
  'PRODUCTION',
  'TRANSFER_IN',
  'RETURN',
];
const NEGATIVE_MOVEMENTS: readonly StockMovementType[] = [
  'SALE',
  'WASTE',
  'TRANSFER_OUT',
];

@Injectable()
export class InventoryService {
  constructor(private readonly repository: InventoryRepository) {}

  list(user: JwtPayload) {
    return this.repository.list(user.tenantId, user.branchIds);
  }

  async create(user: JwtPayload, dto: CreateInventoryItemDto) {
    this.assertBranchAccess(user, dto.branchId);

    const [branch, product, unit] = await Promise.all([
      this.repository.findBranch(user.tenantId, dto.branchId),
      this.repository.findProduct(user.tenantId, dto.productId),
      this.repository.findUnit(user.tenantId, dto.unitId),
    ]);

    if (!branch) {
      throw new NotFoundException('Active branch not found');
    }
    if (!product?.trackInventory) {
      throw new BadRequestException('Product is not configured for inventory tracking');
    }
    if (!unit) {
      throw new BadRequestException('Active inventory unit not found');
    }
    if (product.unitId !== dto.unitId) {
      throw new BadRequestException(
        'Basic inventory must use the product selling unit; conversions are applied explicitly',
      );
    }

    return this.repository.create(user.tenantId, {
      branchId: dto.branchId,
      productId: dto.productId,
      unitId: dto.unitId,
      ...(dto.allowNegativeStock !== undefined
        ? { allowNegativeStock: dto.allowNegativeStock }
        : {}),
    });
  }

  async listMovements(user: JwtPayload, itemId: string) {
    const item = await this.getAccessibleItem(user, itemId);
    return this.repository.listMovements(user.tenantId, item.id);
  }

  async recordMovement(
    user: JwtPayload,
    itemId: string,
    dto: RecordStockMovementDto,
  ) {
    this.validateMovementSign(dto.type, dto.quantityDelta);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const item = await this.getAccessibleItem(user, itemId);
      const current = new Prisma.Decimal(item.currentQuantity);
      const delta = new Prisma.Decimal(dto.quantityDelta);
      const next = current.plus(delta);

      if (!item.allowNegativeStock && next.isNegative()) {
        throw new BadRequestException('Stock movement would make inventory negative');
      }

      const saved = await this.repository.recordMovement({
        tenantId: user.tenantId,
        branchId: item.branchId,
        inventoryItemId: item.id,
        createdById: user.userId,
        type: dto.type,
        quantityDelta: delta.toFixed(6),
        quantityAfter: next.toFixed(6),
        expectedVersion: item.version,
        ...(dto.referenceType ? { referenceType: dto.referenceType.trim() } : {}),
        ...(dto.referenceId ? { referenceId: dto.referenceId.trim() } : {}),
        ...(dto.note ? { note: dto.note.trim() } : {}),
      });

      if (saved) {
        return this.repository.find(user.tenantId, item.id);
      }
    }

    throw new ConflictException('Inventory changed concurrently; retry the movement');
  }

  private async getAccessibleItem(user: JwtPayload, itemId: string) {
    const item = await this.repository.find(user.tenantId, itemId);
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }
    this.assertBranchAccess(user, item.branchId);
    return item;
  }

  private assertBranchAccess(user: JwtPayload, branchId: string): void {
    if (!user.branchIds.includes(branchId)) {
      throw new ForbiddenException('You do not have access to this branch');
    }
  }

  private validateMovementSign(type: StockMovementType, quantityDelta: string): void {
    const delta = new Prisma.Decimal(quantityDelta);
    if (delta.isZero()) {
      throw new BadRequestException('Stock movement quantity cannot be zero');
    }
    if (POSITIVE_MOVEMENTS.includes(type) && delta.isNegative()) {
      throw new BadRequestException(`${type} quantity must be positive`);
    }
    if (NEGATIVE_MOVEMENTS.includes(type) && delta.isPositive()) {
      throw new BadRequestException(`${type} quantity must be negative`);
    }
  }
}
