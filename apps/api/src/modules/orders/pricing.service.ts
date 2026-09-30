import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, type TaxMode } from '@prisma/client';
import Decimal from 'decimal.js';

interface ProductPricingRecord {
  id: string;
  name: string;
  sku: string | null;
  unitId: string;
  sellingPrice: Prisma.Decimal;
  taxExempt: boolean;
  taxProfile: {
    percentage: Prisma.Decimal;
    mode: TaxMode;
  } | null;
  branches: Array<{
    isAvailable: boolean;
    priceOverride: Prisma.Decimal | null;
  }>;
  discounts: Array<{
    percentage: Prisma.Decimal;
  }>;
  modifierGroups: Array<{
    modifierGroup: {
      name: string;
      minSelect: number;
      maxSelect: number;
      options: Array<{
        id: string;
        name: string;
        priceDelta: Prisma.Decimal;
        isActive: boolean;
      }>;
    };
  }>;
  unit: { symbol: string };
}

interface PricingInput {
  productId: string;
  quantity: string;
  modifierOptionIds?: string[];
  note?: string;
}

export interface PricedOrderItem {
  productId: string;
  productName: string;
  skuSnapshot: string | null;
  unitId: string;
  unitSymbol: string;
  quantity: string;
  unitPrice: string;
  modifierTotal: string;
  discountPercentage: string;
  discountAmount: string;
  taxPercentage: string;
  taxMode: TaxMode | null;
  taxAmount: string;
  lineSubtotal: string;
  lineTotal: string;
  note?: string;
  modifiers: Array<{
    modifierOptionId: string;
    modifierGroupName: string;
    modifierOptionName: string;
    priceDelta: string;
  }>;
}

@Injectable()
export class PricingService {
  priceLines(inputs: PricingInput[], products: ProductPricingRecord[]): PricedOrderItem[] {
    const byId = new Map(products.map((product) => [product.id, product]));
    return inputs.map((input) => {
      const product = byId.get(input.productId);
      if (!product) {
        throw new BadRequestException('One or more products are unavailable');
      }
      return this.priceLine(input, product);
    });
  }

  totals(items: PricedOrderItem[]) {
    const subtotal = this.sum(items.map((item) => item.lineSubtotal));
    const discountTotal = this.sum(items.map((item) => item.discountAmount));
    const taxTotal = this.sum(items.map((item) => item.taxAmount));
    const grandTotal = this.sum(items.map((item) => item.lineTotal));
    return { subtotal, discountTotal, taxTotal, grandTotal };
  }

  private priceLine(input: PricingInput, product: ProductPricingRecord): PricedOrderItem {
    const branch = product.branches[0];
    if (!branch?.isAvailable) {
      throw new BadRequestException(product.name + ' is unavailable at this branch');
    }

    const quantity = new Decimal(input.quantity);
    if (!quantity.isPositive()) {
      throw new BadRequestException('Order quantity must be greater than zero');
    }

    const basePrice = new Decimal(
      (branch.priceOverride ?? product.sellingPrice).toString(),
    );
    const modifiers = this.resolveModifiers(input.modifierOptionIds ?? [], product);
    const modifierUnitTotal = modifiers.reduce(
      (sum, modifier) => sum.plus(modifier.priceDelta),
      new Decimal(0),
    );
    const unitWithModifiers = basePrice.plus(modifierUnitTotal);
    if (unitWithModifiers.isNegative()) {
      throw new BadRequestException('Modifier selection makes the product price negative');
    }

    const lineSubtotal = unitWithModifiers.mul(quantity);
    const discountPercentage = product.discounts[0]?.percentage
      ? new Decimal(product.discounts[0].percentage.toString())
      : new Decimal(0);
    const discountAmount = lineSubtotal.mul(discountPercentage).div(100);
    const afterDiscount = lineSubtotal.minus(discountAmount);

    const taxPercentage =
      product.taxExempt || !product.taxProfile
        ? new Decimal(0)
        : new Decimal(product.taxProfile.percentage.toString());
    const taxMode =
      product.taxExempt || !product.taxProfile ? null : product.taxProfile.mode;

    let taxAmount = new Decimal(0);
    let lineTotal = afterDiscount;
    if (taxMode === 'EXCLUSIVE') {
      taxAmount = afterDiscount.mul(taxPercentage).div(100);
      lineTotal = afterDiscount.plus(taxAmount);
    } else if (taxMode === 'INCLUSIVE' && !taxPercentage.isZero()) {
      const net = afterDiscount.div(new Decimal(1).plus(taxPercentage.div(100)));
      taxAmount = afterDiscount.minus(net);
    }

    return {
      productId: product.id,
      productName: product.name,
      skuSnapshot: product.sku,
      unitId: product.unitId,
      unitSymbol: product.unit.symbol,
      quantity: quantity.toFixed(6),
      unitPrice: basePrice.toFixed(2),
      modifierTotal: modifierUnitTotal.mul(quantity).toFixed(2),
      discountPercentage: discountPercentage.toFixed(2),
      discountAmount: discountAmount.toDecimalPlaces(2).toFixed(2),
      taxPercentage: taxPercentage.toFixed(2),
      taxMode,
      taxAmount: taxAmount.toDecimalPlaces(2).toFixed(2),
      lineSubtotal: lineSubtotal.toDecimalPlaces(2).toFixed(2),
      lineTotal: lineTotal.toDecimalPlaces(2).toFixed(2),
      ...(input.note ? { note: input.note.trim() } : {}),
      modifiers,
    };
  }

  private resolveModifiers(
    selectedIds: string[],
    product: ProductPricingRecord,
  ): PricedOrderItem['modifiers'] {
    const selected = new Set(selectedIds);
    const result: PricedOrderItem['modifiers'] = [];

    for (const assignment of product.modifierGroups) {
      const group = assignment.modifierGroup;
      const chosen = group.options.filter((option) => selected.has(option.id));
      if (chosen.length < group.minSelect || chosen.length > group.maxSelect) {
        throw new BadRequestException('Invalid selection count for ' + group.name);
      }
      for (const option of chosen) {
        if (!option.isActive) {
          throw new BadRequestException('Inactive modifier option selected');
        }
        result.push({
          modifierOptionId: option.id,
          modifierGroupName: group.name,
          modifierOptionName: option.name,
          priceDelta: new Decimal(option.priceDelta.toString()).toFixed(2),
        });
        selected.delete(option.id);
      }
    }

    if (selected.size > 0) {
      throw new BadRequestException('Modifier does not belong to this product');
    }

    return result;
  }

  private sum(values: string[]): string {
    return values
      .reduce((sum, value) => sum.plus(value), new Decimal(0))
      .toDecimalPlaces(2)
      .toFixed(2);
  }
}
