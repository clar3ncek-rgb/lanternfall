import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '5254', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await p.goto('http://localhost:5254/?demo=skills.class'); await p.waitForTimeout(800);
// hold the first node to open its info popup
const node = p.locator('#panel [data-long]').first();
const bb = await node.boundingBox();
await p.mouse.move(bb.x + 20, bb.y + 10); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up();
await p.waitForTimeout(300);
const info = await p.evaluate(() => {
  const m = document.getElementById('modal');
  const btn = m && [...m.querySelectorAll('button')].find((x) => /close/i.test(x.textContent) || x.dataset.act === 'close');
  if (!btn) return { open: !m?.hidden, btn: null };
  const r = btn.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const at = document.elementFromPoint(cx, cy);
  const at769 = document.elementFromPoint(46, 769);
  return { open: !m.hidden, rect: [r.left, r.top, r.width, r.height].map(Math.round), atCenter: at?.outerHTML.slice(0, 80), at46_769: at769?.outerHTML.slice(0, 80), modalKind: m.className };
});
console.log(JSON.stringify(info, null, 1));
await p.mouse.click(46, 769); await p.waitForTimeout(300);
console.log('after tap 46,769 open:', await p.evaluate(() => !document.getElementById('modal').hidden));
await p.screenshot({ path: 'C:/Users/edred/AppData/Local/Temp/claude/999db07fbd86f702/cf957873-d541-409a-b0f5-b033e7ca3dfe/scratchpad/probe.png' });
await b.close(); server.kill();
