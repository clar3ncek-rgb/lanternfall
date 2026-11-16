// itch cover (630x500) from the real game: a mid-game save's fight scene under a title band. node scripts/cover.mjs [port] [out]
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const PORT = Number(process.argv[2] || 5297), OUT = process.argv[3] || 'itch/cover-630x500.png';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const browser = await chromium.launch({ headless: true });
try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* */ } await new Promise((r) => setTimeout(r, 250)); }
  const ctx = await browser.newContext({ viewport: { width: 630, height: 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((v) => { if (!localStorage.getItem('unwritten-tapper-save')) localStorage.setItem('unwritten-tapper-save', v); }, readFileSync('tests/fixtures/save-v4.json', 'utf8'));
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/?nocoldopen`); await page.waitForTimeout(1200);
  for (let k = 0; k < 3; k++) if (await page.locator('.modal [data-act="close"]').first().isVisible().catch(() => false)) { await page.locator('.modal [data-act="close"]').first().click(); await page.waitForTimeout(300); }
  const box = await page.locator('#battle').boundingBox();
  for (let i = 0; i < 6; i++) { await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.45); await page.waitForTimeout(120); }
  await page.addStyleTag({ content: '.toast,#hint,#coach,#banner,.modal,#weakspot,.foeinfo{display:none!important}' });
  await page.waitForTimeout(250);
  const shot = await page.locator('#battle').screenshot();
  const strip = await page.locator('#strip').screenshot().catch(() => null);
  const img = (b) => `data:image/png;base64,${b.toString('base64')}`;
  const c = await ctx.newPage();
  await c.setViewportSize({ width: 630, height: 500 });
  await c.setContent(`<html><body style="margin:0;width:630px;height:500px;overflow:hidden;background:#141018;font-family:Georgia,serif">
    <div style="height:56px;display:flex;align-items:center;gap:14px;padding:0 16px;background:#0d0a10;border-bottom:2px solid #3a2c22">
      <span style="font-size:32px;color:#e2b45a;font-weight:700">The Unwritten</span>
      <span style="font:700 14px Arial;letter-spacing:2px;color:#b9aea0">LANTERNFALL</span>
      <span style="margin-left:auto;font:14px Arial;color:#e8e0d4">Idle dark-fantasy tapper</span></div>
    <div style="height:${strip ? 380 : 444}px;overflow:hidden;display:flex;align-items:center;justify-content:center"><img src="${img(shot)}" style="width:630px;height:100%;object-fit:cover;object-position:center 70%;display:block"></div>
    ${strip ? `<div style="height:64px;overflow:hidden;background:#0d0a10"><img src="${img(strip)}" style="width:630px;display:block"></div>` : ''}
  </body></html>`);
  await c.waitForTimeout(300);
  await c.screenshot({ path: OUT });
  console.log('COVER OK', OUT);
} finally { await browser.close(); server.kill(); }
