// 32 px icons: cleric group. Keys are the ids from icon-list.ts (ICON_GROUPS.cleric).
import type { IconDef } from '../icon-kit';
import type { Grid } from '../core';

/** Rays from a centre, n of them, from radius r1 to r2. */
const rays = (g: Grid, cx: number, cy: number, r1: number, r2: number, n: number, c: string, off = 0) => {
  for (let i = 0; i < n; i++) {
    const a = off + (i * Math.PI * 2) / n;
    g.line(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2, c);
  }
};
/** A teardrop flame, point at top, round at the bottom. */
const flame = (g: Grid, cx: number, top: number, bot: number, hw: number, c: string) => {
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / (bot - top);
    const half = t < 0.7 ? hw * Math.sqrt(t / 0.7) : hw * Math.sqrt(Math.max(0, 1 - ((t - 0.7) / 0.3) ** 2));
    g.spans([[y, Math.round(cx - half), Math.round(cx + half)]], c);
  }
};

/** Fill a polygon (pixel centres inside). */
const poly = (g: Grid, pts: [number, number][], c: string) => {
  for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) g.px(x, y, c);
  }
};

export const ICONS: Record<string, IconDef> = {
  // Cleric: a gold sun-ring holding the holy flame
  'class:cleric': { frame: 'holy', art: (g) => {
    rays(g, 13.5, 13.5, 10, 13, 8, 'y', Math.PI / 8);
    rays(g, 13.5, 13.5, 10, 12, 8, 'g');
    g.ellipse(13.5, 13.5, 9, 9, 'G').ellipse(13, 13, 8, 8, 'g').ellipse(13.5, 13.5, 6.5, 6.5, 'D');
    g.px(8, 7, 'y').px(7, 8, 'y').px(9, 6, 'y');
    flame(g, 13.5, 7, 19, 4, 'f');
    flame(g, 13.5, 10, 19, 2.6, 'y');
    flame(g, 13.5, 13, 18, 1.2, 'w');
  } },

  // Rite of Names: an open book of names, a spirit rising from it
  cl0: { frame: 'holy', art: (g) => {
    g.spans([[17, 3, 12], [18, 3, 12], [19, 3, 12], [20, 3, 12], [21, 3, 12], [22, 3, 12], [23, 4, 12]], 't');
    g.spans([[17, 15, 24], [18, 15, 24], [19, 15, 24], [20, 15, 24], [21, 15, 24], [22, 15, 24], [23, 15, 23]], 'T');
    g.spans([[16, 4, 12], [16, 15, 23]], 't').rect(13, 16, 2, 9, 'L');
    g.rect(2, 24, 24, 2, 'R').rect(2, 24, 11, 1, 'r');
    for (const y of [18, 20, 22]) g.line(5, y, 11, y, 'T').line(16, y, 22, y, 'h');
    g.ellipse(14, 7, 4, 4, 'a').rect(10, 7, 9, 4, 'a').spans([[11, 11, 17], [12, 12, 16], [13, 13, 15], [14, 13, 14], [15, 14, 14]], 'a');
    g.spans([[4, 12, 14], [5, 11, 12]], 'w').rect(17, 7, 2, 4, 'A').px(16, 11, 'A');
    g.rect(12, 7, 1, 2, 'e').rect(15, 7, 1, 2, 'e').px(13, 10, 'A').px(14, 10, 'A');
    g.px(6, 5, 'y').px(22, 4, 'y').px(23, 11, 'w').px(4, 11, 'y');
  } },

  // Consecrate: a pillar of light on a blessed ring of ground
  cl1: { frame: 'holy', art: (g) => {
    g.ellipse(13.5, 22, 12, 4, 'G').ellipse(13.5, 21.5, 11, 3, 'g').ellipse(13.5, 22, 8.5, 2.2, 'h');
    g.rect(9, 1, 10, 22, 'g').rect(10, 1, 8, 22, 'y').rect(12, 1, 4, 22, 'w');
    g.ellipse(13.5, 22, 5, 1.4, 'y').ellipse(13.5, 22, 3, 1, 'w');
    for (const [x, y] of [[5, 15], [22, 12], [4, 8], [23, 5], [6, 3]] as const) g.px(x, y, 'y').px(x, y - 1, 'g');
    g.px(21, 18, 'w').px(6, 19, 'w');
  } },

  // Oathbound: a sword, point down, bound in chain
  cl2: { frame: 'phys', art: (g) => {
    g.rect(12, 7, 4, 17, 'm').rect(12, 7, 2, 17, 'n').spans([[24, 12, 15], [25, 13, 14]], 'm').px(13, 26, 'm').px(12, 24, 'n');
    g.rect(15, 7, 1, 17, 'k');
    g.rect(5, 5, 18, 2, 'G').rect(5, 5, 18, 1, 'g').px(4, 5, 'g').px(23, 6, 'G');
    g.rect(12, 1, 4, 4, 'l').rect(15, 1, 1, 4, 'L').rect(12, 0, 4, 1, 'g');
    const chain = (x0: number, y0: number, x1: number, y1: number) => {
      g.line(x0, y0, x1, y1, 'k');
      for (let i = 0; i <= 6; i++) { const x = Math.round(x0 + ((x1 - x0) * i) / 6), y = Math.round(y0 + ((y1 - y0) * i) / 6); g.rect(x - 1, y - 1, 3, 3, 'm').px(x, y, 'e').px(x - 1, y - 1, 'n'); }
    };
    chain(3, 10, 24, 19); chain(3, 19, 24, 10);
    g.px(13, 9, 'w');
  } },

  // Sanctuary: a small chapel, its door lit
  cl3: { frame: 'holy', art: (g) => {
    g.rect(13, 0, 2, 4, 'k').rect(12, 1, 4, 1, 'k').px(13, 0, 'm');
    const roof: [number, number, number][] = [];
    for (let y = 4; y <= 12; y++) roof.push([y, 13 - (y - 4), 14 + (y - 4)]);
    g.spans(roof, 'd').spans(roof.map(([y, a]) => [y, a, 13] as [number, number, number]), 'c');
    g.rect(4, 12, 20, 1, 'D');
    g.rect(6, 13, 16, 12, 'm').rect(18, 13, 4, 12, 'k').rect(6, 13, 16, 1, 'k');
    g.rect(11, 17, 6, 8, 'g').rect(12, 16, 4, 1, 'g').rect(12, 18, 4, 7, 'y').rect(13, 19, 2, 6, 'w');
    g.rect(8, 16, 2, 3, 'y').px(8, 16, 'w').rect(19, 16, 2, 3, 'g');
    g.rect(2, 25, 24, 2, 'V').rect(2, 25, 24, 1, 'v');
    g.spans([[25, 10, 17], [26, 9, 18]], 'y');
    g.px(3, 6, 'y').px(24, 8, 'y').px(22, 3, 'w');
  } },

  // Foresight: an hourglass, its sand stopped in the air
  cl4: { frame: 'magic', art: (g) => {
    g.rect(4, 1, 20, 3, 'l').rect(4, 1, 20, 1, 'g').rect(4, 24, 20, 3, 'l').rect(4, 26, 20, 1, 'L');
    g.rect(5, 4, 2, 20, 'L').rect(21, 4, 2, 20, 'L').rect(5, 4, 1, 20, 'l');
    const glass: [number, number, number][] = [];
    for (let y = 4; y <= 23; y++) { const d = y <= 13 ? (y - 4) * 0.7 : (23 - y) * 0.7; glass.push([y, Math.round(8 + d), Math.round(19 - d)]); }
    g.spans(glass, 'C');
    g.spans([[9, 11, 16], [10, 11, 16], [11, 12, 15], [12, 13, 14]], 'g').spans([[9, 11, 13], [10, 12, 13]], 'y');
    g.spans([[20, 10, 17], [21, 9, 18], [22, 9, 18], [23, 8, 19]], 'g').spans([[22, 14, 18], [23, 15, 19]], 'G').px(13, 19, 'g').px(14, 19, 'g');
    g.px(13, 14, 'y').px(14, 16, 'g').px(13, 17, 'y');
    g.line(9, 5, 11, 7, 'q').px(9, 21, 'q').px(8, 16, 'q');
    g.px(1, 12, 'q').px(26, 8, 'q').px(26, 17, 'w').px(2, 19, 'q');
  } },

  // Clear Sight: prayer beads, a small gold sun hanging from them
  cl5: { frame: 'holy', art: (g) => {
    rays(g, 13.5, 23, 3, 5, 8, 'y', Math.PI / 8);
    for (let k = 0; k < 14; k++) {
      const a = -Math.PI / 2 + (k * Math.PI * 2) / 14;
      if (Math.abs(a - Math.PI / 2) < 0.3) continue;
      const x = 13.5 + Math.cos(a) * 9.5, y = 10.5 + Math.sin(a) * 8.5;
      g.ellipse(x, y, 1.1, 1.1, 'l').px(Math.round(x - 0.5), Math.round(y - 0.5), 'S');
    }
    g.line(13, 19, 13, 20, 'h').line(14, 19, 14, 20, 'h');
    g.ellipse(13.5, 23, 2.6, 2.6, 'G').ellipse(13, 22.5, 2, 2, 'g').px(12, 22, 'y').px(13, 22, 'w');
    g.ellipse(13.5, 10.5, 3, 3, 'y').ellipse(13.5, 10.5, 1.6, 1.6, 'w');
    rays(g, 13.5, 10.5, 4, 6, 8, 'g');
    g.px(3, 3, 'y').px(24, 25, 'y');
  } },

  // Tithe: a bony hand drops a coin into the offering plate
  cl6: { frame: 'gold', art: (g) => {
    g.ellipse(13.5, 21, 12, 4, 'G').ellipse(13.5, 20.5, 11, 3, 'g').ellipse(13.5, 21, 9, 2, 'h');
    g.rect(9, 24, 10, 2, 'G').rect(8, 26, 12, 1, 'h');
    for (const [x, y] of [[10, 20], [15, 20], [13, 19], [18, 21]] as const) g.ellipse(x, y, 2.5, 1.4, 'G').ellipse(x, y - 0.5, 2.5, 1.2, 'g').px(x - 1, y - 1, 'y');
    g.ellipse(13.5, 12, 3, 3, 'g').rect(13, 10, 1, 4, 'G').px(12, 10, 'y').px(12, 11, 'y');
    g.line(15, 15, 15, 16, 'y').line(12, 16, 12, 17, 'y');
    g.rect(21, 1, 6, 2, 'T').rect(21, 1, 6, 1, 't');
    g.rect(17, 3, 6, 3, 't').rect(17, 5, 6, 1, 'T').px(19, 4, 'e').px(21, 4, 'e');
    g.line(17, 6, 15, 9, 't').line(18, 6, 16, 9, 'T').line(21, 6, 17, 10, 't').px(15, 10, 'T');
    g.px(4, 8, 'y').px(6, 13, 'w').px(24, 13, 'y');
  } },

  // Judgement: a flanged mace, ringing
  cl7: { frame: 'holy', art: (g) => {
    g.line(3, 25, 14, 14, 'l').line(4, 25, 15, 14, 'L').line(3, 24, 14, 13, 'l').rect(2, 24, 3, 3, 'g').px(2, 24, 'y');
    g.line(6, 20, 8, 22, 'G');
    g.ellipse(17.5, 9.5, 5, 5, 'm').ellipse(16.5, 8.5, 3, 3, 'n').px(15, 7, 'w');
    for (const [x0, y0, x1, y1] of [[17, 2, 18, 4], [24, 9, 22, 10], [11, 10, 13, 9], [17, 17, 18, 15], [12, 4, 14, 6], [23, 4, 21, 6], [23, 15, 21, 13]] as const) g.line(x0, y0, x1, y1, 'n');
    g.px(18, 2, 'm').px(25, 9, 'm').px(24, 15, 'k').px(18, 17, 'k');
    g.ellipse(18.5, 10.5, 2, 2, 'k').px(19, 11, 'm');
    g.line(26, 2, 26, 6, 'y').line(25, 0, 25, 1, 'y').line(22, 22, 26, 20, 'y').line(20, 25, 24, 24, 'g');
  } },

  // Zeal: a burning heart
  cl8: { frame: 'fire', art: (g) => {
    flame(g, 9, 2, 14, 3, 'f'); flame(g, 18, 1, 14, 3.5, 'f'); flame(g, 13.5, 4, 14, 2.5, 'F');
    flame(g, 9, 6, 13, 1.6, 'y'); flame(g, 18, 5, 13, 2, 'y');
    g.ellipse(9, 13, 5, 5, 'R').ellipse(18, 13, 5, 5, 'R');
    const tip: [number, number, number][] = [];
    for (let y = 14; y <= 25; y++) { const w = 11 - (y - 14); tip.push([y, Math.round(13.5 - w), Math.round(13.5 + w - 1) + 1]); }
    g.spans(tip.filter(([, a, b]) => b >= a), 'R');
    g.ellipse(8.5, 12.5, 4, 4, 'r').ellipse(17, 12.5, 4, 4, 'r');
    const tip2: [number, number, number][] = [];
    for (let y = 14; y <= 23; y++) { const w = 9.5 - (y - 14); tip2.push([y, Math.round(13 - w), Math.round(13 + w - 2)]); }
    g.spans(tip2.filter(([, a, b]) => b >= a), 'r');
    g.rect(6, 10, 2, 3, 'p').px(8, 9, 'p').px(6, 10, 'w');
  } },

  // Purging Flame: a horned skull wreathed in white-gold holy fire
  cl9: { frame: 'fire', art: (g) => {
    flame(g, 6, 5, 22, 4, 'g'); flame(g, 21, 4, 22, 4, 'g'); flame(g, 13.5, 0, 18, 5, 'g');
    flame(g, 6, 9, 21, 2.2, 'y'); flame(g, 21, 8, 21, 2.2, 'y'); flame(g, 13.5, 3, 16, 3, 'y'); flame(g, 13.5, 6, 14, 1.5, 'w');
    g.line(6, 12, 8, 16, 'k').line(5, 12, 7, 16, 'k').px(5, 11, 'm');
    g.line(21, 12, 19, 16, 'k').line(22, 12, 20, 16, 'k').px(22, 11, 'm');
    g.ellipse(13.5, 18, 6, 5, 't').rect(10, 21, 8, 4, 't').rect(17, 15, 2, 9, 'T').rect(10, 24, 8, 1, 'T');
    g.rect(10, 17, 3, 3, 'e').rect(15, 17, 3, 3, 'e').px(11, 18, 'f').px(16, 18, 'f').px(13, 21, 'e').px(14, 21, 'e');
    g.px(11, 23, 'e').px(13, 23, 'e').px(15, 23, 'e');
    g.rect(4, 25, 20, 2, 'F').rect(6, 25, 16, 1, 'f');
  } },

  // Templar: a white kite shield with a red cross
  'sub:cleric:Templar': { frame: 'holy', art: (g) => {
    const sh: [number, number, number][] = [];
    for (let y = 2; y <= 26; y++) { const t = y <= 12 ? 0 : (y - 12) / 14; const w = 10 * Math.sqrt(1 - t * t); sh.push([y, Math.round(13.5 - w), Math.round(13.5 + w - 1) + 1]); }
    g.spans(sh, 'G');
    g.spans(sh.filter(([y]) => y >= 3 && y <= 24).map(([y, a, b]) => [y, a + 1, b - 1] as [number, number, number]), 'n');
    g.spans(sh.filter(([y]) => y >= 3 && y <= 24).map(([y, , b]) => [y, 14, b - 1] as [number, number, number]), 'a');
    g.rect(4, 2, 20, 1, 'g').rect(12, 3, 4, 20, 'r').rect(5, 9, 18, 4, 'r').rect(14, 3, 2, 20, 'R').rect(14, 11, 9, 2, 'R');
    g.px(6, 4, 'w').px(5, 5, 'w').px(6, 5, 'w');
  } },

  // Sworn Shield: a round steel shield, an oath sealed on it in red wax
  'cleric-templar-t5': { frame: 'phys', art: (g) => {
    g.rect(12, 0, 4, 3, 'l').rect(10, 3, 8, 2, 'G').rect(10, 3, 8, 1, 'g').spans([[22, 12, 15], [23, 12, 15], [24, 13, 14], [25, 13, 14]], 'n').px(15, 23, 'm').px(14, 25, 'm');
    g.ellipse(13.5, 13, 9.5, 9.5, 'k').ellipse(13, 12.5, 8.5, 8.5, 'm').ellipse(13.5, 13, 6, 6, 'k').ellipse(13, 12.5, 5, 5, 'm');
    g.ellipse(10.5, 9.5, 2.5, 2.5, 'n').px(9, 8, 'w');
    for (const [x, y] of [[13, 4], [5, 13], [22, 13], [7, 7], [19, 7], [7, 19], [19, 19]] as const) g.px(x, y, 'n');
    g.ellipse(13.5, 13, 3.5, 3.5, 'R').ellipse(13, 12.5, 2.6, 2.6, 'r').ellipse(13.5, 13, 1.2, 1.2, 'R').px(12, 11, 'p');
  } },

  // Oath of the Dead: a skeletal hand raised to swear, in a ghost light
  'cleric-templar-t6': { frame: 'shadow', art: (g) => {
    g.ellipse(13.5, 12, 11, 11, 'X');
    g.ellipse(13.5, 12, 9, 9, 'D');
    for (const [x, top] of [[8, 5], [11, 2], [14, 1], [17, 3]] as const) {
      g.rect(x, top, 2, 11 - top + 3, 't').rect(x + 1, top, 1, 11 - top + 3, 'T').px(x, top + 3, 'e').px(x, top + 7, 'e');
    }
    g.rect(8, 13, 11, 6, 't').rect(15, 13, 4, 6, 'T').px(10, 15, 'e').px(13, 15, 'e').px(16, 15, 'e');
    g.line(19, 15, 22, 11, 't').line(20, 16, 23, 12, 'T').px(23, 10, 't');
    g.rect(10, 19, 2, 8, 't').rect(15, 19, 2, 8, 'T').rect(12, 20, 3, 1, 'T');
    g.px(4, 4, 'x').px(23, 3, 'x').px(3, 18, 'x').px(24, 21, 'x').px(12, 0, 'w');
  } },

  // Host of the Named (ultimate): hooded spirits march under a banner
  'cleric-templar-t7': { frame: 'ult', art: (g) => {
    const ghost = (x: number, y: number, h: number, body: string, shade: string, eye: string) => {
      const sp: [number, number, number][] = [];
      for (let j = 0; j < h; j++) { const w = Math.min(3.5, 1 + j * 0.8); sp.push([y + j, Math.round(x - w), Math.round(x + w)]); }
      g.spans(sp, body).spans(sp.map(([yy, , b]) => [yy, x + 1, b] as [number, number, number]), shade);
      g.rect(x - 1, y + 2, 3, 2, 'e').px(x - 1, y + 3, eye).px(x + 1, y + 3, eye);
      for (let i = x - 3; i <= x + 3; i += 2) g.px(i, y + h, body);
    };
    g.line(3, 1, 3, 26, 'L').rect(4, 2, 7, 6, 'g').rect(4, 7, 7, 1, 'G').spans([[8, 4, 6], [9, 4, 5], [8, 9, 10], [9, 10, 10]], 'G').px(4, 3, 'y').px(3, 0, 'y');
    ghost(15, 3, 10, 'A', 'd', 'x');
    ghost(22, 5, 10, 'A', 'd', 'x');
    ghost(9, 11, 14, 'a', 'A', 'y');
    ghost(19, 12, 14, 'a', 'A', 'y');
    g.px(25, 1, 'y').px(13, 0, 'w');
  } },

  // Oracle: a crystal ball on a gold claw stand
  'sub:cleric:Oracle': { frame: 'magic', art: (g) => {
    g.ellipse(13.5, 11, 10, 10, 'C').ellipse(13, 10.5, 9, 9, 'c').ellipse(12, 9, 5, 5, 'q').ellipse(15, 13, 4, 3, 'C');
    g.rect(8, 6, 2, 3, 'w').px(10, 5, 'w').px(17, 15, 'b').px(18, 14, 'i').px(16, 12, 'b');
    g.spans([[21, 8, 19], [22, 7, 20], [23, 9, 18], [24, 9, 18], [25, 6, 21], [26, 5, 22]], 'G');
    g.spans([[21, 9, 18], [22, 8, 13], [25, 7, 15], [26, 6, 12]], 'g');
    g.line(5, 19, 8, 22, 'g').line(22, 19, 19, 22, 'G').px(5, 18, 'y').px(22, 18, 'g');
    g.px(2, 3, 'q').px(25, 4, 'w').px(24, 6, 'q');
  } },

  // Second Sight: a wide eye, a mana tear falling from it
  'cleric-oracle-t5': { frame: 'magic', art: (g) => {
    rays(g, 13.5, 11, 10, 13, 12, 'q');
    const eye: [number, number, number][] = [];
    for (let y = 4; y <= 18; y++) { const t = (y - 11) / 7.5; const w = 12 * Math.sqrt(Math.max(0, 1 - t * t)) * (1 - 0.25 * Math.abs(t)); eye.push([y, Math.round(13.5 - w), Math.round(13.5 + w - 1) + 1]); }
    g.spans(eye, 'C').spans(eye.filter(([y]) => y >= 5 && y <= 17).map(([y, a, b]) => [y, a + 1, b - 1] as [number, number, number]), 'n');
    g.spans(eye.filter(([y]) => y >= 14 && y <= 17).map(([y, a, b]) => [y, a + 1, b - 1] as [number, number, number]), 'a');
    g.ellipse(13.5, 11, 5, 5, 'B').ellipse(13, 10.5, 4, 4, 'b').ellipse(13.5, 11, 2, 2, 'e').px(11, 8, 'w').px(12, 8, 'w').px(11, 9, 'i');
    g.spans([[20, 13, 14], [21, 13, 14], [22, 12, 15], [23, 12, 15], [24, 12, 15], [25, 13, 14]], 'b').px(13, 21, 'i').px(12, 22, 'i').px(15, 24, 'B');
  } },

  // Augury: a raven in flight, read against the stars
  'cleric-oracle-t6': { frame: 'magic', art: (g) => {
    poly(g, [[8, 17], [15, 16], [9, 9], [2, 2], [4, 10]], 'k');
    poly(g, [[12, 16], [19, 15], [22, 7], [24, 1], [17, 6]], 'D');
    g.line(3, 3, 9, 10, 'm').line(23, 2, 19, 8, 'd');
    poly(g, [[8, 16], [1, 19], [2, 23], [9, 19]], 'D');
    g.ellipse(13, 17, 7, 3, 'k').ellipse(13, 18, 6, 1.5, 'D');
    g.ellipse(21, 15, 2.6, 2.4, 'k').px(22, 14, 'y').spans([[15, 24, 26], [16, 24, 25]], 'G').px(24, 15, 'g');
    g.px(8, 14, 'm').px(11, 15, 'm');
    g.px(16, 25, 'y').px(17, 25, 'g').px(16, 24, 'g').px(4, 25, 'q').px(25, 22, 'w').px(26, 10, 'q').px(9, 1, 'q');
  } },

  // All Futures Close (ultimate): the clock stopped, its face cracked
  'cleric-oracle-t7': { frame: 'ult', art: (g) => {
    g.rect(12, 0, 4, 2, 'G').rect(13, 0, 2, 1, 'g');
    g.ellipse(13.5, 14, 12, 12, 'G').ellipse(13, 13.5, 11, 11, 'g').ellipse(13.5, 14, 9.5, 9.5, 'T').ellipse(13, 13.5, 9, 9, 't');
    for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; g.px(13.5 + Math.cos(a) * 7.5, 14 + Math.sin(a) * 7.5, i % 3 === 0 ? 'e' : 'T'); }
    g.rect(13, 6, 2, 9, 'e').rect(13, 13, 5, 2, 'e').ellipse(13.5, 14, 1.2, 1.2, 'g');
    g.line(19, 5, 17, 9, 'k').line(17, 9, 19, 12, 'k').line(19, 12, 18, 16, 'k').line(18, 16, 21, 19, 'k').line(17, 9, 15, 8, 'k');
    g.px(7, 7, 'w').px(6, 8, 'w').px(8, 6, 'y');
    g.px(2, 2, 'i').px(25, 3, 'i').px(1, 25, 'i').px(26, 26, 'i');
  } },

  // Inquisitor: a tall pointed hood, eyes burning in its shadow
  // Inquisitor: the black book of judgement, an eye on its cover, a flame above it
  'sub:cleric:Inquisitor': { frame: 'blood', art: (g) => {
    flame(g, 13.5, 0, 8, 4, 'f');
    flame(g, 13.5, 3, 8, 2, 'y');
    g.rect(4, 9, 20, 17, 'D').rect(6, 10, 17, 15, 'd').rect(4, 9, 2, 17, 'e');
    g.rect(23, 10, 2, 15, 't').rect(23, 24, 2, 1, 'T');
    g.rect(6, 10, 17, 1, 'G').rect(6, 24, 17, 1, 'G').px(6, 10, 'g').px(22, 10, 'g').px(6, 24, 'g').px(22, 24, 'g');
    g.spans([[15, 11, 18], [16, 9, 20], [17, 8, 21], [18, 9, 20], [19, 11, 18]], 'w');
    g.ellipse(14.5, 17, 2.5, 2.2, 'r').rect(14, 16, 2, 2, 'e').px(13, 15, 'p');
    g.line(8, 13, 9, 14, 'g').line(21, 13, 20, 14, 'g').line(8, 21, 9, 20, 'g').line(21, 21, 20, 20, 'g');
  } },

  // Verdict: the scales of judgement, one pan sinking
  'cleric-inquisitor-t5': { frame: 'holy', art: (g) => {
    g.rect(13, 3, 2, 21, 'G').rect(13, 3, 1, 21, 'g').ellipse(13.5, 2, 1.5, 1.5, 'g').px(13, 1, 'y');
    g.line(2, 8, 25, 4, 'g').line(2, 9, 25, 5, 'G');
    g.spans([[24, 9, 18], [25, 7, 20], [26, 6, 21]], 'G').spans([[24, 9, 13], [25, 7, 12]], 'g');
    g.line(3, 9, 0, 19, 'k').line(3, 9, 6, 19, 'k');
    g.spans([[19, 0, 7], [20, 1, 6], [21, 2, 5]], 'g').spans([[19, 0, 3]], 'y');
    g.line(24, 5, 21, 14, 'k').line(24, 5, 27, 14, 'k');
    g.spans([[14, 20, 27], [15, 21, 26], [16, 22, 25]], 'G').spans([[14, 20, 22]], 'g');
    g.ellipse(4, 17, 2, 1.5, 'r').px(3, 16, 'p').ellipse(23.5, 12, 1.5, 1.5, 'y');
  } },

  // Purifying Brand: a branding iron, its sun-mark white-hot
  'cleric-inquisitor-t6': { frame: 'fire', art: (g) => {
    g.line(2, 25, 8, 19, 'l').line(3, 25, 9, 19, 'L').line(2, 24, 8, 18, 'l').px(1, 25, 'h').px(2, 26, 'h');
    g.line(9, 18, 15, 12, 'k').line(10, 18, 16, 12, 'm');
    rays(g, 19.5, 8.5, 4, 7, 8, 'f');
    g.ellipse(19.5, 8.5, 4, 4, 'F').ellipse(19.5, 8.5, 3, 3, 'f').ellipse(19.5, 8.5, 2, 2, 'y').ellipse(19.5, 8.5, 0.8, 0.8, 'w');
    g.line(23, 18, 24, 21, 'm').line(24, 21, 22, 24, 'k').line(5, 9, 6, 6, 'm').line(6, 6, 4, 3, 'k');
    g.px(12, 6, 'y').px(25, 15, 'f').px(26, 2, 'y');
  } },

  // Sentence of Ash (ultimate): the iron bell tolls once, holy blows break from it, ash falls
  'cleric-inquisitor-t7': { frame: 'ult', art: (g) => {
    rays(g, 13.5, 12, 11, 14, 12, 'y', Math.PI / 12);
    g.rect(12, 1, 4, 2, 'k').rect(13, 1, 2, 1, 'm');
    g.spans([[3, 10, 17], [4, 9, 18], [5, 8, 19], [6, 8, 19], [7, 8, 19], [8, 7, 20], [9, 7, 20], [10, 7, 20], [11, 7, 20], [12, 6, 21], [13, 6, 21], [14, 5, 22], [15, 4, 23], [16, 3, 24]], 'k');
    g.spans([[3, 10, 12], [4, 9, 11], [5, 9, 11], [6, 9, 11], [7, 9, 11], [8, 8, 10], [9, 8, 10], [10, 8, 10], [11, 8, 10], [12, 7, 9], [13, 7, 9], [14, 6, 8]], 'm').rect(10, 4, 1, 6, 'n');
    g.rect(3, 17, 22, 2, 'g').rect(3, 18, 22, 1, 'G').px(3, 17, 'y');
    g.ellipse(13.5, 20.5, 2, 1.5, 'f').px(13, 20, 'y');
    for (const [x, y, c] of [[5, 23, 'T'], [9, 25, 'f'], [17, 24, 'T'], [22, 22, 'f'], [20, 26, 'T'], [2, 26, 'T'], [25, 25, 'f'], [12, 26, 'T']] as const) g.px(x, y, c);
  } },
};
