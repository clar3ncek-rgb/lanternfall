import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { PETS, QUESTS, RELICS, SETS, SPELLS } from '../src/rules/content';
import { fresh, T0 } from './helpers';

const DAY = 86400000;

describe('elements and immunities', () => {
  it('immune foes take only the 20% floor from that element (run 2), piercing caps at 50%, weaknesses take x1.5', () => {
    const s = fresh();
    const d = G.derive(s);
    const foe = { name: 'x', hp: B.big(100), max: B.big(100), boss: false, immune: ['fire' as const], weak: ['cold' as const] };
    expect(G.elementFactor(d, foe, 'fire')).toBeCloseTo(G.IMMUNE_FLOOR / 100);
    expect(G.elementFactor(d, foe, 'cold')).toBeCloseTo(1.5);
    expect(G.elementFactor(d, foe, 'phys')).toBeCloseTo(1);
    d.stats.pierceAll = 500;
    expect(G.elementFactor(d, foe, 'fire')).toBeCloseTo(0.5);
  });

  it('bosses past stage 26 always keep at least one weakness and are never immune to everything', () => {
    const s = fresh();
    s.bestStage = 300;
    for (let i = 0; i < 200; i++) {
      s.life.stage = 26 + i;
      s.life.kills = G.KILLS_PER_STAGE;
      s.life.foe = { name: 'x', hp: B.big(1), max: B.big(1), boss: false };
      G.fightBoss(s);
      const f = s.life.foe;
      expect(f.boss).toBe(true);
      expect(f.weak?.length).toBeGreaterThan(0);
      expect((f.immune ?? []).length).toBeLessThan(6);
      expect(f.weak!.some((w) => f.immune?.includes(w))).toBe(false);
    }
  });

  it('no immunities before stage 26', () => {
    const s = fresh();
    for (let i = 0; i < 300; i++) {
      G.tap(s);
      expect(s.life.foe.immune).toBeUndefined();
      if (s.life.stage >= 20) break;
    }
  });
});

describe('overkill (Warrior Berserker cleave)', () => {
  const berserker = () => {
    const s = fresh('warrior');
    s.points.classPt = 30;
    s.classPaths.Berserker = { tier: 4, rank: 1, xp: 0 };
    s.classPath = 'Berserker';
    for (const n of G.classOf(s).tree) if (n.cleave) s.ranks[n.id] = 5;
    return s;
  };

  it('only the Berserker branch cleaves for real; everything else is capped at 15%', () => {
    expect(G.derive(fresh()).overkill).toBe(0);
    const r = fresh();
    r.relics.r13 = 20; // Pyre Salt
    r.pets['avalanche-hound'] = 200;
    r.petsOut = ['avalanche-hound'];
    expect(G.derive(r).overkill).toBeCloseTo(G.OVERKILL_OTHER_CAP / 100);
    expect(G.derive(berserker()).overkill).toBeCloseTo(1);
  });

  it('leftover damage kills the next foes but stops at the boss', () => {
    const s = berserker();
    s.life.heroLevel = 400; // one tap is far more than a stage-1 foe
    G.tap(s);
    expect(s.life.kills).toBe(G.KILLS_PER_STAGE);
    expect(s.life.foe.boss).toBe(true);
    expect(s.life.stage).toBe(1);
  });

  it('a non-Warrior does not carry leftover damage', () => {
    const s = fresh();
    s.life.heroLevel = 400;
    G.tap(s);
    expect(s.life.kills).toBe(1);
  });

  it('on stages you have cleared before, cleave sweeps the stage and moves on', () => {
    const s = berserker();
    s.bestStage = 50;
    s.life.heroLevel = 900;
    G.tap(s);
    expect(s.life.stage).toBeGreaterThan(1);
    expect(s.counts.overkillStages ?? 0).toBeGreaterThan(0);
  });
});

describe('special foes and fairies', () => {
  it('a treasure foe pays much more gold', () => {
    const s = fresh();
    s.life.stage = 10;
    s.life.treasureNext = true;
    s.life.kills = 1;
    s.life.foe = { name: 'x', hp: B.big(1), max: B.big(1), boss: false };
    G.tap(s);
    expect(s.life.foe.kind).toBe('treasure');
    const before = B.toNumber(s.life.gold);
    s.life.heroLevel = 2000;
    G.tap(s);
    expect(s.counts.treasure).toBe(1);
    expect(B.toNumber(s.life.gold) - before).toBeGreaterThan(B.toNumber(G.foeHp(10)) * G.GOLD_PER_HP * 5);
  });

  it('a fairy shows up within two minutes and can be collected', () => {
    const s = fresh();
    let seen = false;
    for (let i = 0; i < 1300 && !seen; i++) {
      G.tick(s, 0.1);
      if (s.life.fairy) seen = true;
    }
    expect(seen).toBe(true);
    expect(G.collectFairy(s)).not.toBeNull();
    expect(s.counts.fairies).toBe(1);
    expect(s.life.fairy).toBeNull();
  });
});

