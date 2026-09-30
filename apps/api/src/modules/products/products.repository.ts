import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma } from '@prisma/client';

interface ProductWriteInput {
  name?: string;
  categoryId?: string;
  unitId?: string;
  taxProfileId?: string | null;
  sellingPrice?: string;
  sku?: string | null;
  barcode?: string | null;
  taxExempt?: boolean;
  trackInventory?: boolean;
  isActive?: boolean;
}

interface BranchOverride {
  branchId: string;
  isAvailable?: boolean;
  priceOverride?: string;
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  list(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        category: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true, symbol: true } },
        taxProfile: true,
        branches: true,
      },
    });
  }

  find(tenantId: string, productId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: { branches: true },
    });
  }

  findCategory(tenantId: string, categoryId: string) {
    return this.prisma.category.findFirst({ where: { id: categoryId, tenantId } });
  }

  findUnit(tenantId: string, unitId: string) {
    return this.prisma.unit.findFirst({ where: { id: unitId, tenantId } });
  }

  findTax(tenantId: string, taxProfileId: string) {
    return this.prisma.taxProfile.findFirst({ where: { id: taxProfileId, tenantId } });
  }

  findBranches(tenantId: string, branchIds: string[]) {
    return this.prisma.branch.findMany({
      where: { tenantId, id: { in: branchIds } },
      select: { id: true },
    });
  }

  create(tenantId: string, input: ProductWriteInput, branches: BranchOverride[]) {
    return this.prisma.product.create({
      data: {
        tenantId,
        name: input.name!,
        categoryId: input.categoryId!,
        unitId: input.unitId!,
        sellingPrice: new Prisma.Decimal(input.sellingPrice!),
        ...(input.taxProfileId ? { taxProfileId: input.taxProfileId } : {}),
        ...(input.sku ? { sku: input.sku } : {}),
        ...(input.barcode ? { barcode: input.barcode } : {}),
        ...(input.taxExempt !== undefined ? { taxExempt: input.taxExempt } : {}),
        ...(input.trackInventory !== undefined
          ? { trackInventory: input.trackInventory }
          : {}),
        branches: {
          create: branches.map((branch) => ({
            branchId: branch.branchId,
            ...(branch.isAvailable !== undefined
              ? { isAvailable: branch.isAvailable }
              : {}),
            ...(branch.priceOverride !== undefined
              ? { priceOverride: new Prisma.Decimal(branch.priceOverride) }
              : {}),
          })),
        },
      },
      include: { branches: true },
    });
  }

  update(
    tenantId: string,
    productId: string,
    input: ProductWriteInput,
    branches?: BranchOverride[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { id: productId, tenantId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
          ...(input.taxProfileId !== undefined
            ? { taxProfileId: input.taxProfileId }
            : {}),
          ...(input.sellingPrice !== undefined
            ? { sellingPrice: new Prisma.Decimal(input.sellingPrice) }
            : {}),
          ...(input.sku !== undefined ? { sku: input.sku } : {}),
          ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
          ...(input.taxExempt !== undefined ? { taxExempt: input.taxExempt } : {}),
          ...(input.trackInventory !== undefined
            ? { trackInventory: input.trackInventory }
            : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });

      if (branches !== undefined) {
        await tx.productBranch.deleteMany({ where: { productId } });
        if (branches.length > 0) {
          await tx.productBranch.createMany({
            data: branches.map((branch) => ({
              productId,
              branchId: branch.branchId,
              isAvailable: branch.isAvailable ?? true,
              ...(branch.priceOverride !== undefined
                ? { priceOverride: new Prisma.Decimal(branch.priceOverride) }
                : {}),
            })),
          });
        }
      }

      return tx.product.findFirst({
        where: { id: productId, tenantId },
        include: { branches: true },
      });
    });
  }
}
