// Several Elliot (Codex) testers, a few at a time. Serves dist on 5196 itself. No API credits.
// node scripts/ai/elliot/batch.mjs --set classes   (one per class, new game, mixed races and faiths)
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const PERSONAS = {
  careless: 'A careless first-timer: you skim, tap whatever glows or looks big, never read long text, and get bored fast.',
  curious: 'A curious first-time player who found this game on itch.io and plays it on a phone.',
  casual: 'A casual idle-game fan on a bus: you play in short bursts, like seeing numbers grow, and want to know what to aim for next.',
  speedrun: 'A speed-runner and idle-game veteran: you want the fastest progress and notice wasted taps, slow menus and bad numbers.',
  breaker: 'A rule-breaker QA tester: you try odd things on purpose and report anything that breaks, overlaps, freezes or looks wrong.',
};
// one per class, each with a different race and faith (12 Nov: Clarence, "all permutations": the sim covers all 150, Elliot plays 5 for feel)
const RUNS = [
  ['warrior', 'Orc', 'Iron Testament', 'careless'],
  ['mage', 'Elf', 'Silent Archive', 'curious'],
  ['rogue', 'Human', 'Red Hunt', 'speedrun'],
  ['ranger', 'Dwarf', 'Lantern Covenant', 'casual'],
  ['cleric', 'Troll', 'Unbound', 'breaker'],
];
// run 8 (Clarence, 14 Nov): "all class x race permutations", on Luna and on Haiku. --set all25 --engine codex|haiku
const argv = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const ENGINE = argv('engine', 'codex');
const SET = argv('set', 'classes');
const RACE_NAMES = ['Human', 'Elf', 'Dwarf', 'Orc', 'Troll'];
const FAITH_NAMES = ['Lantern Covenant', 'Red Hunt', 'Silent Archive', 'Iron Testament', 'Veiled Balance', 'Unbound'];
const WHO = Object.keys(PERSONAS);
if (SET === 'all25') {
  RUNS.length = 0;
  ['warrior', 'mage', 'rogue', 'ranger', 'cleric'].forEach((cls, ci) => RACE_NAMES.forEach((race, ri) => RUNS.push([cls, race, FAITH_NAMES[(ci + ri) % 6], WHO[(ci * 2 + ri) % WHO.length]])));
}
const BASE = ENGINE === 'haiku' ? 5400 : 5300;
const TAG = SET === 'all25' ? `-${ENGINE}` : '';
const PAR = 3;
const note = (cls, race, faith) => ` This is a new game. When you create your character, pick the ${race} race, the ${cls[0].toUpperCase() + cls.slice(1)} class and the faith whose name contains "${faith}" (or the closest one). Play from the start. In your verdict say how your class played (what you did with your hands), whether your race and faith made any difference you noticed, and whether you would come back tomorrow.` +
  (SET === 'all25' ? ' Also answer: did the start feel overwhelming or calm (tabs open one at a time now)? Did item drops and skill points feel earned, too fast or too slow?' : '');

let up = false;
try { up = (await fetch('http://localhost:5196/')).ok; } catch { /* not running */ }
const server = up ? null : spawn('npx', ['vite', 'preview', '--port', '5196', '--strictPort'], { shell: true, stdio: 'ignore' });
for (let i = 0; i < 80; i++) { try { if ((await fetch('http://localhost:5196/')).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 250)); }
const one = ([cls, race, faith, who], i) => new Promise((res) => {
  const id = `elliot-${cls}-${race.toLowerCase()}${TAG}`;
  if (existsSync(`samples/playtest/elliot/${id}/report.md`)) return res(0);
  const c = spawn('node', ['scripts/ai/elliot/run.mjs', '--engine', ENGINE, '--id', id, '--port', String(BASE + (i % PAR)), '--steps', '120', '--persona', PERSONAS[who] + note(cls, race, faith)], { stdio: 'ignore' });
  c.on('exit', res);
});
for (let i = 0; i < RUNS.length; i += PAR) await Promise.all(RUNS.slice(i, i + PAR).map((r, k) => one(r, i + k)));
server?.kill();
const rows = RUNS.map(([cls, race]) => {
  const f = `samples/playtest/elliot/elliot-${cls}-${race.toLowerCase()}${TAG}/report.md`;
  if (!existsSync(f)) return `| ${cls} ${race} | (no report) |`;
  const v = readFileSync(f, 'utf8').split('\n').find((l) => /come back/i.test(l)) ?? '';
  return `| ${cls} ${race} | ${v.replace(/\|/g, '/').slice(0, 200)} |`;
});
writeFileSync(`samples/playtest/elliot/summary-${SET}${TAG}.md`, `# Elliot: ${SET} on ${ENGINE}\n\n| Tester | Verdict |\n|---|---|\n${rows.join('\n')}\n`);
console.log('ELLIOT BATCH DONE');
