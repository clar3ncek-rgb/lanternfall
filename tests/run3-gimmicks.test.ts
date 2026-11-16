import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';

const fresh = () => G.newGame({ name: 'Test', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' }, 7, Date.now());
/** A boss at the given stage with the given gimmick, no immunities, so only the gimmick matters. */
function bossAt(stage: number, gimmick?: 'shield' | 'tolling') {
  const s = fresh();
  s.life.stage = s.life.maxStage = s.bestStage = stage;
  s.life.kills = G.KILLS_PER_STAGE;
  s.life.foe.boss = false;
  G.fightBoss(s);
  const f = s.life.foe;
  f.immune = []; f.weak = [];
  if (gimmick) { f.gimmick = gimmick; f.gimT = 0; f.shieldLeft = 0; f.tolled = 0; }
  s.life.bossLeft = 999;
  return s;
}

describe('gimmick bosses (run 3, round 2)', () => {
  it('every 10th stage from 110, never on the Hollow Bishop\'s stages', () => {
    expect(G.isGimmickStage(100)).toBe(false);
    expect(G.isGimmickStage(110)).toBe(true);
    expect(G.isGimmickStage(150)).toBe(false); // the Bishop's
    expect(G.isGimmickStage(160)).toBe(true);
    expect(G.isGimmickStage(165)).toBe(false);
  });
  it('a gimmick stage boss gets a gimmick; an ordinary stage boss does not', () => {
    expect(bossAt(160).life.foe.gimmick).toBeDefined();
    expect(bossAt(161).life.foe.gimmick).toBeUndefined();
  });
  it('Shield: at half health the ward goes up for 10 s and taps do only the floor', () => {
    const s = bossAt(160, 'shield');
    const f = s.life.foe;
    f.hp = B.times(f.max, 0.5);
    G.tick(s, 0.1);
    expect(f.shieldLeft).toBeGreaterThan(9);
    // a tap now does 20 % of what it would do unwarded
    const hp0 = f.hp;
    const warded = G.tap(s).dmg;
    f.shieldLeft = -1; // ward spent
    f.hp = hp0;
    const open = G.tap(s).dmg;
    expect(B.ratio(warded, open)).toBeCloseTo(G.IMMUNE_FLOOR / 100, 1);
  });
  it('Shield: the ward ends after 10 s and never comes back in the same fight', () => {
    const s = bossAt(160, 'shield');
    const f = s.life.foe;
    f.hp = B.times(f.max, 0.5);
    for (let t = 0; t < 12; t += 0.25) G.tick(s, 0.25);
    expect(f.shieldLeft).toBe(-1);
  });
  it('Shield with no other weapon and every element immune: the Named alone still win', () => {
    const s = bossAt(160, 'shield');
    s.life.allyLevels[0] = 400; s.life.allyLevels[1] = 400;
    const f = s.life.foe;
    f.hp = f.max = B.times(G.derive(s).allyDps, 30); // about 30 s of Named damage
    f.immune = ['phys', 'magic', 'fire', 'cold', 'light', 'poison'];
    const stage = s.life.stage;
    for (let t = 0; t < 400 && s.life.stage === stage; t += 0.25) G.tick(s, 0.25);
    expect(s.life.stage).toBeGreaterThan(stage);
  });
  it('Tolling: every 8 s the Named stop for 2 s, and tapping the bell stops the toll', () => {
    const s = bossAt(160, 'tolling');
    s.life.allyLevels[0] = 50;
    const f = s.life.foe;
    f.hp = f.max = B.times(G.derive(s).allyDps, 1000); // big enough to last, small enough that a tick shows
    for (let t = 0; t < 8.05; t += 0.05) G.tick(s, 0.05);
    expect(f.tolled).toBeGreaterThan(0);
    const before = f.hp;
    G.tick(s, 0.5);
    expect(f.hp).toEqual(before); // the Named do nothing during the toll
    expect(G.cancelToll(s)).toBe(true);
    G.tick(s, 0.5);
    expect(B.lt(f.hp, before)).toBe(true);
  });
  it('the first win against each gimmick gives a key and 20 Marks, once', () => {
    const s = bossAt(160, 'shield');
    const keys = s.keys, marks = s.marks;
    s.life.foe.hp = B.big(1);
    G.tap(s);
    expect(s.gimmicksBeaten).toEqual(['shield']);
    expect(s.keys).toBe(keys + 1);
    expect(s.marks).toBe(marks + 20);
  });
  it('no gimmicks inside an escape', () => {
    const s = fresh();
    s.life.maxStage = 160; s.life.stage = 160;
    expect(G.die(s)).toBe(true);
    expect(G.foeNow(s).gimmick).toBeUndefined();
  });
});
