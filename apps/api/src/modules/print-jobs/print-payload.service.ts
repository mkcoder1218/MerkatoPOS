import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrintJobsRepository } from './print-jobs.repository';

type Snapshot = NonNullable<
  Awaited<ReturnType<PrintJobsRepository['getOrderSnapshot']>>
>;

@Injectable()
export class PrintPayloadService {
  constructor(private readonly repository: PrintJobsRepository) {}

  async queueCompletedSale(tenantId: string, orderId: string): Promise<void> {
    const order = await this.repository.getOrderSnapshot(tenantId, orderId);
    if (!order?.completion) {
      throw new NotFoundException('Completed sale snapshot not found');
    }

    await Promise.all([
      this.queueReceipt(order),
      this.queueKitchenTickets(order),
    ]);
  }

  private async queueReceipt(order: Snapshot): Promise<void> {
    const assigned = order.register.receiptPrinter?.printer;
    const printer =
      assigned?.isActive && assigned.type === 'RECEIPT'
        ? assigned
        : await this.repository.findDefaultPrinter(
            order.tenantId,
            order.branchId,
            'RECEIPT',
          );

    if (!printer) {
      return;
    }

    await this.repository.upsertInitialJob({
      tenantId: order.tenantId,
      branchId: order.branchId,
      printerId: printer.id,
      orderId: order.id,
      kind: 'RECEIPT',
      sourceKey: 'receipt:' + order.id,
      payload: this.receiptPayload(order),
    });
  }

  private async queueKitchenTickets(order: Snapshot): Promise<void> {
    const [routes, fallback] = await Promise.all([
      this.repository.getKitchenRoutes(order.tenantId, order.branchId),
      this.repository.findDefaultPrinter(order.tenantId, order.branchId, 'KITCHEN'),
    ]);

    const grouped = new Map<string, { printerId: string; printerName: string; items: Snapshot['items'] }>();

    for (const item of order.items) {
      const productRoutes = routes.filter((route) => route.productId === item.productId);
      const categoryRoutes =
        productRoutes.length > 0
          ? []
          : routes.filter((route) => route.categoryId === item.product.categoryId);
      const selected = productRoutes.length > 0 ? productRoutes : categoryRoutes;

      if (selected.length === 0 && fallback) {
        this.addKitchenItem(grouped, fallback.id, fallback.name, item);
        continue;
      }

      const seen = new Set<string>();
      for (const route of selected) {
        if (seen.has(route.printerId)) {
          continue;
        }
        seen.add(route.printerId);
        this.addKitchenItem(grouped, route.printer.id, route.printer.name, item);
      }
    }

    await Promise.all(
      [...grouped.values()].map((group) =>
        this.repository.upsertInitialJob({
          tenantId: order.tenantId,
          branchId: order.branchId,
          printerId: group.printerId,
          orderId: order.id,
          kind: 'KITCHEN',
          sourceKey: 'kitchen:' + order.id + ':' + group.printerId,
          payload: this.kitchenPayload(order, group.printerName, group.items),
        }),
      ),
    );
  }

  private addKitchenItem(
    grouped: Map<string, { printerId: string; printerName: string; items: Snapshot['items'] }>,
    printerId: string,
    printerName: string,
    item: Snapshot['items'][number],
  ): void {
    const current = grouped.get(printerId);
    if (current) {
      current.items.push(item);
      return;
    }
    grouped.set(printerId, { printerId, printerName, items: [item] });
  }

  private receiptPayload(order: Snapshot): Prisma.InputJsonObject {
    return {
      documentType: 'RECEIPT',
      businessName: order.tenant.name,
      branchName: order.branch.name,
      receiptNumber: order.completion?.receiptNumber ?? '',
      orderNumber: order.orderNumber,
      orderType: order.type,
      table: order.table?.name ?? null,
      cashier: order.user.name,
      register: order.register.name,
      completedAt: order.completedAt?.toISOString() ?? '',
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        lineTotal: item.lineTotal.toString(),
        discountAmount: item.discountAmount.toString(),
        taxAmount: item.taxAmount.toString(),
        note: item.note ?? null,
        modifiers: item.modifiers.map((modifier) => ({
          group: modifier.modifierGroupName,
          option: modifier.modifierOptionName,
          priceDelta: modifier.priceDelta.toString(),
        })),
      })),
      subtotal: order.subtotal.toString(),
      discountTotal: order.discountTotal.toString(),
      taxTotal: order.taxTotal.toString(),
      grandTotal: order.grandTotal.toString(),
      payments: order.payments.map((payment) => ({
        method: payment.method,
        amount: payment.amount.toString(),
        reference: payment.reference ?? null,
      })),
    };
  }

  private kitchenPayload(
    order: Snapshot,
    printerName: string,
    items: Snapshot['items'],
  ): Prisma.InputJsonObject {
    return {
      documentType: 'KITCHEN_TICKET',
      printerName,
      ticketNumber: order.orderNumber,
      orderType: order.type,
      table: order.table?.name ?? null,
      cashier: order.user.name,
      createdAt: order.createdAt.toISOString(),
      items: items.map((item) => ({
        name: item.productName,
        quantity: item.quantity.toString(),
        note: item.note ?? null,
        modifiers: item.modifiers.map((modifier) => ({
          group: modifier.modifierGroupName,
          option: modifier.modifierOptionName,
        })),
      })),
    };
  }
}
