import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { PrintJobsRepository } from './print-jobs.repository';
import { PrintPayloadService } from './print-payload.service';

describe('PrintPayloadService', () => {
  it('routes separate kitchen items to separate printers and queues one receipt', async () => {
    const upsertInitialJob = vi.fn().mockResolvedValue({});
    const repository = {
      getOrderSnapshot: vi.fn().mockResolvedValue({
        id: 'order-1',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        orderNumber: 'ORD-1',
        type: 'DINE_IN',
        subtotal: new Prisma.Decimal('30'),
        discountTotal: new Prisma.Decimal('0'),
        taxTotal: new Prisma.Decimal('0'),
        grandTotal: new Prisma.Decimal('30'),
        createdAt: new Date('2026-09-30T08:00:00Z'),
        completedAt: new Date('2026-09-30T08:05:00Z'),
        tenant: { name: 'Demo Restaurant' },
        branch: { id: 'branch-1', name: 'Main' },
        register: {
          name: 'POS 1',
          receiptPrinter: {
            printer: {
              id: 'receipt-1',
              name: 'Receipt',
              type: 'RECEIPT',
              isActive: true,
            },
          },
        },
        user: { name: 'Cashier' },
        table: { name: 'Table 1', code: 'T1' },
        completion: { receiptNumber: 'RCP-1' },
        payments: [
          {
            method: 'CASH',
            amount: new Prisma.Decimal('30'),
            reference: null,
          },
        ],
        items: [
          {
            productId: 'coffee',
            productName: 'Coffee',
            quantity: new Prisma.Decimal('1'),
            unitPrice: new Prisma.Decimal('10'),
            lineTotal: new Prisma.Decimal('10'),
            discountAmount: new Prisma.Decimal('0'),
            taxAmount: new Prisma.Decimal('0'),
            note: null,
            product: { id: 'coffee', categoryId: 'drinks' },
            modifiers: [],
          },
          {
            productId: 'burger',
            productName: 'Burger',
            quantity: new Prisma.Decimal('1'),
            unitPrice: new Prisma.Decimal('20'),
            lineTotal: new Prisma.Decimal('20'),
            discountAmount: new Prisma.Decimal('0'),
            taxAmount: new Prisma.Decimal('0'),
            note: 'No onions',
            product: { id: 'burger', categoryId: 'food' },
            modifiers: [],
          },
        ],
      }),
      getKitchenRoutes: vi.fn().mockResolvedValue([
        {
          printerId: 'bar-1',
          productId: null,
          categoryId: 'drinks',
          printer: { id: 'bar-1', name: 'Bar' },
        },
        {
          printerId: 'kitchen-1',
          productId: 'burger',
          categoryId: null,
          printer: { id: 'kitchen-1', name: 'Kitchen' },
        },
      ]),
      findDefaultPrinter: vi.fn().mockResolvedValue(null),
      upsertInitialJob,
    } as unknown as PrintJobsRepository;

    const service = new PrintPayloadService(repository);
    await service.queueCompletedSale('tenant-1', 'order-1');

    expect(upsertInitialJob).toHaveBeenCalledTimes(3);
    expect(upsertInitialJob).toHaveBeenCalledWith(
      expect.objectContaining({ sourceKey: 'receipt:order-1', printerId: 'receipt-1' }),
    );
    expect(upsertInitialJob).toHaveBeenCalledWith(
      expect.objectContaining({ sourceKey: 'kitchen:order-1:bar-1' }),
    );
    expect(upsertInitialJob).toHaveBeenCalledWith(
      expect.objectContaining({ sourceKey: 'kitchen:order-1:kitchen-1' }),
    );
  });
});
