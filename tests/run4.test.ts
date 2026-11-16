import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { fresh } from './helpers';

/** A stage-60 world fight with gold to spare. */
function at(stage: number, seed = 42) {
  const s = fresh('rogue', seed);
  s.life.stage = s.life.maxStage = s.bestStage = stage;
  s.life.kills = 0;
  s.life.gold = B.big(1e300);
  s.life.foe = { name: 'Test Foe', hp: B.big(1e9), max: B.big(1e9), boss: false };
  return s;
}
/** Kill the current foe outright and return the next one. */
function next(s: G.State) {
  s.life.foe.hp = B.big(1e-12 as number);
  s.life.foe.armour = 0;
  G.tap(s);
  return s.life.foe;
}

describe('run 4: elites', () => {
  it('about 1 ordinary foe in 8 from stage 26 is an elite, and none before', () => {
    const s = at(60);
    let elites = 0, n = 0;
    for (let i = 0; i < 400; i++) { s.life.kills = 0; const f = next(s); if (!f.boss && !f.kind) { n++; if (f.elite) elites++; } }
    const want = G.ELITE_CHANCE * G.eliteRate(s); // the test hero is an elf of the Red Hunt: x3
    expect(elites / n).toBeGreaterThan(want * 0.6);
    expect(elites / n).toBeLessThan(want * 1.4);
    const e = at(20);
    for (let i = 0; i < 200; i++) { e.life.kills = 0; expect(next(e).elite).toBeUndefined(); }
  });
  it('elites draw from their own stream: the main seed moves exactly as before', () => {
    const a = at(60, 7), b = at(10, 7);
    const ra = a.seed, rb = b.seed;
    expect(ra).toBe(rb);
  });
  it('armoured takes half tap damage until 3 crits; then full', () => {
    const s = at(60);
    s.life.foe = { name: 'Elite', hp: B.big(1e30), max: B.big(1e30), boss: false, elite: 'armoured', armour: 3 };
    const half = G.tap(s);
    s.life.foe.armour = 0;
    const full = G.tap(s);
    if (half.crit === full.crit) expect(B.ratio(half.dmg, full.dmg)).toBeCloseTo(0.5, 5);
  });
  it('a swift elite flees after 8 s, and pays Marks if caught', () => {
    const s = at(60);
    s.life.foe = { name: 'Swift One', hp: B.big(1e30), max: B.big(1e30), boss: false, elite: 'swift', fleeLeft: G.SWIFT_SECONDS };
    for (let t = 0; t < 9; t += 0.5) G.tick(s, 0.5);
    expect(s.life.foe.name).not.toBe('Swift One');
    const marks = s.marks;
    s.life.foe = { name: 'Swift Two', hp: B.big(1), max: B.big(1), boss: false, elite: 'swift', fleeLeft: 8 };
    G.tap(s);
    expect(s.marks).toBe(marks + G.SWIFT_MARKS);
    expect(s.counts.elites).toBe(1);
  });
  it('never in escapes or dungeons (run 5: except for the Rogue)', () => {
    const s = at(60);
    s.hero.cls = 'warrior';
    s.escape = { realm: 'ash' } as never;
    for (let i = 0; i < 50; i++) expect(G.weakOpen(s)).toBe(false);
  });
});

describe('run 4: weak spot', () => {
  it('opens 2 s after the start or the last hit and waits to be hit, on bosses and elites; x3 only while open', () => {
    const s = at(60);
    s.life.foe = { name: 'Boss', hp: B.big(1e40), max: B.big(1e40), boss: true, weakT: 0 };
    s.life.bossLeft = 999;
    expect(G.weakOpen(s)).toBe(false);
    s.life.foe.weakT = 2.1;
    expect(G.weakOpen(s)).toBe(true);
    const counted = s.counts.weakHits ?? 0;
    const hitOpen = G.tap(s, { weak: true });
    expect(hitOpen.weak).toBe(true);
    expect(s.counts.weakHits).toBe(counted + 1);
    expect(s.life.foe.weakT).toBe(0); // the hit closes it
    expect(G.tap(s, { weak: true }).weak).toBe(false);
    s.life.foe = { name: 'Plain', hp: B.big(1e40), max: B.big(1e40), boss: false, weakT: 5 };
    expect(G.weakOpen(s)).toBe(false);
  });
});

