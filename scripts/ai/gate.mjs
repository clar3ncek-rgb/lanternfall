// Run 2, item 18: the play-test gate. 15 AI first-timers (5 personas x 3), 180 steps each, 5 at a time.
// Serves dist on 5196 itself, then writes samples/playtest/gate/summary.md. Pass: at most 5 of 15 would not come back.
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';

const PERSONAS = {
  careless: 'A careless first-timer: you skim, tap whatever glows or looks big, never read long text, get bored fast, and quit mentally if nothing exciting happens in a minute.',
  curious: 'A curious first-time player who found this game on itch.io and plays it on a phone.',
  casual: 'A casual idle-game fan on a bus: you play in short bursts, like seeing numbers grow, read short tips, and want to know what to aim for next.',
  speedrun: 'A speed-runner and idle-game veteran: you want the fastest progress, look for the optimal upgrade every time, push stages hard, fall as soon as it pays, and notice wasted taps, slow menus and bad numbers.',
  breaker: 'A rule-breaker QA tester: you try odd things on purpose: rapid tapping on buttons, switching tabs mid-fight, holding everything, entering weird names, opening and closing the same tab fast, buying with no gold, and you report anything that breaks, overlaps, freezes or looks wrong.',
};
// --final: one each of careless, curious, casual and breaker on the finished build, into samples/playtest/gate-final
const FINAL = process.argv.includes('--final');
// run 3: --mid starts every tester from a stage-104 save and asks about the middle; --three runs only 3 testers (the smoke test)
const MID = process.argv.includes('--mid');
const THREE = process.argv.includes('--three');
// fix round: --retest re-runs only the 8 testers who said MAYBE or NO last time (from the stage-100 save), capped at $0.84 each to stay in the $50 cap
const RETEST = process.argv.includes('--retest');
// run 4: --r4 runs the 15 testers from the stage-100 save into gate-run4, and asks what they did between bosses
const R4 = process.argv.includes('--r4');
// --r4retest: after the fix round, 6 testers (the 'buy and wait' and weak-spot cases) into gate-run4-retest
const R4RE = process.argv.includes('--r4retest');
const R4RE_IDS = ['careless-1', 'careless-2', 'curious-3', 'casual-2', 'speedrun-2', 'breaker-2'];
// run 5: --r5 runs 15 testers from a NEW game, 3 per class (personas mixed across classes), into gate-run5
const R5 = process.argv.includes('--r5');
// --r5retest: after the fix round, the 4 who said no plus the two Mage cases, into gate-run5-retest
const R5RE = process.argv.includes('--r5retest');
const R5RE_IDS = [['warrior', 'careless'], ['rogue', 'careless'], ['cleric', 'careless'], ['rogue', 'speedrun'], ['mage', 'casual'], ['mage', 'breaker']];
const R5CLASSES = ['Warrior', 'Mage', 'Rogue', 'Ranger', 'Cleric'];
// run 6: --r6 runs 10 testers (2 per class) from a stage-200ish save with their class weapons set, two realm sets and one off-class piece in the bag
const R6 = process.argv.includes('--r6');
const R6NOTE = ' You are continuing a game that is already past stage 200. Your bag holds new gear: a set made for your class, two other complete sets, and one piece made for another class. Open the Gear tab, look at them, wear what helps, and try the Stash (Gear tab > Stash). In your verdict say in a few words: did wearing your class set change how you played; was the Stash clear; would you hunt for more class gear?';
const R5NOTE = (c) => ` When you create your character, pick the ${c} class (any race and faith you like). In your verdict, say in a few words how your class played: what you did with your hands, and whether it felt different from a plain tapping game.`;
const R4NOTE = ' In your verdict also say what you mostly did between bosses (in a few words), and which new things you tried.';
const RETEST_IDS = ['careless-1', 'careless-2', 'careless-3', 'curious-1', 'curious-2', 'curious-3', 'speedrun-3', 'breaker-1'];
const MIDNOTE = ' You are continuing a game that is already past stage 100. Note each time something NEW appears (a new land, a new boss, a boss with a special rule, an event), and say in your verdict whether the game started to feel repetitive again, and when.';
const DIR = R6 ? 'samples/playtest/gate-run6' : R5RE ? 'samples/playtest/gate-run5-retest' : R5 ? 'samples/playtest/gate-run5' : R4RE ? 'samples/playtest/gate-run4-retest' : R4 ? 'samples/playtest/gate-run4' : RETEST ? 'samples/playtest/gate-retest' : FINAL ? 'samples/playtest/gate-final' : MID ? (THREE ? 'samples/playtest/gate3-mid' : 'samples/playtest/gate-mid') : 'samples/playtest/gate';
const runs = [];
if (RETEST) for (const id of RETEST_IDS) runs.push({ id: `retest-${id}`, p: PERSONAS[id.split('-')[0]] + MIDNOTE });
else if (FINAL) for (const name of ['careless', 'curious', 'casual', 'breaker']) runs.push({ id: `final-${name}`, p: PERSONAS[name] });
else if (THREE) for (const name of ['careless', 'curious', 'breaker']) runs.push({ id: `mid3-${name}`, p: PERSONAS[name] + MIDNOTE });
else if (R6) R5CLASSES.forEach((c, i) => { for (const name of [Object.keys(PERSONAS)[i], Object.keys(PERSONAS)[(i + 2) % 5]]) runs.push({ id: `r6-${c.toLowerCase()}-${name}`, cls: c.toLowerCase(), p: PERSONAS[name] + R6NOTE }); });
else if (R5RE) for (const [c, n] of R5RE_IDS) runs.push({ id: `r5re-${c}-${n}`, p: PERSONAS[n] + R5NOTE(c[0].toUpperCase() + c.slice(1)) });
else if (R5) Object.entries(PERSONAS).forEach(([name, p], pi) => { for (let i = 0; i < 3; i++) { const c = R5CLASSES[(pi + i * 2) % 5]; runs.push({ id: `r5-${c.toLowerCase()}-${name}`, p: p + R5NOTE(c) }); } });
else if (R4RE) for (const id of R4RE_IDS) runs.push({ id: `r4re-${id}`, p: PERSONAS[id.split('-')[0]] + MIDNOTE + R4NOTE });
else if (R4) for (const [name, p] of Object.entries(PERSONAS)) for (let i = 1; i <= 3; i++) runs.push({ id: `r4-${name}-${i}`, p: p + MIDNOTE + R4NOTE });
else for (const [name, p] of Object.entries(PERSONAS)) for (let i = 1; i <= 3; i++) runs.push({ id: `${MID ? 'mid' : 'gate'}-${name}-${i}`, p: p + (MID ? MIDNOTE : '') });

