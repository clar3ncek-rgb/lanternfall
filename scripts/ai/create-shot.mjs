// Creation screen at phone size for the itch page.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '5255', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:5255/?create=0'); await p.waitForTimeout(800);
await p.screenshot({ path: 'itch/v21-shot1-creation.png' });
await b.close(); server.kill();
