// j1/j2: Claude plays the game in a real phone-sized browser and reports what was confusing, broken or boring.
// Usage: node scripts/ai/playtest.mjs --tag j1-playtest --steps 500 --model sonnet --persona "..." --out samples/playtest/j1 --max 6
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';
import { message, textOf, spentUsd, HAIKU, SONNET, OPUS } from './api.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const TAG = arg('tag', 'j1-playtest');
const STEPS = Number(arg('steps', 500));
const MODEL = { haiku: HAIKU, sonnet: SONNET, opus: OPUS }[arg('model', 'sonnet')];
const OUT = arg('out', `samples/playtest/${TAG}`);
const MAX_USD = Number(arg('max', 6));
const URL = arg('url', 'http://localhost:5196/');
const PERSONA = arg('persona', 'A curious first-time player who found this game on itch.io and plays it on a phone.');
mkdirSync(OUT, { recursive: true });

const SYSTEM = `You are play-testing a phone web game you have never seen. ${PERSONA}
You see one screenshot (390x844 CSS pixels) per step and choose ONE action. Coordinates are in that 390x844 space.
Reply with ONLY a JSON object, no other text:
{"think":"<10-25 words: what you see and why you act>","action":"tap|taps|hold|wait|scroll|type","x":0,"y":0,"n":1,"seconds":0,"dy":0,"text":"",
 "note":{"kind":"none|confused|bug|boring|fun|ugly","text":"<what and where, one sentence>"}}
- tap: one tap at x,y. taps: n quick taps (n up to 25) at x,y. hold: press and hold 0.8 s (shows details in this game). wait: let the idle game run (seconds up to 30).
- scroll: scroll the page at x,y by dy pixels. type: type text into the focused box.
- Use "note" only when something is worth reporting to the developer (confusing, broken, boring, ugly, or especially fun); otherwise kind "none".
- Play to make progress and to understand the game, like a real player would.`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: false, isMobile: false });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message || e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
// run 3: --save <file> starts the tester from a prepared save (once per browser session, like a real returning player)
const SAVE = arg('save', '');
if (SAVE) await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, ['unwritten-tapper-save', readFileSync(SAVE, 'utf8')]);
await page.goto(URL);
await page.waitForTimeout(1500);

const history = [];
const notes = [];
const log = (o) => appendFileSync(`${OUT}/log.jsonl`, JSON.stringify(o) + '\n');
let step = 0;
for (step = 1; step <= STEPS; step++) {
  if (spentUsd() > MAX_USD) { log({ step, stop: `budget ${MAX_USD} reached` }); break; }
  const shot = await page.screenshot({ type: 'jpeg', quality: 60 });
  const recent = history.slice(-8).map((h) => `step ${h.step}: ${h.action}${h.x !== undefined ? ` at ${h.x},${h.y}` : ''} (${h.think})`).join('\n');
  const content = [
    { type: 'text', text: `Step ${step} of ${STEPS}.${recent ? `\nYour last actions:\n${recent}` : ''}${errors.length ? `\nThe game logged ${errors.length} script error(s) so far.` : ''}` },
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: shot.toString('base64') } },
  ];
  let a;
  try {
    const r = await message(MODEL, content, { system: SYSTEM, maxTokens: 300, tag: TAG });
    const t = textOf(r);
    a = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
  } catch (e) {
    log({ step, error: String(e).slice(0, 300) });
    await page.waitForTimeout(2000);
    continue;
  }
  const x = Math.max(0, Math.min(389, Number(a.x) || 0)), y = Math.max(0, Math.min(843, Number(a.y) || 0));
  try {
    if (a.action === 'tap') await page.mouse.click(x, y);
    else if (a.action === 'taps') { for (let i = 0; i < Math.min(25, Number(a.n) || 1); i++) { await page.mouse.click(x, y); await page.waitForTimeout(70); } }
    else if (a.action === 'hold') { await page.mouse.move(x, y); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up(); }
    else if (a.action === 'wait') await page.waitForTimeout(Math.min(30, Math.max(1, Number(a.seconds) || 5)) * 1000);
    else if (a.action === 'scroll') { await page.mouse.move(x, y); await page.mouse.wheel(0, Number(a.dy) || 300); }
    else if (a.action === 'type') await page.keyboard.type(String(a.text || '').slice(0, 40));
  } catch (e) { log({ step, actError: String(e).slice(0, 200) }); }
  await page.waitForTimeout(400);
  history.push({ step, action: a.action, x, y, think: String(a.think || '').slice(0, 160) });
  const n = a.note && a.note.kind && a.note.kind !== 'none' ? a.note : null;
  if (n) { notes.push({ step, kind: n.kind, text: String(n.text).slice(0, 300) }); await page.screenshot({ path: `${OUT}/step-${String(step).padStart(3, '0')}.png` }); }
  if (step % 50 === 0) await page.screenshot({ path: `${OUT}/every50-${String(step).padStart(3, '0')}.png` });
  log({ step, action: a.action, x, y, n: a.n, seconds: a.seconds, think: a.think, note: n, usd: Number(spentUsd().toFixed(3)) });
}
for (const e of [...new Set(errors)].slice(0, 20)) notes.push({ step: 0, kind: 'bug', text: `Script error logged by the game: ${e.slice(0, 250)}` });
await page.screenshot({ path: `${OUT}/final.png` });
await browser.close();

// Summary: findings ranked, with step numbers.
const summaryPrompt = `You play-tested a phone idle RPG for ${step - 1} steps as: ${PERSONA}
Here are your notes (step, kind, text):\n${notes.map((n) => `${n.step} | ${n.kind} | ${n.text}`).join('\n') || '(no notes)'}
Here are your last 40 actions:\n${history.slice(-40).map((h) => `${h.step}: ${h.action} (${h.think})`).join('\n')}
Write a short report in plain English for the game's owner: 1) a 3-line verdict (would you come back tomorrow, and why), 2) the top findings ranked by how much they hurt a new player, each with step numbers, what happened and a suggested fix, 3) what was fun. Merge duplicates. At most 15 findings.`;
let report = '';
try { report = textOf(await message(MODEL, [{ type: 'text', text: summaryPrompt }], { maxTokens: 2000, tag: TAG })); } catch (e) { report = `Summary failed: ${e}`; }
writeFileSync(`${OUT}/report.md`, `# Play-test report (${TAG}, ${MODEL}, ${step - 1} steps, about $${spentUsd().toFixed(2)})\n\nPersona: ${PERSONA}\n\n${report}\n\n## Raw notes\n${notes.map((n) => `- step ${n.step} [${n.kind}] ${n.text}`).join('\n')}\n`);
console.log(`done ${TAG}: ${step - 1} steps, ${notes.length} notes, $${spentUsd().toFixed(2)}`);