const server = spawn('npx', ['vite', 'preview', '--port', '5196', '--strictPort'], { shell: true, stdio: 'ignore' });
// wait until the preview server answers (a fixed 4 s wait lost the whole first batch once)
for (let i = 0; i < 80; i++) { try { if ((await fetch('http://localhost:5196/')).ok) break; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 250)); }
const one = (r) => new Promise((res) => {
  const c = spawn('node', ['scripts/ai/playtest.mjs', '--tag', r.id, '--steps', '180', '--model', 'sonnet', '--max', RETEST ? '0.84' : R6 ? '1.0' : '1.2',
    '--out', `${DIR}/${r.id}`, '--persona', JSON.stringify(r.p), ...(R6 ? ['--save', `samples/playtest/start-r6-${r.cls}.json`] : MID || RETEST || R4 || R4RE ? ['--save', 'samples/playtest/start-95.json'] : [])], { shell: true, stdio: 'ignore' });
  c.on('exit', res);
});
const todo = RETEST || R6 ? runs.filter((r) => !existsSync(`${DIR}/${r.id}/report.md`)) : runs; // a re-run only redoes testers with no report
for (let i = 0; i < todo.length; i += 5) await Promise.all(todo.slice(i, i + 5).map(one));
server.kill();

mkdirSync(DIR, { recursive: true });
const rows = runs.map((r) => {
  const f = `${DIR}/${r.id}/report.md`;
  if (!existsSync(f)) return `| ${r.id} | (no report) | |`;
  const t = readFileSync(f, 'utf8');
  const cost = (t.match(/about \$([\d.]+)/) || [])[1] ?? '?';
  const v = t.split('\n').find((l) => /come back|coming back|verdict/i.test(l) && l.startsWith('-')) ?? '';
  const notes = (t.split('## Raw notes')[1] ?? '').split('\n').filter((l) => l.startsWith('- ')).length;
  return `| ${r.id} | ${v.replace(/\|/g, '/').slice(0, 160)} | ${notes} notes, $${cost} |`;
});
writeFileSync(`${DIR}/summary.md`, `# Play-test gate\n\n| Run | Verdict line | Notes, cost |\n|---|---|---|\n${rows.join('\n')}\n`);
console.log('GATE DONE');
