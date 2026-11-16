import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { T0 } from './helpers';

function hero(cls: string) {
  const s = G.newGame({ name: 'T', race: 'human', cls, faith: 'lantern', form: 'mortal' }, 42, T0);
  s.bestStage = 1000;
  s.life.stage = s.life.maxStage = 100;
  s.life.foe = { name: 'Target', hp: B.big(1e10), max: B.big(1e10), boss: false };
  s.lastSeen = T0;
  return s;
}
const H = 3600_000;

describe('Vigil: the Cleric climbs while away', () => {
  it('a full night (8 h) climbs to 90% of the best stage, and Prayer comes back full', () => {
    const s = hero('cleric');
    const r = G.applyOffline(s, T0 + 8 * H);
    expect(s.life.stage).toBe(900);
    expect(r.stages).toBe(800);
    expect(s.life.prayer).toBe(G.PRAYER_MAX);
  });
  it('half the time climbs half the way; never past 90% however long', () => {
    const half = hero('cleric');
    G.applyOffline(half, T0 + 4 * H);
    expect(half.life.stage).toBe(500);
    const week = hero('cleric');
    G.applyOffline(week, T0 + 7 * 24 * H);
    expect(week.life.stage).toBe(900);
  });
  it('under 10 minutes away does nothing; already past 90% does nothing', () => {
    const quick = hero('cleric');
    G.applyOffline(quick, T0 + 9 * 60_000);
    expect(quick.life.stage).toBe(100);
    const deep = hero('cleric');
    deep.life.stage = 950;
    G.applyOffline(deep, T0 + 8 * H);
    expect(deep.life.stage).toBe(950);
  });
  it('other classes keep the old rules (no Vigil)', () => {
    for (const cls of ['warrior', 'mage', 'rogue', 'ranger']) {
      const s = hero(cls);
      G.applyOffline(s, T0 + 8 * H);
      expect(s.life.stage, cls).toBe(100);
      expect(G.vigilStages(s, 8 * 3600)).toBe(0);
    }
  });
  it('no Vigil inside an escape', () => {
    const s = hero('cleric');
    s.escape = { realm: 'x' } as unknown as G.State['escape'];
    G.applyOffline(s, T0 + 8 * H);
    expect(s.life.stage).toBe(100);
  });
});
