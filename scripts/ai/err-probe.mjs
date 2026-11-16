// Load a save and print the first script errors (run 3 debug).
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', '5258', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addInitScript((v) => localStorage.setItem('unwritten-tapper-save', v), readFileSync(process.argv[2] || 'samples/playtest/start-95.json', 'utf8'));
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(String(e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 200)); });
await p.goto('http://localhost:5258/'); await p.waitForTimeout(4000);
console.log(errs.length, 'errors'); console.log([...new Set(errs)].slice(0, 5).join('\n'));
await b.close(); server.kill();
