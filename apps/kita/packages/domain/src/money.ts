/**
 * @kita/domain — money value-object TYPES and pure validation/formatting helpers.
 *
 * STUB ONLY (T-PLAT-01). Per the Sol CONDITIONAL-PASS, this package must contain
 * ZERO money-moving logic until T-CORE-02 (core reducers) and T-LEDGER-02 (ledger
 * posting) land after the T-CONTRACT-01 contracts freeze.
 *
 * Deliberately absent:
 * - No arithmetic on MinorAmount (add/sub/mul/div). Fee splitting, discount caps,
 *   and especially refund FX rounding are known blocking issues; any rounding rule
 *   baked in here would silently become authoritative before the contract freeze.
 *   Refund FX rounding is DEFERRED to post-freeze implementation (T-LEDGER-02 /
 *   refund_obligations reducer), where it can be specified against evidence and
 *   tested per-currency exponent.
 * - No ledger postings, journal construction, or balance math. Those arrive with
 *   T-LEDGER-02 alongside the DB's post_journal() security-definer function
 *   (docs/kita-plan/sql/001_core.sql).
 */

/** ISO-4217-style currency code as stored in currencies.code (CHECK `^[A-Z]{3}$`). */
export type CurrencyCode = string;

/**
 * Amount in minor units (cents, centavos, sen...). Modeled as `bigint` to mirror
 * the SQL `bigint` columns (e.g. quotes.principal_minor, journal_lines.amount_minor).
 * Never use JS `number` for these — precision loss is unacceptable.
 */
export type MinorAmount = bigint;

/**
 * Pure value object: an amount paired with its currency. Construction-time
 * invariants (sign, currency shape) are checked by the validators below; no
 * mutation and no arithmetic are provided at this stage.
 */
export interface Money {
  readonly currency: CurrencyCode;
  readonly minor: MinorAmount;
}

/** Currencies seeded in docs/kita-plan/sql/001_core.sql with their minor-unit exponents. */
export const KNOWN_CURRENCY_EXPONENTS: Readonly<Record<string, 0 | 2>> = {
  USD: 2,
  PHP: 2,
  CAD: 2,
  GBP: 2,
  EUR: 2,
  JPY: 0,
  SGD: 2,
  AUD: 2,
} as const;

const CURRENCY_CODE_RE = /^[A-Z]{3}$/;

/** True if `code` matches the currencies.code CHECK constraint (`^[A-Z]{3}$`). */
export function isCurrencyCode(code: string): code is CurrencyCode {
  return CURRENCY_CODE_RE.test(code);
}

/** True if `m.minor > 0n`. Mirrors SQL CHECKs like `principal_minor > 0`. */
export function isPositiveMoney(m: Money): boolean {
  return m.minor > 0n;
}

/** True if `m.minor >= 0n`. Mirrors SQL CHECKs like `fee_minor >= 0`. */
export function isNonNegativeMoney(m: Money): boolean {
  return m.minor >= 0n;
}

/**
 * Structural check only: valid currency shape plus a bigint amount. Does NOT
 * enforce sign — compose with isPositiveMoney/isNonNegativeMoney.
 */
export function isValidMoneyShape(m: Money): boolean {
  return typeof m.minor === 'bigint' && isCurrencyCode(m.currency);
}

/**
 * Format minor units as a decimal string using the currency's exponent from
 * KNOWN_CURRENCY_EXPONENTS (e.g. 12345n USD -> "123.45", 1234n JPY -> "1234").
 * Throws on unknown currency so display code fails loudly rather than assuming
 * two decimals. Purely presentational — performs no rounding of the input.
 */
export function formatMinorUnits(m: Money): string {
  const exponent = KNOWN_CURRENCY_EXPONENTS[m.currency];
  if (exponent === undefined) {
    throw new RangeError(`formatMinorUnits: unknown currency ${m.currency}`);
  }
  const negative = m.minor < 0n;
  const digits = (negative ? -m.minor : m.minor).toString().padStart(exponent + 1, '0');
  if (exponent === 0) return negative ? `-${digits}` : digits;
  const intPart = digits.slice(0, digits.length - exponent);
  const fracPart = digits.slice(digits.length - exponent);
  return `${negative ? '-' : ''}${intPart}.${fracPart}`;
}
