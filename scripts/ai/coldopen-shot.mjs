// The cold open (new player) and the creation screen after it, at phone size.
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '5256', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await p.goto('http://localhost:5256/'); await p.waitForTimeout(1600);
await p.screenshot({ path: '.lavish/coldopen-1.png' });
await p.waitForTimeout(9200);
await p.screenshot({ path: '.lavish/coldopen-3.png' });
await p.click('.coldopen'); await p.waitForTimeout(600);
await p.screenshot({ path: '.lavish/coldopen-create.png' });
await b.close(); server.kill();
