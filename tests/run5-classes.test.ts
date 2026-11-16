import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { T0 } from './helpers';

function hero(cls: string, race = 'human', faith = 'lantern', seed = 42) {
  const s = G.newGame({ name: 'T', race, cls, faith, form: 'mortal' }, seed, T0);
  s.life.stage = s.life.maxStage = s.bestStage = 60;
  s.life.foe = { name: 'Target', hp: B.big(1e40), max: B.big(1e40), boss: false };
  s.life.gold = B.big(1e300);
  return s;
}
/** Average damage of n manual taps (crit luck averaged by many taps). */
function tapDmg(s: G.State, n = 400) {
  let sum = B.ZERO;
  for (let i = 0; i < n; i++) sum = B.add(sum, G.tap(s).dmg);
  return B.times(sum, 1 / n);
}

describe('run 5: five classes, five ways to play', () => {
  it('Warrior: 25 taps build Rage; the 26th is a Rage Strike for 25x; Rage fades after a pause; Named -30%', () => {
    const s = hero('warrior');
    for (let i = 0; i < 25; i++) G.tap(s);
    expect(s.life.rage).toBe(G.RAGE_MAX);
    const r = G.tap(s);
    expect(s.life.rage).toBe(0);
    expect(s.counts.rageStrikes).toBe(1);
    const plain = G.tap(s);
    if (r.crit === plain.crit) expect(B.ratio(r.dmg, plain.dmg)).toBeCloseTo(G.RAGE_STRIKE, 3);
    for (let i = 0; i < 10; i++) G.tap(s);
    G.tick(s, 1); G.tick(s, 1); G.tick(s, 1);
    expect(s.life.rage ?? 0).toBeLessThan(40);
    const m = hero('mage');
    s.life.allyLevels[0] = m.life.allyLevels[0] = 30;
    expect(B.ratio(G.derive(s).namedDps[0], G.derive(m).namedDps[0])).toBeCloseTo(G.WARRIOR_NAMED, 5);
  });
  it('Mage: taps do half and refill mana; spells twice as strong; cooldowns shorter', () => {
    const m = hero('mage'), w = hero('rogue');
    w.life.combo = 0;
    expect(B.ratio(tapDmg(m), tapDmg(w))).toBeGreaterThan(0.35);
    expect(B.ratio(tapDmg(m), tapDmg(w))).toBeLessThan(0.65);
    m.life.mana = 0;
    G.tap(m);
    expect(m.life.mana).toBe(G.MAGE_MANA_PER_TAP);
    expect(G.derive(m).skillPower / G.derive(w).skillPower).toBeGreaterThan(G.MAGE_SKILL * 0.95); // the Mage's heirloom adds a little Intellect too
  });
  it('Rogue: weak spots open after 1 s and hit x5, building a combo that breaks if a spot is left for 2 s', () => {
    const s = hero('rogue');
    s.life.foe = { name: 'Boss', hp: B.big(1e40), max: B.big(1e40), boss: true, weakT: 0 };
    s.life.bossLeft = 999;
    G.tick(s, 1.05);
    expect(G.weakOpen(s)).toBe(true);
    expect(G.tap(s, { weak: true }).weak).toBe(true);
    expect(s.life.combo).toBe(1);
    for (let t = 0; t < 3.2; t += 0.1) G.tick(s, 0.1);
    expect(s.life.combo).toBe(0);
    const w = hero('warrior');
    expect(G.derive(s).timer).toBeCloseTo(G.derive(w).timer + G.ROGUE_TIMER, 5);
  });
  it('Ranger: arrows fly by themselves; pets x2; own taps half', () => {
    const r = hero('ranger'), w = hero('warrior');
    expect(G.derive(r).autoTap - G.derive(w).autoTap).toBe(G.RANGER_AUTO);
    expect(G.derive(r).petMult / G.derive(w).petMult).toBeCloseTo(G.RANGER_PETS, 5);
    r.life.foe = { name: 'Small', hp: B.big(1e6), max: B.big(1e6), boss: false };
    const before = r.life.foe.hp;
    G.tick(r, 1);
    expect(B.lt(r.life.foe.hp, before)).toBe(true); // no taps, still hits
  });
  it('Cleric: taps build Prayer that lifts the Named, and it fades', () => {
    const c = hero('cleric');
    c.life.allyLevels[0] = 50;
    c.life.foe = { name: 'Wall', hp: B.big(1e7), max: B.big(1e7), boss: false };
    for (let i = 0; i < 100; i++) G.tap(c);
    expect(c.life.prayer).toBe(G.PRAYER_MAX);
    const hp0 = c.life.foe.hp; G.tick(c, 0.5); const withPrayer = B.sub(hp0, c.life.foe.hp);
    c.life.prayer = 0; c.life.sinceTap = 99;
    const hp1 = c.life.foe.hp; G.tick(c, 0.5); const without = B.sub(hp1, c.life.foe.hp);
    expect(B.ratio(withPrayer, without)).toBeGreaterThan(2.5);
    c.life.prayer = 100; c.life.sinceTap = 5; G.tick(c, 1);
    expect(c.life.prayer).toBeLessThan(100);
  });
  it('every class can beat the first boss with taps alone', () => {
    for (const cls of ['warrior', 'mage', 'rogue', 'ranger', 'cleric']) {
      const s = G.newGame({ name: 'T', race: 'human', cls, faith: 'lantern', form: 'mortal' }, 5, T0);
      for (let t = 0; t < 90 && s.life.stage < 2; t += 0.2) { G.tap(s); G.tick(s, 0.2); if (s.life.kills >= G.KILLS_PER_STAGE) G.fightBoss(s); }
      expect(s.life.stage, cls).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('run 5: races and faiths', () => {
  it('Troll: a failed boss comes back with the health it had; a failed escape leaves no scar', () => {
    const s = hero('warrior', 'troll');
    s.life.kills = G.KILLS_PER_STAGE; s.life.autoBoss = false; G.fightBoss(s);
    s.life.foe.hp = B.times(s.life.foe.max, 0.3);
    s.life.bossLeft = 0.01; G.tick(s, 0.1);
    G.fightBoss(s);
    expect(B.ratio(s.life.foe.hp, s.life.foe.max)).toBeCloseTo(0.3, 2);
  });
  it('Human makes two shrine offerings per land; Dwarf pays half at the Forge; Red Hunt and Elf find more elites', () => {
    const h = hero('warrior', 'human');
    expect(G.makeOffering(h, 'tap')).toBe(true);
    expect(G.makeOffering(h, 'named')).toBe(true);
    expect(G.offeringReady(h)).toBe(false);
    const d = hero('warrior', 'dwarf'), o = hero('warrior', 'orc');
    const it = d.equipped.mainHand!;
    o.equipped.mainHand = it;
    expect(B.ratio(G.forgeCost(d, it), G.forgeCost(o, it))).toBeCloseTo(0.5, 5);
    expect(G.eliteRate(hero('warrior', 'elf', 'redhunt'))).toBe(3);
  });
});

describe('run 5: gems and Reshape', () => {
  it('a Reshape costs 10 gems, changes the class in one step, returns class points and swaps the untouched starter kit', () => {
    const s = hero('warrior');
    s.gems = 10;
    expect(G.reshapeBlock(s, 'cls', 'warrior')).toBeTruthy();
    expect(G.reshape(s, 'cls', 'mage')).toBe(true);
    expect(s.hero.cls).toBe('mage');
    expect(s.gems).toBe(0);
    expect(Object.keys(s.ranks)).toHaveLength(0);
    expect(s.equipped.trinket1!.stats.int).toBe(3);
    expect(s.equipped.trinket1!.stats.str).toBeUndefined();
    expect(G.reshape(s, 'race', 'orc')).toBe(false); // no gems left
  });
  it('an older save gets 10 welcome gems once', () => {
    const s = hero('warrior');
    delete s.gemsWelcome; s.gems = 0;
    const back = G.deserialize(G.serialize(s));
    expect(back.gems).toBe(G.RESHAPE_COST);
    expect(G.deserialize(G.serialize(back)).gems).toBe(G.RESHAPE_COST);
  });
});