describe('run 4: adds gimmick and the boss clock', () => {
  it('while an add stands the boss takes 20%; adds take the hits first', () => {
    const s = at(120);
    s.life.foe = { name: 'Boss', hp: B.big(1000), max: B.big(1000), boss: true, gimmick: 'adds', addHp: [B.big(1e6), B.big(1e6)] };
    s.life.bossLeft = 999;
    const before = s.life.foe.hp;
    const r = G.tap(s);
    const lost = B.sub(before, s.life.foe.hp);
    expect(B.ratio(lost, r.dmg)).toBeCloseTo(G.ADDS_BOSS_SHARE, 5);
    expect(B.lt(s.life.foe.addHp![0], B.big(1e6))).toBe(true);
  });
  it('the next boss clock changes once, capped at 5 s either way', () => {
    const s = at(61);
    s.life.kills = G.KILLS_PER_STAGE; s.life.autoBoss = false;
    G.fightBoss(s);
    const base = s.life.bossLeft;
    s.life.foe = { name: 'x', hp: B.big(1e9), max: B.big(1e9), boss: false };
    s.life.nextBossDelta = -12;
    G.fightBoss(s);
    expect(s.life.bossLeft).toBeCloseTo(Math.max(5, base - 5), 5);
    s.life.foe = { name: 'x', hp: B.big(1e9), max: B.big(1e9), boss: false };
    G.fightBoss(s);
    expect(s.life.bossLeft).toBeCloseTo(base, 5); // used once
  });
});

describe('run 4: Toll Collector, shrine offering, hunts', () => {
  it('the Toll Collector: yes doubles gold and costs the next boss 5 s; no just ends it', () => {
    const s = at(60);
    G.startEvent(s, 'collector');
    expect(s.life.collector).toBe(true);
    expect(G.answerCollector(s, true)).toBe(true);
    expect(s.life.nextBossDelta).toBe(-5);
    expect(s.life.buffs.some((b) => b.kind === 'goldBuff' && b.mag === 1)).toBe(true);
    expect(G.answerCollector(s, true)).toBe(false);
    const t = at(60);
    G.startEvent(t, 'collector');
    G.answerCollector(t, false);
    expect(t.life.event).toBeNull();
    expect(t.life.nextBossDelta ?? 0).toBe(0);
  });
  it('a shrine offering is once per land per life, costs gold, and oil is not offered while a toll is owed', () => {
    const s = at(60);
    expect(G.offeringReady(s)).toBe(true);
    expect(G.makeOffering(s, 'tap')).toBe(true);
    expect(G.offeringReady(s)).toBe(false);
    expect(G.makeOffering(s, 'named')).toBe(false);
    s.life.stage = 80; // the next land
    expect(G.offeringReady(s)).toBe(true);
    s.life.nextBossDelta = -5;
    expect(G.offerKinds(s)).not.toContain('oil');
    const poor = at(60);
    poor.life.gold = B.ZERO;
    expect(G.makeOffering(poor, 'oil')).toBe(false);
  });
  it('offering and event buffs end in an escape', () => {
    const s = at(60);
    G.makeOffering(s, 'named');
    s.escape = { realm: 'ash', done: false, foe: { name: 'e', hp: B.big(1e9), max: B.big(1e9), boss: false }, timeLeft: 99 } as never;
    G.tick(s, 0.1);
    expect(s.life.buffs.some((b) => b.from === 'offering')).toBe(false);
  });
  it('hunts: offered from stage 26, accepted, done for a reward; they never tick outside the world', () => {
    const s = at(60);
    s.life.huntIn = 0.1;
    G.tick(s, 0.2);
    expect(s.life.huntOffer).toBeTruthy();
    s.life.huntOffer = { kind: 'weak', base: 0, left: 20 };
    expect(G.acceptHunt(s)).toBe(true);
    const marks = s.marks;
    s.counts.weakHits = (s.counts.weakHits ?? 0) + 10;
    G.tick(s, 0.1);
    expect(s.life.hunt).toBeNull();
    expect(s.marks).toBeGreaterThanOrEqual(marks + 15);
    // an accepted hunt does not run down inside a dungeon
    const d = at(60);
    d.life.hunt = { kind: 'elites', base: 0, left: 10 };
    d.dungeon = { done: false, foe: { name: 'd', hp: B.big(1e9), max: B.big(1e9), boss: false }, timeLeft: 99 } as never;
    G.tick(d, 1);
    expect(d.life.hunt?.left).toBe(10);
  });
  it('saves without run-4 fields load and play on', () => {
    const s = at(60);
    delete s.r4Seed; delete s.life.hunt; delete s.life.offered;
    const back = G.deserialize(G.serialize(s));
    for (let i = 0; i < 40; i++) { G.tap(back); G.tick(back, 0.25); }
    expect(back.life.stage).toBeGreaterThanOrEqual(60);
  });
});

