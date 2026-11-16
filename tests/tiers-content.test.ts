import { describe, expect, it } from 'vitest';
import { BASE_TITLE, FORM_EXTRA, SUBCLASS_EXTRA } from '../src/rules/tiers-content';
import type { TierNode, Ultimate } from '../src/rules/tiers-content';
import { ACTIVE_HELP, CLASSES, FORMS, STAT_LABEL } from '../src/rules/data';

const formKey = (id: string) => (id === 'mortal' ? 'mastery' : id);

const allNodes = (): { owner: string; n: TierNode }[] => [
  ...Object.entries(SUBCLASS_EXTRA).flatMap(([owner, x]) => x.nodes.map((n) => ({ owner, n }))),
  ...Object.entries(FORM_EXTRA).flatMap(([owner, x]) => x.nodes.map((n) => ({ owner, n }))),
];
const allUlts = (): Ultimate[] => [...Object.values(SUBCLASS_EXTRA), ...Object.values(FORM_EXTRA)].map((x) => x.ultimate);

describe('tier content', () => {
  it('every class branch has 2 nodes (tiers 5, 6) and 6 titles', () => {
    for (const c of CLASSES) {
      expect(BASE_TITLE[c.id], c.id).toBeTruthy();
      for (const b of c.branches) {
        const x = SUBCLASS_EXTRA[`${c.id}:${b}`];
        expect(x, `${c.id}:${b}`).toBeDefined();
        expect(x.nodes.map((n) => n.tier)).toEqual([5, 6]);
        expect(x.nodes.map((n) => n.id)).toEqual([`${c.id}-${b.toLowerCase()}-t5`, `${c.id}-${b.toLowerCase()}-t6`]);
        expect(x.titles).toHaveLength(6);
      }
    }
    expect(Object.keys(SUBCLASS_EXTRA)).toHaveLength(CLASSES.reduce((s, c) => s + c.branches.length, 0));
  });

  it('every form (mortal = mastery) has 3 nodes (tiers 4-6) and 7 titles', () => {
    for (const f of FORMS) {
      const id = formKey(f.id);
      const x = FORM_EXTRA[id];
      expect(x, id).toBeDefined();
      expect(x.nodes.map((n) => n.tier)).toEqual([4, 5, 6]);
      expect(x.nodes.map((n) => n.id)).toEqual([`${id}-t4`, `${id}-t5`, `${id}-t6`]);
      expect(x.titles).toHaveLength(7);
    }
    expect(Object.keys(FORM_EXTRA)).toHaveLength(FORMS.length);
  });

  it('ids are unique', () => {
    const ids = [...allNodes().map((x) => x.n.id), ...allUlts().map((u) => u.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every effect has a valid stat or a rule, and 5 ranks', () => {
    for (const { n } of allNodes()) {
      expect(n.effect.stat !== undefined || n.effect.rule !== undefined, n.id).toBe(true);
      if (n.effect.stat) { expect(STAT_LABEL[n.effect.stat], n.id).toBeDefined(); expect(typeof n.effect.per, n.id).toBe('number'); }
      if (n.effect.stat2) { expect(STAT_LABEL[n.effect.stat2], n.id).toBeDefined(); expect(typeof n.effect.per2, n.id).toBe('number'); }
      expect(n.max).toBe(5);
      expect(n.text.length).toBeGreaterThan(0);
    }
  });

  it('only the Berserker uses overkillPct', () => {
    for (const { owner, n } of allNodes()) {
      const uses = n.effect.stat === 'overkillPct' || n.effect.stat2 === 'overkillPct';
      if (uses) expect(owner, n.id).toBe('warrior:Berserker');
    }
  });

  it('form nodes never add their weakness stat back', () => {
    for (const f of FORMS) {
      const weak = Object.entries(f.stats).filter(([, v]) => (v ?? 0) < 0).map(([k]) => k);
      for (const n of FORM_EXTRA[formKey(f.id)].nodes) {
        expect(weak, n.id).not.toContain(n.effect.stat);
        expect(weak, n.id).not.toContain(n.effect.stat2);
      }
    }
  });

  it('ultimates are big, slow and use a known ActiveKind', () => {
    for (const u of allUlts()) {
      expect(u.r, u.id).toBeGreaterThanOrEqual(u.active === 'dmgBuff' ? 3 : 8); // run 5: form ultimates lift every source, so they are scaled down
      expect(u.r, u.id).toBeLessThanOrEqual(15);
      expect(u.mana).toBeGreaterThanOrEqual(60);
      expect(u.mana).toBeLessThanOrEqual(100);
      expect(u.cooldown).toBeGreaterThanOrEqual(120);
      expect(u.cooldown).toBeLessThanOrEqual(300);
      expect(ACTIVE_HELP[u.active], u.id).toBeDefined();
    }
  });
});
