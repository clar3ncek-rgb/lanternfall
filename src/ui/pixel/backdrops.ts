// Layered 180 x 120 pixel backdrops, built once per place and cached, plus per-frame ambient motion.
// Ground line (where feet stand) is y = 92 in every backdrop.
import { REALMS, ZONES } from '../../rules/data';
import { mix, rng } from './core';
import { realmTint } from './palette';

export const SW = 180;
export const SH = 120;
export const GROUND = 92;

type G = CanvasRenderingContext2D;
const canvas = () => { const c = document.createElement('canvas'); c.width = SW; c.height = SH; return c; };
const P = (g: G, x: number, y: number, col: string) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
const R = (g: G, x: number, y: number, w: number, h: number, col: string) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

function bands(g: G, cols: string[], bh: number[]) {
  for (let i = 0; i < cols.length; i++) R(g, 0, bh[i], SW, bh[i + 1] - bh[i], cols[i]);
  for (let i = 1; i < cols.length; i++) for (let x = 0; x < SW; x += 2) { P(g, x, bh[i] - 1, cols[i]); P(g, x + 1, bh[i] - 2, cols[i]); }
}
function stars(g: G, r: () => number, n: number, maxY: number, bright = '#efe4c0', dim = '#6d6278') {
  for (let i = 0; i < n; i++) P(g, Math.floor(r() * SW), 2 + Math.floor(r() * (maxY - 2)), r() < 0.25 ? bright : dim); // rows 0-1 stay clear: they are stretched upward
}
function moon(g: G, mx: number, my: number, rad: number, a = '#e7dbb1', b = '#bfae82', halo = '#3a3150') {
  for (let y = -rad - 5; y <= rad + 5; y++) for (let x = -rad - 5; x <= rad + 5; x++) { const d = Math.hypot(x, y); if (d <= rad + 4 && d > rad + 1 && (x + y) % 2 === 0) P(g, mx + x, my + y, halo); }
  for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) if (Math.hypot(x + 0.5, y + 0.5) <= rad) P(g, mx + x, my + y, Math.hypot(x + rad * 0.45, y - rad * 0.25) < rad * 0.95 ? a : b);
}
function hill(g: G, base: number, amp: number, f: number, ph: number, col: string) {
  for (let x = 0; x < SW; x++) { const top = Math.round(base - amp * Math.sin(x * f + ph) - amp * 0.5 * Math.sin(x * f * 2.3 + ph * 2)); R(g, x, top, 1, SH - top, col); }
}
function ground(g: G, r: () => number, top: number, c: { a: string; b: string; c: string; grass?: string; grass2?: string; speck: string; speck2: string }) {
  R(g, 0, top, SW, SH - top, c.a);
  if (c.grass) R(g, 0, top, SW, 1, c.grass);
  R(g, 0, top + 10, SW, SH - top - 10, c.b); for (let x = 0; x < SW; x += 2) P(g, x, top + 9, c.b);
  R(g, 0, top + 20, SW, SH - top - 20, c.c); for (let x = 1; x < SW; x += 2) P(g, x, top + 19, c.c);
  for (let i = 0; i < 26; i++) P(g, Math.floor(r() * SW), top + 2 + Math.floor(r() * (SH - top - 3)), r() < 0.5 ? c.speck : c.speck2);
  if (c.grass) for (let i = 0; i < 22; i++) { const x = Math.floor(r() * (SW - 4)), col = r() < 0.5 ? c.grass2 ?? c.grass : c.grass; P(g, x, top - 1, col); P(g, x + 1, top - 2, col); P(g, x + 2, top - 1, col); if (r() < 0.5) P(g, x + 3, top - 2, col); }
}

// ---------------------------------------------------------------- the five lands
function graves(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(7);
  bands(g, ['#161220', '#1b1626', '#211b2e', '#282136', '#30283d'], [0, 18, 36, 52, 64, 80]);
  stars(g, r, 40, 58);
  moon(g, 138, 24, 10);
  hill(g, 76, 5, 0.035, 1.2, '#251f30');
  const sil = '#1b1724';
  hill(g, 86, 3, 0.05, 2.5, sil);
  const cross = (x: number, y: number, h: number) => { R(g, x, y, 1, h, sil); R(g, x - 1, y + 1, 3, 1, sil); };
  const stone = (x: number, y: number, w: number, h: number) => { R(g, x, y + 1, w, h - 1, sil); R(g, x + 1, y, w - 2, 1, sil); };
  [[12, 79, 6], [30, 80, 5], [47, 78, 7], [90, 79, 6], [104, 80, 5], [160, 78, 7], [172, 80, 5]].forEach(([x, y, h]) => cross(x, y, h));
  [[20, 81, 3, 4], [38, 81, 4, 5], [66, 80, 3, 5], [96, 82, 4, 3], [118, 80, 3, 5], [150, 81, 4, 4]].forEach(([x, y, w, h]) => stone(x, y, w, h));
  R(g, 76, 64, 2, 20, sil); [[75, 66], [74, 65], [73, 64], [78, 68], [79, 67], [80, 66], [81, 66], [77, 62], [76, 61], [74, 70], [73, 69]].forEach(([x, y]) => P(g, x, y, sil));
  R(g, 126, 70, 1, 14, sil); R(g, 134, 70, 1, 14, sil); R(g, 124, 68, 13, 2, sil); R(g, 129, 66, 3, 2, sil);
  R(g, 129, 71, 3, 3, '#4a3b2a'); P(g, 130, 74, '#e9b949');
  ground(g, r, GROUND, { a: '#2d2a22', b: '#232019', c: '#1b1914', grass: '#3a4630', grass2: '#4c5c3a', speck: '#4a4436', speck2: '#151310' });
  R(g, 4, 82, 9, 12, '#3d3a3e'); R(g, 5, 81, 7, 1, '#3d3a3e'); R(g, 3, 82, 1, 12, '#1b1418'); R(g, 13, 82, 1, 12, '#1b1418'); R(g, 5, 80, 7, 1, '#1b1418');
  P(g, 4, 81, '#1b1418'); P(g, 12, 81, '#1b1418'); R(g, 5, 82, 1, 10, '#57525a'); R(g, 7, 85, 3, 1, '#2a272d'); R(g, 8, 84, 1, 4, '#2a272d');
  R(g, 170, 70, 1, 24, '#1b1418'); R(g, 168, 68, 5, 1, '#1b1418'); R(g, 168, 69, 5, 4, '#a8752a'); R(g, 169, 70, 3, 2, '#fff2ae');
  return c;
}

function forest(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(21);
  bands(g, ['#0f1712', '#131c16', '#17221a', '#1c281f', '#213024'], [0, 20, 38, 54, 66, 82]);
  stars(g, r, 18, 40, '#cfe0b0', '#3e5444');
  moon(g, 40, 22, 7, '#d8e0b8', '#a8b48a', '#22302a');
  // far tree line: jagged firs
  for (let x = 0; x < SW; x += 1) { const h = 10 + Math.round(6 * Math.abs(Math.sin(x * 0.31)) + 4 * Math.sin(x * 0.07)); R(g, x, 78 - h + ((x % 7) < 3 ? 0 : 3), 1, 40, '#18241c'); }
  hill(g, 84, 3, 0.06, 0.4, '#141e17');
  // big near trunks with root flares and branches
  const trunk = (x: number, w: number) => {
    R(g, x, 0, w, GROUND + 2, '#0d130f'); R(g, x + 1, 0, 1, GROUND, '#1a241c');
    for (let i = 0; i < 6; i++) { P(g, x - 1 - i, GROUND - 4 + i, '#0d130f'); P(g, x + w + i, GROUND - 4 + i, '#0d130f'); P(g, x - 1 - i, GROUND - 3 + i, '#0d130f'); P(g, x + w + i, GROUND - 3 + i, '#0d130f'); }
    for (let i = 0; i < 14; i++) { P(g, x + w + i, 20 + Math.floor(i / 2), '#0d130f'); P(g, x - 1 - i, 34 + Math.floor(i / 3), '#0d130f'); }
    for (let y = 22; y < 60; y += 7) { R(g, x + w + 8 + (y % 5), y, 1, 6 + (y % 4), '#2b3a24'); }
  };
  trunk(6, 7); trunk(156, 9); trunk(110, 3);
  // twisted root arches in the mid ground
  for (let x = 30; x < 100; x++) { const y = Math.round(86 - 6 * Math.sin((x - 30) / 70 * Math.PI)); P(g, x, y, '#141e17'); P(g, x, y + 1, '#141e17'); }
  ground(g, r, GROUND, { a: '#232a1d', b: '#1b2117', c: '#141912', grass: '#2f4426', grass2: '#46622e', speck: '#3a4a2c', speck2: '#0f130d' });
  for (let i = 0; i < 6; i++) { const x = 20 + i * 27; for (let k = 0; k < 10; k++) P(g, x + k, GROUND + 4 + Math.round(Math.sin(k / 2 + i) * 1.2), '#2e2418'); }
  // glowing mushrooms
  [[24, GROUND - 2], [140, GROUND - 1], [98, GROUND - 2]].forEach(([x, y]) => { R(g, x, y - 2, 3, 2, '#7ac0a8'); P(g, x + 1, y, '#c8d0b0'); P(g, x + 1, y - 2, '#c8fff0'); });
  return c;
}