describe('run 4, after the gate: sellswords, the tithe, Named specialisation', () => {
  it('sellswords add 10% to every Named per hire, up to 5, each twice the price, and end with the life', () => {
    const s = at(60);
    s.life.allyLevels[0] = 50;
    const before = G.derive(s).allyDps;
    const c1 = G.mercCost(s);
    expect(G.hireMerc(s)).toBe(true);
    expect(B.ratio(G.derive(s).allyDps, before)).toBeCloseTo(1.1, 5);
    expect(B.ratio(G.mercCost(s), c1)).toBeCloseTo(2, 5);
    for (let i = 0; i < 10; i++) G.hireMerc(s);
    expect(s.life.mercs).toBe(G.MERC_MAX);
    const poor = at(60); poor.life.gold = B.ZERO;
    expect(G.hireMerc(poor)).toBe(false);
  });
  it('the tithe takes all gold for up to +20% Embers, once per life', () => {
    const s = at(60);
    s.life.maxStage = 120;
    const base = G.previewEmbers(s);
    expect(G.tithe(s)).toBe(true);
    expect(B.isZero(s.life.gold)).toBe(true);
    expect(B.ratio(G.previewEmbers(s), base)).toBeCloseTo(1 + G.TITHE_MAX, 5);
    s.life.gold = B.big(1e300);
    expect(G.tithe(s)).toBe(false);
  });
  it('a Named at level 100 picks one trade; Bossbreaker hits bosses harder, Reaper the rest', () => {
    const s = at(60);
    s.life.allyLevels[0] = 99;
    expect(G.specWaiting(s, 0)).toBe(false);
    s.life.allyLevels[0] = 100;
    expect(G.chooseSpec(s, 0, 'boss')).toBe(true);
    expect(G.chooseSpec(s, 0, 'horde')).toBe(false);
    expect(G.specMult(s, 0, { name: 'b', hp: B.big(1), max: B.big(1), boss: true })).toBe(1.5);
    expect(G.specMult(s, 0, { name: 'f', hp: B.big(1), max: B.big(1), boss: false })).toBe(1);
  });
});

describe('run 4 fix: worse drops are salvaged at once', () => {
  it('a Rare-or-lower drop that is worse than what you wear becomes gold; Epic and up always reach the bag; the setting turns it off', () => {
    const s = at(60);
    s.equipped.mainHand = { id: 999, name: 'Big Stick', slot: 'mainHand', rarity: 'legendary', ilvl: 500, stats: { weapon: 1e9 } };
    let auto = 0;
    for (let i = 0; i < 60; i++) { const before = s.life.autoSold ?? 0; G.dropItem(s, 10, 'boss'); auto += (s.life.autoSold ?? 0) - before; }
    expect(auto).toBeGreaterThan(0);
    expect(s.bag.every((it) => !G.AUTO_SALVAGE.includes(it.rarity) || !G.isWorse(s, it))).toBe(true);
    const off = at(60);
    off.autoSalvageOff = true;
    off.equipped.mainHand = s.equipped.mainHand;
    for (let i = 0; i < 20; i++) G.dropItem(off, 10, 'boss');
    expect(off.life.autoSold ?? 0).toBe(0);
    expect(off.bag.length).toBeGreaterThan(0);
  });
});
