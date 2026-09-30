import { Injectable } from '@nestjs/common';
import { PrismaService } from '@merkatopos/database';
import { Prisma, type PaymentMethod } from '@prisma/client';

@Injectable()
export class SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCompletion(tenantId: string, idempotencyKey: string) {
    return this.prisma.saleCompletion.findUnique({
      where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } },
      include: {
        order: {
          include: {
            items: { include: { modifiers: true } },
            payments: true,
            completion: true,
          },
        },
      },
    });
  }

  async complete(input: {
    tenantId: string;
    branchId: string;
    orderId: string;
    userId: string;
    idempotencyKey: string;
    receiptNumber: string;
    payments: Array<{ method: PaymentMethod; amount: string; reference?: string }>;
  }) {
    return this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.saleCompletion.findUnique({
          where: {
            tenantId_idempotencyKey: {
              tenantId: input.tenantId,
              idempotencyKey: input.idempotencyKey,
            },
          },
          include: { order: true },
        });
        if (existing) {
          return tx.order.findUnique({
            where: { id: existing.orderId },
            include: {
              items: { include: { modifiers: true } },
              payments: true,
              completion: true,
            },
          });
        }

        const order = await tx.order.findFirstOrThrow({
          where: {
            id: input.orderId,
            tenantId: input.tenantId,
            branchId: input.branchId,
            status: 'OPEN',
          },
          include: { items: true },
        });

        for (const item of order.items) {
          const product = await tx.product.findFirstOrThrow({
            where: { id: item.productId, tenantId: input.tenantId },
            select: { trackInventory: true },
          });
          if (!product.trackInventory) {
            continue;
          }

          const inventory = await tx.inventoryItem.findUnique({
            where: {
              tenantId_branchId_productId: {
                tenantId: input.tenantId,
                branchId: input.branchId,
                productId: item.productId,
              },
            },
          });
          if (!inventory) {
            throw new Error('Inventory item missing for tracked product');
          }

          const next = new Prisma.Decimal(inventory.currentQuantity).minus(item.quantity);
          if (!inventory.allowNegativeStock && next.isNegative()) {
            throw new Error('Insufficient inventory');
          }

          await tx.inventoryItem.update({
            where: { id: inventory.id },
            data: {
              currentQuantity: next,
              version: { increment: 1 },
            },
          });

          await tx.stockMovement.create({
            data: {
              tenantId: input.tenantId,
              branchId: input.branchId,
              inventoryItemId: inventory.id,
              createdById: input.userId,
              type: 'SALE',
              quantityDelta: new Prisma.Decimal(item.quantity).negated(),
              quantityAfter: next,
              referenceType: 'ORDER',
              referenceId: order.id,
            },
          });
        }

        await tx.payment.createMany({
          data: input.payments.map((payment) => ({
            tenantId: input.tenantId,
            orderId: order.id,
            method: payment.method,
            amount: new Prisma.Decimal(payment.amount),
            status: 'COMPLETED',
            ...(payment.reference ? { reference: payment.reference } : {}),
          })),
        });

        await tx.saleCompletion.create({
          data: {
            orderId: order.id,
            tenantId: input.tenantId,
            idempotencyKey: input.idempotencyKey,
            receiptNumber: input.receiptNumber,
            completedById: input.userId,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        return tx.order.findUnique({
          where: { id: order.id },
          include: {
            items: { include: { modifiers: true } },
            payments: true,
            completion: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  createVoidRequest(
    tenantId: string,
    orderId: string,
    userId: string,
    reason: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirstOrThrow({
        where: { id: orderId, tenantId, status: 'COMPLETED' },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: 'VOID_PENDING' },
      });

      return tx.voidRequest.create({
        data: {
          tenantId,
          orderId,
          requestedById: userId,
          reason,
        },
      });
    });
  }

  async approveVoid(
    tenantId: string,
    orderId: string,
    approverId: string,
    decisionNote: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findFirstOrThrow({
          where: { id: orderId, tenantId, status: 'VOID_PENDING' },
          include: { items: true, voidRequest: true },
        });
        if (!order.voidRequest || order.voidRequest.status !== 'PENDING') {
          throw new Error('Pending void request not found');
        }

        for (const item of order.items) {
          const inventory = await tx.inventoryItem.findUnique({
            where: {
              tenantId_branchId_productId: {
                tenantId,
                branchId: order.branchId,
                productId: item.productId,
              },
            },
          });
          if (!inventory) {
            continue;
          }

          const next = new Prisma.Decimal(inventory.currentQuantity).plus(item.quantity);
          await tx.inventoryItem.update({
            where: { id: inventory.id },
            data: {
              currentQuantity: next,
              version: { increment: 1 },
            },
          });
          await tx.stockMovement.create({
            data: {
              tenantId,
              branchId: order.branchId,
              inventoryItemId: inventory.id,
              createdById: approverId,
              type: 'RETURN',
              quantityDelta: item.quantity,
              quantityAfter: next,
              referenceType: 'VOID_ORDER',
              referenceId: order.id,
            },
          });
        }

        await tx.payment.updateMany({
          where: { orderId: order.id, status: 'COMPLETED' },
          data: { status: 'REVERSED', reversedAt: new Date() },
        });

        await tx.voidRequest.update({
          where: { id: order.voidRequest.id },
          data: {
            status: 'APPROVED',
            approvedById: approverId,
            decisionNote,
            decidedAt: new Date(),
          },
        });

        return tx.order.update({
          where: { id: order.id },
          data: { status: 'VOIDED', voidedAt: new Date() },
          include: { payments: true, voidRequest: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  rejectVoid(
    tenantId: string,
    orderId: string,
    approverId: string,
    decisionNote: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.voidRequest.findFirstOrThrow({
        where: {
          tenantId,
          orderId,
          status: 'PENDING',
        },
      });
      await tx.voidRequest.update({
        where: { id: request.id },
        data: {
          status: 'REJECTED',
          approvedById: approverId,
          decisionNote,
          decidedAt: new Date(),
        },
      });
      return tx.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
        include: { voidRequest: true },
      });
    });
  }
}
