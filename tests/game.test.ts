import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { ALLIES, ARTIFACTS, CLASSES, ESCAPE_FOES, SCARS } from '../src/rules/data';
import { fresh, play, T0 } from './helpers';

describe('new game', () => {
  it('starts at stage 1 with a weapon and the family heirloom', () => {
    const s = fresh();
    expect(s.life.stage).toBe(1);
    expect(s.equipped.mainHand?.stats.weapon).toBeGreaterThan(0);
    expect(s.equipped.trinket1?.rarity).toBe('ancestry');
    expect(G.derive(s).tap).toBeGreaterThan(B.ZERO);
  });

  it('every class has a tree of 10 nodes with 4 actives and a single foundation', () => {
    for (const c of CLASSES) {
      expect(c.tree).toHaveLength(10);
      expect(c.tree.filter((n) => n.kind === 'active')).toHaveLength(4);
      expect(c.tree.filter((n) => n.tier === 0)).toHaveLength(1);
    }
  });
});

describe('tapping and stages', () => {
  it('kills foes, earns gold, fights the boss after 8 kills and moves on', () => {
    const s = fresh();
    let guard = 0;
    while (!s.life.foe.boss && guard++ < 1000) G.tap(s);
    expect(s.life.kills).toBe(G.KILLS_PER_STAGE);
    expect(s.life.gold).toBeGreaterThan(B.ZERO);
    expect(s.life.bossLeft).toBeGreaterThan(0);
    while (s.life.stage === 1 && guard++ < 5000) G.tap(s);
    expect(s.life.stage).toBe(2);
    expect(s.bestStage).toBe(2);
  });

  it('a boss that runs out the clock sends you back to farming until you tap Fight boss', () => {
    const s = fresh();
    s.life.stage = 60; // far too strong for a new hero
    s.life.kills = G.KILLS_PER_STAGE;
    expect(G.fightBoss(s)).toBe(true);
    const ev = { failed: false };
    for (let i = 0; i < 400 && !ev.failed; i++) ev.failed = G.tick(s, 0.25).bossFailed;
    expect(ev.failed).toBe(true);
    expect(s.life.foe.boss).toBe(false);
    expect(s.life.autoBoss).toBe(false);
    expect(G.fightBoss(s)).toBe(true);
    expect(s.life.foe.boss).toBe(true);
  });

  it('a freeze skill stops the boss clock', () => {
    const s = fresh('rogue');
    s.points.classPt = 19; // plenty of skill points
    s.classPaths.Trickster = { tier: 4, rank: 1, xp: 0 };
    s.classPath = 'Trickster';
    for (const id of ['ro0', 'ro4', 'ro5', 'ro6']) G.rankUp(s, id);
    s.life.stage = 60;
    s.life.kills = G.KILLS_PER_STAGE;
    G.fightBoss(s);
    s.life.mana = 999;
    expect(G.useSkill(s, 'ro6')).toBe(true); // Hushblade
    const before = s.life.bossLeft;
    G.tick(s, 1);
    expect(s.life.bossLeft).toBe(before);
    expect(G.useSkill(s, 'ro6')).toBe(false); // on cooldown
  });
});

describe('buying', () => {
  it('buys hero levels and Named with gold, never going negative', () => {
    const s = fresh();
    s.life.gold = B.big(1000);
    const n = G.buyHero(s, 10);
    expect(n).toBe(10);
    expect(s.life.heroLevel).toBe(11);
    expect(G.buyAlly(s, 0)).toBe(1);
    expect(s.life.allyLevels[0]).toBe(1);
    expect(G.buyAlly(s, 9)).toBe(0); // not unlocked yet
    s.life.gold = B.ZERO;
    expect(G.buyHero(s)).toBe(0);
    expect(G.derive(s).allyDps).toBeGreaterThan(B.ZERO);
  });

  it('max buy matches what the gold can pay for', () => {
    const s = fresh();
    s.life.gold = B.big(1e9);
    const n = G.maxHeroBuy(s);
    const cost = G.heroCost(s, n);
    expect(B.gte(s.life.gold, cost)).toBe(true);
    expect(B.lt(s.life.gold, G.heroCost(s, n + 1))).toBe(true);
  });
});

