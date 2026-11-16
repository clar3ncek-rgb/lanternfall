// Browser smoke suite (run 2, item 5). Runs the built game in a real phone-sized browser and checks the things unit tests cannot.
// Usage: node scripts/smoke.mjs [port]  (needs `npm run build` first; starts its own `vite preview`).
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = Number(process.argv[2] || 5231);
const URL = `http://localhost:${PORT}/`;
const KEY = 'unwritten-tapper-save';
const results = [];
const check = (name, ok, extra = '') => { results.push([name, ok]); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra ? ` (${extra})` : ''}`); };

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const browser = await chromium.launch({ headless: true });
try {
  for (let i = 0; i < 40; i++) { try { if ((await fetch(URL)).ok) break; } catch { /* not up yet */ } await new Promise((r) => setTimeout(r, 250)); }
  const v3 = readFileSync('tests/fixtures/save-v3.json', 'utf8');
  const fresh = async (stored) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    if (stored !== undefined) await ctx.addInitScript(([k, v]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(k, v); sessionStorage.setItem('seeded', '1'); } }, [KEY, stored]);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message)));
    await page.goto(URL);
    await page.waitForTimeout(800);
    if (await page.locator('.coldopen').isVisible().catch(() => false)) { await page.click('.coldopen'); await page.waitForTimeout(400); }
    return { ctx, page, errors };
  };
  const stored = (page, k = KEY) => page.evaluate((key) => localStorage.getItem(key), k);

  // 1. A corrupt save is kept, shown, never overwritten, and can be replaced by a good code.
  {
    const bad = '{"hero":{"name":"Vae';
    const { ctx, page } = await fresh(bad);
    check('corrupt save shows the recovery screen', await page.locator('.recovery').isVisible());
    await page.waitForTimeout(6000);
    await page.evaluate(() => { window.dispatchEvent(new Event('pagehide')); document.dispatchEvent(new Event('visibilitychange')); });
    check('corrupt save is byte-identical after a timer tick and pagehide', (await stored(page)) === bad);
    check('an exact copy is kept in .bad', (await stored(page, `${KEY}.bad`)) === bad);
    await page.reload(); await page.waitForTimeout(600);
    check('after reload the recovery screen still shows', await page.locator('.recovery').isVisible());
    await page.fill('#rcode', 'UT1:nonsense'); await page.click('[data-r="load"]');
    check('a damaged code is refused with a message', ((await page.textContent('#rerr')) ?? '').length > 0 && (await stored(page)) === bad);
    await page.fill('#rcode', readFileSync('tests/fixtures/save-v3.code.txt', 'utf8')); await page.click('[data-r="load"]'); await page.waitForTimeout(800);
    check('a valid code loads the game from the recovery screen', await page.locator('#battle').isVisible());
    check('after loading a good code, the good save is written', JSON.parse((await stored(page)) ?? '{}').hero?.name === 'Fixture');
    await ctx.close();
  }
  // 2. A save from a newer version is refused the same way.
  {
    const newer = JSON.parse(v3); newer.v = 99;
    const raw = JSON.stringify(newer);
    const { ctx, page } = await fresh(raw);
    check('a newer-version save shows the recovery screen', await page.locator('.recovery').isVisible());
    await page.click('[data-r="new"]');
    check('Start new asks first, the save is still untouched', (await page.locator('#rconfirm').isVisible()) && (await stored(page)) === raw);
    await page.click('[data-r="new-yes"]'); await page.waitForTimeout(300);
    check('after confirming, character creation opens', await page.locator('.create').isVisible());
    await ctx.close();
  }
  // 3. A good v3 save loads and progress survives a reload.
  {
    const { ctx, page, errors } = await fresh(v3);
    check('a v3 save loads into the fight', await page.locator('#battle').isVisible());
    if (await page.locator('.modal [data-act="close"]:not(.sheetx)').first().isVisible().catch(() => false)) await page.locator('.modal [data-act="close"]:not(.sheetx)').first().click();
    await page.waitForTimeout(300);
    for (let i = 0; i < 20; i++) { await page.mouse.click(250, 260); await page.waitForTimeout(60); }
    await page.waitForTimeout(5600);
    const before = JSON.parse(await stored(page)).counts?.taps ?? JSON.parse(await stored(page)).totalTaps;
    await page.reload(); await page.waitForTimeout(800);
    const after = JSON.parse(await stored(page)).counts?.taps ?? JSON.parse(await stored(page)).totalTaps;
    check('reload keeps progress (taps were saved)', (await page.locator('#battle').isVisible()) && before >= 3010 && after >= before, `taps ${before} -> ${after}`);
    // Round 1, item 6: the fight stays tappable with every tab open
    const taps = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)).totalTaps, KEY);
    let tabOk = true; const bad = [];
    for (const tab of ['hero', 'named', 'gear', 'skills', 'pets', 'quests', 'death', 'menu']) {
      await page.click(`#tabs [data-tab="${tab}"]`); await page.waitForTimeout(150);
      const box = await page.locator('#battle').boundingBox();
      if (!box || box.height < 120) { tabOk = false; bad.push(`${tab}: fight hidden`); continue; }
      const t0 = await page.evaluate(() => window.__taps ?? 0);
      await page.evaluate(() => { window.__taps = 0; document.getElementById('battle').addEventListener('pointerdown', () => { window.__taps++; }, { once: true }); });
      await page.mouse.click(box.x + box.width * 0.7, box.y + box.height * 0.6);
      if ((await page.evaluate(() => window.__taps)) < 1) { tabOk = false; bad.push(`${tab}: tap missed`); }
      void t0;
      await page.click(`#tabs [data-tab="${tab}"]`); await page.waitForTimeout(100);
    }
    check('the fight is visible and tappable with every tab open', tabOk, bad.join(', '));
    // Round 1, item 7: after a hold, one tap on Close closes the popup
    await page.click('#tabs [data-tab="hero"]'); await page.waitForTimeout(150);
    await page.click('[data-act="htab:stats"]'); await page.waitForTimeout(150);
    const tile = page.locator('#panel .tile[data-long]').first();
    const tb = await tile.boundingBox();
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
    await page.waitForTimeout(200);
    const opened = await page.locator('#modal').isVisible();
    await page.locator('#modal [data-act="close"]:not(.sheetx)').click(); await page.waitForTimeout(150);
    check('after a hold, one tap closes the popup', opened && !(await page.locator('#modal').isVisible()));
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
    await page.waitForTimeout(200);
    await page.mouse.click(10, 300); await page.waitForTimeout(150);
    check('tapping the dim backdrop closes an info popup', !(await page.locator('#modal').isVisible()));
    // final play-test: "Show my save code" must leave the code in the box (a redraw used to wipe it)
    await page.click('#tabs [data-tab="menu"]'); await page.waitForTimeout(150);
    await page.click('[data-act="menu:save"]'); await page.waitForTimeout(150);
    await page.click('[data-act="export"]'); await page.waitForTimeout(700);
    const code = await page.locator('#codeout').inputValue();
    check('Show my save code leaves the code in the box', code.startsWith('UT1:'), code.slice(0, 12));
    // an info popup closes with a tap on its text, not only on Close
    await page.click('#tabs [data-tab="hero"]'); await page.waitForTimeout(150);
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up();
    await page.waitForTimeout(200);
    await page.locator('#modal .sheetbox').click({ position: { x: 120, y: 60 } }); await page.waitForTimeout(150);
    check('tapping the text of an info popup closes it', !(await page.locator('#modal').isVisible()));
    // run 3: a gimmick boss and an event run without script errors, and the toll bell can be tapped
    for (const d of ['tolling', 'shield', 'event']) {
      const p2 = await ctx.newPage();
      const errs = [];
      p2.on('pageerror', (e) => errs.push(String(e.message)));
      await p2.goto(`${URL}?demo=fight.${d}`); await p2.waitForTimeout(1500);
      let ok = errs.length === 0;
      if (d === 'event') ok = ok && (await p2.locator('#evchip').isVisible());
      else ok = ok && (await p2.locator('#gimtell').isVisible());
      if (d === 'tolling') { const bell = p2.locator('#bellbtn'); if (await bell.isVisible()) { const bb = await bell.boundingBox(); await p2.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await p2.waitForTimeout(200); ok = ok && !(await bell.isVisible()); } else ok = false; }
      if (d === 'shield') ok = ok && ((await p2.textContent('#gimtell')) ?? '').includes('Warded');
      check(`run 3: ${d} works with no script errors`, ok && errs.length === 0, errs.join('; '));
      await p2.close();
    }
    await page.click('#tabs [data-tab="hero"]'); await page.waitForTimeout(100);
    void taps;
    // frame time and save size with a long-played save
    const avg = await page.evaluate(() => new Promise((ok) => { const t = []; let last = performance.now(); const f = (n) => { t.push(n - last); last = n; if (t.length < 90) requestAnimationFrame(f); else ok(t.slice(10).reduce((a, b) => a + b, 0) / 80); }; requestAnimationFrame(f); }));
    check('frames stay under 34 ms on average', avg < 34, `${avg.toFixed(1)} ms`);
    const size = (await stored(page)).length;
    check('save stays under 200 KB', size < 200_000, `${Math.round(size / 1024)} KB`);
    check('no script errors while playing', errors.length === 0, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // 5. Round 3: a brand-new player
  {
    const { ctx, page } = await fresh();
    check('a new player sees character creation', await page.locator('.create').isVisible());
    // run 7 (Clarence: "not scrollable, I can't see the skills"): the class step scrolls inside itself, down to the skills
    await page.click('[data-nav="1"]'); await page.waitForTimeout(200);
    const scrolled = await page.evaluate(() => { const c = document.querySelector('.create'); c.scrollTop = 9999; return c.scrollTop > 0 || c.scrollHeight <= c.clientHeight; });
    check('character creation scrolls to the skills', scrolled);
    check('there is no Begin now button or Name step', !(await page.locator('[data-nav="quick"]').count()) && (await page.locator('.stepper button').count()) === 3);
    await page.click('[data-nav="1"]'); await page.waitForTimeout(200);
    await page.click('[data-nav="1"]'); await page.waitForTimeout(600);
    check('Begin on the Faith step starts the game', await page.locator('#battle').isVisible());
    check('the guided start shows step 1 of 6', ((await page.textContent('#hint')) ?? '').startsWith('1/6'));
    const pets = page.locator('#tabs [data-tab="pets"]');
    check('locked tabs are dimmed', ((await pets.getAttribute('class')) ?? '').includes('locked'));
    await pets.click(); await page.waitForTimeout(250);
    check('tapping a locked tab explains it and does not open it', !(await page.locator('.game.tabopen').count()) && (await page.locator('.toast').count()) > 0);
    await ctx.close();
  }
  // 6. Round 3: the first fall shows its picture card once
  {
    const { ctx, page } = await fresh(v3);
    if (await page.locator('.modal [data-act="close"]:not(.sheetx)').first().isVisible().catch(() => false)) await page.locator('.modal [data-act="close"]:not(.sheetx)').first().click();
    await page.click('#tabs [data-tab="death"]'); await page.waitForTimeout(250);
    const fall = page.locator('#panel [data-act="die"]');
    if (await fall.count()) {
      await fall.click(); await page.waitForTimeout(250);
      check('the first fall shows the picture card', await page.locator('.fallcard').isVisible());
      await page.locator('#modal [data-act="close"]:not(.sheetx)').click(); await page.waitForTimeout(150);
      await fall.click(); await page.waitForTimeout(250);
      check('the second time it goes straight to the normal confirm', !(await page.locator('.fallcard').count()) && (await page.locator('#modal').isVisible()));
    } else check('the Fall button is on the Death tab', false);
    await ctx.close();
  }
  // 4. The crash catcher shows the save text and keeps the last good save.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [KEY, v3]);
    const page = await ctx.newPage();
    await page.goto(`${URL}?crash=1`); await page.waitForTimeout(800);
    check('?crash=1 shows the crash screen', await page.locator('.crash').isVisible());
    check('the crash screen shows the save text', ((await page.inputValue('.crash textarea')) ?? '').length > 100);
    await ctx.close();
  }
  // 6. Run 4: an elite says what it is; a weak spot can be tapped; a hunt can be taken; the Toll Collector asks; the shrine opens.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    await page.goto(`${URL}?demo=fight.elite`); await page.waitForTimeout(900);
    check('an elite says what it is', /Elite/.test((await page.locator('#gimtell').textContent()) ?? ''));
    await page.goto(`${URL}?demo=fight.weak`); await page.waitForTimeout(900);
    const before = await page.evaluate(() => 0);
    void before;
    check('a weak spot shows on the boss', await page.locator('#weakspot').isVisible());
    await page.locator('#weakspot').dispatchEvent('pointerdown'); await page.waitForTimeout(150);
    check('tapping it shows the x3', ((await page.locator('#floats').textContent()) ?? '').includes('✸'));
    await page.goto(`${URL}?demo=fight.hunt`); await page.waitForTimeout(900);
    await page.locator('#huntchip [data-act="hunt:yes"]').click(); await page.waitForTimeout(400);
    check('a hunt can be taken', /0\/3/.test((await page.locator('#huntchip').textContent()) ?? ''));
    await page.goto(`${URL}?demo=fight.collector`); await page.waitForTimeout(900);
    await page.locator('#keys').click(); await page.waitForTimeout(300);
    check('the Toll Collector offer hides behind a popup', !(await page.locator('#evchip').isVisible()));
    await page.locator('#modal [data-act="close"]').first().click(); await page.waitForTimeout(500);
    await page.locator('#evchip [data-act="collector:yes"]').click(); await page.waitForTimeout(400);
    check('the Toll Collector can be accepted', !(await page.locator('#evchip [data-act="collector:yes"]').count()));
    await page.goto(`${URL}?demo=fight.shrine`); await page.waitForTimeout(1100);
    await page.locator('#modal [data-act="offer:tap"]').click(); await page.waitForTimeout(300);
    check('a shrine offering can be made', !(await page.locator('#shrinebtn').isVisible()));
    check('no script errors on the run 4 screens', errs.length === 0, errs.join(' | ').slice(0, 200));
    await ctx.close();
  }
  // 7. Run 5: each class shows its own meter; Reshape opens and lists the choices.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));
    const want = { warrior: 'Rage', mage: 'Mana', rogue: 'Combo', ranger: 'Quiver', cleric: 'Prayer' };
    let ok = 0;
    for (const [cls, word] of Object.entries(want)) {
      await page.goto(`${URL}?demo=class.${cls}`); await page.waitForTimeout(700);
      if (((await page.locator('#classmeter').textContent()) ?? '').includes(word)) ok++;
    }
    check('each class shows its own meter', ok === 5, `${ok}/5`);
    await page.goto(`${URL}?demo=reshape`); await page.waitForTimeout(1000);
    check('Reshape lists classes, races and faiths', (await page.locator('#modal [data-act^="reshape-do:"]').count()) === 16);
    check('no script errors on the run 5 screens', errs.length === 0, errs.join(' | ').slice(0, 200));
    await ctx.close();
  }
  // 5. A jumpscare shows its face, then the joke, and one tap gets back to the game.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(`${URL}?demo=scare.hanged`); await page.waitForTimeout(1700);
    check('a jumpscare shows its face', await page.locator('#scare.boo .scareface').isVisible());
    await page.waitForTimeout(1300);
    check('then a joke line', ((await page.locator('.scarejoke p').textContent()) ?? '').length > 10);
    await page.locator('.scarejoke button').click(); await page.waitForTimeout(200);
    check('one tap closes it', (await page.locator('#scare').count()) === 0);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
const failed = results.filter(([, ok]) => !ok).length;
console.log(failed ? `SMOKE FAILED: ${failed} of ${results.length}` : `SMOKE PASSED: ${results.length} checks`);
process.exit(failed ? 1 : 0);
