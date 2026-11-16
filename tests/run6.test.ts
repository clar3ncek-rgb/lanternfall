import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { SETS } from '../src/rules/content';
import { CLASSES } from '../src/rules/data';
import { T0 } from './helpers';

function hero(cls: string, seed = 42) {
  const s = G.newGame({ name: 'T', race: 'human', cls, faith: 'lantern', form: 'mortal' }, seed, T0);
  s.life.stage = s.life.maxStage = s.bestStage = 150;
  s.life.foe = { name: 'Target', hp: B.big(1e40), max: B.big(1e40), boss: false };
  return s;
}
const wearSet = (s: G.State, id: string) => {
  const def = G.setById(id)!;
  def.pieces.forEach((_, i) => { const it = G.makeSetPiece(s, id, i, 150); s.bag.push(it); G.equip(s, it.id); });
};
const stashSet = (s: G.State, id: string) => {
  const def = G.setById(id)!;
  def.pieces.forEach((_, i) => { const it = G.makeSetPiece(s, id, i, 150); s.bag.push(it); expect(G.stashPut(s, it.id)).toBe(true); });
};
const realm = SETS.filter((x) => !x.cls);

describe('run 6: class gear', () => {
  it('there is one class weapons set per class', () => {
    for (const c of ['warrior', 'mage', 'rogue', 'ranger', 'cleric']) expect(SETS.some((x) => x.id === `${c}-weapons` && x.cls === c)).toBe(true);
  });
  it('class pieces roll stats and looks for their own class, not the wearer', () => {
    const s = hero('mage');
    const it = G.makeSetPiece(s, 'warrior-weapons', 0, 150);
    expect(it.cls).toBe('warrior');
    expect(it.stats.str).toBeGreaterThan(0);
    expect(it.look).toBe(CLASSES.find((c) => c.id === 'warrior')!.weapon);
  });
  it('off-class set: stats count, bonus does not; Reshape wakes it', () => {
    const s = hero('mage');
    s.gems = 100;
    wearSet(s, 'ranger-weapons');
    expect(G.setsComplete(s).some((d) => d.id === 'ranger-weapons')).toBe(false);
    expect(G.totalStats(s).weapon ?? 0).toBeGreaterThan(0);
    expect(G.derive(s).autoTap).toBe(0);
    expect(G.reshape(s, 'cls', 'ranger')).toBe(true);
    expect(G.setsComplete(s).some((d) => d.id === 'ranger-weapons')).toBe(true);
    expect(G.derive(s).autoTap).toBe(G.RANGER_AUTO + 1);
  });
  it('a dungeon clear: about half class pieces, about 70% of those for your class; realm drops keep the main stream', () => {
    const s = hero('warrior');
    let cls = 0; let own = 0;
    for (let i = 0; i < 2000; i++) { const it = G.classDrop(s); if (it) { cls++; if (it.cls === 'warrior') own++; } }
    expect(cls / 2000).toBeGreaterThan(0.45); expect(cls / 2000).toBeLessThan(0.55);
    expect(own / cls).toBeGreaterThan(0.64); expect(own / cls).toBeLessThan(0.76);
    const a = hero('warrior', 7); const b = hero('warrior', 7);
    for (let i = 0; i < 50; i++) G.classDrop(b);
    expect(G.rand(a)).toBe(G.rand(b)); // the gear stream never touches the main one
  });
  it('class rules: Fury, Surge, deeper combo, marking arrows, deeper Prayer', () => {
    const r = hero('ranger'); wearSet(r, 'ranger-weapons'); expect(G.derive(r).autoTap).toBe(G.RANGER_AUTO + 1);
    const c = hero('cleric'); wearSet(c, 'cleric-weapons'); expect(G.prayerMax(G.derive(c))).toBe(G.PRAYER_MAX + 80);
    for (let i = 0; i < 200; i++) G.tap(c);
    expect(c.life.prayer).toBe(G.PRAYER_MAX + 80);
    const w = hero('warrior'); wearSet(w, 'warrior-weapons');
    for (let i = 0; i < 26; i++) G.tap(w);
    expect(w.life.surgeT).toBe(6);
    const m = hero('mage'); wearSet(m, 'mage-weapons'); m.life.mana = 999;
    expect(G.useSkill(m, 'lantern-strike')).toBe(true);
    expect(m.life.surgeT).toBe(12);
    const o = hero('rogue'); wearSet(o, 'rogue-weapons'); expect(G.comboMax(G.derive(o))).toBe(G.COMBO_MAX + 4);
  });
});