function causeway(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(33);
  bands(g, ['#141826', '#181e2e', '#1d2436', '#232c40', '#2a344a'], [0, 18, 34, 50, 62, 76]);
  stars(g, r, 30, 50, '#e0e8f0', '#4a5470');
  moon(g, 30, 20, 8, '#dfe6e8', '#a8b2b8', '#26304a');
  // water to the horizon
  R(g, 0, 70, SW, SH - 70, '#121a28'); R(g, 0, 70, SW, 1, '#2a3a52');
  for (let y = 72; y < SH; y += 3) for (let x = (y * 7) % 11; x < SW; x += 9 + (y % 5)) R(g, x, y, 3 + (x % 3), 1, '#1c2a3e');
  // moon path on the water
  for (let y = 72; y < 90; y += 2) R(g, 26 + ((y * 3) % 5), y, 6 - ((y - 72) >> 3), 1, '#56627a');
  // broken arches far away
  const sil = '#1a2232';
  const arch = (x: number, w: number, top: number) => { R(g, x, top, 3, 70 - top, sil); R(g, x + w, top + 3, 3, 70 - top - 3, sil); for (let i = 0; i <= w; i++) P(g, x + i, top - Math.round(Math.sin((i / w) * Math.PI) * 4), sil); };
  arch(70, 16, 56); arch(92, 14, 58); arch(130, 18, 54); R(g, 112, 62, 3, 8, sil); R(g, 150, 60, 2, 10, sil);
  // the causeway the fight stands on: stone blocks, broken edge, then water below
  R(g, 0, GROUND, SW, 12, '#3a3c42'); R(g, 0, GROUND, SW, 1, '#5a5c64');
  for (let y = GROUND + 3; y < GROUND + 12; y += 4) R(g, 0, y, SW, 1, '#26272c');
  for (let y = GROUND; y < GROUND + 12; y += 4) for (let x = ((y >> 2) % 2) * 6; x < SW; x += 12) R(g, x, y + 1, 1, 3, '#26272c');
  for (let x = 0; x < SW; x++) { const d = 1 + Math.round(2 * Math.abs(Math.sin(x * 0.4)) + (x % 13 === 0 ? 2 : 0)); R(g, x, GROUND + 12, 1, d, '#2c2e34'); }
  for (let i = 0; i < 30; i++) P(g, Math.floor(r() * SW), GROUND + 1 + Math.floor(r() * 10), r() < 0.5 ? '#4c4e56' : '#2a2b30');
  for (let y = GROUND + 16; y < SH; y += 2) for (let x = (y * 5) % 7; x < SW; x += 10) R(g, x, y, 4, 1, '#1a2638');
  // moss on the stones
  for (let i = 0; i < 18; i++) { const x = Math.floor(r() * SW); P(g, x, GROUND, '#3e5a44'); P(g, x + 1, GROUND, '#3e5a44'); }
  return c;
}

function shrine(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(44);
  R(g, 0, 0, SW, SH, '#1c1620');
  // stone blocks
  for (let y = 0; y < GROUND; y += 6) for (let x = (y / 6) % 2 ? -6 : 0; x < SW; x += 12) { R(g, x, y, 11, 5, '#241c29'); R(g, x, y, 11, 1, '#2c2332'); }
  // tall arched window with a dim violet light
  const wx = 72, ww = 36;
  for (let y = 8; y < 70; y++) for (let x = wx; x < wx + ww; x++) {
    const top = 8 + (18 - Math.round(Math.sqrt(Math.max(0, 1 - ((x - wx - ww / 2) / (ww / 2)) ** 2)) * 18));
    if (y >= top) P(g, x, y, (x + y) % 2 ? '#3a2e4e' : '#34294a');
  }
  for (let x = wx; x < wx + ww; x += 9) R(g, x, 14, 1, 56, '#1c1620');
  R(g, wx, 40, ww, 1, '#1c1620');
  for (let y = 18; y < 68; y += 7) for (let x = wx + 3; x < wx + ww; x += 9) P(g, x + (y % 3), y, ['#6a4a8a', '#8a5a5a', '#4a6a8a'][(x + y) % 3]);
  // light shafts
  for (let y = 70; y < GROUND; y++) for (let x = wx - (y - 70); x < wx + ww + (y - 70); x++) if ((x + y) % 3 === 0) P(g, x, y, '#2a2234');
  // pillars
  const pillar = (x: number) => { R(g, x, 0, 14, GROUND, '#2c2433'); R(g, x + 2, 0, 2, GROUND, '#3a3044'); R(g, x + 11, 0, 3, GROUND, '#1e1824'); R(g, x - 2, GROUND - 6, 18, 6, '#2c2433'); R(g, x - 2, 10, 18, 4, '#2c2433'); };
  pillar(18); pillar(148);
  // banners
  const banner = (x: number) => { R(g, x, 16, 10, 30, '#4a1e2a'); R(g, x, 16, 10, 2, '#a8752a'); for (let i = 0; i < 10; i += 2) P(g, x + i, 46, '#4a1e2a'); R(g, x + 4, 26, 2, 8, '#a8752a'); R(g, x + 2, 28, 6, 2, '#a8752a'); };
  banner(46); banner(124);
  // floor tiles
  R(g, 0, GROUND, SW, SH - GROUND, '#2a2128');
  for (let y = GROUND; y < SH; y += 5) for (let x = ((y - GROUND) / 5) % 2 ? 0 : 7; x < SW; x += 14) R(g, x, y, 7, 5, '#241c22');
  R(g, 0, GROUND, SW, 1, '#3e3240');
  for (let i = 0; i < 20; i++) P(g, Math.floor(r() * SW), GROUND + 2 + Math.floor(r() * 26), '#3a2e36');
  // candle stands at the back (flames are animated)
  for (const x of CANDLES) { R(g, x, GROUND - 6, 1, 6, '#d8cdb0'); R(g, x - 1, GROUND - 1, 3, 1, '#4a3b2a'); }
  return c;
}
const CANDLES = [40, 44, 60, 120, 136, 140];

function bell(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(55);
  bands(g, ['#0e0c12', '#121016', '#16131a', '#1a1720', '#1e1a24'], [0, 20, 40, 56, 70, 86]);
  // cavern walls
  for (let y = 0; y < GROUND; y++) { const l = 10 + Math.round(6 * Math.sin(y * 0.12)), rr = 12 + Math.round(5 * Math.sin(y * 0.1 + 2)); R(g, 0, y, l, 1, '#0a080c'); R(g, SW - rr, y, rr, 1, '#0a080c'); }
  // chains
  for (const x of [70, 110]) for (let y = 0; y < 14; y += 2) { P(g, x, y, '#3a3440'); P(g, x + 1, y + 1, '#3a3440'); }
  // the great bell
  const bx = 90, top = 12;
  for (let y = top; y < 62; y++) {
    const t = (y - top) / 50, half = Math.round(14 + 8 * t * t + (y > 56 ? (y - 56) * 2 : 0));
    R(g, bx - half, y, half * 2, 1, '#2a2420');
    R(g, bx - half, y, 2, 1, '#4a3e2e'); R(g, bx + half - 4, y, 4, 1, '#1a1612');
  }
  R(g, bx - 34, 61, 68, 2, '#4a3e2e'); R(g, bx - 30, 30, 60, 1, '#3a3026'); R(g, bx - 31, 44, 62, 1, '#3a3026');
  R(g, bx - 4, 6, 8, 6, '#2a2420'); R(g, bx - 2, 4, 4, 2, '#2a2420');
  // crack
  [[96, 20], [97, 22], [97, 24], [99, 26], [98, 28], [100, 31], [101, 34]].forEach(([x, y]) => P(g, x, y, '#0a080c'));
  // glow under the bell
  for (let y = 63; y < GROUND; y++) for (let x = bx - 40; x < bx + 40; x++) { const d = ((x - bx) / 40) ** 2 + ((y - GROUND) / 26) ** 2; if (d < 1 && (x + y) % 2 === 0) P(g, x, y, d < 0.4 ? '#3a2a20' : '#2a1e18'); }
  ground(g, r, GROUND, { a: '#1f1b1b', b: '#181414', c: '#110e0e', speck: '#3a3030', speck2: '#0a0808' });
  // rubble
  [[12, 88, 6, 4], [30, 90, 4, 2], [150, 87, 7, 5], [166, 89, 5, 3]].forEach(([x, y, w, h]) => { R(g, x, y, w, h, '#2a2426'); R(g, x, y, w, 1, '#3a3234'); });
  return c;
}

