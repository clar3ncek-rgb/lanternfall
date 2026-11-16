// Run 6 (Codex point 2): each class weapons set measured alone. One snapshot per class and seed, cloned into control and
// treatment; both wear the same pieces, but in the control the set's bonus is switched off (stats only), so only the bonus differs.
// Same 2 minutes on a training dummy (a boss that never dies), same taps; the damage meter compares total damage dealt. Gate: each class median +15 to +35 %, spread at most 10 points.
import { expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { play, T0, type Policy } from '../tests/helpers';

const CLASS_IDS = ['warrior', 'mage', 'rogue', 'ranger', 'cleric'];
const SEEDS = [5, 23, 41];
const BAND: [number, number] = [15, 35];
const SPREAD = 10;

function tidy(s: G.State) {
  while (s.pending.length) G.choose(s, s.pending[0].choices[0]);
  while (true) { const [h, n] = G.questProgress(s); if (h < n || !G.claimQuest(s)) break; }
  for (const id of ['lantern-strike', 'ferrymans-toll', 'grave-sight', 'call-the-named', 'bell-frenzy', 'echo-hands']) G.learnSpell(s, id);
  G.salvageWorse(s);
  while (G.trainPerksWaiting(s) > 0) G.chooseTrainPerk(s, s.trainPerks.length % 2 ? 'crit' : 'tap');
}

function measure(snap: string, cls: string, on: boolean, type = 'weapons'): number {
  const s = G.deserialize(snap);
  const def = G.setById(`${cls}-${type}`)!;
  s.bag = []; // a full bag blocks swapping gear (both arms alike)
  const pieces = def.pieces.map((_, i) => {
    const it = G.makeSetPiece(s, def.id, i, s.life.stage, 0, () => 0.5); // same rolls in both arms
    if (!on) it.cls = 'none'; // control: stats only
    s.bag.push(it);
    const pair = G.fitsSlots(it);
    const slot = pair.length > 1 && s.equipped[pair[0]]?.set === def.id ? pair[1] : pair[0];
    if (!G.equip(s, it.id, slot)) throw new Error(`could not wear ${it.name}`);
    return [it, slot] as const;
  });
  // the bot wears better drops as they come; put the set back on each second (both arms alike)
  const rewear = () => { for (const [it, slot] of pieces) if (s.equipped[slot] !== it && s.bag.includes(it)) { if (s.bag.length >= 40) s.bag.splice(0, 1); G.equip(s, it.id, slot); } };
  if (!on) for (const it of Object.values(s.equipped)) if (it?.set === def.id) it.cls = 'none';
  const policy: Policy = { ...(cls === 'rogue' ? { aim: 0.8 } : {}), noGear: true }; // the bot leaves gear alone while measuring
  // a training dummy: a boss that never dies and never runs out of clock (same land, so no element luck between arms)
  const dummy = () => { s.life.foe = { name: 'Dummy', hp: B.big(1e300), max: B.big(1e300), boss: true } as G.Foe; s.life.bossLeft = 999; };
  dummy();
  G.dmgMeter.v = B.ZERO; G.dmgMeter.on = true;
  for (let k = 0; k < 120; k++) { while (s.pending.length) G.choose(s, s.pending[0].choices[0]); play(s, 1, 5, 0.25, policy); rewear(); s.life.bossLeft = 999; if (!s.life.foe.boss || s.life.foe.name !== 'Dummy') dummy(); }
  G.dmgMeter.on = false;
  return G.dmgMeter.v;
}

it('run 6: class weapons sets, paired', () => {
  const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2; };
  const per: Record<string, number> = {};
  const extra: string[] = [];
  for (const cls of CLASS_IDS) {
    const gains: number[] = [];
    for (const seed of SEEDS) {
      const s = G.newGame({ name: 'Sim', race: 'human', cls, faith: 'lantern', form: 'mortal' }, seed, T0);
      for (let m = 0; m < 12; m++) { play(s, 60, 5, 0.25, cls === 'rogue' ? { aim: 0.8 } : {}); tidy(s); }
      const snap = G.serialize(s);
      const g = (type: string) => (Math.pow(10, measure(snap, cls, true, type) - measure(snap, cls, false, type)) - 1) * 100;
      const gain = g('weapons');
      gains.push(gain);
      const acc = g('accessories'); const arm = g('armour');
      console.log(`  ${cls} seed ${seed} (stage ${s.life.stage}): weapons +${gain.toFixed(1)}%, accessories +${acc.toFixed(1)}%, armour +${arm.toFixed(1)}% (damage only; gold and Vigil sets show 0)`);
      if (acc > BAND[1] || arm > BAND[1]) extra.push(`${cls} seed ${seed}: accessories +${acc.toFixed(0)}%, armour +${arm.toFixed(0)}%`);
    }
    per[cls] = med(gains);
  }
  const vals = Object.values(per);
  console.log(`  class weapons set, median gain: ${CLASS_IDS.map((c) => `${c} +${per[c].toFixed(1)}%`).join(', ')}; spread ${(Math.max(...vals) - Math.min(...vals)).toFixed(1)} points`);
  const bad = CLASS_IDS.filter((c) => per[c] < BAND[0] || per[c] > BAND[1]);
  expect(bad, `outside +${BAND[0]} to +${BAND[1]}%`).toEqual([]);
  expect(Math.max(...vals) - Math.min(...vals)).toBeLessThanOrEqual(SPREAD);
  expect(extra, 'no accessories or armour set above the weapons band').toEqual([]);
}, 1_800_000);
