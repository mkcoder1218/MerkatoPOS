const DECIMAL_PATTERN = /^-?\d+(?:\.\d{1,6})?$/;
const MONEY_PATTERN = /^\d+(?:\.\d{1,2})?$/;
const PERCENT_PATTERN = /^\d+(?:\.\d{1,2})?$/;

export function isDecimalString(value: string): boolean {
  return DECIMAL_PATTERN.test(value);
}

export function isMoneyString(value: string): boolean {
  return MONEY_PATTERN.test(value);
}

export function isPercentageString(value: string): boolean {
  if (!PERCENT_PATTERN.test(value)) {
    return false;
  }

  const numeric = Number(value);
  return numeric >= 0 && numeric <= 100;
}
