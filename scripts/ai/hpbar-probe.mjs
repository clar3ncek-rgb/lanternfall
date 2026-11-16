// Health bar check at small phone sizes, normal and Larger text, fight and half-cover tab.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '5257', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const b = await chromium.launch();
const out = [];
for (const [w, h, big, demo] of [[360, 740, false, 'fight'], [360, 740, true, 'fight'], [390, 844, true, 'hero.train'], [412, 915, false, 'fight.boss']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addInitScript((bg) => localStorage.setItem('unwritten-tapper-prefs', JSON.stringify({ vibrate: true, motion: true, big: bg, seenItem: 0 })), big);
  const p = await ctx.newPage();
  await p.goto(`http://localhost:5257/?demo=${demo}`); if (process.argv.includes('--hugefont')) await p.addStyleTag({ content: 'html{font-size:24px}' }); await p.waitForTimeout(900);
  const m = await p.evaluate(() => { const bar = document.querySelector('.foeinfo .bar.hp'); const sp = document.getElementById('hptext'); const r = bar.getBoundingClientRect(), t = sp.getBoundingClientRect(); return { bar: [r.width, r.height].map(Math.round), text: [t.width, t.height].map(Math.round), txt: sp.textContent, fs: getComputedStyle(sp).fontSize }; });
  const file = `.lavish/hp-${w}-${big ? 'big' : 'norm'}-${demo}.png`;
  const bar = await p.locator('.foeinfo').boundingBox();
  await p.screenshot({ path: file, clip: { x: 0, y: bar.y, width: w, height: bar.height + 4 } });
  out.push({ w, big, demo, ...m });
  await ctx.close();
}
console.log(JSON.stringify(out, null, 0));
await b.close(); server.kill();
