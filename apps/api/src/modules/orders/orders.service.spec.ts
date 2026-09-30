import { ConflictException } from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../auth/auth.types';
import type { OrdersRepository } from './orders.repository';
import { OrdersService } from './orders.service';
import type { PricingService } from './pricing.service';
import type { SalesRepository } from './sales.repository';

const user: JwtPayload = {
  sub: 'u1',
  userId: 'u1',
  tenantId: 't1',
  email: 'owner@example.com',
  sessionId: 's1',
  branchIds: ['b1'],
  permissions: ['sales.complete'],
};

describe('OrdersService checkout', () => {
  it('returns the prior sale for a repeated idempotency key', async () => {
    const repository = {} as OrdersRepository;
    const pricing = {} as PricingService;
    const sales = {
      findCompletion: vi.fn().mockResolvedValue({
        order: { id: 'o1', status: 'COMPLETED' },
      }),
    } as unknown as SalesRepository;

    const service = new OrdersService(repository, pricing, sales);
    const result = await service.complete(user, 'o1', {
      idempotencyKey: 'checkout-1',
      payments: [{ method: PaymentMethod.CASH, amount: '10.00' }],
    });

    expect(result).toEqual({ id: 'o1', status: 'COMPLETED' });
  });

  it('rejects checkout when a required order shift is no longer active', async () => {
    const repository = {
      find: vi.fn().mockResolvedValue({
        id: 'o1',
        tenantId: 't1',
        branchId: 'b1',
        registerId: 'r1',
        shiftId: 'shift-old',
        status: 'OPEN',
        grandTotal: new Prisma.Decimal('10'),
      }),
      getSettings: vi.fn().mockResolvedValue({ requireActiveShift: true }),
      findOpenShift: vi.fn().mockResolvedValue(null),
    } as unknown as OrdersRepository;
    const pricing = {} as PricingService;
    const sales = {
      findCompletion: vi.fn().mockResolvedValue(null),
    } as unknown as SalesRepository;

    const service = new OrdersService(repository, pricing, sales);

    await expect(
      service.complete(user, 'o1', {
        idempotencyKey: 'checkout-2',
        payments: [{ method: PaymentMethod.CASH, amount: '10.00' }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
