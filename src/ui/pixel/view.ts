// The battle canvas (layout C): backdrop, top-3 Named + pets behind the hero, the foe on the right,
// sparks, poofs and the fairy. Logical scene 180 x 120 drawn at an integer scale; the spare room
// around it is filled by stretching the backdrop's edge pixels, so the box never shows bars.
import { FAIRY, PET_FLYERS, namedSprites, petSprites } from './allies';
import { ambient, backdrop, GROUND, SH, SW } from './backdrops';
import { type Sprite, blit, mix, tintPalette } from './core';
import { type FoeArt, type FoeLook, SACK, foeArt, footRow, topRow } from './foes';
import { type HeroLook, heroSig, heroSprite } from './hero';
import { elementColor, rarityColor, realmTint } from './palette';
import type { NamedLook } from './strip';

export interface PetLook { id: string; body: string; element: string }
export interface Scene {
  hero: HeroLook; foe: FoeLook; named: NamedLook[]; pets: PetLook[];
  mode: 'world' | 'escape' | 'dungeon'; fairy: { x: number; y: number } | null;
}
export interface BattleView {
  setScene(s: Scene): void;
  strike(crit: boolean): void;
  foeHit(element: string, crit: boolean): void;
  namedHit(i: number, element: string): void;
  /** Run 2, idea 50: a gold burst on the hero (-1) or a Named who just levelled. */
  levelUp(i: number): void;
  kill(): void;
  fairyHitTest(x: number, y: number): boolean;
  /** Where the wisp is on screen (client px), or null. */
  fairyScreen(): { x: number; y: number } | null;
  /** Run 4: the foe's box on screen (client px), for the weak spot. */
  foeScreen(): { x: number; y: number; w: number; h: number } | null;
  destroy(): void;
}

const HERO_X = 62, HERO_Y = 61;
const NAMED_SLOTS: [number, number][] = [[42, 73], [24, 67], [6, 75]];
const GROUND_PETS: [number, number][] = [[46, 93], [26, 97], [6, 94]];
const FLY_PETS: [number, number][] = [[92, 32], [76, 22], [106, 46]];

type Fx =
  | { k: 'spark'; x0: number; y0: number; x1: number; y1: number; col: string; t0: number; dur: number }
  | { k: 'burst'; x: number; y: number; col: string; t0: number; big: boolean }
  | { k: 'trail'; t0: number; col: string; crit: boolean }
  | { k: 'poof'; x: number; y: number; t0: number; parts: [number, number, number][] };

interface FoeGeo { x: number; y: number; w: number; h: number; scale: number; cx: number; cy: number; top: number }

