// Elliot (Codex) play-tester, 12 Nov 2026: one phone-sized browser kept open, driven over a tiny local HTTP API.
// No API credits: Codex reads the screen as text (cli.mjs look) and taps by number.
// Usage: node scripts/ai/elliot/server.mjs --port 5299 --out samples/playtest/elliot/<id> [--save file.json] [--url http://localhost:5196/]
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { mkdirSync, appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const PORT = Number(arg('port', 5299));
const OUT = arg('out', 'samples/playtest/elliot/run');
const GAME = arg('url', 'http://localhost:5196/');
const SAVE = arg('save', '');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
if (SAVE) await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, ['unwritten-tapper-save', readFileSync(SAVE, 'utf8')]);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message || e)));
await page.goto(GAME);
await page.waitForTimeout(1500);

let refs = [];
let steps = 0;
const log = (line) => appendFileSync(`${OUT}/actions.log`, `${new Date().toISOString().slice(11, 19)} ${line}\n`);

/** What a player sees, as text: top bar, foe, any open popup, and every visible tappable thing with a number. */
async function look() {
  const data = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
    const txt = (el) => (el?.innerText ?? '').replace(/\s+/g, ' ').trim();
    const modal = document.querySelector('#modal:not([hidden])');
    const panel = document.querySelector('#panel');
    const items = [];
    const seen = new Set();
    for (const el of document.querySelectorAll('button, [data-act], #battle, .cell, a')) {
      if (!vis(el) || seen.has(el)) continue;
      seen.add(el);
      const r = el.getBoundingClientRect();
      // the top-most element at its centre must be it (or inside it), else it is covered
      const cx = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)); const cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
      const top = document.elementFromPoint(cx, cy);
      if (top && !el.contains(top) && !top.contains(el)) continue;
      let label = el.id === 'battle' ? '[the fight: tap here to attack]' : (txt(el) || el.getAttribute('aria-label') || el.getAttribute('title') || el.dataset.act || '').slice(0, 90);
      const help = (el.dataset.long || el.closest('[data-long]')?.dataset.long || '').replace(/^\w+:/, '');
      if (label.length < 12 && help) label += ` (${help.slice(0, 60)})`;
      const aria = el.getAttribute('aria-label') || el.getAttribute('title') || '';
      if (label.length < 12 && !help && aria && aria !== label) label += ` (${aria.slice(0, 60)})`; // run 8: a bare symbol says what it is
      if (!label) continue;
      items.push({ label, x: Math.round(cx), y: Math.round(cy) });
    }
    return {
      top: txt(document.querySelector('#top')).slice(0, 200),
      foe: txt(document.querySelector('.foeinfo')).slice(0, 160),
      meter: txt(document.querySelector('#classmeter')).slice(0, 120),
      hint: txt(document.querySelector('#hint')).slice(0, 160),
      toast: [...document.querySelectorAll('.toast')].map(txt).join(' | ').slice(0, 200),
      popup: modal && vis(modal) ? txt(modal).slice(0, 900) : '',
      panel: panel && vis(panel) ? txt(panel).slice(0, 900) : '',
      items,
    };
  });
  refs = data.items;
  const lines = [
    `TOP: ${data.top}`, data.foe && `FOE: ${data.foe}`, data.meter && `METER: ${data.meter}`, data.hint && `HINT: ${data.hint}`, data.toast && `MESSAGE: ${data.toast}`,
    data.popup && `POPUP (covers the screen): ${data.popup}`, !data.popup && data.panel && `OPEN TAB: ${data.panel}`,
    'TAPPABLE:', ...refs.map((r, i) => `  [${i}] ${r.label}`),
    errors.length ? `SCRIPT ERRORS: ${errors.slice(-3).join(' | ')}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}

async function act(q) {
  const ref = q.get('ref') !== null ? refs[Number(q.get('ref'))] : null;
  const cmd = q.get('cmd');
  steps++;
  if (['tap', 'taps', 'hold'].includes(cmd) && !ref) return `No item [${q.get('ref')}]. Run look first.`;
  if (cmd === 'tap') { await page.mouse.click(ref.x, ref.y); await page.waitForTimeout(350); log(`tap ${ref.label}`); }
  else if (cmd === 'taps') { const n = Math.min(40, Number(q.get('n') || 10)); for (let i = 0; i < n; i++) { await page.mouse.click(ref.x, ref.y); await page.waitForTimeout(90); } log(`taps x${n} ${ref.label}`); }
  else if (cmd === 'hold') { await page.mouse.move(ref.x, ref.y); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up(); await page.waitForTimeout(300); log(`hold ${ref.label}`); }
  else if (cmd === 'wait') { const s = Math.min(30, Number(q.get('s') || 5)); await page.waitForTimeout(s * 1000); log(`wait ${s}s`); }
  else if (cmd === 'scroll') { await page.mouse.wheel(0, Number(q.get('dy') || 300)); await page.waitForTimeout(300); log('scroll'); }
  else if (cmd === 'note') { appendFileSync(`${OUT}/notes.md`, `- step ${steps} [${q.get('kind') || 'note'}] ${q.get('text') || ''}\n`); return 'Noted.'; }
  else if (cmd === 'shot') { await page.screenshot({ path: `${OUT}/shot-${steps}.png` }); return `Saved shot-${steps}.png`; }
  else if (cmd !== 'look') return 'Unknown command.';
  if (steps % 20 === 0) await page.screenshot({ path: `${OUT}/shot-${steps}.png` });
  return `step ${steps}\n${await look()}`;
}

const server = createServer(async (req, res) => {
  const q = new URL(req.url, 'http://x').searchParams;
  let body;
  try { body = await act(q); } catch (e) { body = `Error: ${e.message}`; }
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); res.end(body);
  if (q.get('cmd') === 'quit') { writeFileSync(`${OUT}/errors.txt`, errors.join('\n')); await browser.close(); process.exit(0); }
});
server.listen(PORT, () => console.log(`elliot driver on ${PORT}`));