describe('skills', () => {
  it('class points come from quests and cannot be overspent', () => {
    const s = fresh();
    expect(G.skillPointsFree(s)).toBe(0);
    s.points.classPt = 3; // class points now come from quests
    expect(G.skillPointsFree(s)).toBe(3);
    expect(G.rankUp(s, 'ro1')).toBe(false); // branch needs the foundation first
    expect(G.rankUp(s, 'ro0')).toBe(true);
    s.classPaths.Assassin = { tier: 2, rank: 1, xp: 0 }; // subclass nodes open by tier
    expect(G.rankUp(s, 'ro1')).toBe(true);
    expect(G.rankUp(s, 'ro0')).toBe(true);
    expect(G.rankUp(s, 'ro0')).toBe(false);
    expect(G.resetSkills(s)).toBe(false); // no Embers: taking points back is not free
    expect(G.skillPointsFree(s)).toBe(0);
    expect(B.toNumber(G.respecCost(s))).toBeCloseTo(5);
    s.embers = B.big(8);
    expect(G.resetSkills(s)).toBe(true);
    expect(G.skillPointsFree(s)).toBe(3);
    expect(B.toNumber(s.embers)).toBeCloseTo(3);
    s.bestReturn = B.big(400);
    expect(B.toNumber(G.respecCost(s))).toBeCloseTo(100); // a quarter of the best return
  });

  it('skills spend mana and buffs wear off', () => {
    const s = fresh();
    s.points.classPt = 1;
    G.rankUp(s, 'ro0'); // Twinfang, tap buff
    s.life.mana = 100;
    const tapBefore = G.tap(s).dmg;
    expect(G.useSkill(s, 'ro0')).toBe(true);
    expect(s.life.mana).toBeLessThan(100);
    expect(s.life.buffs).toHaveLength(1);
    for (let i = 0; i < 100; i++) G.tick(s, 0.5);
    expect(s.life.buffs).toHaveLength(0);
    expect(tapBefore).toBeGreaterThan(B.ZERO);
  });
});

describe('loot', () => {
  it('rolls items with stats matching rarity and compares them with what is worn', () => {
    const s = fresh();
    const rare = G.makeItem(s, 50, 'rare', 'chest');
    const extra = Object.keys(rare.stats).filter((k) => !['str', 'agi', 'sta', 'int', 'spi'].includes(k));
    expect(extra.length).toBeGreaterThanOrEqual(3);
    const common = G.makeItem(s, 50, 'common', 'chest');
    expect(Object.keys(common.stats).every((k) => ['str', 'agi', 'sta', 'int', 'spi'].includes(k))).toBe(true);
    s.bag.push(rare);
    const c = G.compare(s, rare);
    expect(c.slot).toBe('chest');
    expect(c.tap).toBeGreaterThan(0);
    expect(G.equip(s, rare.id)).toBe(true);
    expect(s.equipped.chest?.id).toBe(rare.id);
  });

  it('rings fill the free ring slot first; only one Artifact is worn at a time', () => {
    const s = fresh();
    const r1 = G.makeItem(s, 10, 'common', 'ring1');
    const r2 = G.makeItem(s, 10, 'common', 'ring1');
    s.bag.push(r1, r2);
    G.equip(s, r1.id);
    G.equip(s, r2.id);
    expect(s.equipped.ring1?.id).toBe(r1.id);
    expect(s.equipped.ring2?.id).toBe(r2.id);
    const a1 = G.makeArtifact(s, ARTIFACTS[0].id, 10);
    const a2 = G.makeArtifact(s, ARTIFACTS[2].id, 10);
    s.bag.push(a1, a2);
    G.equip(s, a1.id);
    G.equip(s, a2.id);
    const worn = Object.values(s.equipped).filter((i) => i?.rarity === 'artifact');
    expect(worn).toHaveLength(1);
    expect(worn[0]!.id).toBe(a2.id);
    expect(s.bag.some((i) => i.id === a1.id)).toBe(true);
  });

  it('the heirloom cannot be salvaged; other items turn into gold', () => {
    const s = fresh();
    G.unequip(s, 'trinket1');
    const heir = s.bag.find((i) => i.rarity === 'ancestry')!;
    expect(G.salvage(s, heir.id)).toBe(false);
    const junk = G.makeItem(s, 5, 'poor', 'feet');
    s.bag.push(junk);
    expect(G.salvage(s, junk.id)).toBe(true);
    expect(s.life.gold).toBeGreaterThan(B.ZERO);
  });
});

describe('item power and salvage', () => {
  it('worse means less Power than the weakest worn item it could replace', () => {
    const s = fresh();
    const strong = G.makeItem(s, 50, 'rare', 'ring1');
    const weak = G.makeItem(s, 5, 'common', 'ring1');
    const mid = G.makeItem(s, 30, 'uncommon', 'ring1');
    expect(G.itemPower(s, strong)).toBeGreaterThan(G.itemPower(s, weak));
    s.bag.push(mid);
    s.equipped.ring1 = strong;
    expect(G.isWorse(s, mid)).toBe(false); // ring2 is empty, so it still helps
    s.equipped.ring2 = weak;
    expect(G.replaceTarget(s, mid)).toBe('ring2');
    expect(G.isWorse(s, mid)).toBe(G.itemPower(s, mid) <= G.itemPower(s, weak));
    s.equipped.ring2 = G.makeItem(s, 60, 'rare', 'ring1');
    expect(G.isWorse(s, mid)).toBe(true);
    expect(G.salvageWorse(s)).toBe(1);
    expect(s.bag.length).toBe(0);
  });

  it('salvages all of one rarity, never Artifacts', () => {
    const s = fresh();
    s.bag.push(G.makeItem(s, 5, 'poor'), G.makeItem(s, 5, 'poor'), G.makeItem(s, 5, 'rare'), G.makeArtifact(s, 'nail', 5));
    expect(G.salvageRarity(s, 'poor')).toBe(2);
    expect(G.salvageRarity(s, 'artifact')).toBe(0);
    expect(s.bag.map((i) => i.rarity).sort()).toEqual(['artifact', 'rare']);
    expect(B.isZero(s.life.gold)).toBe(false);
  });
});

