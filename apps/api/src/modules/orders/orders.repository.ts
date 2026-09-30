import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma, type OrderType } from '@prisma/client';
import type { PricedOrderItem } from './pricing.service';

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  getSettings(tenantId: string) {
    return this.prisma.posSettings.upsert({
      where: { tenantId },
      create: { tenantId },
      update: {},
    });
  }

  findRegister(tenantId: string, registerId: string) {
    return this.prisma.register.findFirst({
      where: { id: registerId, tenantId, isActive: true },
    });
  }

  findOpenShift(tenantId: string, registerId: string) {
    return this.prisma.shift.findFirst({
      where: { tenantId, registerId, status: 'OPEN' },
    });
  }

  findTable(tenantId: string, tableId: string) {
    return this.prisma.diningTable.findFirst({
      where: { id: tableId, tenantId, isActive: true },
    });
  }

  getPricingProducts(tenantId: string, branchId: string, productIds: string[]) {
    const now = new Date();
    return this.prisma.product.findMany({
      where: { tenantId, id: { in: productIds }, isActive: true },
      include: {
        unit: { select: { symbol: true } },
        taxProfile: true,
        branches: { where: { branchId }, take: 1 },
        discounts: {
          where: {
            isActive: true,
            AND: [
              { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
              { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
            ],
          },
          orderBy: { percentage: 'desc' },
          take: 1,
        },
        modifierGroups: {
          where: { modifierGroup: { isActive: true } },
          orderBy: { displayOrder: 'asc' },
          include: {
            modifierGroup: { include: { options: true } },
          },
        },
      },
    });
  }

  list(tenantId: string, branchIds: string[]) {
    return this.prisma.order.findMany({
      where: { tenantId, branchId: { in: branchIds } },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { items: { include: { modifiers: true } }, payments: true },
    });
  }

  find(tenantId: string, orderId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        items: { include: { modifiers: true } },
        payments: true,
        completion: true,
        voidRequest: true,
      },
    });
  }

  create(input: {
    tenantId: string;
    branchId: string;
    registerId: string;
    shiftId?: string;
    userId: string;
    tableId?: string;
    orderNumber: string;
    type: OrderType;
    items: PricedOrderItem[];
    totals: {
      subtotal: string;
      discountTotal: string;
      taxTotal: string;
      grandTotal: string;
    };
  }) {
    return this.prisma.order.create({
      data: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        registerId: input.registerId,
        ...(input.shiftId ? { shiftId: input.shiftId } : {}),
        userId: input.userId,
        ...(input.tableId ? { tableId: input.tableId } : {}),
        orderNumber: input.orderNumber,
        type: input.type,
        status: 'OPEN',
        subtotal: new Prisma.Decimal(input.totals.subtotal),
        discountTotal: new Prisma.Decimal(input.totals.discountTotal),
        taxTotal: new Prisma.Decimal(input.totals.taxTotal),
        grandTotal: new Prisma.Decimal(input.totals.grandTotal),
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            skuSnapshot: item.skuSnapshot,
            unitId: item.unitId,
            unitSymbol: item.unitSymbol,
            quantity: new Prisma.Decimal(item.quantity),
            unitPrice: new Prisma.Decimal(item.unitPrice),
            modifierTotal: new Prisma.Decimal(item.modifierTotal),
            discountPercentage: new Prisma.Decimal(item.discountPercentage),
            discountAmount: new Prisma.Decimal(item.discountAmount),
            taxPercentage: new Prisma.Decimal(item.taxPercentage),
            taxMode: item.taxMode,
            taxAmount: new Prisma.Decimal(item.taxAmount),
            lineSubtotal: new Prisma.Decimal(item.lineSubtotal),
            lineTotal: new Prisma.Decimal(item.lineTotal),
            ...(item.note ? { note: item.note } : {}),
            modifiers: {
              create: item.modifiers.map((modifier) => ({
                modifierOptionId: modifier.modifierOptionId,
                modifierGroupName: modifier.modifierGroupName,
                modifierOptionName: modifier.modifierOptionName,
                priceDelta: new Prisma.Decimal(modifier.priceDelta),
              })),
            },
          })),
        },
      },
      include: { items: { include: { modifiers: true } } },
    });
  }

  async replaceItems(
    tenantId: string,
    orderId: string,
    type: OrderType | undefined,
    tableId: string | null | undefined,
    items: PricedOrderItem[] | undefined,
    totals:
      | { subtotal: string; discountTotal: string; taxTotal: string; grandTotal: string }
      | undefined,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: orderId, tenantId, status: { in: ['DRAFT', 'OPEN'] } },
        data: {
          ...(type !== undefined ? { type } : {}),
          ...(tableId !== undefined ? { tableId } : {}),
          ...(totals
            ? {
                subtotal: new Prisma.Decimal(totals.subtotal),
                discountTotal: new Prisma.Decimal(totals.discountTotal),
                taxTotal: new Prisma.Decimal(totals.taxTotal),
                grandTotal: new Prisma.Decimal(totals.grandTotal),
              }
            : {}),
        },
      });
      if (updated.count !== 1) {
        return null;
      }

      if (items) {
        await tx.orderItem.deleteMany({ where: { orderId } });
        for (const item of items) {
          await tx.orderItem.create({
            data: {
              orderId,
              productId: item.productId,
              productName: item.productName,
              skuSnapshot: item.skuSnapshot,
              unitId: item.unitId,
              unitSymbol: item.unitSymbol,
              quantity: new Prisma.Decimal(item.quantity),
              unitPrice: new Prisma.Decimal(item.unitPrice),
              modifierTotal: new Prisma.Decimal(item.modifierTotal),
              discountPercentage: new Prisma.Decimal(item.discountPercentage),
              discountAmount: new Prisma.Decimal(item.discountAmount),
              taxPercentage: new Prisma.Decimal(item.taxPercentage),
              taxMode: item.taxMode,
              taxAmount: new Prisma.Decimal(item.taxAmount),
              lineSubtotal: new Prisma.Decimal(item.lineSubtotal),
              lineTotal: new Prisma.Decimal(item.lineTotal),
              ...(item.note ? { note: item.note } : {}),
              modifiers: {
                create: item.modifiers.map((modifier) => ({
                  modifierOptionId: modifier.modifierOptionId,
                  modifierGroupName: modifier.modifierGroupName,
                  modifierOptionName: modifier.modifierOptionName,
                  priceDelta: new Prisma.Decimal(modifier.priceDelta),
                })),
              },
            },
          });
        }
      }

      return tx.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { modifiers: true } }, payments: true },
      });
    });
  }
}
