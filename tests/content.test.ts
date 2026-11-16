import { describe, expect, it } from 'vitest';
import * as C from '../src/rules/content';
import { SET_SLOTS } from '../src/rules/content-types';
import type { Effect, Reward, RuleKind } from '../src/rules/content-types';
import { DEEP_SHOWN, ALLIES, CLASSES, ELEMENTS, FORMS, MAX_RANK, RACES, REALMS, RITES, STAT_LABEL, ZONES } from '../src/rules/data';
import type { StatKey } from '../src/rules/data';

const STAT_KEYS = Object.keys(STAT_LABEL) as StatKey[];
const RULE_KINDS: RuleKind[] = [
  'fury', 'surge', 'comboDeep', 'volleyAuto', 'prayerDeep', // run 6
  'rageGain', 'rageKeep', 'strikeCrit', 'strikePlus', 'chainStrike', 'manaTap', 'mageFocus', 'manaRegenPlus', 'manaMaxPct', 'burntGrimoire',
  'spotGold', 'spotFast', 'comboStart', 'spotWait', 'glassKnife', 'petHaste', 'rangerGold', 'arrowPlus', 'silentString',
  'prayerHold', 'vigilFast', 'vigilQuick', 'prayerGain', 'ashCenser',
  'critSplash', 'tapCleave', 'bossRamp', 'execute', 'shatter', 'clockPauseSkill', 'bleed', 'bloodMoney', 'weakestElement',
  'cooldownCut', 'drift', 'emberDrip', 'bossRevive', 'namedAsTap', 'offlinePush', 'nthTap', 'lifeStart', 'skillExtendOnKill',
  'fairyStrike', 'namedDouble', 'freeSpellTaps', 'durationPlus', 'clockSlow', 'goldInterest', 'critFreeze', 'respecDiscount',
  'tapPerMilestone', 'bossWeaken', 'fallingStar', 'spellTwice', 'plusOneDrop', 'keepGold', 'treasureSplit', 'namedInEscape', 'autoCast',
];

const unique = (ids: string[]) => new Set(ids).size === ids.length;

const allEffects = (): { where: string; e: Effect }[] => [
  ...C.SETS.map((s) => ({ where: `set ${s.id}`, e: s.bonus })),
  ...C.RELICS.map((r) => ({ where: `relic ${r.id}`, e: r.effect })),
  ...[...C.RACE_TREES, ...C.FORM_TREES].flatMap((t) => t.nodes.map((n) => ({ where: `node ${n.id}`, e: n.effect }))),
];

const allRewards = (): Reward[] => [
  ...C.QUESTS.flatMap((q) => q.rewards),
  ...C.DAILY_TASKS.flatMap((t) => t.rewards),
  ...C.WEEKLY_TASKS.flatMap((t) => t.rewards),
  ...C.LOGIN.flatMap((d) => d.rewards),
  ...C.CHEST.rewards,
  ...C.CHEST.big,
];

const sum = (rs: Reward[], kind: Reward['kind']) => rs.filter((r) => r.kind === kind).reduce((a, r) => a + r.n, 0);

