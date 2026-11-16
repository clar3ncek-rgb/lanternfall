// Every race x class x faith (5 x 5 x 6 = 150) from a new game, 12 sim minutes each, same seed and taps.
// Free (plain code). Run: npx vitest run --config vitest.matrix.config.ts
// Clarence's rule (11 Nov): race, faith and transformation must help every class equally. So, inside each class,
// every race and every faith should land near the class median. Flags setups more than 20% off it.
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import * as G from '../src/rules/game';
import { CLASSES, FAITHS, RACES } from '../src/rules/data';
import { play, T0 } from '../tests/helpers';

const MINUTES = 12;
const SEED = 17;
const OFF = 0.2;

function tidy(s: G.State) {
  while (s.pending.length) G.choose(s, s.pending[0].choices[0]);
  while (true) { const [h, n] = G.questProgress(s); if (h < n || !G.claimQuest(s)) break; }
  for (const id of ['lantern-strike', 'ferrymans-toll', 'grave-sight', 'call-the-named', 'bell-frenzy', 'echo-hands']) G.learnSpell(s, id);
  G.salvageWorse(s);
  while (G.trainPerksWaiting(s) > 0) G.chooseTrainPerk(s, s.trainPerks.length % 2 ? 'crit' : 'tap');
}

it('race x class x faith matrix', () => {
  const rows: { cls: string; race: string; faith: string; stage: number; gold: number }[] = [];
  for (const c of CLASSES) for (const r of RACES) for (const f of FAITHS) {
    const s = G.newGame({ name: 'Sim', race: r.id, cls: c.id, faith: f.id, form: 'mortal' }, SEED, T0);
    for (let m = 0; m < MINUTES; m++) { play(s, 60, 5, 0.25, c.id === 'rogue' ? { aim: 0.8 } : {}); tidy(s); }
    rows.push({ cls: c.id, race: r.id, faith: f.id, stage: s.life.stage, gold: s.life.gold });
  }
  const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2; };
  const out: string[] = [`# Race x class x faith matrix (${MINUTES} sim minutes from a new game, seed ${SEED})`, ''];
  const flags: string[] = [];
  for (const c of CLASSES) {
    const mine = rows.filter((x) => x.cls === c.id);
    const m = med(mine.map((x) => x.stage));
    out.push(`## ${c.name} (median stage ${m})`, '', `| Race \\ Faith | ${FAITHS.map((f) => f.name).join(' | ')} |`, `|---|${FAITHS.map(() => '---').join('|')}|`);
    for (const r of RACES) out.push(`| ${r.name} | ${FAITHS.map((f) => { const x = mine.find((y) => y.race === r.id && y.faith === f.id)!; const bad = Math.abs(x.stage - m) > OFF * m; if (bad) flags.push(`${c.name} ${r.name} ${f.name}: stage ${x.stage} vs class median ${m}`); return bad ? `**${x.stage}**` : String(x.stage); }).join(' | ')} |`);
    const byRace = RACES.map((r) => `${r.name} ${med(mine.filter((x) => x.race === r.id).map((x) => x.stage))}`).join(', ');
    const byFaith = FAITHS.map((f) => `${f.name} ${med(mine.filter((x) => x.faith === f.id).map((x) => x.stage))}`).join(', ');
    out.push('', `Race medians: ${byRace}`, `Faith medians: ${byFaith}`, '');
  }
  const classMed = CLASSES.map((c) => `${c.name} ${med(rows.filter((x) => x.cls === c.id).map((x) => x.stage))}`).join(', ');
  out.push('## Summary', '', `Class medians: ${classMed}`, '', flags.length ? `**${flags.length} setups more than ${OFF * 100}% off their class median:**` : `No setup is more than ${OFF * 100}% off its class median.`, ...flags.map((f) => `- ${f}`));
  writeFileSync('samples/sim/matrix.md', out.join('\n'));
  console.log(out.slice(-flags.length - 4).join('\n'));
}, 3_600_000);