describe('run 6: the Stash', () => {
  it('only complete sets count; worn pieces do not; 1% of worn gear stats per set', () => {
    const s = hero('warrior');
    const def = realm[0];
    const it = G.makeSetPiece(s, def.id, 0, 150); s.bag.push(it); G.stashPut(s, it.id);
    expect(G.stashSets(s)).toHaveLength(0);
    const w = G.makeItem(s, 150, 'epic', 'mainHand'); s.bag.push(w); G.equip(s, w.id);
    const before = G.totalStats(s).weapon ?? 0;
    stashSet(s, def.id);
    expect(G.stashSets(s).map((d) => d.id)).toEqual([def.id]);
    const after = G.totalStats(s).weapon ?? 0;
    expect(after / before).toBeCloseTo(1.02, 3);
  });
  it('at most 10 sets count', () => {
    const s = hero('warrior');
    for (const d of [...realm.filter((x) => x.type !== 'armour'), realm.find((x) => x.type === 'armour')!]) stashSet(s, d.id);
    expect(G.stashSets(s)).toHaveLength(G.STASH_SETS_MAX);
  });
  it('rules come in small: a stashed Ranger set gives +0.2 arrows, only to a Ranger', () => {
    const r = hero('ranger'); stashSet(r, 'ranger-weapons');
    expect(G.derive(r).autoTap).toBeCloseTo(G.RANGER_AUTO + 0.2, 5);
    const m = hero('mage'); stashSet(m, 'ranger-weapons');
    expect(G.derive(m).autoTap).toBe(0);
  });
  it('no moves in a dungeon or escape; merging finds stashed copies; save round-trip; old saves start empty', () => {
    const s = hero('warrior');
    const def = realm[0];
    const a = G.makeSetPiece(s, def.id, 0, 150); s.bag.push(a);
    s.dungeon = { realm: 'ash' } as unknown as G.State['dungeon'];
    expect(G.stashPut(s, a.id)).toBe(false);
    s.dungeon = null;
    expect(G.stashPut(s, a.id)).toBe(true);
    const b = G.makeSetPiece(s, def.id, 0, 150); s.bag.push(b);
    expect(G.merge(s, b.id)).toBe(true);
    expect(s.stash![0].plus).toBe(1);
    const back = G.deserialize(G.serialize(s));
    expect(back.stash).toHaveLength(1);
    const old = JSON.parse(G.serialize(hero('mage')));
    delete old.stash;
    expect(G.deserialize(JSON.stringify(old)).stash ?? []).toHaveLength(0);
  });
});