// ---------------------------------------------------------------- The Bellrope Descent (fix round: land 6, stages 126-150)
// A narrow shaft under the Bell: soot-black walls, one great rope running down the middle into the dark, a wooden ledge to stand on.
const ROPE = { x: 90, w: 5 };
function bellrope(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(126);
  const { sky, grd } = landCols(5, '#1a1820', '#1c1716');
  const deep = mix(sky, '#000000', 0.6);
  bands(g, [mix(sky, '#3a3040', 0.3), mix(sky, '#000000', 0.15), mix(sky, '#000000', 0.3), mix(sky, '#000000', 0.45), deep], [0, 14, 30, 50, 70, 92]);
  // faint light from the Bell far above
  glow(g, ROPE.x, 0, 30, 22, mix(sky, '#e9b949', 0.18), mix(sky, '#e9b949', 0.08), 0);
  // shaft walls, stone courses, soot streaks
  const wall = mix(sky, '#000000', 0.45), wallL = mix(sky, '#6a5a50', 0.25), wallD = mix(sky, '#000000', 0.7);
  for (let y = 0; y < GROUND; y++) {
    const l = 34 + Math.round(4 * Math.sin(y * 0.09)) + Math.floor(y / 18), rr = 36 + Math.round(4 * Math.sin(y * 0.11 + 1)) + Math.floor(y / 20);
    R(g, 0, y, l, 1, wall); P(g, l - 1, y, wallL); R(g, SW - rr, y, rr, 1, wall); P(g, SW - rr, y, wallL);
    if (y % 6 === 0) { R(g, 0, y, l - 2, 1, wallD); R(g, SW - rr + 2, y, rr - 2, 1, wallD); }
  }
  for (let i = 0; i < 10; i++) { const x = Math.floor(r() * 30), y0 = Math.floor(r() * 60); R(g, x, y0, 1, 10 + Math.floor(r() * 18), wallD); R(g, SW - 1 - x, y0 + 6, 1, 8 + Math.floor(r() * 14), wallD); }
  // iron rings in the walls with short rope ends
  for (const [x, y] of [[30, 26], [146, 40], [34, 58]]) { R(g, x, y, 3, 1, '#4a4450'); P(g, x, y + 1, '#4a4450'); P(g, x + 2, y + 1, '#4a4450'); for (let k = 2; k < 9; k++) P(g, x + 1 + (k > 5 ? 1 : 0), y + k, k % 2 ? '#7a6a4a' : '#5a4a32'); }
  // the great rope (ambient adds the tremble)
  for (let y = 0; y < GROUND + 4; y++) {
    const x = ROPE.x - (ROPE.w >> 1) + Math.round(Math.sin(y * 0.05) * 1);
    R(g, x, y, ROPE.w, 1, '#6a5638'); P(g, x, y, '#9a8258'); P(g, x + ROPE.w - 1, y, '#3a2c1a');
    if ((y + (y >> 2)) % 4 === 0) R(g, x + 1, y, 2, 1, '#4a3a24'); // the twist
  }
  for (const y of [22, 48]) { R(g, ROPE.x - 4, y, 8, 3, '#7a6444'); R(g, ROPE.x - 4, y, 8, 1, '#a08a5c'); } // knots
  // the ledge: rough planks over the drop, the rope passes through a hole in it
  ground(g, r, GROUND, { a: mix(grd, '#5a4a38', 0.25), b: grd, c: mix(grd, '#000000', 0.35), speck: mix(grd, '#8a7050', 0.35), speck2: mix(grd, '#000000', 0.6) });
  R(g, 0, GROUND, SW, 1, mix(grd, '#a08a5c', 0.35));
  for (let x = 0; x < SW; x += 14) R(g, x, GROUND + 1, 1, SH - GROUND, mix(grd, '#000000', 0.45));
  R(g, ROPE.x - 6, GROUND + 1, 12, 4, '#050406'); R(g, ROPE.x - 5, GROUND + 5, 10, 1, '#050406');
  // soot heaps and a dropped clapper
  [[18, 88, 8, 4], [150, 89, 9, 3]].forEach(([x, y, w, h]) => { R(g, x, y, w, h, mix(grd, '#000000', 0.4)); R(g, x + 1, y, w - 2, 1, mix(grd, '#5a5050', 0.3)); });
  R(g, 128, 86, 3, 6, '#5a4a30'); R(g, 127, 91, 5, 2, '#7a6444');
  return c;
}

// ---------------------------------------------------------------- the deep lands (run 3: lands 6 to 12, stages 151-500)
// Each uses its land's sky / ground from data.ts (Deeper copies reuse the base land's art) and one clear landmark.
function landCols(land: number, sky: string, grd: string) { const z = ZONES[land]; return { sky: z?.sky ?? sky, grd: z?.ground ?? grd }; }
function skyBands(g: G, sky: string, lift = '#ffffff') {
  const dark = mix(sky, '#000000', 0.5);
  bands(g, [dark, mix(dark, sky, 0.35), mix(dark, sky, 0.7), sky, mix(sky, lift, 0.08)], [0, 20, 40, 56, 68, 84]);
}
/** Dithered soft glow (checker pixels in two strengths). */
function glow(g: G, cx: number, cy: number, rx: number, ry: number, inner: string, outer: string, y0 = 0, y1 = SH) {
  for (let y = Math.max(y0, cy - ry); y < Math.min(y1, cy + ry); y++) for (let x = Math.max(0, cx - rx); x < Math.min(SW, cx + rx); x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d < 1 && (x + y) % 2 === 0) P(g, x, y, d < 0.35 ? inner : outer);
  }
}
/** Bell body, top centre (bx, top), height h, mouth half-width w. */
function bellShape(g: G, bx: number, top: number, h: number, w: number, body: string, lit: string, dark: string, rim: string) {
  // domed crown, gently widening waist, flared lip
  const halfAt = (t: number) => t < 0.18 ? w * 0.68 * Math.sqrt(Math.max(0.05, 1 - ((0.18 - t) / 0.18) ** 2)) : t < 0.78 ? w * (0.68 + 0.22 * (t - 0.18) / 0.6) : w * (0.9 + 0.55 * ((t - 0.78) / 0.22) ** 1.5);
  for (let y = top; y < top + h; y++) {
    const half = Math.max(1, Math.round(halfAt((y - top) / Math.max(1, h - 1)))), edge = Math.max(1, half >> 2);
    R(g, bx - half, y, half * 2, 1, body); R(g, bx - half, y, edge, 1, lit); R(g, bx + half - edge, y, edge, 1, dark);
  }
  const mh = Math.round(halfAt(1));
  R(g, bx - mh, top + h - 1, mh * 2, 1, rim);
  if (h > 10) R(g, bx - Math.round(halfAt(0.82)), top + Math.round(h * 0.8), Math.round(halfAt(0.82)) * 2, 1, dark);
  R(g, bx - 2, top - 2, 4, 2, body); P(g, bx - 1, top - 3, body); P(g, bx, top - 3, body);
}

