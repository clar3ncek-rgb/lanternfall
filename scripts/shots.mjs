// Screenshots of a new player's first screens and the first fall, for the Lavish report. node scripts/shots.mjs <port> <outdir>
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
const PORT = Number(process.argv[2] || 5251), OUT = process.argv[3] || 'samples/shots-r3';
mkdirSync(OUT, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const browser = await chromium.launch({ headless: true });
try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* */ } await new Promise((r) => setTimeout(r, 250)); }
  let ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  let page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/?nocoldopen`); await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/1-create.png` });
  for (let i = 0; i < 3; i++) { await page.click('[data-nav="1"]'); await page.waitForTimeout(i === 2 ? 900 : 200); }
  await page.screenshot({ path: `${OUT}/2-guided.png` });
  await page.click('#tabs [data-tab="gear"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/3-locked.png` });
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript((v) => { if (!localStorage.getItem('unwritten-tapper-save')) localStorage.setItem('unwritten-tapper-save', v); }, readFileSync('tests/fixtures/save-v3.json', 'utf8'));
  page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/`); await page.waitForTimeout(800);
  if (await page.locator('.modal [data-act="close"]').first().isVisible().catch(() => false)) await page.locator('.modal [data-act="close"]').first().click();
  await page.click('#tabs [data-tab="death"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/4-fallpanel.png` });
  await page.click('#panel [data-act="die"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/5-fallcard.png` });
} finally { await browser.close(); server.kill(); }
