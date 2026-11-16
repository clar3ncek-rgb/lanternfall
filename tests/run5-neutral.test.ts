import { describe, expect, it } from 'vitest';
import { FAITHS, FORMS, RACES, type StatKey } from '../src/rules/data';
import { FORM_TREES, RACE_TREES } from '../src/rules/content';
import { FORM_EXTRA } from '../src/rules/tiers-content';
import { NEUTRAL_OK } from '../src/rules/neutral';
import type { Effect } from '../src/rules/content-types';

// Clarence, 11 Nov 2026: "race, faith, transformation must equally buff all class, so users won't be skewed to always picking a
// certain set up". Each class deals its damage its own way, so these may only give things every class gets the same from.
const SKEWED_RULES = ['nthTap', 'bleed', 'critSplash', 'tapCleave', 'namedDouble', 'cooldownCut'];
const SKEWED_ACTIVES = ['tapBuff', 'allyBuff', 'critBuff', 'autoTap', 'dot', 'burst'];
function check(e: Effect, where: string) {
  for (const k of [e.stat, e.stat2]) if (k) expect(NEUTRAL_OK.has(k as StatKey), `${where}: ${k}`).toBe(true);
  if (e.rule) {
    expect(SKEWED_RULES, `${where}: rule ${e.rule.kind}`).not.toContain(e.rule.kind);
    if (e.rule.active) expect(SKEWED_ACTIVES, `${where}: buff ${e.rule.active}`).not.toContain(e.rule.active);
  }
}

describe('run 5: race, faith and transformation help every class the same', () => {
  it('every race starts with the same attributes', () => {
    for (const r of RACES) expect(r.attrs).toEqual(RACES[0].attrs);
  });
  it('faith and transformation base stats are class-neutral', () => {
    for (const f of FAITHS) for (const k of Object.keys(f.stats)) expect(NEUTRAL_OK.has(k as StatKey), `${f.id}: ${k}`).toBe(true);
    for (const f of FORMS) for (const k of Object.keys(f.stats)) expect(NEUTRAL_OK.has(k as StatKey), `${f.id}: ${k}`).toBe(true);
  });
  it('race and transformation tree nodes are class-neutral', () => {
    for (const t of [...RACE_TREES, ...FORM_TREES]) for (const n of t.nodes) check(n.effect, `${t.id}/${n.name}`);
    for (const [id, fx] of Object.entries(FORM_EXTRA)) for (const n of fx.nodes) check(n.effect, `${id}/${n.name}`);
  });
  it('transformation ultimates lift every source', () => {
    for (const [id, fx] of Object.entries(FORM_EXTRA)) expect(SKEWED_ACTIVES, `${id}: ${fx.ultimate.active}`).not.toContain(fx.ultimate.active);
  });
});