const BELFRY = { x: 76, top: 22, water: 64 };
const belfryLean = (y: number) => Math.floor((BELFRY.water - y) / 9);
function drownedBelfry(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(88);
  const { sky, grd } = landCols(6, '#14222c', '#122027');
  skyBands(g, sky, '#7ab0b8');
  stars(g, r, 18, 44, '#c8e8e8', mix(sky, '#6a8a9a', 0.5));
  moon(g, 146, 18, 6, '#cfe0e0', '#98b0b4', mix(sky, '#000000', 0.2));
  const water = mix(sky, '#000000', 0.35), far = mix(sky, '#000000', 0.25);
  // drowned roofs far off
  [[18, 12, 58], [42, 8, 60], [138, 10, 59], [160, 14, 57]].forEach(([x, w, y]) => { for (let i = 0; i <= w; i++) R(g, x + i, y + Math.abs(i - (w >> 1)) * 0.6, 1, BELFRY.water - y, far); });
  R(g, 0, BELFRY.water, SW, GROUND - BELFRY.water, water); R(g, 0, BELFRY.water, SW, 1, mix(sky, '#8ab0b8', 0.3));
  for (let y = BELFRY.water + 3; y < GROUND; y += 3) for (let x = (y * 7) % 13; x < SW; x += 15 + (y % 4)) R(g, x, y, 4, 1, mix(water, sky, 0.6));
  // the tower, leaning, half under the water: pale wet stone so it stands out from the night
  const tw = mix(sky, '#6a8088', 0.32), tl = mix(sky, '#a8c0c4', 0.45), td = mix(sky, '#000000', 0.3);
  const tx = (y: number) => BELFRY.x + belfryLean(y), TW = 24;
  // reflection first (under the tower base), broken by ripples
  for (let y = BELFRY.water + 1; y < GROUND - 1; y += 2) { const m = BELFRY.water - (y - BELFRY.water); if (m < BELFRY.top - 10) break; R(g, tx(m) + ((y >> 1) % 3) - 1, y, TW - 2, 1, mix(water, tw, 0.45)); }
  for (let y = BELFRY.top; y < BELFRY.water; y++) { R(g, tx(y), y, TW, 1, tw); P(g, tx(y), y, tl); R(g, tx(y) + TW - 4, y, 4, 1, td); }
  for (let y = BELFRY.top + 4; y < BELFRY.water; y += 4) for (let x = 2 + ((y >> 2) % 2) * 3; x < TW - 5; x += 6) R(g, tx(y) + x, y, 5, 1, mix(tw, '#000000', 0.25));
  R(g, tx(BELFRY.top) - 1, BELFRY.top, TW + 2, 2, tl); R(g, tx(46) - 1, 46, TW + 2, 2, tl);
  // pointed roof, leaning with the tower, a few slates gone
  for (let y = 4; y < BELFRY.top; y++) {
    const half = Math.round((y - 4) * 0.75) + 1, cx = BELFRY.x + belfryLean(BELFRY.top) + (TW >> 1) + Math.floor((BELFRY.top - y) / 4);
    R(g, cx - half, y, half * 2, 1, td); P(g, cx - half, y, tl);
    if (y > 12 && y < 17) R(g, cx + half - 4, y, 2, 1, mix(sky, '#000000', 0.45));
  }
  // the bell in its arched opening
  for (let y = 24; y < 45; y++) { const x0 = tx(y) + 5, top = y < 28 ? 28 - y : 0; R(g, x0 + top, y, TW - 10 - top * 2, 1, '#05080a'); }
  bellShape(g, tx(30) + (TW >> 1), 29, 14, 5, '#6a5630', '#a8853a', '#3a2c18', '#c8a050');
  // drowned stone floor the fight stands on
  ground(g, r, GROUND, { a: mix(grd, '#5a7078', 0.22), b: grd, c: mix(grd, '#000000', 0.35), speck: mix(grd, '#7ab0b0', 0.35), speck2: mix(grd, '#000000', 0.6) });
  R(g, 0, GROUND, SW, 1, mix(grd, '#8ab0b8', 0.4));
  [[10, 6], [52, 9], [118, 7], [150, 11]].forEach(([x, w]) => { R(g, x, GROUND + 4, w, 2, water); R(g, x + 1, GROUND + 4, w - 3, 1, mix(water, '#8ab0b8', 0.3)); });
  return c;
}

const ROOT = { b: '#3a2c1c', l: '#5a4630', d: '#22190f' };
function rootCathedral(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(99);
  const { sky, grd } = landCols(7, '#1a2618', '#1e2416');
  R(g, 0, 0, SW, SH, mix(sky, '#000000', 0.45));
  for (let y = 0; y < GROUND; y += 6) for (let x = (y / 6) % 2 ? -6 : 0; x < SW; x += 12) R(g, x, y, 11, 1, mix(sky, '#000000', 0.3));
  // the green glow behind the great arch
  const arch = (x0: number, x1: number, yb: number, fill: boolean) => {
    const span = x1 - x0, inside = (x: number, y: number) => y > yb || (Math.hypot(x - x1, y - yb) <= span && Math.hypot(x - x0, y - yb) <= span);
    if (fill) for (let y = 0; y < GROUND; y++) for (let x = x0 + 3; x < x1 - 2; x++) if (inside(x, y)) {
      const d = Math.hypot((x - (x0 + x1) / 2) / span, (y - 44) / 60);
      P(g, x, y, d < 0.22 ? ((x + y) % 2 ? '#3e6a2c' : '#4c7c34') : d < 0.4 ? ((x + y) % 2 ? '#2c4a22' : '#34562a') : (x + y) % 2 ? mix(sky, '#000000', 0.2) : mix(sky, '#2c4a22', 0.4));
    }
    // two arcs of twisted root strands
    for (let a = 0; a <= 61; a += 0.6) {
      const rad = (a * Math.PI) / 180, wob = Math.round(Math.sin(a * 0.5) * 1);
      const lx = Math.round(x1 - span * Math.cos(rad)), rx = Math.round(x0 + span * Math.cos(rad)), y = Math.round(yb - span * Math.sin(rad));
      R(g, lx - 1 + wob, y, 3, 2, ROOT.b); P(g, lx - 1 + wob, y, ROOT.l); R(g, rx - 1 - wob, y, 3, 2, ROOT.b); P(g, rx + 1 - wob, y + 1, ROOT.d);
    }
  };
  arch(62, 118, 58, true); arch(16, 62, 62, false); arch(118, 164, 62, false);
  // rose window of roots in the glow
  for (let a = 0; a < 360; a += 4) { const rad = (a * Math.PI) / 180; P(g, Math.round(90 + 11 * Math.cos(rad)), Math.round(32 + 11 * Math.sin(rad)), ROOT.b); }
  for (let a = 0; a < 360; a += 45) { const rad = (a * Math.PI) / 180; for (let k = 2; k < 11; k++) P(g, Math.round(90 + k * Math.cos(rad)), Math.round(32 + k * Math.sin(rad)), ROOT.d); }
  R(g, 89, 31, 3, 3, '#a0d070'); P(g, 90, 32, '#e0f8b0');
  // pillars: bundles of roots winding round each other, flaring at the floor
  const pillar = (x: number, w: number) => {
    R(g, x + 1, 0, w - 2, GROUND, ROOT.d);
    for (let y = 0; y < GROUND; y++) for (let s = 0; s < 3; s++) { const px = x + (w >> 1) + Math.round(Math.sin(y * 0.16 + s * 2.1) * ((w >> 1) - 1)); R(g, px - 1, y, 2, 1, s ? ROOT.b : ROOT.l); }
    for (let i = 0; i < 7; i++) { P(g, x - i, GROUND - 6 + i, ROOT.b); P(g, x - i, GROUND - 5 + i, ROOT.d); P(g, x + w + i - 1, GROUND - 6 + i, ROOT.b); P(g, x + w + i - 1, GROUND - 5 + i, ROOT.d); }
  };
  pillar(10, 9); pillar(57, 8); pillar(115, 8); pillar(161, 9);
  // hanging root tendrils with moss
  for (const x of [30, 44, 74, 104, 136, 150]) { const len = 10 + ((x * 7) % 12); for (let y = 0; y < len; y++) P(g, x + Math.round(Math.sin(y * 0.4 + x) * 1), y, ROOT.b); P(g, x, len, '#5a7a34'); }
  ground(g, r, GROUND, { a: grd, b: mix(grd, '#000000', 0.25), c: mix(grd, '#000000', 0.45), grass: '#2f4426', grass2: '#46622e', speck: '#3a4a2c', speck2: '#0f130d' });
  for (let i = 0; i < 5; i++) { const x = 8 + i * 38; for (let k = 0; k < 16; k++) P(g, x + k, GROUND + 5 + Math.round(Math.sin(k / 2.5 + i) * 1.5), ROOT.b); }
  return c;
}

