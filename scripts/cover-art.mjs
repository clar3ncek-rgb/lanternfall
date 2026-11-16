// itch cover (630x500): Codex key art (itch/art/cover-art-1.png) with the title set in real type on top. node scripts/cover-art.mjs
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const art = `data:image/png;base64,${readFileSync('itch/art/cover-art-1.png').toString('base64')}`;
const browser = await chromium.launch({ headless: true });
try {
  const p = await browser.newPage({ viewport: { width: 630, height: 500 }, deviceScaleFactor: 1 });
  await p.setContent(`<html><body style="margin:0;width:630px;height:500px;overflow:hidden;background:#120e24">
  <div style="position:absolute;inset:0;background:url(${art}) center/cover no-repeat;image-rendering:auto"></div>
  <div style="position:absolute;left:0;right:0;top:34px;text-align:center;font-family:Georgia,'Times New Roman',serif">
    <div style="font-size:52px;font-weight:700;color:#f0c66a;letter-spacing:1px;text-shadow:0 3px 0 #3a1d08,0 0 18px #000a">The Unwritten</div>
    <div style="margin-top:6px;font:700 20px Georgia,serif;letter-spacing:10px;color:#e9dcc6;text-shadow:0 2px 0 #000,0 0 10px #000c">LANTERNFALL</div>
  </div></body></html>`);
  await p.waitForTimeout(200);
  await p.screenshot({ path: 'itch/cover-2.6-630x500.png' });
  console.log('COVER OK');
} finally { await browser.close(); }