describe('run 6: class items and chase items', () => {
  it('3 sets, 2 legendaries and 1 artifact per class; 26 chase items, 2 per land', async () => {
    const { CLASS_ITEMS, CHASE } = await import('../src/rules/run6-content');
    for (const c of ['warrior', 'mage', 'rogue', 'ranger', 'cleric']) {
      expect(SETS.filter((x) => x.cls === c)).toHaveLength(3);
      expect(CLASS_ITEMS.filter((x) => x.cls === c && x.kind === 'legendary')).toHaveLength(2);
      expect(CLASS_ITEMS.filter((x) => x.cls === c && x.kind === 'artifact')).toHaveLength(1);
    }
    expect(CHASE).toHaveLength(26);
    for (let l = 0; l < 13; l++) expect(CHASE.filter((x) => x.land === l)).toHaveLength(2);
  });
  it('a class legendary works only for its class', () => {
    const w = hero('warrior');
    const it = G.makeClassItem(w, 'bellbreaker', 150); w.bag.push(it); G.equip(w, it.id);
    expect(G.derive(w).rules.has('strikePlus')).toBe(true);
    const m = hero('mage');
    const it2 = G.makeClassItem(m, 'bellbreaker', 150); m.bag.push(it2); G.equip(m, it2.id);
    expect(G.derive(m).rules.has('strikePlus')).toBe(false);
  });
  it('Ash Censer raises Prayer max; Silent String silences taps but speeds arrows', () => {
    const c = hero('cleric'); const a = G.makeClassItem(c, 'ash-censer', 150); c.bag.push(a); G.equip(c, a.id);
    expect(G.prayerMax(G.derive(c))).toBe(G.PRAYER_MAX + 100);
    const r = hero('ranger'); const b = G.makeClassItem(r, 'silent-string', 150); r.bag.push(b); G.equip(r, b.id);
    expect(G.derive(r).autoTap).toBeCloseTo(G.RANGER_AUTO * 1.5, 5);
    expect(B.isZero(G.tap(r).dmg)).toBe(true);
  });
  it('chase drops: only from that land, about 1 in 40, on their own stream; collection and gems', () => {
    const s = hero('warrior');
    s.gems = 0;
    let n = 0;
    for (let i = 0; i < 4000 && (s.chaseFound?.length ?? 0) < 2; i++) if (G.chaseDrop(s, 30)) n++;
    expect(s.chaseFound!.sort()).toEqual(['crow-mantle', 'root-mothers-ring']);
    const a = hero('warrior', 9); const b = hero('warrior', 9);
    for (let i = 0; i < 200; i++) G.chaseDrop(b, 30);
    expect(G.rand(a)).toBe(G.rand(b));
    const t = hero('warrior', 3); let hits = 0;
    t.chaseFound = []; const before = { ...t };
    for (let i = 0; i < 4000; i++) { t.chaseFound = []; if (G.chaseDrop(t, 30)) hits++; }
    expect(hits / 4000).toBeGreaterThan(0.015); expect(hits / 4000).toBeLessThan(0.04);
    void before; void n;
  });
  it('a dungeon clear sometimes gives a class legendary or artifact', () => {
    const s = hero('rogue');
    let items = 0;
    for (let i = 0; i < 1200; i++) { const it = G.classDrop(s); if (it && !it.set) items++; }
    expect(items / 1200).toBeGreaterThan(0.05); expect(items / 1200).toBeLessThan(0.12);
  });
});

describe('run 6: judge gear by a focus', () => {
  it('the focus decides better or worse, and auto-salvage follows it', () => {
    const s = hero('warrior');
    const c = { tap: 0.1, ally: -0.05, timer: 0, gold: -0.02 };
    expect(G.judge(s, c)).toBe('mixed');
    s.gearFocus = 'tap'; expect(G.judge(s, c)).toBe('better');
    s.gearFocus = 'named'; expect(G.judge(s, c)).toBe('worse');
    s.gearFocus = 'utility'; expect(G.judge(s, c)).toBe('worse');
    expect(G.judge(s, { tap: 0, ally: 0, timer: 2, gold: 0 })).toBe('better');
  });
});

describe('run 6: quest 2 per class, race and faith moments', () => {
  it('quest 2 asks each class for its own loop, and restarts after a Reshape', () => {
    const w = hero('warrior');
    expect(G.questDef(2, 'warrior').goal.kind).toBe('rageStrikes');
    expect(G.questDef(2, 'cleric').goal.kind).toBe('prayerSec');
    expect(G.questDef(2).goal.kind).toBe('taps');
    w.quest = { num: 2, base: 0 };
    w.counts.rageStrikes = 4;
    expect(G.questProgress(w)[0]).toBe(0); // starts for this class now
    w.counts.rageStrikes = 7;
    expect(G.questProgress(w)).toEqual([3, 10]);
  });
  it('a race or faith rule that fires is counted and told once a life', () => {
    const s = hero('mage');
    s.events = [];
    G.moment(s, 'troll', 'Troll: test');
    G.moment(s, 'troll', 'Troll: test');
    expect(s.life.moments!.troll).toBe(2);
    expect(s.events.filter((e) => e.includes('Troll: test'))).toHaveLength(1);
  });
});