describe('death, escape and return', () => {
  function readyToDie(seed = 7) {
    const s = fresh('rogue', seed);
    s.life.maxStage = 40;
    s.bestStage = 40;
    s.life.stage = 40;
    s.life.gold = B.big(1e6);
    return s;
  }

  it('you cannot die for Embers before stage 20', () => {
    const s = fresh();
    expect(G.canDie(s)).toBe(false);
    expect(G.die(s)).toBe(false);
  });

  it('a failed escape still returns Embers, adds a chosen permanent scar, and resets the life', () => {
    const s = readyToDie();
    expect(G.die(s)).toBe(true);
    expect(s.escape).not.toBeNull();
    for (let t = 0; t < 400 && !s.escape!.done; t += 1) G.tick(s, 1);
    expect(s.escape!.done).toBe(true);
    expect(s.escape!.cleared).toBe(false);
    expect(s.pending[0].kind).toBe('scar');
    expect(G.returnToLife(s)).toBeNull(); // must choose first
    const pickScar = s.pending[0].choices[1];
    expect(G.choose(s, pickScar)).toBe(true);
    const gained = G.returnToLife(s)!;
    expect(gained).toBeGreaterThan(B.ZERO);
    expect(s.scars).toEqual([pickScar]);
    expect(s.life.stage).toBe(1);
    expect(s.life.heroLevel).toBe(1);
    expect(s.returns).toBe(1);
    // heirloom keeps 5% of gold
    expect(B.toNumber(s.life.gold)).toBeCloseTo(5e4, -1);
    // kept: best stage, gear, Embers
    expect(s.bestStage).toBe(40);
    expect(s.embers).toBe(gained);
  });

  it('clearing the gate gives more Embers than failing, and no scar', () => {
    const s = readyToDie();
    G.die(s);
    const e = s.escape!;
    const failReward = G.escapeReward({ ...e, killed: 0 });
    // kill every realm foe and the gate by brute force
    let guard = 0;
    while (!e.done && guard++ < 1000) {
      e.foe.hp = B.ZERO;
      G.tap(s);
    }
    expect(e.cleared).toBe(true);
    expect(e.killed).toBe(ESCAPE_FOES + 1);
    expect(s.pending.every((p) => p.kind === 'prize')).toBe(true);
    while (s.pending.length) G.choose(s, s.pending[0].choices[s.pending[0].choices.length - 1]);
    const got = G.returnToLife(s)!;
    expect(B.ratio(got, failReward)).toBeCloseTo(2.0 / 0.4, 0); // 0.4 + 0.6 + 0.5 (+0.5 if special)
    expect(s.scars).toHaveLength(0);
  });

  it('scars stack without limit but never push a stat below zero', () => {
    const s = fresh();
    for (let i = 0; i < 60; i++) s.scars.push('tendon', 'eye', 'lungs', 'frostbite');
    const d = G.derive(s);
    expect(d.tapMult).toBeGreaterThan(0);
    expect(d.critChance).toBeGreaterThanOrEqual(0);
    expect(d.timer).toBeGreaterThanOrEqual(10);
    expect(d.manaRegen).toBeGreaterThan(0);
  });

  it('a scar can be healed with Embers at 20x the best return', () => {
    const s = fresh();
    s.scars = ['tendon', 'memory'];
    s.bestReturn = B.big(10);
    expect(B.toNumber(G.healCost(s))).toBeCloseTo(200);
    s.embers = B.big(100);
    expect(G.healScar(s, 0)).toBe(false);
    s.embers = B.big(210);
    expect(G.healScar(s, 0)).toBe(true);
    expect(s.scars).toEqual(['memory']);
    expect(B.toNumber(s.embers)).toBeCloseTo(10);
  });

  it('special runs happen about 1 in 8 deaths', () => {
    let special = 0;
    const N = 800;
    for (let i = 0; i < N; i++) {
      const s = readyToDie(1000 + i);
      G.die(s);
      if (s.escape!.special) special++;
    }
    expect(special / N).toBeGreaterThan(0.08);
    expect(special / N).toBeLessThan(0.17);
  });

  it('Ember rites cost more each level and raise the stat', () => {
    const s = fresh();
    s.embers = B.big(100);
    const before = G.derive(s).tapMult;
    expect(G.buyRite(s, 'grip')).toBe(true);
    expect(G.derive(s).tapMult).toBeGreaterThan(before);
    const c1 = G.riteCost(s, 'grip');
    G.buyRite(s, 'grip');
    expect(G.riteCost(s, 'grip')).toBeGreaterThanOrEqual(c1);
  });
});

