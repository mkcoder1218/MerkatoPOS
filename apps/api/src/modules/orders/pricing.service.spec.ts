import { Prisma, TaxMode } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { PricingService } from './pricing.service';

describe('PricingService', () => {
  const service = new PricingService();

  it('uses branch price, modifier, discount, and exclusive tax on the server', () => {
    const items = service.priceLines(
      [
        {
          productId: 'p1',
          quantity: '2',
          modifierOptionIds: ['m1'],
        },
      ],
      [
        {
          id: 'p1',
          name: 'Coffee',
          sku: 'COF',
          unitId: 'u1',
          sellingPrice: new Prisma.Decimal('100'),
          taxExempt: false,
          unit: { symbol: 'pc' },
          branches: [
            { isAvailable: true, priceOverride: new Prisma.Decimal('120') },
          ],
          discounts: [{ percentage: new Prisma.Decimal('10') }],
          taxProfile: {
            percentage: new Prisma.Decimal('15'),
            mode: TaxMode.EXCLUSIVE,
          },
          modifierGroups: [
            {
              modifierGroup: {
                name: 'Milk',
                minSelect: 0,
                maxSelect: 1,
                options: [
                  {
                    id: 'm1',
                    name: 'Extra milk',
                    priceDelta: new Prisma.Decimal('10'),
                    isActive: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    );

    expect(items[0]).toMatchObject({
      lineSubtotal: '260.00',
      discountAmount: '26.00',
      taxAmount: '35.10',
      lineTotal: '269.10',
    });
  });

  it('rejects modifier IDs that do not belong to the product', () => {
    expect(() =>
      service.priceLines(
        [{ productId: 'p1', quantity: '1', modifierOptionIds: ['foreign'] }],
        [
          {
            id: 'p1',
            name: 'Bread',
            sku: null,
            unitId: 'u1',
            sellingPrice: new Prisma.Decimal('10'),
            taxExempt: true,
            unit: { symbol: 'pc' },
            branches: [{ isAvailable: true, priceOverride: null }],
            discounts: [],
            taxProfile: null,
            modifierGroups: [],
          },
        ],
      ),
    ).toThrow();
  });
});