describe('content: ids and counts', () => {
  it('has the right counts', () => {
    expect(C.SETS.filter((x) => !x.cls)).toHaveLength(15); // realm sets
    expect(C.SETS.filter((x) => x.cls)).toHaveLength(15); // run 6: weapons, accessories and armour for each class
    expect(C.RELICS).toHaveLength(100);
    expect(C.RACE_TREES).toHaveLength(RACES.length);
    expect(C.FORM_TREES).toHaveLength(FORMS.length);
    expect(C.SPELLS).toHaveLength(6);
    expect(C.PETS).toHaveLength(STAT_KEYS.length - 1); // run 5: dmgPct (every source) is for race, faith and form only, no pet
    expect(C.QUESTS).toHaveLength(100);
    expect(C.ACHIEVEMENTS).toHaveLength(30);
    expect(C.DAILY_TASKS).toHaveLength(10);
    expect(C.WEEKLY_TASKS).toHaveLength(8);
    expect(C.LOGIN).toHaveLength(7);
    expect(C.NAMED_ELEMENTS).toHaveLength(ALLIES.length);
    expect(C.NAMED_MILESTONES).toHaveLength(ALLIES.length);
    // run 3: 3 for lands 1 to 5, one for The Bellrope Descent, plus one of each for every land below it
    expect(C.SPECIAL_FOES.filter((f) => f.kind === 'treasure')).toHaveLength(4 + DEEP_SHOWN.length);
    expect(C.SPECIAL_FOES.filter((f) => f.kind === 'wanderer')).toHaveLength(4 + DEEP_SHOWN.length);
    expect(C.CHEST.every).toBe(25);
  });

  it('has unique ids everywhere', () => {
    expect(unique(C.SETS.map((s) => s.id))).toBe(true);
    expect(unique(C.RELICS.map((r) => r.id))).toBe(true);
    expect(unique([...C.RACE_TREES, ...C.FORM_TREES].map((t) => t.id))).toBe(true);
    expect(unique([...C.RACE_TREES, ...C.FORM_TREES].flatMap((t) => t.nodes.map((n) => n.id)))).toBe(true);
    expect(unique(C.SPELLS.map((s) => s.id))).toBe(true);
    expect(unique(C.PETS.map((p) => p.id))).toBe(true);
    expect(unique(C.PETS.map((p) => p.name))).toBe(true);
    expect(unique(C.QUESTS.map((q) => q.id))).toBe(true);
    expect(unique(C.ACHIEVEMENTS.map((a) => a.id))).toBe(true);
    expect(unique([...C.DAILY_TASKS, ...C.WEEKLY_TASKS].map((t) => t.id))).toBe(true);
    expect(unique(C.SPECIAL_FOES.map((f) => f.id))).toBe(true);
    expect(C.LOGIN.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('numbers relics 1..100; the first 9 are the rites with their old ids', () => {
    expect(C.RELICS.map((r) => r.num)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    RITES.forEach((rite, i) => {
      const r = C.RELICS[i];
      expect(r.id).toBe(rite.id);
      expect(r.name).toBe(rite.name);
      expect(r.effect.stat).toBe(rite.stat);
      expect(r.effect.per).toBe(rite.perLevel);
      expect(!!r.effect.compound).toBe(!!rite.compound);
      expect(r.max).toBe(rite.maxLevel);
    });
    C.RELICS.slice(9).forEach((r) => expect(r.id).toBe(`r${r.num}`));
    for (const r of C.RELICS) {
      expect(r.growth).toBeGreaterThanOrEqual(1.25);
      expect(r.growth).toBeLessThanOrEqual(1.6);
      expect(r.cost).toBeGreaterThan(0);
    }
  });

  it('caps Embered Bones (lifeStart) at 20% of best', () => {
    for (const r of C.RELICS.filter((x) => x.effect.rule?.kind === 'lifeStart')) {
      const rule = r.effect.rule!;
      expect(r.max).toBeDefined();
      expect(rule.a + (rule.perA ?? 0) * (r.max! - 1)).toBeLessThanOrEqual(20);
    }
  });
});

describe('content: sets', () => {
  it('pieces match SET_SLOTS for their type', () => {
    for (const s of C.SETS) expect(s.pieces.map((p) => p.slot), s.id).toEqual(SET_SLOTS[s.type]);
  });

  it('every realm has its 3 set types', () => {
    for (const realm of REALMS) {
      const types = C.SETS.filter((s) => s.realm === realm.id).map((s) => s.type).sort();
      expect(types, realm.id).toEqual(['accessories', 'armour', 'weapons']);
    }
    for (const s of C.SETS) expect(s.cls ? s.realm === 'class' : REALMS.some((r) => r.id === s.realm)).toBe(true);
  });

  it('pieces roll 2 to 3 stats and the bonus is a rule', () => {
    for (const s of C.SETS) {
      expect(s.stats.length).toBeGreaterThanOrEqual(2);
      expect(s.stats.length).toBeLessThanOrEqual(3);
      expect(s.bonus.rule, s.id).toBeDefined();
    }
  });

  it("keeps Clarence's rulings on the strong set bonuses", () => {
    const bonus = (id: string) => C.SETS.find((s) => s.id === id)!.bonus.rule!;
    expect(bonus('court-armour')).toMatchObject({ kind: 'execute', a: 10, b: 50 });
    expect(bonus('astral-accessories')).toMatchObject({ kind: 'cooldownCut', a: 50 });
    expect(bonus('winter-accessories')).toMatchObject({ kind: 'offlinePush', a: 2, b: 25 });
  });
});

describe('content: effects', () => {
  it('every tree node and relic has a stat or a rule; stats are real keys', () => {
    for (const { where, e } of allEffects()) {
      expect(!!(e.stat || e.rule), where).toBe(true);
      if (e.stat) {
        expect(STAT_KEYS, where).toContain(e.stat);
        expect(Number.isFinite(e.per), where).toBe(true);
      }
      if (e.stat2) {
        expect(STAT_KEYS, where).toContain(e.stat2);
        expect(Number.isFinite(e.per2), where).toBe(true);
      }
    }
  });

  it('every rule used is a known RuleKind with a value for a', () => {
    for (const { where, e } of allEffects()) {
      if (!e.rule) continue;
      expect(RULE_KINDS, where).toContain(e.rule.kind);
      expect(Number.isFinite(e.rule.a), where).toBe(true);
      if (e.rule.el) expect(ELEMENTS).toContain(e.rule.el);
      if (e.rule.kind === 'autoCast') {
        expect(e.rule.active, where).toBeDefined();
        expect(e.rule.b, where).toBeDefined();
        expect(e.rule.dur, where).toBeDefined();
      }
    }
  });

  it('trees: one per race and per form, Mortal Master gets Mastery, tiers 0..2', () => {
    expect(C.RACE_TREES.map((t) => t.id)).toEqual(RACES.map((r) => r.id));
    expect(C.FORM_TREES.map((t) => t.id).sort()).toEqual(FORMS.map((f) => (f.id === 'mortal' ? 'mastery' : f.id)).sort());
    for (const t of C.RACE_TREES) expect(t.kind).toBe('race');
    for (const t of C.FORM_TREES) expect(t.kind).toBe('form');
    for (const t of [...C.RACE_TREES, ...C.FORM_TREES]) {
      for (const n of t.nodes) {
        expect([0, 1, 2]).toContain(n.tier);
        expect(n.max).toBeGreaterThan(0);
      }
      expect(t.nodes.some((n) => n.tier === 0)).toBe(true);
    }
  });
});

describe('content: pets', () => {
  it('one pet per StatKey, each stat distinct', () => {
    const stats = C.PETS.map((p) => p.stat);
    expect(new Set(stats).size).toBe(stats.length);
    for (const k of STAT_KEYS.filter((x) => x !== 'dmgPct')) expect(stats.filter((s) => s === k), k).toHaveLength(1);
    for (const p of C.PETS) {
      expect(p.per).toBeGreaterThan(0);
      expect(p.atk).toBeGreaterThan(0);
      expect(ELEMENTS).toContain(p.element);
    }
  });

  it('starters are crow, wisp and hound, given as a pick at quest 4', () => {
    const starters = C.PETS.filter((p) => p.starter);
    expect(starters.map((p) => p.body).sort()).toEqual(['crow', 'hound', 'wisp']);
    const q4 = C.QUESTS[3].rewards.find((r) => r.kind === 'pet');
    expect(q4?.pets?.slice().sort()).toEqual(starters.map((p) => p.id).sort());
  });

  it('other pets come at quests 35 and 70 plus eggs spread through the chain', () => {
    const petIds = new Set(C.PETS.map((p) => p.id));
    for (const num of [35, 70]) {
      const r = C.QUESTS[num - 1].rewards.find((x) => x.kind === 'pet');
      expect(r?.pets?.length, `quest ${num}`).toBeGreaterThan(0);
      for (const id of r!.pets!) {
        expect(petIds.has(id)).toBe(true);
        expect(C.PETS.find((p) => p.id === id)!.starter).toBeFalsy();
      }
    }
    for (const q of C.QUESTS) for (const r of q.rewards) if (r.pets) for (const id of r.pets) expect(petIds.has(id)).toBe(true);
    const eggQuests = C.QUESTS.filter((q) => q.rewards.some((r) => r.kind === 'egg')).map((q) => q.num);
    expect(eggQuests.length).toBeGreaterThanOrEqual(8);
    expect(eggQuests.length).toBeLessThanOrEqual(12);
    expect(Math.min(...eggQuests)).toBeLessThan(25);
    expect(Math.max(...eggQuests)).toBeGreaterThan(75);
    expect(C.CHEST.big.some((r) => r.kind === 'egg')).toBe(true);
  });
});

describe('content: quests and points', () => {
  it('numbers quests 1..100 and every quest pays something', () => {
    C.QUESTS.forEach((q, i) => {
      expect(q.num).toBe(i + 1);
      expect(q.id).toBe(`q${i + 1}`);
      expect(q.rewards.length).toBeGreaterThan(0);
      expect(q.goal.n).toBeGreaterThan(0);
    });
  });

  it('class points cover the class tree plus every spell at max', () => {
    const need = Math.max(...CLASSES.map((c) => c.tree.length)) * MAX_RANK + C.SPELLS.reduce((a, s) => a + s.max, 0);
    expect(sum(C.QUESTS.flatMap((q) => q.rewards), 'classPt')).toBeGreaterThanOrEqual(need);
  });

  it('form points cover the largest form tree', () => {
    const need = Math.max(...C.FORM_TREES.map((t) => t.nodes.reduce((a, n) => a + n.max, 0)));
    expect(sum(C.QUESTS.flatMap((q) => q.rewards), 'formPt')).toBeGreaterThanOrEqual(need);
  });

  it('endless quests are deterministic, growing, and keep paying class and form points', () => {
    expect(C.endlessQuest(150)).toEqual(C.endlessQuest(150));
    expect(C.endlessQuest(101).id).toBe('q101');
    const stageGoals = Array.from({ length: 200 }, (_, i) => C.endlessQuest(101 + i)).filter((q) => q.goal.kind === 'stage');
    for (let i = 1; i < stageGoals.length; i++) expect(stageGoals[i].goal.n).toBeGreaterThan(stageGoals[i - 1].goal.n);
    expect(stageGoals[0].goal.n).toBeGreaterThan(600);
    const lap = Array.from({ length: 40 }, (_, i) => C.endlessQuest(101 + i).rewards).flat();
    expect(sum(lap, 'classPt')).toBeGreaterThan(0);
    expect(sum(lap, 'formPt')).toBeGreaterThan(0);
    const bosses = Array.from({ length: 100 }, (_, i) => C.endlessQuest(101 + i)).filter((q) => q.goal.kind === 'bosses');
    expect(bosses[bosses.length - 1].goal.n).toBeGreaterThan(bosses[0].goal.n);
  });

  it('every reward has a positive amount', () => {
    for (const r of allRewards()) expect(r.n).toBeGreaterThan(0);
  });
});

describe('content: the rest', () => {
  it('Named elements use all 6', () => {
    expect(new Set(C.NAMED_ELEMENTS).size).toBe(6);
    for (const el of C.NAMED_ELEMENTS) expect(ELEMENTS).toContain(el);
  });

  it('Named milestones rise by level', () => {
    for (const list of C.NAMED_MILESTONES) {
      for (let i = 1; i < list.length; i++) expect(list[i].level).toBeGreaterThanOrEqual(list[i - 1].level);
      expect(list.some((m) => m.level === 200)).toBe(true);
    }
  });

  it('achievements have 5 rising tiers', () => {
    for (const a of C.ACHIEVEMENTS) {
      expect(a.tiers).toHaveLength(5);
      for (let i = 1; i < 5; i++) expect(a.tiers[i]).toBeGreaterThan(a.tiers[i - 1]);
      expect(STAT_KEYS).toContain(a.stat);
    }
  });

  it('special foes live in real zones', () => {
    for (const f of C.SPECIAL_FOES) for (const z of f.lands) expect(z).toBeLessThan(ZONES.length);
  });

  it('fairy weights add to 100 and spells use the 6 slots sensibly', () => {
    expect(C.FAIRY_REWARDS.reduce((a, f) => a + f.weight, 0)).toBe(100);
    for (const s of C.SPELLS) {
      expect(s.max).toBeGreaterThan(0);
      expect(s.mana).toBeGreaterThan(0);
      expect(s.cooldown).toBeGreaterThan(0);
    }
  });
});
