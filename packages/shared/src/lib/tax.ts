import Decimal from 'decimal.js';

export interface TaxCalculation {
  net: string;
  tax: string;
  gross: string;
}

function money(value: Decimal): string {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export function calculateExclusiveTax(amount: string, percentage: string): TaxCalculation {
  const net = new Decimal(amount);
  const tax = net.mul(percentage).div(100);
  const gross = net.plus(tax);

  return { net: money(net), tax: money(tax), gross: money(gross) };
}

export function calculateInclusiveTax(amount: string, percentage: string): TaxCalculation {
  const gross = new Decimal(amount);
  const rate = new Decimal(percentage).div(100);
  const net = gross.div(new Decimal(1).plus(rate));
  const tax = gross.minus(net);

  return { net: money(net), tax: money(tax), gross: money(gross) };
}

export function convertQuantity(quantity: string, multiplier: string): string {
  return new Decimal(quantity).mul(multiplier).toDecimalPlaces(6).toFixed(6);
}