describe('XP, quests and points', () => {
  it('XP levels follow the curve and give race points', () => {
    expect(G.xpLevel(0)).toBe(1);
    expect(G.xpLevel(G.xpForLevel(10))).toBe(10);
    expect(G.xpLevel(G.xpForLevel(10) - 1)).toBe(9);
    const s = fresh();
    s.xp = G.xpForLevel(6);
    expect(G.racePointsFree(s)).toBe(5);
  });

  it('quests are claimed in order and a starter pet is a choice', () => {
    const s = fresh();
    expect(G.claimQuest(s)).toBe(false);
    // finish quests by faking progress
    for (let n = 1; n <= 4; n++) {
      const q = G.questDef(s.quest.num, s.hero.cls);
      s.counts[q.goal.kind] = (s.counts[q.goal.kind] ?? 0) + q.goal.n + 1;
      if (q.goal.kind === 'stage') s.bestStage = Math.max(s.bestStage, q.goal.n);
      if (q.goal.kind === 'xpLevel') s.xp = G.xpForLevel(q.goal.n);
      expect(G.claimQuest(s)).toBe(true);
      if (s.pending.length) break;
    }
    expect(s.quest.num).toBeGreaterThan(1);
    const petPending = s.pending.find((p) => p.kind === 'pet');
    expect(petPending?.choices.length).toBe(3);
    expect(G.choose(s, petPending!.choices[0])).toBe(true);
    expect(s.pets[petPending!.choices[0]]).toBe(1);
    expect(s.petsOut).toContain(petPending!.choices[0]);
  });

  it('the quest chain goes past 100', () => {
    expect(QUESTS.length).toBe(100);
    const q = G.questDef(150);
    expect(q.num).toBe(150);
    expect(q.rewards.length).toBeGreaterThan(0);
  });

  it('shared spells cost class points and can be cast', () => {
    const s = fresh();
    const sp = SPELLS.find((x) => x.unlock <= 1)!;
    expect(G.learnSpell(s, sp.id)).toBe(false);
    s.points.classPt = 1;
    expect(G.learnSpell(s, sp.id)).toBe(true);
    expect(G.skillPointsFree(s)).toBe(0);
    s.life.mana = 1000;
    expect(G.canUse(s, sp.id)).toBe('ok');
    expect(G.useSkill(s, sp.id)).toBe(true);
    expect(G.canUse(s, sp.id)).toBe('cooldown');
  });
});

describe('daily, keys and login', () => {
  it('a new day gives tasks, a free key up to 3, and the login reward once', () => {
    const s = fresh();
    s.keys = 0;
    expect(G.refreshDaily(s, T0)).toBe(true);
    expect(s.daily.tasks.length).toBe(3);
    expect(s.daily.weekly.length).toBe(3);
    expect(s.keys).toBeGreaterThanOrEqual(1);
    expect(G.refreshDaily(s, T0 + 1000)).toBe(false);
    for (let i = 1; i <= 6; i++) G.refreshDaily(s, T0 + i * DAY);
    // free keys stop at 3 (prize keys from login rewards can add more)
    s.keys = 3;
    const login = s.daily.loginDay;
    G.refreshDaily(s, T0 + 7 * DAY);
    expect(s.keys).toBeGreaterThanOrEqual(3);
    expect(s.daily.loginDay).toBe((login + 1) % 7);
  });

  it('a missed day pauses the login cycle instead of resetting it', () => {
    const s = fresh();
    G.refreshDaily(s, T0);
    G.refreshDaily(s, T0 + DAY);
    const at = s.daily.loginDay;
    G.refreshDaily(s, T0 + 5 * DAY);
    expect(s.daily.loginDay).toBe((at + 1) % 7);
  });
});

