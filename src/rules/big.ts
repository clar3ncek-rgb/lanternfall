// Big numbers for the idle economy, stored as base-10 logarithms.
// A Big is a plain number holding log10(value), branded so it cannot be mixed up
// with an ordinary number by accident. This reaches far beyond 1e308 (the limit of
// a normal JS number) while staying a single number that saves to JSON cleanly.
// Zero is a large negative log, so JSON never sees -Infinity.

export type Big = number & { readonly __big: unique symbol };

const ZERO_LOG = -1e9;
const asBig = (l: number) => l as Big;

export const ZERO: Big = asBig(ZERO_LOG);

export function isZero(a: Big): boolean {
  return a <= ZERO_LOG / 10;
}

/** Make a Big from an ordinary number. Negative or zero values become ZERO. */
export function big(n: number): Big {
  if (!(n > 0) || !Number.isFinite(n)) return n === Infinity ? asBig(1e9) : ZERO;
  return asBig(Math.log10(n));
}

/** Make a Big directly from a log10 value (e.g. 10^500 = fromLog(500)). */
export function fromLog(l: number): Big {
  return Number.isFinite(l) ? asBig(Math.max(l, ZERO_LOG)) : l > 0 ? asBig(1e9) : ZERO;
}

export function log10(a: Big): number {
  return a;
}

/** Back to an ordinary number (Infinity if too large). */
export function toNumber(a: Big): number {
  if (isZero(a)) return 0;
  return Math.pow(10, a);
}

export function add(a: Big, b: Big): Big {
  if (isZero(a)) return b;
  if (isZero(b)) return a;
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return asBig(hi + Math.log10(1 + Math.pow(10, lo - hi)));
}

/** a - b, never below zero. */
export function sub(a: Big, b: Big): Big {
  if (isZero(b)) return a;
  if (b >= a) return ZERO;
  const d = 1 - Math.pow(10, b - a);
  if (d <= 1e-12) return ZERO;
  return asBig(a + Math.log10(d));
}

export function mul(a: Big, b: Big): Big {
  if (isZero(a) || isZero(b)) return ZERO;
  return asBig(a + b);
}

/** Multiply by an ordinary non-negative number. */
export function times(a: Big, n: number): Big {
  if (!(n > 0)) return ZERO;
  if (isZero(a)) return ZERO;
  return asBig(a + Math.log10(n));
}

export function div(a: Big, b: Big): Big {
  if (isZero(a)) return ZERO;
  if (isZero(b)) throw new Error('Big: divide by zero');
  return asBig(a - b);
}

/** Ratio a / b as an ordinary number. */
export function ratio(a: Big, b: Big): number {
  if (isZero(a)) return 0;
  if (isZero(b)) return Infinity;
  return Math.pow(10, a - b);
}

/** base^exp for an ordinary base and exponent, e.g. 1.15^stage. */
export function powN(base: number, exp: number): Big {
  if (!(base > 0)) return ZERO;
  return asBig(Math.log10(base) * exp);
}

export function cmp(a: Big, b: Big): number {
  if (isZero(a) && isZero(b)) return 0;
  const d = a - b;
  if (Math.abs(d) < 1e-12) return 0;
  return d < 0 ? -1 : 1;
}

export const gte = (a: Big, b: Big) => cmp(a, b) >= 0;
export const lt = (a: Big, b: Big) => cmp(a, b) < 0;
export const max = (a: Big, b: Big) => (cmp(a, b) >= 0 ? a : b);
export const min = (a: Big, b: Big) => (cmp(a, b) <= 0 ? a : b);

const SUFFIX = ['', 'K', 'M', 'B', 'T'];

/** Short display text: 999, 1.23K, 45.6M, 7.89T, then 1.00aa, 1.00ab ... */
/** Run 2, idea 46 (replaces 34): show numbers from a million up as 1.23e45 instead of letters. A player setting. */
let sci = false;
export function setScientific(on: boolean) { sci = on; }
export function format(a: Big): string {
  if (isZero(a)) return '0';
  if (sci && a >= 6) {
    let e = Math.floor(a + 1e-9);
    let m = Math.pow(10, a - e);
    if (m >= 9.995) { m /= 10; e += 1; }
    return `${m.toFixed(2)}e${e}`;
  }
  if (a < 3) {
    const n = Math.pow(10, a);
    return n < 10 ? (Math.round(n * 10) / 10).toString() : Math.floor(n + 1e-9).toString();
  }
  let group = Math.floor((a + 1e-9) / 3);
  let mant = Math.pow(10, a - group * 3);
  if (mant >= 999.995) {
    group += 1;
    mant /= 1000;
  }
  const digits = mant >= 100 ? 0 : mant >= 10 ? 1 : 2;
  const text = mant.toFixed(digits);
  let suffix: string;
  if (group < SUFFIX.length) suffix = SUFFIX[group];
  else {
    const n = group - SUFFIX.length; // 0 -> aa
    if (n >= 26 * 26) return `${mant.toFixed(2)}e${group * 3}`;
    suffix = String.fromCharCode(97 + Math.floor(n / 26)) + String.fromCharCode(97 + (n % 26));
  }
  return text + suffix;
}

/**
 * Highest n such that sum of cost(base, growth, owned + i) for i in [0, n) fits in budget.
 * Costs form a geometric series: base * growth^owned * (growth^n - 1) / (growth - 1).
 */
export function maxAffordable(budget: Big, base: Big, growth: number, owned: number): number {
  const first = mul(base, powN(growth, owned));
  if (lt(budget, first)) return 0;
  // budget >= first * (g^n - 1)/(g - 1)  =>  g^n <= budget*(g-1)/first + 1
  const r = ratio(budget, first) * (growth - 1) + 1;
  const n = Math.floor(Math.log(r) / Math.log(growth) + 1e-9);
  return Math.max(0, n);
}

/** Total cost of buying n levels starting at owned. */
export function seriesCost(base: Big, growth: number, owned: number, n: number): Big {
  if (n <= 0) return ZERO;
  const first = mul(base, powN(growth, owned));
  // (g^n - 1)/(g - 1) computed in log space to avoid overflow
  const gn = powN(growth, n);
  return times(mul(first, sub(gn, big(1))), 1 / (growth - 1));
}
