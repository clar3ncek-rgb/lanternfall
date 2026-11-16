// Phone-width screenshots of the Run 2 part of .lavish/run-reports.html, one picture per group of rounds.
import { chromium } from 'playwright-core';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const exe = 'C:/Users/edred/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const dir = path.resolve('.lavish');
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2.5 });
await page.goto(pathToFileURL(path.join(dir, 'run-reports.html')).href);
await page.waitForLoadState('load');
const groups = [['h1', 'log'], ['gate', 'gate'], ['ideas', 'ideas'], ['ask', 'ask']];
let i = 1;
for (const [a, b] of groups) {
  const box = await page.evaluate(([a, b]) => {
    const A = a === 'h1' ? document.querySelector('h1') : document.getElementById(a);
    const B = document.getElementById(b);
    const ra = A.getBoundingClientRect(), rb = B.getBoundingClientRect();
    return { y: ra.top + scrollY - 8, h: rb.bottom - ra.top + 16 };
  }, [a, b]);
  const out = path.join(dir, `run2-done-${i++}.png`);
  await page.screenshot({ path: out, fullPage: true, clip: { x: 0, y: box.y, width: 430, height: box.h } });
  console.log(out, Math.round(box.h));
}
await browser.close();
