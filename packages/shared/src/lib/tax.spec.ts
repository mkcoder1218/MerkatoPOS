import { describe, expect, it } from 'vitest';
import {
  calculateExclusiveTax,
  calculateInclusiveTax,
  convertQuantity,
} from './tax';

describe('decimal-safe tax and unit math', () => {
  it('calculates 15% exclusive tax without floating-point drift', () => {
    expect(calculateExclusiveTax('100.00', '15.00')).toEqual({
      net: '100.00',
      tax: '15.00',
      gross: '115.00',
    });
  });

  it('extracts inclusive tax from a gross amount', () => {
    expect(calculateInclusiveTax('115.00', '15.00')).toEqual({
      net: '100.00',
      tax: '15.00',
      gross: '115.00',
    });
  });

  it('converts quantities at six decimal precision', () => {
    expect(convertQuantity('1.25', '1000')).toBe('1250.000000');
  });
});
