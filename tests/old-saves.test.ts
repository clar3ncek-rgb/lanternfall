import { describe, expect, it } from 'vitest';
import * as G from '../src/rules/game';

// Frozen save files (run 2, item 3). Made once by scripts/fixtures.sim.ts; do not regenerate unless they must change on purpose.
import v1 from './fixtures/save-v1.json?raw';
import v2 from './fixtures/save-v2.json?raw';
import v3 from './fixtures/save-v3.json?raw';
const FIX: Record<number, string> = { 1: v1, 2: v2, 3: v3 };
const raw = (v: number) => FIX[v];

describe('old saves keep loading (run 2, item 3)', () => {
  it('v3 loads unchanged in progress', () => {
    const before = JSON.parse(raw(3));
    const s = G.deserialize(raw(3));
    expect(s.v).toBe(G.SAVE_VERSION);
    expect(s.bestStage).toBe(before.bestStage);
    expect(s.life.heroLevel).toBe(before.life.heroLevel);
    expect(s.classPaths).toEqual(before.classPaths);
  });

  it('v2 loads, resets the class ladder to base T1 and the form to mortal, and drops branch ranks', () => {
    const before = JSON.parse(raw(2));
    const s = G.deserialize(raw(2));
    expect(s.v).toBe(G.SAVE_VERSION);
    expect(s.bestStage).toBe(before.bestStage);
    expect(s.classPath).toBe('base');
    expect(s.classPaths).toEqual({ base: { tier: 1, rank: 1, xp: 0 } });
    expect(s.hero.form).toBe('mortal');
    expect(s.forms).toEqual([]);
    expect(s.ranks.wa1).toBeUndefined(); // a Guardian branch node, not foundation
  });

  it('v1 loads: rites become relics, new systems start empty, class points are granted from best stage', () => {
    const before = JSON.parse(raw(1));
    const s = G.deserialize(raw(1));
    expect(s.v).toBe(G.SAVE_VERSION);
    expect(s.relics).toEqual(before.rites);
    expect((s as unknown as { rites?: unknown }).rites).toBeUndefined();
    expect(s.xp).toBe(0);
    expect(s.quest).toEqual({ num: 1, base: 0 });
    expect(s.points.classPt).toBe(Math.floor((before.bestStage - 1) / 10));
    expect(s.keys).toBe(1);
  });

  it('every fixture also survives a save code round trip', () => {
    for (const v of [1, 2, 3]) {
      const s = G.deserialize(raw(v));
      const again = G.importCode(G.exportCode(s));
      expect(again.bestStage).toBe(s.bestStage);
    }
  });

  it('a newer version is refused, not silently replaced', () => {
    const r = JSON.parse(raw(3));
    r.v = G.SAVE_VERSION + 1;
    expect(() => G.deserialize(JSON.stringify(r))).toThrow(/newer version/);
    expect(G.readSave(JSON.stringify(r)).kind).toBe('bad');
  });
});