export function createBattleView(host: HTMLElement): BattleView {
  const cv = document.createElement('canvas');
  cv.className = 'px-canvas';
  cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', zIndex: '0', pointerEvents: 'none', imageRendering: 'pixelated' });
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.insertBefore(cv, host.firstChild);
  const ctx = cv.getContext('2d')!;
  const buf = document.createElement('canvas');
  const g = buf.getContext('2d')!;

  let k = 1, BW = SW, BH = SH, ox = 0, oy = 0, dx = 0, dy = 0;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(1, host.clientWidth), H = Math.max(1, host.clientHeight);
    const cw = Math.max(1, Math.round(W * dpr)), ch = Math.max(1, Math.round(H * dpr));
    k = Math.max(1, Math.floor(Math.min(cw / SW, ch / SH)));
    BW = Math.ceil(cw / k); BH = Math.ceil(ch / k);
    ox = Math.floor((BW - SW) / 2);
    oy = Math.round((BH - SH) * 0.62); // a little lower than centre: the foe info sits on top
    dx = Math.floor((cw - BW * k) / 2); dy = Math.floor((ch - BH * k) / 2);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    if (buf.width !== BW || buf.height !== BH) { buf.width = BW; buf.height = BH; }
    ctx.imageSmoothingEnabled = false; g.imageSmoothingEnabled = false;
  }
  resize();
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  ro?.observe(host);
  window.addEventListener('resize', resize);

  let scene: Scene | null = null;
  let attackUntil = 0, flashUntil = 0, softUntil = 0, knockUntil = 0, shakeUntil = 0;
  let killAt = -1e9, slideStart = -1e9, lastFoeName = '';
  const fx: Fx[] = [];
  const namedLit = new Map<number, number>();

  // caches rebuilt only when their inputs change
  let heroKey = '', heroA: Sprite, heroB: Sprite, heroS: Sprite, heroTrail = '#f6ecd4';
  let foeKey = '', art: FoeArt, flashA: Sprite, flashB: Sprite, softA: Sprite, softB: Sprite, auraA: Sprite | null = null, auraB: Sprite | null = null, geo: FoeGeo;
  const flashSprites = new Map<Sprite, Map<string, Sprite>>();
  const flashOf = (s: Sprite, col = '#fff6e0', amt = 0.7, rec?: string) => {
    let m = flashSprites.get(s);
    if (!m) { m = new Map(); flashSprites.set(s, m); }
    const key = col + amt + (rec ?? '');
    let f = m.get(key);
    if (!f) { f = { ...s, palette: tintPalette(s, rec, col, amt) }; m.set(key, f); }
    return f;
  };

  function syncHero(h: HeroLook) {
    const key = heroSig(h);
    if (key === heroKey) return;
    heroKey = key;
    heroA = heroSprite(h, 'a'); heroB = heroSprite(h, 'b'); heroS = heroSprite(h, 'strike');
    heroTrail = h.gear.mainHand ? mix(rarityColor(h.gear.mainHand.rarity), '#ffffff', 0.35) : '#f6ecd4';
  }
  function syncFoe(f: FoeLook, now: number) {
    const key = `${f.name}|${f.land}|${f.boss}|${f.realm ?? ''}|${f.treasure ? 1 : 0}|${f.wanderer ? 1 : 0}`; // land too: placeholder names repeat across lands
    if (key === foeKey) return;
    if (f.name !== lastFoeName && lastFoeName && now - killAt > 400 && now - slideStart > 420) slideStart = now; // new foe without a kill: slide in too
    lastFoeName = f.name;
    foeKey = key;
    art = foeArt(f);
    flashA = flashOf(art.a); flashB = flashOf(art.b); softA = flashOf(art.a, '#fff6e0', 0.28); softB = flashOf(art.b, '#fff6e0', 0.28);
    const scale = f.wanderer && art.a.h <= 40 ? 2 : 1;
    const w = art.a.w * scale, h = art.a.h * scale;
    const x = (f.wanderer ? 178 : 166) - w;
    const y = art.fly ? (f.wanderer ? 8 : 30) : GROUND - footRow(art.a) * scale - (scale - 1);
    const top = y + topRow(art.a) * scale;
    geo = { x, y, w, h, scale, top, cx: Math.round(x + w * 0.42), cy: Math.round(top + (y + h - top) * 0.45) };
    if (f.wanderer) {
      const col = f.realm ? realmTint(f.realm) : '#c070ff';
      const sil = (s: Sprite): Sprite => ({ ...s, palette: Object.fromEntries(Object.keys(s.palette).map((kk) => [kk, col])) });
      auraA = sil(art.a); auraB = sil(art.b);
    } else { auraA = auraB = null; }
  }

  const P = (x: number, y: number, col: string) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  const R = (x: number, y: number, w: number, h: number, col: string) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  function top3(s: Scene): NamedLook[] {
    return s.named.slice().sort((a, b) => b.share - a.share || a.i - b.i).slice(0, 3);
  }
  function namedOrigin(i: number): [number, number] {
    if (!scene) return [20, 80];
    const t3 = top3(scene);
    const slot = t3.findIndex((n) => n.i === i);
    if (slot >= 0) { const [x, y] = NAMED_SLOTS[slot]; return [x + 12, y + 6]; }
    const owned = scene.named.slice().sort((a, b) => a.i - b.i).findIndex((n) => n.i === i);
    return [Math.min(SW - 6, 8 + Math.max(0, owned) * 15), SH + 4];
  }

  // The backdrop at buffer size, its edge pixels stretched into the spare room. Rebuilt on resize or place change.
  const full = document.createElement('canvas');
  const fg = full.getContext('2d')!;
  let fullKey = '', fullSrc: HTMLCanvasElement | null = null;
  function fullBackdrop(bg: HTMLCanvasElement): HTMLCanvasElement {
    const key = `${BW}x${BH}+${ox}+${oy}`;
    if (bg === fullSrc && key === fullKey) return full;
    fullSrc = bg; fullKey = key;
    full.width = BW; full.height = BH; fg.imageSmoothingEnabled = false;
    fg.drawImage(bg, ox, oy);
    if (ox > 0) { fg.drawImage(bg, 0, 0, 1, SH, 0, oy, ox, SH); fg.drawImage(bg, SW - 1, 0, 1, SH, ox + SW, oy, BW - ox - SW, SH); }
    if (oy > 0) fg.drawImage(full, 0, oy, BW, 1, 0, 0, BW, oy);
    if (BH > oy + SH) fg.drawImage(full, 0, oy + SH - 1, BW, 1, 0, oy + SH, BW, BH - oy - SH);
    return full;
  }

  // ---------------------------------------------------------------- frame
  function frame(t: number) {
    const s = scene;
    // backdrop with its edges stretched into the spare room
    const bd = backdrop(s?.mode ?? 'world', s?.foe.land ?? 0, s?.foe.realm);
    g.drawImage(fullBackdrop(bd.canvas), 0, 0);
    if (!s) { ctx.drawImage(buf, 0, 0, BW, BH, dx, dy, BW * k, BH * k); return; }

    const shake = t < shakeUntil ? ((Math.floor(t / 30) % 2) ? 1 : -1) : 0;
    g.save();
    g.translate(ox + shake, oy);
    ambient(g, bd, t);

    // Named: top three by share, back to front
    const t3 = top3(s);
    for (let slot = t3.length - 1; slot >= 0; slot--) {
      const n = t3[slot], [x, y] = NAMED_SLOTS[slot];
      const [a, b] = namedSprites(n.look);
      const fr = Math.floor((t + n.i * 170) / 450) % 2 ? b : a;
      const col = elementColor(n.element);
      const lit = t < (namedLit.get(n.i) ?? 0);
      if (lit) blit(g, flashOf(fr, col, 0.45, col), x, y);
      else blit(g, fr, x, y, n.immune ? { T: '#5f5f5f', t: '#3a3a3a', u: '#8a8a8a' } : col);
      if (n.immune) { P(x + 13, y - 1, '#e25b5b'); P(x + 14, y - 2, '#e25b5b'); P(x + 12, y, '#e25b5b'); }
    }

    // pets: walkers in front of the Named, flyers above
    const pets = s.pets.slice(0, 3);
    let gi = 0, fi = 0;
    const flyers: [Sprite, number, number][] = [];
    for (const p of pets) {
      const [a, b] = petSprites(p.body, elementColor(p.element));
      const fr = Math.floor((t + p.id.length * 97) / 400) % 2 ? b : a;
      if (PET_FLYERS.has(p.body)) { const [x, y] = FLY_PETS[fi++ % 3]; flyers.push([fr, x, y + Math.round(Math.sin(t / 300 + fi) * 1.5)]); }
      else { const [x, y] = GROUND_PETS[gi++ % 3]; blit(g, fr, x, y); }
    }

    // hero
    syncHero(s.hero);
    const striking = t < attackUntil;
    if (striking) blit(g, heroS, HERO_X + 3, HERO_Y);
    else blit(g, Math.floor(t / 450) % 2 ? heroB : heroA, HERO_X, HERO_Y);
    if (s.hero.form === 'elemental') for (let i = 0; i < 4; i++) { const a = t / 500 + i * 1.57; P(HERO_X + 16 + Math.round(Math.cos(a) * 13), HERO_Y + 14 + Math.round(Math.sin(a) * 12), i % 2 ? '#a6e4ff' : '#ffffff'); }

    // foe
    syncFoe(s.foe, t);
    const hidden = t >= killAt && t < slideStart;
    if (!hidden) {
      const sp = Math.min(1, (t - slideStart) / 260);
      const slide = sp < 1 ? Math.round(50 * (1 - sp) * (1 - sp)) : 0;
      const kx = t < knockUntil ? 2 : 0;
      const odd = Math.floor((t + 120) / 450) % 2 === 1;
      const x = geo.x + slide + kx, y = geo.y;
      if (auraA && auraB) {
        const au = odd ? auraB : auraA, pulse = 0.35 + 0.2 * Math.sin(t / 260);
        g.globalAlpha = pulse;
        for (const [ax, ay] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [-1, 1], [1, -1]]) blit(g, au, x + ax * geo.scale, y + ay * geo.scale, null, false, geo.scale);
        g.globalAlpha = 1;
      }
      const flash = t < flashUntil;
      const soft = t < softUntil;
      blit(g, flash ? (odd ? flashB : flashA) : soft ? (odd ? softB : softA) : (odd ? art.b : art.a), x, y, null, false, geo.scale);
      if (s.foe.treasure) blit(g, SACK, x - 9, art.fly ? y + geo.h - 6 : GROUND - 10);
      pips(s.foe, geo.cx + slide, Math.max(2, geo.top - 8), t);
    }

    for (const [fr, x, y] of flyers) blit(g, fr, x, y);
    effects(t);

    // fairy
    if (s.fairy) {
      const fxp = Math.round(s.fairy.x * SW + Math.sin(t / 420) * 2), fyp = Math.round(s.fairy.y * SH + Math.sin(t / 260) * 2);
      for (let i = 1; i <= 3; i++) { g.globalAlpha = 0.5 / i; P(fxp - 1 - i * 3 + Math.round(Math.sin(t / 200 + i) * 1), fyp + Math.round(Math.cos(t / 240 + i) * 2), '#fff2ae'); }
      g.globalAlpha = 1;
      blit(g, FAIRY[Math.floor(t / 200) % 2], fxp - 5, fyp - 5);
    }
    g.restore();
    ctx.drawImage(buf, 0, 0, BW, BH, dx, dy, BW * k, BH * k);
  }

  function pips(f: FoeLook, cx: number, y: number, t: number) {
    const list = [...f.immune.map((e) => [e, true] as const), ...f.weak.map((e) => [e, false] as const)];
    if (!list.length) return;
    const gap = f.immune.length && f.weak.length ? 3 : 0;
    const width = list.length * 6 - 1 + gap;
    let x = Math.round(cx - width / 2);
    list.forEach(([e, imm], idx) => {
      if (idx === f.immune.length && gap) x += gap;
      const col = elementColor(e);
      R(x - 1, y - 1, 7, 7, '#120d12');
      R(x, y, 5, 5, imm ? '#e25b5b' : (Math.floor(t / 400) % 2 ? '#fff2ae' : mix(col, '#ffffff', 0.5)));
      R(x + 1, y + 1, 3, 3, col);
      if (imm) { P(x + 1, y + 1, '#120d12'); P(x + 2, y + 2, '#120d12'); P(x + 3, y + 3, '#120d12'); P(x + 3, y + 1, '#120d12'); P(x + 1, y + 3, '#120d12'); }
      else P(x + 2, y + 2, mix(col, '#ffffff', 0.6));
      x += 6;
    });
  }

  function effects(t: number) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const e = fx[i];
      const a = t - e.t0;
      if (a < 0) continue;
      if (e.k === 'spark') {
        const p = a / e.dur;
        if (p >= 1) { fx.splice(i, 1); fx.push({ k: 'burst', x: e.x1, y: e.y1, col: e.col, t0: t, big: false }); softUntil = Math.max(softUntil, t + 70); continue; }
        const arc = (q: number) => [Math.round(e.x0 + (e.x1 - e.x0) * q), Math.round(e.y0 + (e.y1 - e.y0) * q - Math.sin(q * Math.PI) * 12)];
        const [x, y] = arc(p), [xb, yb] = arc(Math.max(0, p - 0.08)), [xc, yc] = arc(Math.max(0, p - 0.16));
        R(x, y, 2, 2, mix(e.col, '#fff6e0', 0.5)); P(xb, yb, e.col); g.globalAlpha = 0.5; P(xc, yc, e.col); g.globalAlpha = 1;
      } else if (e.k === 'burst') {
        const life = e.big ? 320 : 240;
        if (a > life) { fx.splice(i, 1); continue; }
        const r = (e.big ? 3 : 2) + Math.floor(a / 80);
        g.fillStyle = a < 60 ? '#fff6e0' : e.col;
        for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7]]) {
          g.fillRect(Math.round(e.x + ux * r), Math.round(e.y + uy * r), 1, 1);
          if (e.big) g.fillRect(Math.round(e.x + ux * (r + 2)), Math.round(e.y + uy * (r + 2)), 1, 1);
        }
        if (a < 90) { g.fillStyle = e.col; g.fillRect(e.x - 1, e.y - 1, 3, 3); g.fillStyle = '#fff6e0'; g.fillRect(e.x, e.y, 1, 1); }
      } else if (e.k === 'trail') {
        if (a > 200) { fx.splice(i, 1); continue; }
        const p = a / 200, cx = HERO_X + 34, cy = HERO_Y + 20, rad = e.crit ? 13 : 11;
        g.fillStyle = e.col;
        for (let s = 0; s < 14; s++) {
          const q = s / 13;
          if (q > p * 1.6 || q < p * 1.6 - 0.9) continue;
          const ang = -1.2 + q * 2.2;
          g.fillRect(Math.round(cx + Math.cos(ang) * rad), Math.round(cy + Math.sin(ang) * rad), 1, 1);
          if (e.crit) g.fillRect(Math.round(cx + Math.cos(ang) * (rad - 1)), Math.round(cy + Math.sin(ang) * (rad - 1)), 1, 1);
        }
      } else if (e.k === 'poof') {
        if (a > 420) { fx.splice(i, 1); continue; }
        const p = a / 420;
        for (const [vx, vy, sz] of e.parts) {
          const x = Math.round(e.x + vx * p * 18), y = Math.round(e.y + vy * p * 14 - p * 6);
          const size = Math.max(1, Math.round(sz * (1 - p * 0.6)));
          R(x, y, size, size, p < 0.25 ? '#e8e0d0' : p < 0.6 ? '#8a8490' : '#4a4652');
        }
      }
    }
  }

  // ---------------------------------------------------------------- loop
  let raf = 0, destroyed = false;
  const loop = (t: number) => {
    raf = 0;
    if (destroyed || document.hidden) return;
    frame(t);
    raf = requestAnimationFrame(loop);
  };
  const onVis = () => { if (!document.hidden && !raf && !destroyed) raf = requestAnimationFrame(loop); };
  document.addEventListener('visibilitychange', onVis);
  raf = requestAnimationFrame(loop);

  const flashStrip = (i: number) => {
    const el = host.ownerDocument.querySelector<HTMLElement>(`.px-strip [data-act="ally:${i}"]`);
    if (!el) return;
    el.classList.add('px-hot');
    window.setTimeout(() => el.classList.remove('px-hot'), 160);
  };

  return {
    setScene(s) { scene = s; },
    strike(crit) {
      const t = performance.now();
      attackUntil = t + 220;
      fx.push({ k: 'trail', t0: t, col: crit ? '#fff2ae' : heroTrail, crit });
      if (crit) shakeUntil = t + 140;
    },
    foeHit(element, crit) {
      const t = performance.now();
      if (!geo) return;
      flashUntil = t + (crit ? 170 : 110); knockUntil = t + 100;
      const j = () => Math.round(Math.random() * 6 - 3);
      fx.push({ k: 'burst', x: geo.cx + j(), y: geo.cy + j(), col: elementColor(element), t0: t, big: crit });
      if (crit) fx.push({ k: 'burst', x: geo.cx + j() * 2, y: geo.cy + j() * 2, col: '#fff2ae', t0: t + 50, big: false });
    },
    levelUp(i) {
      const t = performance.now();
      const [x, y] = i < 0 ? [HERO_X + 10, HERO_Y + 8] : namedOrigin(i);
      fx.push({ k: 'burst', x, y, col: '#e0b45a', t0: t, big: true });
      fx.push({ k: 'burst', x, y: y - 6, col: '#fff2b0', t0: t + 90, big: false });
      if (i >= 0) { namedLit.set(i, t + 260); flashStrip(i); }
    },
    namedHit(i, element) {
      const t = performance.now();
      const [x0, y0] = namedOrigin(i);
      const col = elementColor(element);
      namedLit.set(i, t + 120);
      flashStrip(i);
      if (!geo) return;
      const j = () => Math.round(Math.random() * 14 - 7);
      fx.push({ k: 'spark', x0, y0, x1: geo.cx + j(), y1: geo.cy + j(), col, t0: t, dur: y0 > SH ? 380 : 320 });
      if (fx.length > 80) fx.splice(0, fx.length - 80);
    },
    kill() {
      const t = performance.now();
      if (!geo) return;
      const parts: [number, number, number][] = [];
      for (let n = 0; n < 12; n++) { const a = (n / 12) * Math.PI * 2; parts.push([Math.cos(a) * (0.6 + (n % 3) * 0.25), Math.sin(a) * (0.6 + (n % 2) * 0.3), 2 + (n % 3)]); }
      fx.push({ k: 'poof', x: geo.cx, y: geo.cy, t0: t, parts });
      killAt = t; slideStart = t + 160;
    },
    fairyScreen() {
      if (!scene?.fairy) return null;
      const rect = cv.getBoundingClientRect();
      if (!rect.width || !cv.width) return null;
      const css = rect.width / cv.width;
      const fxp = ox + scene.fairy.x * SW + 0.5, fyp = oy + scene.fairy.y * SH + 0.5;
      return { x: rect.left + (dx + fxp * k) * css, y: rect.top + (dy + fyp * k) * css };
    },
    foeScreen() {
      if (!geo) return null;
      const rect = cv.getBoundingClientRect();
      if (!rect.width || !cv.width) return null;
      const css = rect.width / cv.width;
      const top = Math.min(geo.top, geo.y);
      return { x: rect.left + (dx + (ox + geo.x) * k) * css, y: rect.top + (dy + (oy + top) * k) * css, w: geo.w * geo.scale * k * css, h: (geo.y + geo.h - top) * k * css };
    },
    fairyHitTest(x, y) {
      if (!scene?.fairy) return false;
      const rect = cv.getBoundingClientRect();
      if (!rect.width || !cv.width) return false;
      const css = rect.width / cv.width;
      const fxp = ox + scene.fairy.x * SW + 0.5, fyp = oy + scene.fairy.y * SH + 0.5;
      const sx = rect.left + (dx + fxp * k) * css, sy = rect.top + (dy + fyp * k) * css;
      return Math.hypot(x - sx, y - sy) <= 28 + 2 * k * css;
    },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
      cv.remove();
    },
  };
}