describe('offline gold', () => {
  it('pays only gold, from the Named, capped at 24 hours', () => {
    const s = fresh();
    s.life.allyLevels[0] = 10;
    const one = G.applyOffline({ ...structuredClone(s) }, T0 + 3600_000);
    const day = G.applyOffline(structuredClone(s), T0 + 24 * 3600_000);
    const week = G.applyOffline(structuredClone(s), T0 + 7 * 24 * 3600_000);
    expect(one.gold).toBeGreaterThan(B.ZERO);
    expect(B.ratio(day.gold, one.gold)).toBeCloseTo(24, 5);
    expect(week.gold).toBe(day.gold);
    expect(week.capped).toBe(true);
    expect(week.seconds).toBe(G.OFFLINE_CAP_SECONDS);
  });

  it('a clock going backwards gives nothing; no Named means no gold', () => {
    const s = fresh();
    s.life.allyLevels[0] = 5;
    expect(B.isZero(G.applyOffline(structuredClone(s), T0 - 999_999).gold)).toBe(true);
    const t = fresh();
    expect(B.isZero(G.applyOffline(t, T0 + 3600_000).gold)).toBe(true);
  });

  it('never moves stages or drops loot', () => {
    const s = fresh();
    s.life.allyLevels = ALLIES.map(() => 50);
    G.applyOffline(s, T0 + 24 * 3600_000);
    expect(s.life.stage).toBe(1);
    expect(s.bag).toHaveLength(0);
  });
});

describe('saves', () => {
  it('round-trips through a save code and refuses a damaged one', () => {
    const s = fresh();
    play(s, 60);
    s.scars.push(SCARS[0].id);
    const code = G.exportCode(s);
    const back = G.importCode(code);
    expect(back).toEqual(JSON.parse(JSON.stringify(s)));
    expect(() => G.importCode(code.slice(0, -8))).toThrow();
    expect(() => G.importCode('hello')).toThrow();
    const tampered = code.slice(0, -6) + (code.at(-6) === 'A' ? 'B' : 'A') + code.slice(-5); // always a different letter
    expect(() => G.importCode(tampered)).toThrow();
  });

  it('the same seed and the same inputs give the same game', () => {
    const a = fresh('mage', 99);
    const b = fresh('mage', 99);
    play(a, 120);
    play(b, 120);
    expect(G.serialize(a)).toBe(G.serialize(b));
  }, 30000); // plays 4 game minutes twice: slow on a busy machine (it timed out at 5 s once in run 3)

  it('Big zero survives JSON', () => {
    const s = fresh();
    const back = G.deserialize(G.serialize(s));
    expect(B.isZero(back.embers)).toBe(true);
  });
});

describe('escape sizing', () => {
  it('realm foes and the gate are sized in seconds of damage, starting from the estimate (run 3: then adapting to the damage dealt)', () => {
    const s = fresh();
    s.life.maxStage = s.bestStage = 30;
    s.life.heroLevel = 80;
    s.life.allyLevels[0] = 40;
    const unit = G.estimateDps(s);
    G.die(s);
    const e = s.escape!;
    const mult = e.special ? G.SPECIAL_ESCAPE_MULT : 1;
    expect(B.ratio(e.foe.max, unit)).toBeCloseTo(G.ESCAPE_FOE_SECONDS * mult, 6);
    const plain = ESCAPE_FOES * G.ESCAPE_FOE_SECONDS + G.ESCAPE_GATE_SECONDS;
    // run 3, adaptive escapes: sized from your own damage in the escape, the budget sits under the 300 s clock. Run 4: 270 s on paper,
    // because real escape foes take a little longer than their size (the sim leaves about 10 to 35 s at the gate)
    expect(plain).toBeGreaterThan(270);
    expect(plain).toBeLessThan(300);
  });

  it('Embers grow steeply with the stage you die at', () => {
    expect(B.toNumber(G.embersFor(20, 0))).toBeCloseTo(2);
    expect(B.cmp(G.embersFor(100, 0), G.embersFor(50, 0))).toBe(1);
    expect(B.ratio(G.embersFor(60, 10), G.embersFor(60, 0))).toBeCloseTo(1.1);
    expect(B.isZero(G.embersFor(19, 0))).toBe(true);
  });
});
