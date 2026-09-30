import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma, type StockMovementType } from '@prisma/client';

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string, branchIds: string[]) {
    return this.prisma.inventoryItem.findMany({
      where: { tenantId, branchId: { in: branchIds } },
      orderBy: { updatedAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        branch: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true, symbol: true } },
      },
    });
  }

  find(tenantId: string, itemId: string) {
    return this.prisma.inventoryItem.findFirst({
      where: { id: itemId, tenantId },
    });
  }

  findBranch(tenantId: string, branchId: string) {
    return this.prisma.branch.findFirst({
      where: { id: branchId, tenantId, isActive: true },
    });
  }

  findProduct(tenantId: string, productId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId, tenantId, isActive: true },
    });
  }

  findUnit(tenantId: string, unitId: string) {
    return this.prisma.unit.findFirst({
      where: { id: unitId, tenantId, isActive: true },
    });
  }

  create(
    tenantId: string,
    input: {
      branchId: string;
      productId: string;
      unitId: string;
      allowNegativeStock?: boolean;
    },
  ) {
    return this.prisma.inventoryItem.create({
      data: { tenantId, ...input },
    });
  }

  listMovements(tenantId: string, itemId: string) {
    return this.prisma.stockMovement.findMany({
      where: { tenantId, inventoryItemId: itemId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async recordMovement(input: {
    tenantId: string;
    branchId: string;
    inventoryItemId: string;
    createdById: string;
    type: StockMovementType;
    quantityDelta: string;
    quantityAfter: string;
    expectedVersion: number;
    referenceType?: string;
    referenceId?: string;
    note?: string;
  }): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryItem.updateMany({
        where: {
          id: input.inventoryItemId,
          tenantId: input.tenantId,
          version: input.expectedVersion,
        },
        data: {
          currentQuantity: new Prisma.Decimal(input.quantityAfter),
          version: { increment: 1 },
        },
      });

      if (updated.count !== 1) {
        return false;
      }

      await tx.stockMovement.create({
        data: {
          tenantId: input.tenantId,
          branchId: input.branchId,
          inventoryItemId: input.inventoryItemId,
          createdById: input.createdById,
          type: input.type,
          quantityDelta: new Prisma.Decimal(input.quantityDelta),
          quantityAfter: new Prisma.Decimal(input.quantityAfter),
          ...(input.referenceType ? { referenceType: input.referenceType } : {}),
          ...(input.referenceId ? { referenceId: input.referenceId } : {}),
          ...(input.note ? { note: input.note } : {}),
        },
      });

      return true;
    });
  }
}