const OSS_CANDLES = [70, 110];
function ossuary(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(111);
  const { sky, grd } = landCols(8, '#262320', '#2a251f');
  const wall = mix(sky, '#000000', 0.25), seam = mix(sky, '#000000', 0.45), hi = mix(sky, '#8a7a60', 0.25);
  R(g, 0, 0, SW, SH, wall);
  for (let y = 0; y < GROUND; y += 6) for (let x = (y / 6) % 2 ? -7 : 0; x < SW; x += 14) { R(g, x, y, 13, 1, hi); R(g, x + 13, y, 1, 6, seam); }
  const bone = '#c8bca0', boneD = '#8a806a', eye = '#1a1410', recess = '#0f0c0a', brass = '#a8853a';
  const skull = (x: number, y: number) => { R(g, x + 1, y, 3, 1, bone); R(g, x, y + 1, 5, 2, bone); P(g, x + 1, y + 1, eye); P(g, x + 3, y + 1, eye); P(g, x + 2, y + 2, boneD); R(g, x + 1, y + 3, 3, 1, boneD); };
  const bones = (x: number, y: number, w: number) => { R(g, x + 1, y, w - 2, 1, bone); P(g, x, y - 1, bone); P(g, x, y + 1, bone); P(g, x + w - 1, y - 1, bone); P(g, x + w - 1, y + 1, bone); };
  // niches in rows, each filled with skulls or stacked bones, a name plaque under each
  for (const y of [8, 30, 52]) for (let x = 4; x < SW - 10; x += 18) {
    if (x > 58 && x < 116) continue;
    R(g, x + 1, y, 12, 1, recess); R(g, x, y + 1, 14, 13, recess); R(g, x, y + 14, 14, 1, hi);
    if ((x + y) % 3 === 0) { bones(x + 1, y + 7, 12); bones(x + 1, y + 10, 12); bones(x + 1, y + 12, 12); skull(x + 4, y + 2); }
    else { skull(x + 1, y + 9); skull(x + 8, y + 9); skull(x + 4, y + 4); }
    R(g, x + 4, y + 16, 6, 3, brass); R(g, x + 5, y + 17, 1, 1, eye); R(g, x + 7, y + 17, 2, 1, eye);
  }
  // the great ossuary arch: a wall of skulls stacked to the vault
  const ax = 62, aw = 56;
  for (let y = 4; y < GROUND; y++) for (let x = ax; x < ax + aw; x++) {
    const top = 4 + (16 - Math.round(Math.sqrt(Math.max(0, 1 - ((x - ax - aw / 2) / (aw / 2)) ** 2)) * 16));
    if (y >= top) P(g, x, y, recess); else if (y === top - 1) P(g, x, y, hi);
  }
  for (let row = 0; row < 15; row++) {
    const y = 14 + row * 5, off = row % 2 ? 3 : 0;
    for (let x = ax + 4 + off; x < ax + aw - 8; x += 6) {
      const top = 4 + (16 - Math.round(Math.sqrt(Math.max(0, 1 - ((x + 2 - ax - aw / 2) / (aw / 2)) ** 2)) * 16));
      if (y >= top + 2 && y < GROUND - 4) skull(x, y);
    }
  }
  R(g, 80, 12, 20, 6, brass); R(g, 81, 13, 18, 4, '#6a5020'); for (let x = 83; x < 97; x += 3) R(g, x, 14, 2, 2, '#c8a050');
  R(g, ax - 3, 0, 4, GROUND, seam); R(g, ax + aw - 1, 0, 4, GROUND, seam); R(g, ax - 3, 0, 1, GROUND, hi);
  // vault shadow along the top (rows 0-1 are stretched upward on tall screens, so keep them dark and plain)
  R(g, 0, 0, SW, 2, seam); for (let x = 0; x < SW; x += 2) P(g, x, 2, seam);
  ground(g, r, GROUND, { a: grd, b: mix(grd, '#000000', 0.25), c: mix(grd, '#000000', 0.45), speck: mix(grd, bone, 0.3), speck2: mix(grd, '#000000', 0.6) });
  R(g, 0, GROUND, SW, 1, mix(grd, bone, 0.25));
  for (let y = GROUND + 6; y < SH; y += 7) R(g, 0, y, SW, 1, mix(grd, '#000000', 0.4));
  [[22, GROUND + 9], [140, GROUND + 15], [96, GROUND + 22]].forEach(([x, y]) => bones(x, y, 6));
  skull(156, GROUND + 3);
  for (const x of OSS_CANDLES) { R(g, x, GROUND - 7, 2, 7, '#d8cdb0'); R(g, x - 1, GROUND - 1, 4, 1, '#4a3b2a'); }
  return c;
}

function ashStair(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(122);
  const { sky, grd } = landCols(9, '#2e1a14', '#2a1812');
  skyBands(g, sky, '#f08a24');
  // the embers the stair climbs into
  glow(g, 128, 8, 44, 26, '#b2531c', '#5a2414', 2);
  glow(g, 128, 6, 20, 12, '#f08a24', '#b2531c', 2);
  // cliff walls
  const rock = mix(sky, '#000000', 0.55), rockL = mix(sky, '#b2531c', 0.15);
  for (let y = 0; y < GROUND; y++) {
    const l = 34 + Math.round(8 * Math.sin(y * 0.11) + 4 * Math.sin(y * 0.37)) - Math.floor(y / 6), rr = 30 + Math.round(6 * Math.sin(y * 0.13 + 1)) - Math.floor(y / 8);
    if (l > 0) { R(g, 0, y, l, 1, rock); P(g, l - 1, y, rockL); }
    if (rr > 0) R(g, SW - rr, y, rr, 1, rock);
  }
  // the stair: broad at the bottom, climbing up and right into the glow
  const n = 17;
  for (let i = n - 1; i >= 0; i--) {
    const t = i / (n - 1), y = Math.round(86 - i * 4.4), w = Math.round(56 - i * 2.4), x = Math.round(92 + i * 2.2 - w / 2);
    const face = mix(mix(sky, '#000000', 0.35), '#7a2a18', t * 0.8), tread = mix(mix(sky, '#8a6a5a', 0.3), '#f08a24', t * t * 0.9);
    R(g, x, y, w, 5, face); R(g, x, y, w, 1, tread); R(g, x + w - 2, y, 2, 5, mix(face, '#000000', 0.4));
    if (i % 3 === 1) { P(g, x + 6 + (i * 7) % (w - 10), y + 2, '#f08a24'); P(g, x + 7 + (i * 7) % (w - 10), y + 3, '#b2531c'); }
  }
  // ground of ash with glowing cracks
  ground(g, r, GROUND, { a: grd, b: mix(grd, '#000000', 0.25), c: mix(grd, '#000000', 0.45), speck: '#6a5a54', speck2: mix(grd, '#000000', 0.6) });
  R(g, 0, GROUND, SW, 1, mix(grd, '#8a7a74', 0.35));
  const crack = (x: number, y: number, len: number) => { for (let i = 0; i < len; i++) P(g, x + i, y + Math.round(Math.sin(i * 0.9 + x) * 1.2), i % 3 ? '#b2531c' : '#f08a24'); };
  crack(8, GROUND + 6, 14); crack(118, GROUND + 9, 18); crack(60, GROUND + 18, 12); crack(150, GROUND + 22, 10);
  return c;
}

function silentBells(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(133);
  const { sky, grd } = landCols(10, '#1e1c2c', '#1c1a26');
  R(g, 0, 0, SW, SH, mix(sky, '#000000', 0.35));
  for (let y = 0; y < GROUND; y += 7) for (let x = (y / 7) % 2 ? -8 : 0; x < SW; x += 16) R(g, x, y, 15, 1, mix(sky, '#000000', 0.1));
  // violet light falling from above
  for (let y = 2; y < GROUND; y++) { const half = 14 + Math.floor(y / 3); for (let x = 90 - half; x < 90 + half; x++) if ((x + y) % 2 === 0 && x >= 0 && x < SW) P(g, x, y, y < 40 ? '#3a2e5a' : '#30284c'); }
  glow(g, 90, 0, 22, 16, '#5a4a8a', '#46387a', 2);
  const beam = '#1a1420', beamL = '#3a2e44';
  const row = (by: number, xs: number[], h: number, w: number, body: string, lit: string, dark: string, rim: string) => {
    R(g, 0, by, SW, 3, beam); R(g, 0, by, SW, 1, beamL);
    for (const x of xs) {
      R(g, x, by + 3, 1, 3, '#4a4250');
      bellShape(g, x, by + 8, h, w, body, lit, dark, rim);
      // the open mouth: empty, no clapper
      const mw = Math.round(w * 1.45); R(g, x - mw + 1, by + 8 + h, mw * 2 - 2, 1, '#0a0810'); R(g, x - mw + 3, by + 9 + h, mw * 2 - 6, 1, mix(sky, '#000000', 0.6));
    }
  };
  row(6, [14, 42, 70, 110, 138, 166], 10, 5, '#3a3048', '#5a4a70', '#241c30', '#7a68a0');
  row(30, [24, 60, 120, 156], 16, 7, '#4a3e5a', '#8a72a8', '#2a2236', '#a890d8');
  ground(g, r, GROUND, { a: grd, b: mix(grd, '#000000', 0.25), c: mix(grd, '#000000', 0.45), speck: mix(grd, '#a890d8', 0.3), speck2: mix(grd, '#000000', 0.6) });
  R(g, 0, GROUND, SW, 1, mix(grd, '#a890d8', 0.35));
  for (let y = GROUND + 5; y < SH; y += 6) for (let x = ((y - GROUND) / 6) % 2 ? 0 : 8; x < SW; x += 16) R(g, x, y, 1, 6, mix(grd, '#000000', 0.4));
  for (let y = GROUND + 1; y < GROUND + 12; y++) for (let x = 70; x < 110; x++) if ((x + y) % 3 === 0 && Math.abs(x - 90) < 20 - (y - GROUND)) P(g, x, y, '#3a3058');
  // a fallen bell on the floor, mouth up
  bellShape(g, 160, 82, 8, 3, '#3a3048', '#5a4a70', '#241c30', '#7a68a0');
  return c;
}

