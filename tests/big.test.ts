import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';

const near = (a: number, b: number, rel = 1e-9) => expect(Math.abs(a - b) / Math.max(1, Math.abs(b))).toBeLessThan(rel);

describe('Big numbers', () => {
  it('round-trips ordinary numbers', () => {
    for (const n of [1, 2.5, 999, 1e6, 123456789, 1e300]) near(B.toNumber(B.big(n)), n, 1e-12);
    expect(B.toNumber(B.big(0))).toBe(0);
    expect(B.toNumber(B.big(-5))).toBe(0);
    expect(B.isZero(B.ZERO)).toBe(true);
  });

  it('adds, subtracts, multiplies and divides', () => {
    near(B.toNumber(B.add(B.big(2), B.big(3))), 5);
    near(B.toNumber(B.sub(B.big(10), B.big(4))), 6);
    expect(B.isZero(B.sub(B.big(4), B.big(10)))).toBe(true);
    expect(B.isZero(B.sub(B.big(4), B.big(4)))).toBe(true);
    near(B.toNumber(B.mul(B.big(6), B.big(7))), 42);
    near(B.toNumber(B.div(B.big(42), B.big(7))), 6);
    near(B.toNumber(B.times(B.big(10), 2.5)), 25);
    expect(B.add(B.ZERO, B.big(5))).toBe(B.big(5));
    expect(B.isZero(B.mul(B.ZERO, B.big(5)))).toBe(true);
  });

  it('goes far beyond the normal number limit', () => {
    const huge = B.fromLog(5000);
    const sum = B.add(huge, huge);
    near(B.log10(sum), 5000 + Math.log10(2));
    expect(B.cmp(huge, B.big(1e300))).toBe(1);
    expect(B.toNumber(huge)).toBe(Infinity);
    // adding something tiny to something huge leaves it unchanged
    expect(B.cmp(B.add(huge, B.big(1)), huge)).toBe(0);
  });

  it('compares', () => {
    expect(B.gte(B.big(5), B.big(5))).toBe(true);
    expect(B.lt(B.big(4), B.big(5))).toBe(true);
    expect(B.cmp(B.ZERO, B.big(1))).toBe(-1);
  });

  it('formats short and readable', () => {
    expect(B.format(B.ZERO)).toBe('0');
    expect(B.format(B.big(7))).toBe('7');
    expect(B.format(B.big(999))).toBe('999');
    expect(B.format(B.big(1000))).toBe('1.00K');
    expect(B.format(B.big(1234567))).toBe('1.23M');
    expect(B.format(B.big(45.6e9))).toBe('45.6B');
    expect(B.format(B.big(999.999e3))).toBe('1.00M');
    expect(B.format(B.big(1e15))).toBe('1.00aa');
    expect(B.format(B.big(1e18))).toBe('1.00ab');
    expect(B.format(B.fromLog(15 + 26 * 3))).toBe('1.00ba');
  });

  it('works out the cost of buying many levels', () => {
    const base = B.big(10);
    const g = 1.07;
    // direct sum for comparison
    let direct = 0;
    for (let i = 5; i < 5 + 30; i++) direct += 10 * Math.pow(g, i);
    near(B.toNumber(B.seriesCost(base, g, 5, 30)), direct, 1e-9);
    // maxAffordable is the largest n whose series cost fits
    const n = B.maxAffordable(B.big(direct), base, g, 5);
    expect(n).toBe(30);
    expect(B.maxAffordable(B.big(direct * 0.999), base, g, 5)).toBe(29);
    expect(B.maxAffordable(B.big(5), base, g, 0)).toBe(0);
    // also in the far range
    const far = B.seriesCost(base, g, 20000, 10);
    expect(B.maxAffordable(far, base, g, 20000)).toBe(10);
  });
});
