import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';

const fresh = () => G.newGame({ name: 'Test', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' }, 7, Date.now());

describe('auto-buy (idea 30)', () => {
  it('is locked until 10 relics', () => {
    expect(G.autoBuyUnlocked(fresh())).toBe(false);
  });
  it('spends gold on the cheapest levels and never goes below zero', () => {
    const s = fresh();
    s.life.gold = B.big(5000);
    const before = s.life.heroLevel;
    const n = G.autoBuy(s);
    expect(n).toBeGreaterThan(0);
    expect(s.life.heroLevel).toBeGreaterThan(before);
    expect(B.lt(s.life.gold, B.ZERO)).toBe(false);
    expect(B.lt(s.life.gold, G.heroCost(s))).toBe(true); // nothing affordable left
  });
  it('with no gold it buys nothing', () => {
    const s = fresh();
    s.life.gold = B.ZERO;
    expect(G.autoBuy(s)).toBe(0);
  });
});

describe('auto-cast (idea 28)', () => {
  it('does nothing without full mana', () => {
    const s = fresh();
    s.life.mana = 0;
    expect(G.autoCast(s)).toBeNull();
  });
  it('is locked until level 25', () => {
    expect(G.autoCastUnlocked(fresh())).toBe(false);
  });
});

describe('number format setting (idea 46)', () => {
  it('scientific shows 1.23e45 from a million up, letters otherwise', () => {
    const x = B.big(1.234e45);
    const letters = B.format(x);
    B.setScientific(true);
    expect(B.format(x)).toBe('1.23e45');
    expect(B.format(B.big(999))).toBe('999');
    expect(B.format(B.big(9.999e9))).toBe('1.00e10');
    B.setScientific(false);
    expect(B.format(x)).toBe(letters);
  });
});

describe('merge all (idea 37)', () => {
  it('with nothing to merge does nothing', () => {
    expect(G.mergeAll(fresh())).toBe(0);
  });
});

describe('bounty and land-1 boss time (ideas 45, 46; tuned in the sim)', () => {
  it('bounty stages are every 25th, never the Hollow Bishop\'s', () => {
    expect(G.isBountyStage(25)).toBe(true);
    expect(G.isBountyStage(75)).toBe(true);
    expect(G.isBountyStage(50)).toBe(false);
    expect(G.isBountyStage(30)).toBe(false);
  });
  it('bounties only start after the first fall', () => {
    const s = fresh();
    expect(G.bountyOn(s)).toBe(false);
    s.returns = 1;
    expect(G.bountyOn(s)).toBe(true);
  });
  it('land-1 bosses get the extra seconds, deeper lands do not', () => {
    const s = fresh();
    const d = G.derive(s);
    expect(G.bossTime(s, d)).toBe(d.timer + G.LAND1_BOSS_BONUS);
    s.life.stage = 300;
    expect(G.bossTime(s, d)).toBe(d.timer);
  });
});