function redAssizes(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(144);
  const { sky, grd } = landCols(11, '#2c1418', '#261216');
  skyBands(g, sky, '#b4203c');
  stars(g, r, 10, 30, '#e8b0b0', mix(sky, '#b4203c', 0.3));
  // court wall, open to the storm above
  const wall = mix(sky, '#000000', 0.4), wallL = mix(sky, '#6a3036', 0.3);
  R(g, 0, 40, SW, GROUND - 40, wall);
  for (let x = 0; x < SW; x += 12) { R(g, x, 36, 8, 4, wall); R(g, x, 36, 8, 1, wallL); }
  for (let y = 46; y < GROUND; y += 6) for (let x = (y / 6) % 2 ? -6 : 0; x < SW; x += 12) R(g, x, y, 11, 1, mix(wall, '#000000', 0.25));
  // red banners with a gold scale
  const banner = (x: number) => { R(g, x, 42, 12, 34, '#6a1422'); R(g, x + 9, 42, 3, 34, '#4a0e18'); R(g, x, 42, 12, 2, '#c8a050'); for (let i = 0; i < 12; i += 3) { P(g, x + i + 1, 76, '#6a1422'); } R(g, x + 5, 50, 1, 9, '#c8a050'); R(g, x + 2, 51, 8, 1, '#c8a050'); P(g, x + 2, 54, '#c8a050'); P(g, x + 9, 54, '#c8a050'); R(g, x + 1, 55, 3, 1, '#c8a050'); R(g, x + 8, 55, 3, 1, '#c8a050'); };
  banner(30); banner(130);
  // the judges' bench, raised, with a tall empty chair
  const wood = '#3a1a16', woodL = '#5a2a20', woodD = '#22100e';
  // tall chair back with a pointed top and a gold scale on it
  for (let y = 16; y < 56; y++) { const half = y < 26 ? Math.max(1, Math.round((y - 16) * 0.8)) : 8; R(g, 90 - half, y, half * 2, 1, wood); P(g, 90 - half, y, woodL); P(g, 89 + half, y, woodD); }
  R(g, 89, 13, 2, 3, '#c8a050');
  R(g, 89, 30, 2, 12, '#c8a050'); R(g, 84, 31, 12, 1, '#c8a050'); R(g, 84, 32, 1, 4, '#8a6a30'); R(g, 95, 32, 1, 4, '#8a6a30'); R(g, 82, 36, 5, 1, '#c8a050'); R(g, 93, 36, 5, 1, '#c8a050'); R(g, 86, 42, 8, 1, '#c8a050');
  R(g, 58, 58, 64, 34, wood); R(g, 56, 55, 68, 4, woodL); R(g, 56, 58, 68, 1, woodD);
  for (let x = 62; x < 118; x += 14) { R(g, x, 63, 10, 22, woodD); R(g, x + 1, 64, 8, 20, wood); R(g, x + 1, 64, 8, 1, woodL); }
  R(g, 58, 88, 64, 4, woodD);
  // gallows on the right
  const sil = '#120a0c';
  R(g, 164, 18, 3, GROUND - 18, sil); R(g, 142, 18, 26, 3, sil); for (let i = 0; i < 9; i++) R(g, 156 + i, 20 + i, 2, 1, sil);
  R(g, 164, 21, 1, GROUND - 21, '#4a2228'); R(g, 142, 18, 26, 1, '#4a2228');
  R(g, 147, 21, 1, 16, '#6a5a40'); for (let y = 37; y < 44; y++) { P(g, 145, y, '#6a5a40'); P(g, 149, y, '#6a5a40'); } R(g, 146, 44, 3, 1, '#6a5a40'); R(g, 146, 36, 3, 1, '#6a5a40');
  R(g, 138, 80, 36, 2, sil); R(g, 140, 82, 2, 10, sil); R(g, 170, 82, 2, 10, sil);
  ground(g, r, GROUND, { a: grd, b: mix(grd, '#000000', 0.25), c: mix(grd, '#000000', 0.45), speck: mix(grd, '#b4203c', 0.35), speck2: mix(grd, '#000000', 0.6) });
  R(g, 0, GROUND, SW, 1, mix(grd, '#8a4048', 0.4));
  for (let y = GROUND + 5; y < SH; y += 6) R(g, 0, y, SW, 1, mix(grd, '#000000', 0.35));
  return c;
}

const UC_CANDLES = [62, 70, 110, 118];
function undercroft(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(155);
  const { sky, grd } = landCols(12, '#17151c', '#18141a');
  const back = mix(sky, '#000000', 0.35), stone = mix(sky, '#5a5064', 0.2), stoneL = mix(sky, '#8a7a9a', 0.3), stoneD = mix(sky, '#000000', 0.55);
  R(g, 0, 0, SW, SH, back);
  // far vaults, dimmer
  for (let x = -10; x < SW + 10; x += 28) for (let a = 0; a <= 180; a += 3) { const rad = (a * Math.PI) / 180; P(g, Math.round(x + 14 + 14 * Math.cos(rad)), Math.round(46 - 12 * Math.sin(rad)), mix(back, stone, 0.5)); }
  // low near vaults: ceiling mass, round arches, short thick columns
  const cols = [2, 46, 126, 170];
  R(g, 0, 0, SW, 16, stone); for (let x = 0; x < SW; x += 10) R(g, x, 2, 1, 14, stoneD);
  R(g, 0, 0, SW, 2, stoneD); for (let x = 0; x < SW; x += 2) P(g, x, 2, stoneD);
  for (let i = 0; i < cols.length - 1; i++) {
    const x0 = cols[i] + 8, x1 = cols[i + 1], cx = (x0 + x1) / 2, rad = (x1 - x0) / 2;
    for (let x = x0; x < x1; x++) { const h = Math.round(Math.sqrt(Math.max(0, rad * rad - (x + 0.5 - cx) ** 2)) * 0.8); R(g, x, 16, 1, Math.max(0, 22 - h), stone); P(g, x, 38 - h, stoneL); P(g, x, 37 - h, stoneD); }
  }
  for (const x of cols) { R(g, x, 34, 8, GROUND - 34, stone); R(g, x + 1, 34, 1, GROUND - 34, stoneL); R(g, x + 6, 34, 2, GROUND - 34, stoneD); R(g, x - 2, 32, 12, 3, stoneL); R(g, x - 2, GROUND - 4, 12, 4, stone); }
  // the stolen bell, huge and silent, chained to the columns
  const chain = (x0: number, y0: number, x1: number, y1: number) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i += 2) P(g, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), '#4a4250'); };
  chain(80, 32, 54, 44); chain(100, 32, 126, 44);
  for (let y = 16; y < 22; y += 2) { P(g, 90, y, '#4a4250'); P(g, 91, y + 1, '#4a4250'); }
  glow(g, 90, GROUND, 46, 22, '#2e2422', '#221c20', 0, GROUND);
  bellShape(g, 90, 24, 50, 18, '#4a3e2a', '#7a6640', '#2a2218', '#a8853a');
  // rows of tiny names scratched into the bronze
  for (let y = 34; y < 70; y += 6) { const half = Math.round(18 * (0.68 + 0.22 * ((y - 24) / 50 - 0.18) / 0.6)) - 4; for (let x = 90 - half; x < 90 + half; x += 2) if ((x * 3 + y) % 5 !== 0) P(g, x, y, '#5e4e32'); }
  R(g, 74, 36, 32, 1, '#2a2218'); R(g, 72, 58, 36, 1, '#2a2218');
  ground(g, r, GROUND, { a: grd, b: mix(grd, '#000000', 0.25), c: mix(grd, '#000000', 0.45), speck: mix(grd, '#8a7a9a', 0.3), speck2: mix(grd, '#000000', 0.6) });
  R(g, 0, GROUND, SW, 1, mix(grd, '#8a7a9a', 0.3));
  for (const x of UC_CANDLES) { R(g, x, GROUND - 5, 1, 5, '#d8cdb0'); R(g, x - 1, GROUND - 1, 3, 1, '#4a3b2a'); }
  return c;
}

