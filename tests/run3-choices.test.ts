import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import v3 from './fixtures/save-v3.json?raw';

const fresh = () => G.newGame({ name: 'Test', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' }, 7, Date.now());

describe('Train branches (run 3, round 4)', () => {
  it('a perk waits every 100 Train levels, and choosing one never blocks the fight', () => {
    const s = fresh();
    expect(G.trainPerksWaiting(s)).toBe(0);
    s.life.heroLevel = 250;
    expect(G.trainPerksWaiting(s)).toBe(2);
    expect(s.pending).toEqual([]); // a flag, not a pending choice: tick keeps running
    s.life.foe.hp = s.life.foe.max = B.big(1e9); const hp = s.life.foe.hp; s.life.allyLevels[0] = 5; G.tick(s, 1);
    expect(B.lt(s.life.foe.hp, hp)).toBe(true);
    expect(G.chooseTrainPerk(s, 'tap')).toBe(true);
    expect(G.trainPerksWaiting(s)).toBe(1);
  });
  it('Heavy Hand adds 5% tap damage and Keen Eye 1% crit, and both last through a fall', () => {
    const s = fresh();
    s.life.heroLevel = 200;
    const d0 = G.derive(s);
    G.chooseTrainPerk(s, 'tap'); G.chooseTrainPerk(s, 'crit');
    const d1 = G.derive(s);
    expect(B.ratio(d1.tap, d0.tap)).toBeCloseTo(1.05, 2);
    expect(d1.critChance - d0.critChance).toBeCloseTo(0.01, 3);
    expect(G.chooseTrainPerk(s, 'tap')).toBe(false); // none left at level 200
  });
});

describe('the Gold Forge (run 3, round 4)', () => {
  it('forging spends gold, raises the forge level and the item\'s stats', () => {
    const s = fresh();
    s.life.maxStage = 50;
    const it = s.equipped.mainHand!;
    const cost = G.forgeCost(s, it);
    s.life.gold = B.times(cost, 1.5);
    const tap0 = G.derive(s).tap;
    expect(G.forge(s, 'mainHand')).toBe(true);
    expect(it.forge).toBe(1);
    expect(B.gte(G.derive(s).tap, tap0)).toBe(true);
    expect(B.lt(s.life.gold, cost)).toBe(true);
  });
  it('costs grow with depth (x1.16 a stage) and with each level', () => {
    const s = fresh();
    const it = s.equipped.mainHand!;
    s.life.maxStage = 100; const a = G.forgeCost(s, it);
    s.life.maxStage = 101; const b = G.forgeCost(s, it);
    expect(B.ratio(b, a)).toBeGreaterThanOrEqual(1.15);
    it.forge = 1; expect(B.lt(b, G.forgeCost(s, it))).toBe(true);
  });
  it('never touches set pieces, and old merge levels are unchanged', () => {
    const s = fresh();
    s.equipped.mainHand!.set = 'any-set'; s.equipped.mainHand!.plus = 3;
    s.life.gold = B.big(1e300);
    expect(G.forge(s, 'mainHand')).toBe(false);
    expect(s.equipped.mainHand!.plus).toBe(3);
    const old = G.deserialize(v3);
    for (const it of [...Object.values(old.equipped), ...old.bag]) if (it) expect(it.forge).toBeUndefined();
  });
  it('stops at forge level 10 and is closed inside a realm', () => {
    const s = fresh();
    s.life.gold = B.big(1e300);
    s.equipped.mainHand!.forge = 10;
    expect(G.forge(s, 'mainHand')).toBe(false);
    s.equipped.mainHand!.forge = 0;
    s.life.maxStage = 30; expect(G.die(s)).toBe(true);
    expect(G.forge(s, 'mainHand')).toBe(false);
  });
});

describe('adaptive escapes (run 3, Clarence: every escape tight)', () => {
  const fallAt = (stage: number) => { const s = G.newGame({ name: 'T', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' }, 9, Date.now()); s.life.maxStage = s.life.stage = s.bestStage = stage; s.life.heroLevel = 80; s.life.allyLevels[0] = 40; G.die(s); return s; };
  it('run 5: escape foes are steered by time: a foe that fell fast makes the next bigger, a slow one smaller', () => {
    const s = fallAt(40);
    const e = s.escape!;
    const start = e.unit;
    e.foeT = G.ESCAPE_TUNE.foe / 3; // fell three times faster than its target
    e.foe.hp = B.big(1); G.tap(s);
    expect(B.ratio(e.unit, start)).toBeGreaterThan(2);
    const before = e.unit;
    e.foeT = G.ESCAPE_TUNE.foe * 2; // twice too slow
    e.foe.hp = B.big(1); G.tap(s);
    expect(B.ratio(e.unit, before)).toBeLessThan(0.7); // the target also follows the time left, so the step is a little smaller
  });
  it('slacking makes the escape at most a little easier: the size never drops below half the start', () => {
    const s = fallAt(40);
    const e = s.escape!;
    const start = e.unit;
    for (let i = 0; i < 6; i++) { e.foeT = 60; e.foe.hp = B.big(1); G.tap(s); }
    expect(B.ratio(e.unit, start)).toBeCloseTo(0.5, 5);
  });
});
