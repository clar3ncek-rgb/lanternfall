// Full-page phone picture of a local HTML page: node scripts/ai/page-shot.mjs <page.html> <out.png>
import { chromium } from 'playwright-core';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [src, out] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2.5 });
await p.goto(pathToFileURL(path.resolve(src)).href);
await p.screenshot({ path: out, fullPage: true });
await b.close();
