// Run 2, idea 40: every screen of the demo save, shot at phone size into samples/screens/ with one command (npm run shots).
// Needs a built dist (npm run build or npm run release first). Serves it on its own port.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
const PORT = 5253, OUT = process.argv[2] || 'samples/screens';
const SCREENS = ['fight', 'fight.boss', 'fight.new', 'fight.away', 'hero.train', 'hero.stats', 'hero.rewards', 'named',
  'gear.worn', 'gear.bag', 'gear.sets', 'skills.class', 'skills.spells', 'skills.race', 'skills.form', 'pets',
  'quests.quest', 'quests.trials', 'quests.daily', 'quests.weekly', 'death.fall', 'death.relics', 'death.dungeon',
  'menu', 'menu.words', 'menu.help', 'menu.notes'];
mkdirSync(OUT, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const browser = await chromium.launch({ headless: true });
try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch(`http://localhost:${PORT}/`)).ok) break; } catch { /* */ } await new Promise((r) => setTimeout(r, 250)); }
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  for (const d of SCREENS) {
    await page.goto(`http://localhost:${PORT}/?demo=${d}`);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${d.replace('.', '-')}.png` });
  }
  console.log(`${SCREENS.length} screens in ${OUT}`);
} finally { await browser.close(); server.kill(); }