describe('dungeons, sets and merging', () => {
  it('a key opens a dungeon; clearing it gives a set piece of that realm', () => {
    const s = fresh();
    s.keys = 1;
    s.bestStage = 40;
    expect(G.startDungeon(s)).toBe(true);
    expect(s.keys).toBe(0);
    expect(G.startDungeon(s)).toBe(false);
    const realm = s.dungeon!.realm;
    s.life.heroLevel = 5000;
    for (let i = 0; i < 400 && !s.dungeon!.done; i++) G.tap(s);
    expect(s.dungeon!.cleared).toBe(true);
    const piece = s.bag.find((x) => x.id === s.dungeon!.drop)!;
    expect(piece.set).toBeTruthy();
    expect(G.setById(piece.set!)!.realm).toBe(piece.cls ? 'class' : realm); // run 6: half the clears give a class piece
    expect(G.leaveDungeon(s)).toBe(true);
    expect(s.dungeon).toBeNull();
  });

  it('running out of time keeps the gold but gives no piece', () => {
    const s = fresh();
    s.keys = 1;
    s.bestStage = 40;
    G.startDungeon(s);
    for (let i = 0; i < 2000 && !s.dungeon!.done; i++) G.tick(s, 0.5);
    expect(s.dungeon!.done).toBe(true);
    expect(s.dungeon!.cleared).toBe(false);
    expect(s.dungeon!.drop).toBeNull();
  });

  it('two copies at the same + level merge into +1, up to +5', () => {
    const s = fresh();
    const def = SETS[0];
    const a = G.makeSetPiece(s, def.id, 0, 50);
    s.bag.push(a);
    for (let k = 0; k < 5; k++) {
      const b = G.makeSetPiece(s, def.id, 0, 50, a.plus);
      s.bag.push(b);
      expect(G.merge(s, b.id)).toBe(true);
    }
    expect(a.plus).toBe(5);
    const c = G.makeSetPiece(s, def.id, 0, 50, 5);
    s.bag.push(c);
    expect(G.merge(s, c.id)).toBe(false);
  });

  it('wearing every piece of a set type turns on its rule-bender', () => {
    const s = fresh();
    const def = SETS.find((x) => x.type === 'weapons' && !x.cls)!;
    expect(G.setsComplete(s).length).toBe(0);
    def.pieces.forEach((_, i) => {
      const it = G.makeSetPiece(s, def.id, i, 30);
      s.bag.push(it);
      G.equip(s, it.id);
    });
    expect(G.setsComplete(s).map((x) => x.id)).toEqual([def.id]);
    expect(G.derive(s).rules.has(def.bonus.rule!.kind)).toBe(true);
  });

  it('set pieces are never salvaged by the bulk buttons', () => {
    const s = fresh();
    s.bag.push(G.makeSetPiece(s, SETS[0].id, 1, 10));
    G.salvageWorse(s);
    G.salvageRarity(s, 'set');
    expect(s.bag.length).toBe(1);
  });
});

describe('relics, pets and achievements', () => {
  it('the 9 rites are owned from the start; a new relic is random and costs Embers', () => {
    const s = fresh();
    expect(G.relicsOwnedCount(s)).toBe(9);
    expect(G.findRelic(s)).toBeNull();
    s.embers = B.big(1000);
    const id = G.findRelic(s)!;
    expect(RELICS.findIndex((r) => r.id === id)).toBeGreaterThanOrEqual(9);
    expect(G.relicsOwnedCount(s)).toBe(10);
    expect(B.toNumber(s.embers)).toBeLessThan(1000);
  });

  it('pets: hatch, 3 out at most, level with Marks, benched pets give 10%', () => {
    const s = fresh();
    s.eggs = 4;
    const ids = [G.hatchEgg(s)!, G.hatchEgg(s)!, G.hatchEgg(s)!, G.hatchEgg(s)!];
    expect(new Set(ids).size).toBe(4);
    expect(s.petsOut.length).toBe(3);
    expect(G.togglePet(s, ids[3])).toBe(false);
    G.togglePet(s, ids[0]);
    expect(G.togglePet(s, ids[3])).toBe(true);
    const p = PETS.find((x) => x.id === ids[0])!;
    const benched = G.totalStats(s)[p.stat] ?? 0;
    G.togglePet(s, ids[3]);
    G.togglePet(s, ids[0]);
    const out = G.totalStats(s)[p.stat] ?? 0;
    expect(out - benched).toBeCloseTo(p.per * 0.9, 3);
    expect(G.levelPet(s, ids[0])).toBe(false);
    s.marks = 100;
    expect(G.levelPet(s, ids[0])).toBe(true);
    expect(s.pets[ids[0]]).toBe(2);
  });

  it('achievements grant their tier, Marks and a permanent bonus once', () => {
    const s = fresh();
    s.counts.kills = 1e9;
    s.counts.taps = 1e9;
    expect(G.checkAchievements(s)).toBeGreaterThan(0);
    const marks = s.marks;
    expect(marks).toBeGreaterThan(0);
    expect(G.checkAchievements(s)).toBe(0);
    expect(s.marks).toBe(marks);
  });
});

describe('saves', () => {
  it('a v1 save loads: rites become relics and v1 skill points become class points', () => {
    const s = fresh();
    const raw = JSON.parse(G.serialize(s));
    raw.v = 1;
    raw.rites = { grip: 3 };
    delete raw.relics;
    for (const k of ['xp', 'raceRanks', 'formRanks', 'spells', 'points', 'quest', 'counts', 'marks', 'keys', 'eggs', 'pets', 'petsOut', 'ach', 'chest', 'daily', 'dungeon', 'events']) delete raw[k];
    raw.bestStage = 41;
    const back = G.deserialize(JSON.stringify(raw));
    expect(back.relics.grip).toBe(3);
    expect(back.points.classPt).toBe(4);
    expect(back.v).toBe(G.SAVE_VERSION);
    expect(() => G.tap(back)).not.toThrow();
    expect(() => G.tick(back, 0.5)).not.toThrow();
  });
});