// ---------------------------------------------------------------- escapes (death realms) and dungeons
function realm(id: string): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(66 + id.length);
  const re = REALMS.find((x) => x.id === id);
  const sky = re?.sky ?? '#1d1a33', grd = re?.ground ?? '#1a1828', tint = realmTint(id);
  const dark = mix(sky, '#000000', 0.55);
  bands(g, [dark, mix(dark, sky, 0.35), mix(dark, sky, 0.65), sky, mix(sky, tint, 0.2)], [0, 20, 40, 56, 68, 84]);
  stars(g, r, id === 'astral' ? 70 : 20, 70, mix(tint, '#ffffff', 0.6), mix(sky, tint, 0.4));
  const sil = mix(dark, '#000000', 0.3), rim = mix(tint, sky, 0.4);
  if (id === 'astral') {
    // ringed planet and floating rocks
    for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) if (Math.hypot(x, y) <= 13) P(g, 140 + x, 26 + y, Math.hypot(x + 5, y - 4) < 12 ? mix(tint, '#ffffff', 0.15) : mix(tint, '#000000', 0.3));
    for (let x = -26; x <= 26; x++) { const y = Math.round(x * 0.25); if (Math.abs(x) > 12 || y > 0) { P(g, 140 + x, 26 + y, '#d8c8ff'); P(g, 140 + x, 27 + y, mix(tint, '#000000', 0.2)); } }
    [[30, 50, 12, 5], [70, 36, 8, 4], [104, 60, 10, 4]].forEach(([x, y, w, h]) => { R(g, x, y, w, h, sil); R(g, x + 1, y + h, w - 2, 2, sil); R(g, x, y, w, 1, rim); });
  } else if (id === 'sea') {
    R(g, 0, 70, SW, 22, mix(sky, '#000000', 0.2));
    for (let y = 72; y < GROUND; y += 3) for (let x = (y * 5) % 9; x < SW; x += 11) R(g, x, y, 4, 1, rim);
    [[20, 50], [150, 46]].forEach(([x, y]) => { R(g, x, y, 3, 30, sil); R(g, x - 4, y + 4, 11, 2, sil); });
  } else {
    // spires: ash = jagged rock, winter = ice shards, court = columns
    for (let i = 0; i < 9; i++) {
      const x = 8 + i * 20 + Math.floor(r() * 8), h = 18 + Math.floor(r() * 26), w = id === 'court' ? 6 : 8;
      for (let y = 0; y < h; y++) {
        const ww = id === 'court' ? w : Math.max(1, Math.round(w * (y / h)));
        R(g, x - (ww >> 1), 84 - h + y, ww, 1, sil);
        if (y % (id === 'court' ? 1 : 2) === 0) P(g, x - (ww >> 1), 84 - h + y, rim);
      }
      if (id === 'court') { R(g, x - 4, 84 - h - 2, 8, 2, sil); R(g, x - 4, 84 - h - 2, 8, 1, rim); }
    }
  }
  hill(g, 88, 2, 0.08, 1, sil);
  ground(g, r, GROUND, { a: grd, b: mix(grd, '#000000', 0.25), c: mix(grd, '#000000', 0.45), speck: mix(grd, tint, 0.4), speck2: mix(grd, '#000000', 0.6) });
  R(g, 0, GROUND, SW, 1, mix(grd, tint, 0.45));
  return c;
}

function dungeon(): HTMLCanvasElement {
  const c = canvas(), g = c.getContext('2d')!, r = rng(77);
  R(g, 0, 0, SW, SH, '#141117');
  for (let y = 0; y < GROUND; y += 7) for (let x = (y / 7) % 2 ? -8 : 0; x < SW; x += 16) { R(g, x, y, 15, 6, (x + y) % 3 ? '#26222c' : '#2a2630'); R(g, x, y, 15, 1, '#34303a'); }
  // receding corridor in the middle
  const steps = [[60, 20, 60, 72], [70, 30, 40, 62], [78, 38, 24, 54], [84, 44, 12, 48]];
  steps.forEach(([x, y, w, h], i) => { R(g, x, y, w, h, ['#18151c', '#121016', '#0d0b10', '#08070a'][i]); R(g, x, y, w, 1, '#34303a'); R(g, x, y, 1, h, '#2a2630'); R(g, x + w - 1, y, 1, h, '#0a090c'); });
  for (let i = 0; i <= 20; i++) { P(g, 60 + i * 3, 20 - Math.round(Math.sin((i / 20) * Math.PI) * 8), '#34303a'); R(g, 60 + i * 3, 20 - Math.round(Math.sin((i / 20) * Math.PI) * 8) + 1, 3, Math.round(Math.sin((i / 20) * Math.PI) * 8), '#18151c'); }
  // torches (flames animated)
  for (const x of TORCHES) { R(g, x - 1, 52, 3, 2, '#3a3026'); R(g, x, 46, 1, 7, '#5a4030'); R(g, x - 1, 45, 3, 1, '#4a3b2a'); }
  // floor slabs with perspective seams
  R(g, 0, GROUND, SW, SH - GROUND, '#24202a');
  R(g, 0, GROUND, SW, 1, '#3a3442');
  for (let y = GROUND + 6; y < SH; y += 8) R(g, 0, y, SW, 1, '#1a171e');
  for (let i = -6; i <= 6; i++) for (let y = GROUND; y < SH; y++) P(g, 90 + i * 14 + Math.round(((y - GROUND) / 28) * i * 6), y, '#1a171e');
  for (let i = 0; i < 24; i++) P(g, Math.floor(r() * SW), GROUND + 2 + Math.floor(r() * 26), '#34303a');
  // chains and bones
  for (let y = 0; y < 26; y += 2) { P(g, 30, y, '#3a3440'); P(g, 31, y + 1, '#3a3440'); P(g, 150, y, '#3a3440'); P(g, 151, y + 1, '#3a3440'); }
  R(g, 20, GROUND + 18, 6, 1, '#b8ae98'); P(g, 19, GROUND + 17, '#b8ae98'); P(g, 26, GROUND + 19, '#b8ae98');
  return c;
}
const TORCHES = [40, 140];

// ---------------------------------------------------------------- public
export type BackdropKind = 'graves' | 'forest' | 'causeway' | 'shrine' | 'bell' | 'bellrope'
  | 'belfry' | 'rootcathedral' | 'ossuary' | 'ashstair' | 'silentbells' | 'assizes' | 'undercroft' | 'realm' | 'dungeon';
export const LAND_KINDS: BackdropKind[] = ['graves', 'forest', 'causeway', 'shrine', 'bell', 'bellrope', 'belfry', 'rootcathedral', 'ossuary', 'ashstair', 'silentbells', 'assizes', 'undercroft'];
const LAND_ART: Partial<Record<BackdropKind, () => HTMLCanvasElement>> = {
  graves, forest, causeway, shrine, bell, bellrope, belfry: drownedBelfry, rootcathedral: rootCathedral, ossuary, ashstair: ashStair, silentbells: silentBells, assizes: redAssizes, undercroft, dungeon,
};

export interface Backdrop { canvas: HTMLCanvasElement; kind: BackdropKind; realm?: string; tint: string }
const bdCache = new Map<string, Backdrop>();
/** `land` is landIndex(stage): 0..12, and Deeper copies past stage 500 already pass their base land. */
export function backdrop(mode: 'world' | 'escape' | 'dungeon', land: number, realmId?: string): Backdrop {
  const kind: BackdropKind = mode === 'dungeon' ? 'dungeon' : mode === 'escape' ? 'realm' : LAND_KINDS[Math.max(0, land)] ?? 'bell';
  const key = kind + (kind === 'realm' ? realmId ?? 'astral' : '');
  let b = bdCache.get(key);
  if (!b) {
    const cv = kind === 'realm' ? realm(realmId ?? 'astral') : (LAND_ART[kind] ?? graves)();
    b = { canvas: cv, kind, realm: realmId, tint: kind === 'realm' ? realmTint(realmId) : '#f08a24' };
    bdCache.set(key, b);
  }
  return b;
}

