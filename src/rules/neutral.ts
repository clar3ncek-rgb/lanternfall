// Run 5 (Clarence, 11 Nov 2026): "race, faith, transformation must equally buff all class, so users won't be skewed to always
// picking a certain set up". Classes each have their own way to deal damage (taps, spells, the Named, auto-arrows, prayer), so
// anything race, faith or transformation gives must reach every source the same way. This module converts the race and
// transformation trees and the transformation ultimates at load time: tap-only, Named-only, crit-only and spell-only bonuses
// become "all damage" (dmgPct, applied to every source in foeMods) of about the same worth; tap-triggered rules become
// time-triggered ones. Neutral stats (boss time, gold, Embers, loot, bosses, normal foes, piercing...) are left as they are.
import { STAT_LABEL, type ActiveKind, type StatKey } from './data';
import type { Effect, TreeDef } from './content-types';
import type { Ultimate } from './tiers-content';

/** Stats that favour one class's damage source, and how much "all damage" one point is worth. */
export const SKEWED: Partial<Record<StatKey, number>> = {
  tapPct: 0.5, allyPct: 0.5, skillPct: 0.5, petPct: 0.5, critDmg: 0.25, critChance: 1.5, weapon: 1,
  autoTap: 10, manaRegen: 10, manaMax: 0.34, cooldownPct: 0.5, durationSec: 2, str: 1, agi: 1, int: 1, spi: 1,
};
/** Stats a race, faith or transformation may give (checked by a test). */
export const NEUTRAL_OK = new Set<StatKey>([
  'dmgPct', 'bossPct', 'normalPct', 'timerSec', 'goldPct', 'bossGoldPct', 'treasureGoldPct', 'emberPct', 'lootLuck', 'xpPct',
  'markPct', 'fairyRate', 'treasureRate', 'wanderRate', 'overkillPct', 'offlinePct', 'dungeonSec', 'sta',
  'physPct', 'magicPct', 'firePct', 'coldPct', 'lightPct', 'poisonPct',
  'piercePhys', 'pierceMagic', 'pierceFire', 'pierceCold', 'pierceLight', 'piercePoison', 'pierceAll',
]);
const SKEWED_BUFFS: ActiveKind[] = ['tapBuff', 'allyBuff', 'critBuff', 'autoTap', 'dot', 'burst'];
const round = (x: number) => Math.round(x * 100) / 100;

/** Returns the converted effect and new text, or null if it was already neutral. */
export function neutralEffect(e: Effect): { effect: Effect; text: string } | null {
  if (e.rule) {
    const r = e.rule;
    if (r.kind === 'nthTap') {
      // every n taps (about n/5 s) for b taps of damage -> every n/5 s for b/5 s of all your damage
      const a = Math.max(5, Math.round(r.a / 5)), b = round((r.b ?? 20) / 5), perB = round((r.perB ?? 0) / 5);
      return { effect: { rule: { kind: 'fallingStar', a, b, perB } }, text: `Every ${a} s, a strike worth ${b} s of all your damage${perB ? ` (+${perB} s per rank)` : ''}.` };
    }
    if (r.kind === 'bleed' || r.kind === 'critSplash' || r.kind === 'tapCleave') {
      return { effect: { rule: { kind: 'bossRamp', a: 1, perA: 0.5, b: 40 } }, text: 'Bosses take +1% damage from every source for each second they live (+0.5% per rank, up to 40%).' };
    }
    if (r.kind === 'cooldownCut') return { effect: { stat: 'dmgPct', per: round(r.a), perA: undefined } as Effect, text: `+${round(r.a)}% damage from every source per rank.` };
    if (r.kind === 'namedDouble') return { effect: { stat: 'dmgPct', per: round(r.a / 2) }, text: `+${round(r.a / 2)}% damage from every source.` };
    if (r.kind === 'autoCast' && r.active && SKEWED_BUFFS.includes(r.active)) {
      const mag = round(r.active === 'critBuff' ? (r.b ?? 20) / 100 : r.active === 'autoTap' ? (r.b ?? 4) / 10 : (r.b ?? 1) / 3);
      const perB = r.perB ? round(r.perB / 3) : undefined;
      return { effect: { rule: { ...r, active: 'dmgBuff', b: mag, perB } }, text: `Every ${r.a} s: +${Math.round(mag * 100)}% damage from every source for ${r.dur ?? 10} s${perB ? ', stronger per rank' : ''}.` };
    }
    return null;
  }
  let pct = 0;
  const keep: Effect = { ...e };
  for (const [sk, pk] of [['stat', 'per'], ['stat2', 'per2']] as const) {
    const stat = e[sk] as StatKey | undefined;
    if (!stat || NEUTRAL_OK.has(stat)) continue;
    const w = SKEWED[stat];
    if (w === undefined) continue;
    pct += (e[pk] ?? 0) * w;
    delete keep[sk]; delete keep[pk];
  }
  if (!pct) return null;
  // put the all-damage part in the first free slot
  const out: Effect = keep.stat ? { ...keep, stat2: 'dmgPct', per2: round(pct) } : { ...keep, stat: 'dmgPct', per: round(pct) };
  if (!out.stat && out.stat2) { out.stat = out.stat2; out.per = out.per2; delete out.stat2; delete out.per2; }
  const parts = [`+${round(pct)}% damage from every source`];
  if (keep.stat) { const lab = STAT_LABEL[keep.stat as StatKey] ?? keep.stat; parts.unshift(`${keep.per! > 0 ? '+' : ''}${keep.per}${lab.startsWith('%') || lab.startsWith('s ') ? '' : ' '}${lab}`); }
  return { effect: out, text: `${parts.join(' and ')}.` };
}

export function neutralizeTree(t: TreeDef): void {
  for (const n of t.nodes) {
    const c = neutralEffect(n.effect);
    if (c) { n.effect = c.effect; n.text = c.text; }
  }
}
export function neutralizeUltimate(u: Ultimate): void {
  if (!SKEWED_BUFFS.includes(u.active)) return;
  u.active = 'dmgBuff';
  u.r = Math.max(1, Math.round(u.r * 0.4)); // about a third of the old one-source effect, on every source
  u.text = `${u.text.split('.')[0]}. All your damage, from every source, is raised while it lasts.`;
}
