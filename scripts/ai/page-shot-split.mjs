// Phone pictures of a local page, split before the given CSS selector index: node page-shot-split.mjs <page> <outPrefix> <selector> <index>
import { chromium } from 'playwright-core';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [src, prefix, sel, idx] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2.5 });
await p.goto(pathToFileURL(path.resolve(src)).href);
const { cut, h } = await p.evaluate(([s, i]) => ({ cut: document.querySelectorAll(s)[Number(i)].getBoundingClientRect().top + scrollY - 6, h: document.documentElement.scrollHeight }), [sel, idx]);
await p.screenshot({ path: `${prefix}-1.png`, fullPage: true, clip: { x: 0, y: 0, width: 430, height: cut } });
await p.screenshot({ path: `${prefix}-2.png`, fullPage: true, clip: { x: 0, y: cut, width: 430, height: h - cut } });
await b.close();
