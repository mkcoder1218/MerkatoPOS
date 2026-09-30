import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

describe('ProductsService tenant isolation', () => {
  it('rejects a category that is not found in the authenticated tenant', async () => {
    const repository = {
      findCategory: vi.fn().mockResolvedValue(null),
      findUnit: vi.fn().mockResolvedValue({ id: 'unit-1', isActive: true }),
      findTax: vi.fn(),
      findBranches: vi.fn().mockResolvedValue([]),
    } as unknown as ProductsRepository;

    const service = new ProductsService(repository);

    await expect(
      service.create('tenant-1', {
        name: 'Bread',
        categoryId: 'foreign-category',
        unitId: 'unit-1',
        sellingPrice: '10.00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
