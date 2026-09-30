import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import type { JwtPayload } from '../auth/auth.types';
import type { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

const user: JwtPayload = {
  sub: 'user-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'owner@example.com',
  sessionId: 'session-1',
  branchIds: ['branch-1'],
  permissions: ['inventory.adjust'],
};

describe('InventoryService', () => {
  it('blocks inventory access outside assigned branches', async () => {
    const repository = {
      find: vi.fn().mockResolvedValue({
        id: 'item-1',
        tenantId: 'tenant-1',
        branchId: 'branch-2',
      }),
    } as unknown as InventoryRepository;

    const service = new InventoryService(repository);

    await expect(service.listMovements(user, 'item-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('prevents stock from becoming negative when disabled', async () => {
    const repository = {
      find: vi.fn().mockResolvedValue({
        id: 'item-1',
        tenantId: 'tenant-1',
        branchId: 'branch-1',
        currentQuantity: new Prisma.Decimal('2'),
        allowNegativeStock: false,
        version: 0,
      }),
      recordMovement: vi.fn(),
    } as unknown as InventoryRepository;

    const service = new InventoryService(repository);

    await expect(
      service.recordMovement(user, 'item-1', {
        type: StockMovementType.SALE,
        quantityDelta: '-3',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a positive SALE movement', async () => {
    const repository = {} as InventoryRepository;
    const service = new InventoryService(repository);

    await expect(
      service.recordMovement(user, 'item-1', {
        type: StockMovementType.SALE,
        quantityDelta: '1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