/** Per-frame ambient motion drawn over the backdrop (scene coordinates). */
export function ambient(g: G, b: Backdrop, t: number): void {
  const fog = (y0: number, h: number, col: string, speed: number) => {
    const off = Math.floor(t / speed);
    g.fillStyle = col;
    for (let y = y0; y < y0 + h; y++) for (let x = 0; x < SW; x++) if (((x + off + y * 3) % 7 === 0) && Math.sin((x + off) * 0.05 + y) > -0.2) g.fillRect(x, y, 1, 1);
  };
  switch (b.kind) {
    case 'graves':
      for (let i = 0; i < 6; i++) { const x = Math.floor((i * 37 + t / 60) % SW), y = Math.floor(88 - ((t / 90 + i * 23) % 40)); P(g, x, y, i % 2 ? '#f08a24' : '#e9b949'); }
      fog(84, 8, '#3a3450', 120);
      break;
    case 'forest':
      for (let i = 0; i < 8; i++) { const x = Math.floor((i * 29 + Math.sin(t / 900 + i) * 6 + 180) % SW), y = Math.floor((t / 70 + i * 17) % 96); P(g, x, y, i % 3 ? '#6a8a3a' : '#a0b050'); }
      for (let i = 0; i < 5; i++) if (Math.sin(t / 400 + i * 2.1) > 0.3) P(g, 20 + i * 33 + Math.round(Math.sin(t / 1300 + i) * 8), 60 + Math.round(Math.cos(t / 1100 + i) * 10) + i * 3, '#e0f080');
      fog(80, 10, '#22302a', 140);
      break;
    case 'causeway': {
      const off = Math.floor(t / 160);
      g.fillStyle = '#3a4a66';
      for (let y = 73; y < 90; y += 4) for (let x = (off + y * 3) % 23; x < SW; x += 23) g.fillRect(x, y, 2, 1);
      for (let y = GROUND + 16; y < SH; y += 4) for (let x = (off * 2 + y) % 19; x < SW; x += 19) g.fillRect(x, y, 3, 1);
      fog(80, 10, '#2a3448', 100);
      break;
    }
    case 'shrine':
      for (const x of CANDLES) { const f = Math.floor(t / 120 + x) % 3; P(g, x, GROUND - 7, '#f08a24'); P(g, x, GROUND - 8, f ? '#fff2ae' : '#f0c040'); if (f === 2) P(g, x, GROUND - 9, '#e9b949'); }
      for (let i = 0; i < 7; i++) P(g, 76 + ((i * 13 + Math.floor(t / 200)) % 30), 30 + ((i * 23 + Math.floor(t / 90)) % 60), '#6a5a7a');
      break;
    case 'bell': {
      for (let i = 0; i < 7; i++) P(g, 30 + ((i * 41) % 120), Math.floor((t / 50 + i * 37) % 92), '#4a4040');
      const pulse = 0.5 + 0.5 * Math.sin(t / 700);
      g.globalAlpha = 0.25 * pulse; R(g, 60, 62, 60, 2, '#e9b949'); g.globalAlpha = 1;
      break;
    }
    case 'bellrope': {
      // the rope trembles (something is climbing), soot drifts down, now and then a dark shape climbs the rope from below
      const shake = Math.sin(t / 160) * (Math.sin(t / 2300) > 0.4 ? 1 : 0);
      for (let y = 0; y < GROUND; y += 3) if ((y + Math.floor(t / 90)) % 9 === 0) P(g, ROPE.x - 2 + Math.round(shake + Math.sin(y * 0.05)), y, '#c0a878');
      for (let i = 0; i < 10; i++) P(g, 40 + ((i * 29 + Math.floor(Math.sin(t / 800 + i) * 3)) % 100), Math.floor((t / 60 + i * 31) % GROUND), i % 3 ? '#3a3236' : '#5a5050');
      const climb = (t / 90) % 140;
      if (climb < 70) { const y = 82 - Math.floor(climb); R(g, ROPE.x - 2, y, 4, 5, '#0c0a0e'); P(g, ROPE.x - 1, y - 1, '#0c0a0e'); P(g, ROPE.x - 3, y + 1, '#0c0a0e'); P(g, ROPE.x + 2, y + 1, '#0c0a0e'); }
      fog(82, 10, '#241e24', 150);
      break;
    }
    case 'belfry': {
      // the rope sways from the bell down into the water; slow rings where it touches; drips
      const sway = Math.sin(t / 1100);
      for (let y = 43; y <= BELFRY.water + 1; y++) { const k = (y - 43) / (BELFRY.water - 43); P(g, BELFRY.x + belfryLean(y) + 12 + Math.round(sway * k * 3 + k * 4), y, y % 3 ? '#a89470' : '#7a6a4a'); }
      const ring = Math.floor(t / 180) % 8, rx = BELFRY.x + 16;
      g.fillStyle = '#4a6a74'; g.fillRect(rx - ring, BELFRY.water + 2 + (ring >> 2), ring * 2 + 1, 1);
      for (let i = 0; i < 4; i++) { const x = 30 + i * 37, y = Math.floor((t / 25 + i * 53) % 40); if (y < 26) P(g, x, BELFRY.water - 26 + y, '#6a9aa4'); }
      fog(80, 10, '#1e3038', 130);
      break;
    }
    case 'rootcathedral': {
      for (let i = 0; i < 9; i++) { const x = Math.floor((i * 21 + Math.sin(t / 700 + i) * 4 + 180) % SW), y = 92 - Math.floor((t / 80 + i * 13) % 90); P(g, x, y, i % 3 ? '#6a9a3a' : '#c0e070'); }
      const pulse = 0.5 + 0.5 * Math.sin(t / 900);
      g.globalAlpha = 0.18 + 0.18 * pulse; R(g, 86, 28, 9, 9, '#a0e070'); g.globalAlpha = 1;
      fog(80, 10, '#1c2a1a', 140);
      break;
    }
    case 'ossuary':
      for (const x of OSS_CANDLES) { const f = Math.floor(t / 120 + x) % 3; P(g, x, GROUND - 8, '#f08a24'); P(g, x + 1, GROUND - 8, '#f0c040'); P(g, x + (f ? 1 : 0), GROUND - 9, f ? '#fff2ae' : '#f0c040'); if (f === 2) P(g, x, GROUND - 10, '#e9b949'); }
      for (let i = 0; i < 6; i++) P(g, 20 + ((i * 31 + Math.floor(t / 300)) % 140), 10 + ((i * 17 + Math.floor(t / 110)) % 80), '#5a5040');
      break;
    case 'ashstair':
      for (let i = 0; i < 14; i++) { // ash drifting down, embers rising off the stair
        if (i % 2) P(g, (i * 13 + Math.floor(t / 70) + 180) % SW, Math.floor((t / 45 + i * 29) % 110), '#7a6a64');
        else P(g, 100 + ((i * 7 + Math.floor(Math.sin(t / 400 + i) * 4)) % 40), 88 - Math.floor((t / 35 + i * 17) % 88), i % 4 ? '#f08a24' : '#ffd080');
      }
      break;
    case 'silentbells': {
      for (let i = 0; i < 8; i++) P(g, (i * 23 + Math.floor(Math.sin(t / 900 + i) * 5) + 180) % SW, 90 - Math.floor((t / 120 + i * 19) % 80), i % 2 ? '#8a72c8' : '#c0a8ff');
      const pulse = 0.5 + 0.5 * Math.sin(t / 1200);
      g.globalAlpha = 0.12 * pulse; R(g, 70, 0, 40, GROUND, '#a890d8'); g.globalAlpha = 1;
      break;
    }
    case 'assizes': {
      const ph = t % 5200;
      if (ph < 260) { // lightning: a bolt in the open sky and a red flash on the walls
        const x0 = Math.floor(t / 5200) % 2 ? 40 : 128;
        g.globalAlpha = ph < 90 ? 0.22 : 0.1; R(g, 0, 0, SW, 40, '#ff8090'); g.globalAlpha = 1;
        const col = ph < 120 ? '#fff0f0' : '#e07080';
        let x = x0;
        for (let y = 0; y < 36; y++) { x += [1, 1, -1, -1, -1, 1, 1, 0, -1][Math.floor(y / 4) % 9] * (y % 4 === 0 ? 2 : 0) + (y % 2); P(g, x - (y >> 1), y, col); if (y === 18) for (let k = 1; k < 7; k++) P(g, x - 9 + k, 18 + k, col); }
      }
      for (let i = 0; i < 6; i++) P(g, 10 + i * 31, Math.floor((t / 28 + i * 41) % 40), '#7a2a34');
      break;
    }
    case 'undercroft':
      for (const x of UC_CANDLES) { const f = Math.floor(t / 130 + x) % 3; P(g, x, GROUND - 6, '#f08a24'); P(g, x, GROUND - 7, f ? '#fff2ae' : '#f0c040'); if (f === 2) P(g, x, GROUND - 8, '#e9b949'); }
      for (let i = 0; i < 6; i++) P(g, 30 + ((i * 41) % 120), Math.floor((t / 60 + i * 37) % 92), '#3a3440');
      g.globalAlpha = 0.18 * (0.5 + 0.5 * Math.sin(t / 900)); R(g, 64, 73, 52, 2, '#e9b949'); g.globalAlpha = 1;
      break;
    case 'realm': {
      const id = b.realm ?? 'astral', col = mix(b.tint, '#ffffff', 0.3);
      for (let i = 0; i < 12; i++) {
        const base = i * 15 + 7;
        if (id === 'ash') P(g, (base + Math.floor(Math.sin(t / 500 + i) * 3) + 180) % SW, 100 - Math.floor((t / 40 + i * 29) % 100), i % 2 ? '#f08a24' : '#ffd080');
        else if (id === 'sea') P(g, base + Math.floor(Math.sin(t / 400 + i) * 2), 110 - Math.floor((t / 70 + i * 19) % 60), '#7ad8d0');
        else if (id === 'winter') P(g, (base + Math.floor(t / 90) + 180) % SW, Math.floor((t / 35 + i * 31) % 110), '#e8f8ff');
        else if (id === 'court') P(g, base, Math.floor((t / 30 + i * 41) % 110), '#b4203c');
        else if (Math.sin(t / 300 + i * 1.7) > 0.4) { P(g, (i * 53) % SW, (i * 29) % 70, col); P(g, (i * 53) % SW + 1, (i * 29) % 70, mix(col, '#000000', 0.5)); }
      }
      break;
    }
    case 'dungeon':
      for (const x of TORCHES) {
        const f = Math.floor(t / 110 + x) % 3;
        for (const [rad, al] of [[11, 0.07], [7, 0.08], [4, 0.1]]) {
          g.globalAlpha = al + 0.02 * f;
          for (let y = -rad; y <= rad; y++) { const w = Math.round(Math.sqrt(rad * rad - y * y)); R(g, x - w, 44 + y, w * 2 + 1, 1, '#f08a24'); }
        }
        g.globalAlpha = 1;
        P(g, x, 44, '#f08a24'); P(g, x - 1, 44, '#b2531c'); P(g, x + 1, 44, '#b2531c'); P(g, x, 43, '#fff2ae'); P(g, x + (f - 1), 42, '#f0c040'); if (f) P(g, x, 41, '#f08a24');
      }
      break;
  }
}
