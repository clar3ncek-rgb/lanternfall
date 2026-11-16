// 32 px icons: formsb group. Keys are the ids from icon-list.ts (ICON_GROUPS.formsb).
import type { IconDef } from '../icon-kit';
import type { Grid } from '../core';

/** Fill a polygon (cell centres, even-odd rule). */
function poly(g: Grid, pts: [number, number][], c: string) {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const X = x + 0.5, Y = y + 0.5;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > Y) !== (yj > Y) && X < ((xj - xi) * (Y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) g.px(x, y, c);
  }
}

/** Paint only where the cell already holds one of `on`. */
function onto(g: Grid, on: string, x: number, y: number, c: string) {
  x = Math.round(x); y = Math.round(y);
  if (on.includes(g.get(x, y))) g.px(x, y, c);
}

/** A flame tongue: tip at (cx, top), base centred at (cx, bottom), half-width w. Layers dark to light. */
function flame(g: Grid, cx: number, top: number, bottom: number, w: number, cols = ['F', 'f', 'g', 'y']) {
  cols.forEach((c, k) => {
    const s = 1 - k * 0.24;
    const t = top + (bottom - top) * k * 0.22;
    for (let y = Math.ceil(t); y <= bottom; y++) {
      const f = (y - t) / (bottom - t + 0.001);
      // teardrop: thin licking tip, widest low down, rounded base
      const hw = w * s * Math.pow(Math.sin(Math.min(f, 1) * Math.PI * 0.82 + 0.05), 1.3);
      const sway = Math.sin(f * 7 + k) * (1 - f) * w * 0.25;
      for (let x = Math.round(cx + sway - hw); x <= Math.round(cx + sway + hw); x++) g.px(x, y, c);
    }
  });
}

/** A zigzag lightning bolt through the given points, 2 px wide (light edge left). */
function bolt(g: Grid, pts: [number, number][], c = 'y', edge = 'g', hi = 'w') {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    g.line(x0 + 1, y0, x1 + 1, y1, edge).line(x0, y0, x1, y1, c);
  }
  g.px(pts[0][0], pts[0][1], hi);
}

/** A skull: cranium centred at (cx, cy), radius r (about 6 to 8). Eyes coloured `eye`. */
function skull(g: Grid, cx: number, cy: number, r: number, eye: string, eyeHi: string) {
  g.ellipse(cx, cy, r, r * 0.92, 't');
  g.rect(Math.round(cx - r * 0.6), Math.round(cy + r * 0.55), Math.round(r * 1.2) + 1, Math.round(r * 0.6) + 1, 't');
  // shade right and lower edge
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (g.get(x, y) !== 't') continue;
    if (x > cx + r * 0.45 || (g.get(x + 1, y) === '.' && x > cx)) g.px(x, y, 'T');
  }
  const ex = r * 0.45, ey = cy + r * 0.12;
  g.ellipse(cx - ex, ey, r * 0.27, r * 0.25, 'e').ellipse(cx + ex, ey, r * 0.27, r * 0.25, 'e');
  g.px(cx - ex, ey, eye).px(cx + ex, ey, eye).px(cx - ex - 0.5, ey - 0.5, eyeHi).px(cx + ex - 0.5, ey - 0.5, eyeHi);
  const ny = Math.round(cy + r * 0.55);
  g.px(cx - 0.5, ny, 'e').px(cx + 0.5, ny, 'e').px(cx - 0.5, ny - 1, 'e');
  const ty = Math.round(cy + r * 0.85);
  for (let x = Math.round(cx - r * 0.5); x <= Math.round(cx + r * 0.5); x += 2) g.px(x, ty, 'T').px(x, ty + 1, 'T');
  g.px(cx - r * 0.55, cy - r * 0.6, 'w').px(cx - r * 0.35, cy - r * 0.75, 'w');
}

export const ICONS: Record<string, IconDef> = {
  // ---------------------------------------------------------------- Draconic
  // Draconic emblem: a red dragon head in profile, horns swept back, ember eye
  'form:draconic': {
    frame: 'fire',
    art: (g) => {
      // neck
      g.spans([[16, 5, 12], [17, 4, 12], [18, 4, 12], [19, 3, 12], [20, 3, 11], [21, 3, 11], [22, 2, 11], [23, 2, 11], [24, 2, 11], [25, 2, 11], [26, 2, 11]], 'r');
      for (let y = 17; y <= 26; y++) g.px(3 + (y > 21 ? -1 : 0), y, 'R');
      for (let y = 17; y <= 26; y++) g.px(10 + (y < 20 ? 1 : 0), y, 'G').px(9 + (y < 20 ? 1 : 0), y, 'g');
      for (const y of [18, 21, 24]) g.px(9, y, 'G').px(10, y, 'h');
      // back spikes
      for (const [x, y] of [[3, 15], [2, 18], [1, 21], [1, 24]] as const) g.px(x, y, 'R').px(x - 1, y - 1, 'R');
      // skull
      g.ellipse(10, 11, 6, 5, 'r');
      // upper snout
      g.spans([[9, 13, 20], [10, 13, 23], [11, 13, 24], [12, 13, 25], [13, 13, 25], [14, 13, 24]], 'r');
      // lower jaw (open a little)
      g.spans([[16, 11, 22], [17, 11, 21], [18, 12, 19]], 'R');
      g.spans([[15, 12, 24]], 'e');
      g.px(15, 16, 't').px(18, 16, 't').px(21, 16, 't').px(17, 14, 't').px(20, 14, 't').px(23, 14, 't');
      // light and shade on head
      g.spans([[7, 7, 12], [8, 6, 14], [9, 6, 8]], 'p').spans([[10, 15, 22]], 'p');
      g.spans([[14, 9, 12], [15, 8, 11]], 'R');
      // brow ridge and eye
      g.spans([[8, 11, 16], [9, 15, 17]], 'R');
      g.rect(13, 10, 3, 2, 'y').px(14, 10, 'e').px(14, 11, 'e').px(13, 10, 'w');
      g.px(24, 11, 'e').px(23, 11, 'R');
      // horns
      g.line(7, 7, 2, 2, 'T').line(8, 7, 3, 2, 't').line(9, 6, 5, 1, 't').line(10, 6, 6, 1, 'T').px(2, 1, 'T');
      // ember
      g.px(26, 9, 'y').px(25, 7, 'f').px(26, 15, 'f');
    },
  },
  // Ancient Wrath: a dragon foot, talons hooked and bared
  'draconic-0': {
    frame: 'blood',
    art: (g) => {
      // scaly leg coming down from the top left
      poly(g, [[2, 1], [11, 1], [15, 12], [5, 15]], 'r');
      g.line(3, 1, 6, 13, 'p').line(11, 1, 14, 11, 'R');
      for (const [x, y] of [[6, 4], [9, 6], [7, 9], [10, 10], [8, 3]] as const) g.px(x, y, 'R');
      // foot
      g.ellipse(12, 14, 6, 3.5, 'r').spans([[11, 8, 13]], 'p').spans([[17, 9, 16]], 'R');
      // dewclaw at the heel
      g.line(6, 16, 4, 19, 't').line(5, 16, 3, 19, 'T').px(3, 20, 'T');
      // three toes, each ending in a big hooked talon
      const toe = (x0: number, y0: number, x1: number, y1: number) => {
        g.line(x0, y0, x1, y1, 'r').line(x0, y0 + 1, x1, y1 + 1, 'R');
        g.rect(x1 + 1, y1 - 1, 2, 3, 't').rect(x1 + 3, y1, 2, 3, 't').rect(x1 + 4, y1 + 3, 2, 2, 't').px(x1 + 5, y1 + 5, 't').px(x1 + 5, y1 + 6, 'T');
        g.px(x1 + 2, y1 + 1, 'T').px(x1 + 4, y1 + 2, 'T').px(x1 + 5, y1 + 4, 'T').px(x1 + 1, y1 - 1, 'w');
      };
      toe(15, 11, 19, 8);
      toe(16, 14, 19, 14);
      toe(13, 17, 15, 20);
      // wrath sparks
      g.px(22, 3, 'f').px(25, 6, 'y').px(3, 24, 'f').px(9, 25, 'p').px(25, 24, 'f');
    },
  },
  // Dragonfire: a roaring cone of dragon breath
  'draconic-1': {
    frame: 'fire',
    art: (g) => {
      const layers: [string, number][] = [['F', 1], ['f', 0.74], ['g', 0.48], ['y', 0.24]];
      for (const [c, s] of layers) {
        for (let x = 2; x <= 26; x++) {
          const t = (x - 2) / 24;
          const hw = (1 + t * 10.5) * s + Math.sin(x * 1.3) * 0.9 * t;
          const cy = 15 - t * 2;
          for (let y = Math.round(cy - hw); y <= Math.round(cy + hw); y++) g.px(x, y, c);
        }
      }
      // ragged tongues at the leading edge
      for (const [x, y] of [[24, 2], [26, 5], [22, 26], [25, 24], [20, 3]] as const) g.px(x, y, 'F');
      g.line(3, 15, 9, 14, 'w');
      // embers
      g.px(5, 7, 'y').px(8, 22, 'f').px(3, 21, 'g').px(11, 4, 'f');
    },
  },
  // Heat Shimmer: the air bends in waves over glowing coals
  'draconic-2': {
    frame: 'fire',
    art: (g) => {
      // coals
      g.ellipse(7, 23, 4, 3, 'F').ellipse(14, 22, 5, 4, 'F').ellipse(21, 23, 4, 3, 'F');
      g.ellipse(6.5, 22.5, 2.5, 1.8, 'f').ellipse(13.5, 21.5, 3.2, 2.5, 'f').ellipse(20.5, 22.5, 2.5, 1.8, 'f');
      g.px(13, 20, 'y').px(14, 21, 'g').px(6, 22, 'g').px(20, 22, 'g').px(12, 21, 'w');
      g.rect(3, 26, 22, 1, 'R');
      // rising waves
      for (const [bx, top, ph] of [[6, 5, 0], [13.5, 2, 1.6], [21, 5, 3.1]] as const) {
        for (let y = top; y <= 17; y++) {
          const amp = 1 + (17 - y) / 8;
          const x = bx + Math.sin(y / 1.8 + ph) * amp;
          g.px(x, y, 'f').px(x + 1, y, 'g');
          if (y < top + 3) g.px(x + 1, y, 'y');
        }
      }
      g.px(4, 2, 'y').px(24, 3, 'y').px(10, 12, 'w');
    },
  },
  // Scaled Hide: a shield of overlapping red dragon scales with a gold rim
  'draconic-3': {
    frame: 'phys',
    art: (g) => {
      const outer: [number, number, number][] = [];
      const inner: [number, number, number][] = [];
      for (let y = 2; y <= 26; y++) {
        const t = y < 15 ? 0 : (y - 15) / 11;
        const hw = 11 - Math.pow(t, 1.6) * 11;
        outer.push([y, Math.round(13.5 - hw), Math.round(13.5 + hw)]);
        if (y > 3 && y < 25) inner.push([y, Math.round(13.5 - hw) + 2, Math.round(13.5 + hw) - 2]);
      }
      g.spans(outer, 'G').spans(inner, 'r');
      g.spans([[2, 3, 24]], 'g').line(3, 2, 3, 15, 'g').line(24, 3, 24, 16, 'h');
      // scale rows
      for (let r = 0; r < 6; r++) {
        const y = 4 + r * 3.5;
        for (let x = 3 + (r % 2) * 2; x < 25; x += 4) {
          onto(g, 'r', x, y + 2, 'R'); onto(g, 'r', x + 1, y + 3, 'R'); onto(g, 'r', x + 2, y + 3, 'R'); onto(g, 'r', x + 3, y + 2, 'R');
          onto(g, 'r', x + 1, y + 1, 'p');
        }
      }
      g.px(6, 5, 'w').px(26 - 3, 9, 'y');
    },
  },
  // Wing Buffet: a dragon wing beats, wind blasts away
  'draconic-4': {
    frame: 'phys',
    art: (g) => {
      // membrane
      poly(g, [[19, 15], [12, 3], [2, 9], [3, 13], [4, 17], [7, 20], [11, 23], [14, 21]], 'r');
      // scalloped trailing edge
      g.ellipse(4, 14, 1.5, 1.5, '.').ellipse(6, 19, 1.6, 1.6, '.').ellipse(11, 21.5, 1.8, 1.4, '.');
      poly(g, [[16, 17], [12, 6], [5, 18], [11, 22]], 'R');
      // bones
      g.line(19, 15, 12, 3, 'T').line(20, 15, 13, 3, 't').px(12, 2, 't');
      for (const [x, y] of [[2, 9], [3, 16], [7, 21], [13, 22]] as const) g.line(12, 4, x, y, 'T');
      g.line(12, 3, 2, 8, 't');
      g.px(11, 1, 'T').px(1, 8, 'T');
      // shoulder
      g.ellipse(20, 16, 2.5, 2.5, 'r').px(19, 15, 'p').px(21, 17, 'R');
      // gusts
      for (const [y, x0, x1] of [[6, 19, 26], [10, 21, 26], [21, 18, 25], [25, 14, 22]] as const) {
        g.line(x0, y, x1, y, 'a').px(x1, y - 1, 'w').px(x0, y, 'w');
      }
      g.line(23, 13, 26, 13, 'A');
    },
  },
  // Hoard Sense: a dragon eye opens above its heap of gold
  'draconic-5': {
    frame: 'gold',
    art: (g) => {
      // eye in the dark
      g.spans([[4, 10, 17], [5, 7, 20], [6, 5, 22], [7, 4, 23], [8, 5, 22], [9, 7, 20], [10, 10, 17]], 'G');
      g.spans([[5, 10, 17], [6, 8, 19], [7, 7, 20], [8, 8, 19], [9, 10, 17]], 'g');
      g.spans([[6, 10, 13], [7, 9, 11]], 'y');
      g.line(13, 4, 13, 10, 'e').line(14, 4, 14, 10, 'e').px(12, 7, 'e').px(15, 7, 'e');
      g.px(10, 6, 'w');
      // hoard
      g.spans([[17, 11, 16], [18, 8, 19], [19, 6, 21], [20, 4, 23], [21, 3, 24], [22, 2, 25], [23, 2, 25], [24, 1, 26], [25, 1, 26], [26, 1, 26]], 'G');
      for (const [x, y] of [[13, 17], [9, 19], [17, 19], [6, 21], [12, 21], [20, 21], [4, 23], [9, 23], [16, 23], [22, 23], [3, 25], [13, 25], [19, 25], [24, 25]] as const) {
        g.rect(x - 1, y, 3, 1, 'g').px(x - 1, y, 'y');
      }
      // a red gem
      g.rect(14, 19, 2, 2, 'r').px(14, 19, 'p').px(15, 20, 'R');
      g.px(7, 17, 'y').px(22, 16, 'y').px(25, 19, 'w');
    },
  },
  // Wyrmscale: one great glossy scale wreathed in fire
  'draconic-t4': {
    frame: 'fire',
    art: (g) => {
      // flames behind
      flame(g, 6, 5, 25, 4);
      flame(g, 21, 4, 25, 4);
      flame(g, 13.5, 1, 25, 5, ['F', 'f']);
      // scale: rounded top, point bottom
      const sp: [number, number, number][] = [];
      for (let y = 5; y <= 25; y++) {
        const hw = y < 13 ? Math.sqrt(Math.max(0, 64 - (13 - y) ** 2)) : 8 * (1 - (y - 13) / 12.5);
        sp.push([y, Math.round(13.5 - hw), Math.round(13.5 + hw)]);
      }
      g.spans(sp, 'R');
      const sp2 = sp.filter(([y]) => y > 5 && y < 24).map(([y, a, b]) => [y, a + 1, b - 1] as [number, number, number]);
      g.spans(sp2, 'r');
      // central ridge and gloss
      g.line(13, 7, 13, 23, 'R').line(14, 7, 14, 22, 'p');
      g.spans([[8, 8, 10], [9, 7, 9], [10, 7, 8], [11, 7, 7]], 'p').px(9, 8, 'w').px(8, 9, 'w');
      g.line(18, 16, 15, 22, 'R');
    },
  },
  // Smouldering Wrath: a cracked coal glowing hotter, smoke curling up
  'draconic-t5': {
    frame: 'fire',
    art: (g) => {
      // smoke
      g.ellipse(11, 6, 3, 2.2, 'k').ellipse(15, 3.5, 2.5, 2, 'k').ellipse(18, 7, 2.2, 1.8, 'k');
      g.px(10, 5, 'm').px(14, 3, 'm').px(17, 6, 'm');
      // coal
      g.ellipse(13.5, 18, 11, 8, 'e').ellipse(13, 17.3, 10, 7, 'k');
      g.spans([[11, 9, 16], [12, 7, 11]], 'm');
      // glowing cracks
      const cracks: [number, number, number, number][] = [[6, 14, 11, 19], [11, 19, 9, 24], [11, 19, 17, 17], [17, 17, 21, 13], [17, 17, 20, 23], [13, 12, 11, 19]];
      for (const [a, b, c, d] of cracks) g.line(a, b, c, d, 'f');
      for (const [a, b, c, d] of cracks) g.line(a + 1, b, c + 1, d, 'F');
      g.px(11, 19, 'y').px(12, 19, 'y').px(17, 17, 'y').px(11, 18, 'w');
      g.px(3, 23, 'f').px(24, 22, 'g').px(23, 11, 'f').px(5, 11, 'y');
    },
  },
  // Elder Wyrm: an ancient bronze wyrm coiled in a ring
  'draconic-t6': {
    frame: 'gold',
    art: (g) => {
      for (let a = 0; a < 360; a += 2) {
        if (a > 280 && a < 320) continue;
        const r = (a * Math.PI) / 180;
        const thick = 3.2 - (a / 360) * 1.4;
        for (let d = -thick; d <= thick; d += 0.5) {
          const x = 13.5 + Math.cos(r) * (9 + d), y = 14 + Math.sin(r) * (9 + d);
          g.px(x, y, d > thick * 0.35 ? 'h' : d < -thick * 0.45 ? 't' : 'G');
        }
      }
      // highlight band along the upper-left
      for (let a = 190; a < 280; a += 2) { const r = (a * Math.PI) / 180; g.px(13.5 + Math.cos(r) * 9.5, 14 + Math.sin(r) * 9.5, 'g'); }
      // ridge spikes
      for (let a = 20; a < 280; a += 30) { const r = (a * Math.PI) / 180; g.px(13.5 + Math.cos(r) * 12.6, 14 + Math.sin(r) * 12.6, 'h'); }
      // head at the gap, biting toward the tail
      g.ellipse(19, 4.5, 3.5, 2.6, 'G').spans([[5, 21, 25], [6, 21, 24]], 'G').px(19, 3, 'g').px(20, 3, 'g');
      g.px(19, 4, 'r').px(20, 4, 'y').line(22, 6, 24, 6, 'e').px(25, 5, 'h');
      g.line(16, 3, 13, 1, 't').line(17, 2, 15, 1, 'T');
      g.px(4, 10, 'y').px(7, 4, 'y');
    },
  },
  // Skyburn (ULTIMATE): a horned dragon in profile breathes a great jet of fire across a burning sky
  'draconic-t7': {
    frame: 'ult',
    art: (g) => {
      // burning sky: dark red above, fire glow low down, a burning horizon
      const band = (y: number) => (y <= 8 ? 'R' : y <= 16 ? 'F' : 'f');
      for (let y = 1; y <= 26; y++) g.rect(1, y, 26, 1, band(y));
      for (const [x, y] of [[20, 3], [24, 5], [3, 20]] as const) g.px(x, y, 'f');
      g.rect(1, 25, 26, 2, 'g');
      for (const [x, h] of [[2, 2], [8, 3], [13, 2], [16, 3]] as const) g.line(x, 26, x, 26 - h, 'y').px(x, 26 - h, 'w');
      const d = 'e';
      // wing raised behind: leading edge up to a spiked wrist, fingers fanning back, dark membrane
      poly(g, [[9, 1], [1, 4], [2.5, 7], [1, 9.5], [3, 11.5], [2.5, 14], [6, 15.5], [11, 14]], 'd');
      g.line(10, 14, 9, 1, d).line(11, 14, 10, 2, d).px(10, 1, d);
      for (const [x, y] of [[1, 4], [1, 9], [2, 14]] as const) g.line(9, 3, x, y + 1, 'D').line(9, 2, x, y, d);
      for (const [x, y] of [[11, 4], [11, 7], [12, 10]] as const) g.px(x + 1, y, d);
      // tail sweeping down and back, spade tip
      g.line(4, 18, 2, 21, d).line(5, 18, 3, 21, d).line(2, 21, 3, 23, d).line(3, 22, 7, 23, d);
      poly(g, [[6.5, 21.5], [9.5, 23.5], [6.5, 24.5]], d);
      // body and clawed legs
      g.ellipse(8, 17, 4.5, 2.4, d);
      g.line(10, 19, 11, 22, d).px(12, 22, d).line(6, 19, 6, 22, d).px(7, 22, d);
      // long neck rising to the head, spines down its back
      poly(g, [[9, 16], [12, 9], [14, 6.5], [16.5, 7.5], [13.5, 11], [12.5, 17]], d);
      for (const [x, y] of [[11, 11], [12, 9], [13, 7]] as const) g.px(x - 1, y - 1, d);
      // horned head in profile, jaws open
      g.ellipse(15, 6.5, 2, 1.7, d);
      g.spans([[5, 16, 19], [6, 16, 20]], d);
      g.line(16, 9, 19, 9, d).line(15, 8, 18, 10, d);
      g.line(14, 5, 11, 2, d).line(15, 5, 13, 1, d).px(12, 1, d);
      g.px(15, 6, 'y').px(16, 6, 'w');
      // the fire jet, roaring down across the sky
      for (const [c, s] of [['g', 1], ['y', 0.6], ['w', 0.25]] as const) {
        for (let k = 0; k <= 15; k++) {
          const t = k / 15;
          const cx = 20 + t * 5, cy = 7.5 + t * 13;
          const hw = (0.7 + t * 4.5) * s;
          for (let dy = -hw; dy <= hw; dy += 0.5) for (let dx = -hw; dx <= hw; dx += 0.5) {
            if (dx * dx + dy * dy <= hw * hw && cx + dx <= 26.4) g.px(cx + dx, cy + dy, c);
          }
        }
      }
      g.px(19, 7, 'y').px(20, 8, 'w');
    },
  },

  // ---------------------------------------------------------------- Undead
  // Undead emblem: a skull over crossed bones, grave-green eyes
  'form:undead': {
    frame: 'shadow',
    art: (g) => {
      for (const [x0, y0, x1, y1] of [[3, 17, 24, 26], [24, 17, 3, 26]] as const) {
        g.line(x0, y0, x1, y1, 't').line(x0, y0 + 1, x1, y1 + 1, 'T');
        g.ellipse(x0, y0, 1.3, 1.3, 't').ellipse(x1, y1 - 0.5, 1.3, 1.3, 't');
      }
      skull(g, 13.5, 10, 8, 'v', 'u');
      g.px(2, 3, 'u').px(25, 4, 'v');
    },
  },
  // Grave Pact: a pact scroll sealed in red wax, blood dripping
  'undead-0': {
    frame: 'blood',
    art: (g) => {
      g.rect(6, 5, 16, 17, 't').rect(19, 5, 3, 17, 'T');
      for (const y of [8, 10, 12, 14]) g.line(8, y, 8 + ((y * 7) % 6) + 7, y, 'T');
      g.line(8, 17, 12, 17, 'T');
      // top and bottom rolls
      g.rect(4, 2, 20, 3, 'T').rect(4, 2, 20, 1, 't').ellipse(4, 3.5, 1.2, 1.6, 'h').ellipse(23.5, 3.5, 1.2, 1.6, 'h');
      g.rect(4, 22, 20, 3, 'T').rect(4, 22, 20, 1, 't').ellipse(4, 23.5, 1.2, 1.6, 'h').ellipse(23.5, 23.5, 1.2, 1.6, 'h');
      // seal
      g.ellipse(17, 17, 3.6, 3.6, 'R').ellipse(16.6, 16.6, 2.8, 2.8, 'r').px(15, 15, 'p').px(16, 15, 'p');
      g.px(17, 17, 'R').px(16, 17, 'R').px(17, 16, 'R').px(18, 17, 'R').px(17, 18, 'R');
      // drips
      g.line(16, 21, 16, 24, 'r').px(16, 25, 'R').line(19, 20, 19, 22, 'r').px(19, 23, 'R');
      g.px(7, 6, 'w');
    },
  },
  // Rot Touch: a rotting green hand, dripping
  'undead-1': {
    frame: 'poison',
    art: (g) => {
      // wrist and palm
      g.rect(10, 19, 8, 8, 'V').rect(10, 19, 3, 8, 'v');
      g.ellipse(13.5, 15, 6, 5, 'V').ellipse(12.5, 14.5, 4.5, 4, 'v');
      // fingers
      for (const [x, top] of [[8, 5], [11, 3], [14, 3], [17, 5]] as const) {
        g.rect(x, top, 2, 11 - top + 1, 'v').rect(x + 1, top, 1, 11 - top + 1, 'V');
        g.px(x, top, 't').px(x + 1, top, 'T').px(x, top + 1, 't');
        g.px(x, top + 4, 'V');
      }
      // thumb
      g.line(7, 15, 3, 10, 'v').line(8, 16, 4, 10, 'V').px(3, 9, 't');
      // exposed bone patch
      g.rect(13, 13, 3, 1, 't').rect(12, 15, 4, 1, 'T');
      // drips and fumes
      g.line(20, 15, 20, 18, 'v').px(20, 19, 'u').line(22, 11, 22, 13, 'v').px(22, 14, 'u');
      g.px(5, 21, 'u').px(4, 24, 'v').px(23, 22, 'u').px(24, 4, 'u').px(4, 4, 'v');
      g.px(9, 6, 'u').px(12, 4, 'u');
    },
  },
  // Mass Grave: a mound crowded with crosses and stones under a pale moon
  'undead-2': {
    frame: 'shadow',
    art: (g) => {
      g.ellipse(20, 6, 4, 4, 'a').ellipse(21.5, 5, 3, 3.2, '.').px(17, 5, 'w');
      // stones and crosses
      g.rect(3, 13, 5, 10, 'm').spans([[12, 4, 6]], 'm').rect(7, 13, 1, 10, 'k');
      g.rect(10, 7, 2, 15, 'm').rect(7, 10, 8, 2, 'm').rect(11, 7, 1, 15, 'k').px(7, 11, 'k').px(14, 11, 'k');
      g.rect(15, 14, 6, 8, 'm').spans([[12, 16, 19], [13, 15, 20]], 'm').rect(20, 13, 1, 9, 'k');
      g.rect(22, 15, 2, 8, 'm').rect(20, 17, 6, 2, 'm').rect(23, 15, 1, 8, 'k').px(25, 18, 'k');
      g.line(4, 15, 6, 15, 'k').line(16, 16, 19, 16, 'k');
      // mound
      g.spans([[21, 4, 23], [22, 2, 25], [23, 1, 26], [24, 1, 26], [25, 1, 26], [26, 1, 26]], 'l');
      g.spans([[24, 1, 26], [25, 1, 26], [26, 1, 26]], 'L').spans([[21, 4, 9], [22, 2, 5]], 'G');
      g.px(4, 13, 'n').px(10, 7, 'n').px(16, 13, 'n').px(22, 15, 'n');
    },
  },
  // Deathless: an hourglass of grave-green sand, a skull on its base
  'undead-3': {
    frame: 'shadow',
    art: (g) => {
      // glass
      g.spans([[4, 7, 20], [5, 7, 20], [6, 8, 19], [7, 8, 19], [8, 9, 18], [9, 10, 17], [10, 11, 16], [11, 12, 15], [12, 13, 14], [13, 13, 14],
        [14, 12, 15], [15, 11, 16], [16, 10, 17], [17, 9, 18], [18, 8, 19], [19, 8, 19], [20, 7, 20], [21, 7, 20]], 'a');
      // sand: a little left on top, a heap below
      g.spans([[9, 11, 16], [10, 12, 15], [11, 13, 14]], 'v').line(13, 12, 13, 19, 'u');
      g.spans([[18, 11, 16], [19, 9, 18], [20, 8, 19], [21, 8, 19]], 'v').spans([[18, 13, 14]], 'u').spans([[20, 16, 19], [21, 15, 19]], 'V');
      g.line(8, 5, 11, 9, 'w').px(9, 17, 'w');
      // frame
      g.rect(4, 2, 20, 2, 'l').rect(4, 22, 20, 2, 'l').rect(4, 2, 20, 1, 'G').rect(4, 23, 20, 1, 'L');
      g.rect(4, 4, 2, 18, 'L').rect(22, 4, 2, 18, 'L').rect(4, 4, 1, 18, 'l');
      // skull plate below
      g.ellipse(13.5, 25, 2.5, 1.5, 't').px(12, 25, 'e').px(15, 25, 'e').px(14, 26, 'T');
      g.px(5, 2, 'y');
    },
  },
  // Skeleton Host: a skeleton soldier, sword raised and shield up
  'undead-4': {
    frame: 'phys',
    art: (g) => {
      // sword raised (right hand)
      g.line(21, 1, 21, 11, 'n').line(22, 1, 22, 11, 'm').px(21, 0, 'w');
      g.rect(19, 12, 6, 1, 'G').rect(21, 13, 2, 2, 'l');
      // skull
      g.ellipse(13.5, 5, 3.5, 3.3, 't').rect(12, 8, 4, 2, 't').px(16, 5, 'T').px(16, 6, 'T');
      g.rect(11, 5, 2, 2, 'e').rect(15, 5, 2, 2, 'e').px(11, 5, 'v').px(16, 5, 'v').px(13, 8, 'e').px(14, 8, 'e');
      // spine and ribs
      g.line(13, 10, 13, 20, 'T').line(14, 10, 14, 20, 't');
      for (const y of [11, 13, 15]) g.line(9, y + 1, 18, y + 1, 'T').line(10, y, 17, y, 't');
      // arms
      g.line(18, 11, 21, 14, 't').line(9, 11, 6, 15, 't');
      // pelvis and legs
      g.rect(10, 20, 8, 2, 't').rect(10, 21, 8, 1, 'T');
      g.line(11, 22, 9, 26, 't').line(16, 22, 18, 26, 't').line(12, 22, 10, 26, 'T').line(17, 22, 19, 26, 'T');
      g.rect(7, 26, 3, 1, 't').rect(18, 26, 3, 1, 't');
      // shield (left arm)
      g.spans([[12, 2, 8], [13, 2, 8], [14, 2, 8], [15, 2, 8], [16, 2, 8], [17, 2, 8], [18, 3, 7], [19, 4, 6], [20, 5, 5]], 'k');
      g.spans([[13, 3, 7], [14, 3, 7], [15, 3, 7], [16, 3, 7], [17, 3, 6], [18, 4, 6]], 'l');
      g.line(5, 12, 5, 19, 'G').line(3, 15, 7, 15, 'G').px(3, 13, 'g');
    },
  },
  // Cold Blood: a drop of blood frozen blue, frost crystals around it
  'undead-5': {
    frame: 'cold',
    art: (g) => {
      g.spans([[2, 13, 14], [3, 13, 14], [4, 12, 15], [5, 12, 15], [6, 11, 16], [7, 10, 17], [8, 10, 17], [9, 9, 18], [10, 8, 19]], 'B').ellipse(13.5, 17, 8, 8.5, 'B');
      g.spans([[4, 13, 14], [5, 12, 14], [6, 12, 15], [7, 11, 16], [8, 10, 16], [9, 10, 17], [10, 9, 18]], 'b').ellipse(12.8, 16.2, 7, 7.5, 'b');
      g.rect(8, 12, 2, 6, 'i').px(10, 10, 'i').px(11, 8, 'w').px(8, 13, 'w');
      // frozen cracks
      g.line(13, 14, 16, 18, 'i').line(16, 18, 19, 17, 'i').line(16, 18, 15, 22, 'i');
      // a dark red heart of blood still inside
      g.ellipse(17, 21, 2.2, 1.6, 'R').px(16, 20, 'r');
      // frost
      for (const [x, y] of [[4, 6], [23, 8], [3, 22], [24, 23]] as const) {
        g.px(x, y, 'w').px(x - 1, y, 'i').px(x + 1, y, 'i').px(x, y - 1, 'i').px(x, y + 1, 'i');
      }
    },
  },
  // Bone Legion: a tattered war banner on a bone pole, poison sigil
  'undead-t4': {
    frame: 'phys',
    art: (g) => {
      // pole
      g.line(6, 4, 6, 26, 't').line(7, 4, 7, 26, 'T');
      g.ellipse(6.5, 26, 1.8, 0.9, 't').ellipse(6.5, 13, 1.6, 0.9, 't');
      g.spans([[1, 6, 7], [2, 5, 8], [3, 5, 8]], 'n').px(5, 3, 'm').px(8, 3, 'k');
      // crossbar
      g.line(4, 5, 23, 5, 'l').line(4, 6, 23, 6, 'L');
      // banner with ragged bottom
      g.rect(8, 7, 14, 13, 'c').rect(19, 7, 3, 13, 'C');
      for (const [x, h] of [[8, 3], [10, 5], [12, 2], [14, 6], [16, 3], [18, 5], [20, 2]] as const) g.rect(x, 20, 2, h, x >= 19 ? 'C' : 'c');
      g.px(9, 22, '.').px(15, 25, '.').px(14, 25, 'C');
      g.line(8, 7, 8, 19, 'q');
      // sigil: a green drop
      g.spans([[10, 15, 15], [11, 14, 16], [12, 13, 17], [13, 13, 17], [14, 13, 17], [15, 14, 16]], 'v').px(14, 12, 'u').px(16, 15, 'V');
      g.px(24, 5, 't').px(3, 5, 't');
    },
  },
  // Grave Echo: a ghost and its echo, each striking twice
  'undead-t5': {
    frame: 'magic',
    art: (g) => {
      const ghost = (ox: number, oy: number, a: string, b: string, eye: string) => {
        g.ellipse(ox + 6, oy + 5, 5.5, 5, a);
        g.rect(ox + 1, oy + 5, 11, 9, a);
        for (let x = ox + 1; x <= ox + 11; x++) g.px(x, oy + 14 + ((x - ox) % 3 === 0 ? 1 : 0), a);
        g.rect(ox + 9, oy + 3, 3, 11, b).px(ox + 9, oy + 15, '.');
        g.rect(ox + 3, oy + 4, 2, 3, eye).rect(ox + 7, oy + 4, 2, 3, eye).ellipse(ox + 6, oy + 10, 1.2, 1.5, eye);
      };
      ghost(13, 2, 'q', 'c', 'C');
      ghost(2, 9, 'a', 'A', 'e');
      g.px(4, 11, 'w').px(5, 10, 'w');
      // echo ripples
      g.line(16, 22, 18, 24, 'q').line(19, 20, 22, 23, 'c').line(22, 18, 25, 21, 'q');
    },
  },
  // Deathlord: a hooded skull wearing an iron-gold crown, violet eyes
  'undead-t6': {
    frame: 'shadow',
    art: (g) => {
      // hood
      g.ellipse(13.5, 14, 11, 11, 'D').rect(3, 14, 22, 13, 'D').ellipse(13.5, 15, 8.5, 9, 'e');
      g.spans([[4, 9, 12], [5, 7, 9], [6, 6, 7]], 'd').line(4, 8, 4, 24, 'd');
      skull(g, 13.5, 14, 6, 'q', 'w');
      // crown
      g.rect(7, 7, 14, 3, 'G').rect(7, 7, 14, 1, 'g');
      for (const x of [7, 11, 16, 20]) g.rect(x, 4, 2, 3, 'g').px(x, 3, 'y');
      g.rect(13, 3, 2, 4, 'g').px(13, 2, 'y');
      g.px(13, 8, 'r').px(14, 8, 'r').px(9, 8, 'c').px(18, 8, 'c');
    },
  },
  // Rise, All of You (ULTIMATE): skeletal arms burst from the graves under a green moon
  'undead-t7': {
    frame: 'ult',
    art: (g) => {
      g.ellipse(4, 4, 2.6, 2.6, 'u').ellipse(5, 3.4, 2, 2, '.').px(2, 4, 'w');
      // arms with open bony hands
      const arm = (bx: number, by: number, tx: number, ty: number) => {
        g.line(bx, by, tx, ty, 't').line(bx + 1, by, tx + 1, ty, 'T');
        g.rect(tx - 1, ty - 3, 4, 3, 't').rect(tx + 2, ty - 3, 1, 3, 'T');
        g.line(tx - 1, ty - 4, tx - 3, ty - 7, 't').line(tx, ty - 4, tx, ty - 8, 't').line(tx + 1, ty - 4, tx + 2, ty - 8, 'T').line(tx + 2, ty - 4, tx + 4, ty - 7, 'T');
        g.line(tx - 2, ty - 1, tx - 4, ty - 3, 't');
      };
      arm(6, 22, 6, 14);
      arm(13, 22, 13, 10);
      arm(20, 22, 21, 15);
      // earth and open graves
      g.rect(1, 21, 26, 6, 'L').rect(1, 21, 26, 1, 'l');
      g.ellipse(6, 22, 3, 1, 'e').ellipse(13.5, 22, 3.5, 1, 'e').ellipse(21, 22, 3, 1, 'e');
      for (const [x, y] of [[3, 24], [9, 25], [17, 24], [24, 25], [12, 26]] as const) g.px(x, y, 'l');
      // grave glow
      g.px(3, 18, 'u').px(10, 16, 'v').px(17, 19, 'u').px(25, 17, 'v').px(9, 4, 'u');
    },
  },

  // ---------------------------------------------------------------- Elemental
  // Elemental emblem: a four-pointed star, one point for each element, a white core
  'form:elemental': {
    frame: 'magic',
    art: (g) => {
      const cx = 13.5, cy = 13.5;
      // points: up fire, right frost, down storm, left stone
      poly(g, [[cx - 4, cy], [cx, 1], [cx + 4, cy]], 'F');
      poly(g, [[cx - 2.5, cy], [cx, 3], [cx + 1, cy]], 'f');
      poly(g, [[cx, cy - 4], [26.5, cy], [cx, cy + 4]], 'B');
      poly(g, [[cx, cy - 2.5], [24, cy], [cx, cy + 1]], 'b');
      poly(g, [[cx - 4, cy], [cx, 26.5], [cx + 4, cy]], 'G');
      poly(g, [[cx - 1, cy], [cx, 24], [cx + 2.5, cy]], 'g');
      poly(g, [[cx, cy - 4], [1, cy], [cx, cy + 4]], 'L');
      poly(g, [[cx, cy - 2.5], [3, cy], [cx, cy + 1]], 'l');
      g.ellipse(cx, cy, 3.4, 3.4, 'q').ellipse(cx, cy, 2.2, 2.2, 'w');
      g.px(13, 3, 'y').px(23, 13, 'i').px(13, 23, 'y').px(4, 13, 'T');
      for (const [x, y] of [[5, 5], [22, 5], [5, 22], [22, 22]] as const) g.px(x, y, 'q');
    },
  },
  // Attunement: a tuning fork ringing with violet waves
  'elemental-0': {
    frame: 'magic',
    art: (g) => {
      // prongs
      g.rect(10, 2, 2, 13, 'n').rect(16, 2, 2, 13, 'm').rect(11, 2, 1, 13, 'm').rect(17, 2, 1, 13, 'k');
      g.spans([[15, 10, 17], [16, 11, 16]], 'm').spans([[15, 10, 12]], 'n');
      // stem and foot
      g.rect(13, 17, 2, 7, 'm').rect(13, 17, 1, 7, 'n').ellipse(13.5, 25, 2.5, 1.2, 'k').px(12, 25, 'm');
      g.px(10, 2, 'w').px(16, 2, 'n');
      // waves
      for (const [r, c] of [[5, 'q'], [8, 'c'], [11, 'C']] as const) {
        for (let a = -50; a <= 50; a += 4) {
          const t = (a * Math.PI) / 180;
          g.px(14 + Math.cos(t) * r + 3, 8 + Math.sin(t) * r, c);
          g.px(13 - Math.cos(t) * r - 3, 8 + Math.sin(t) * r, c);
        }
      }
    },
  },
  // Storm Body: a figure of cloud, lightning crackling through it
  'elemental-1': {
    frame: 'lightning',
    art: (g) => {
      // body of cloud
      g.ellipse(13.5, 6, 3.6, 3.6, 'a');
      g.ellipse(13.5, 14, 6, 5, 'a').ellipse(7, 12, 3, 3, 'a').ellipse(20, 12, 3, 3, 'a');
      g.ellipse(4, 16, 2.4, 2.6, 'a').ellipse(23, 16, 2.4, 2.6, 'a');
      g.ellipse(13.5, 20, 4.5, 3, 'A').ellipse(10, 23, 2.5, 2, 'A').ellipse(17, 23, 2.5, 2, 'A').ellipse(13.5, 25, 2, 1.5, 'A');
      // shade
      g.swap('a', 'A', 17, 9, 10, 12).swap('a', 'A', 21, 14, 6, 6);
      g.px(11, 4, 'w').px(6, 10, 'w').px(12, 3, 'n');
      // eyes
      g.px(12, 6, 'y').px(15, 6, 'y');
      // lightning through the body
      bolt(g, [[14, 9], [11, 14], [15, 15], [12, 21]]);
      bolt(g, [[4, 18], [2, 22], [4, 22], [2, 26]]);
      bolt(g, [[23, 18], [25, 21], [23, 22], [25, 25]]);
    },
  },
  // Overflow: a chalice brimming over with blue mana
  'elemental-2': {
    frame: 'cold',
    art: (g) => {
      // bowl
      g.spans([[8, 4, 23], [9, 4, 23], [10, 5, 22], [11, 5, 22], [12, 6, 21], [13, 7, 20], [14, 9, 18], [15, 11, 16]], 'G');
      g.spans([[8, 5, 22], [9, 5, 21], [10, 6, 20], [11, 6, 19], [12, 7, 17], [13, 9, 15]], 'g');
      g.line(6, 9, 7, 12, 'y');
      // stem and foot
      g.rect(13, 16, 2, 6, 'G').px(13, 16, 'g').px(13, 18, 'g');
      g.spans([[22, 10, 17], [23, 8, 19], [24, 8, 19]], 'G').spans([[22, 11, 14], [23, 9, 13]], 'g');
      // mana surface heaped above the rim
      g.spans([[4, 10, 17], [5, 7, 20], [6, 5, 22], [7, 4, 23]], 'b').spans([[5, 9, 13], [6, 7, 11]], 'i').px(10, 4, 'w');
      g.spans([[7, 15, 22]], 'B');
      // spilling down the sides
      g.line(3, 7, 2, 14, 'b').line(3, 8, 3, 12, 'i').px(2, 15, 'b').px(2, 17, 'i');
      g.line(24, 7, 25, 12, 'b').line(24, 8, 25, 14, 'B').px(25, 16, 'b').px(25, 18, 'b');
      // a puddle
      g.ellipse(4, 25, 2.5, 1, 'b').ellipse(23.5, 25.5, 2.5, 0.8, 'B').px(3, 25, 'i');
      g.px(12, 1, 'i').px(16, 2, 'b');
    },
  },
  // Avatar: a flame split by a lightning bolt
  'elemental-3': {
    frame: 'fire',
    art: (g) => {
      flame(g, 13.5, 1, 26, 10);
      g.ellipse(13.5, 22, 9, 4, 'F').ellipse(13.5, 22, 6.5, 3, 'f');
      g.ellipse(13.5, 21, 3.5, 3, 'g').px(13, 20, 'y');
      // bolt
      const pts: [number, number][] = [[18, 2], [11, 12], [17, 12], [9, 25]];
      for (let i = 0; i < 3; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        g.line(x0 - 1, y0, x1 - 1, y1, 'e').line(x0 + 2, y0, x1 + 2, y1, 'e');
        g.line(x0, y0, x1, y1, 'w').line(x0 + 1, y0, x1 + 1, y1, 'y');
      }
      g.rect(11, 12, 7, 1, 'y').rect(12, 11, 5, 1, 'w');
    },
  },
  // Elemental Surge: a burst of shards in every element's colour
  'elemental-4': {
    frame: 'magic',
    art: (g) => {
      const rays: [number, string, string][] = [[0, 'F', 'f'], [45, 'B', 'i'], [90, 'G', 'g'], [135, 'V', 'v'], [180, 'C', 'q'], [225, 'F', 'f'], [270, 'B', 'i'], [315, 'G', 'g']];
      for (const [deg, dk, lt] of rays) {
        const a = (deg * Math.PI) / 180;
        const len = deg % 90 === 0 ? 12.5 : 10.5;
        const px = -Math.sin(a), py = Math.cos(a);
        poly(g, [[13.5 + px * 2.2, 13.5 + py * 2.2], [13.5 + Math.cos(a) * len, 13.5 + Math.sin(a) * len], [13.5 - px * 2.2, 13.5 - py * 2.2]], dk);
        g.line(13.5 + Math.cos(a) * 3, 13.5 + Math.sin(a) * 3, 13.5 + Math.cos(a) * (len - 1.5), 13.5 + Math.sin(a) * (len - 1.5), lt);
      }
      g.ellipse(13.5, 13.5, 3.5, 3.5, 'y').ellipse(13.5, 13.5, 2, 2, 'w');
      for (const [x, y] of [[4, 8], [22, 4], [24, 20], [6, 23]] as const) g.px(x, y, 'w');
    },
  },
  // Steady Core: a teal crystal plumb bob hanging dead still on its line
  'elemental-5': {
    frame: 'stat',
    art: (g) => {
      // beam it hangs from
      g.rect(5, 1, 18, 2, 'l').rect(5, 1, 18, 1, 'G').rect(5, 2, 18, 1, 'L');
      g.line(13, 3, 13, 8, 'n').line(14, 3, 14, 8, 'm');
      g.rect(11, 8, 6, 2, 'G').rect(11, 8, 6, 1, 'g');
      // crystal: wide shoulder, long point down
      poly(g, [[7, 10], [21, 10], [22.5, 13], [14, 27], [5.5, 13]], 'X');
      poly(g, [[7.5, 10], [14, 10], [14, 26], [6, 13]], 'x');
      g.line(14, 10, 14, 25, 'X').line(6, 13, 22, 13, 'X');
      g.line(9, 11, 13, 11, 'i').line(8, 14, 12, 20, 'i').px(9, 14, 'w').px(10, 11, 'w');
      // level marks either side
      g.line(2, 18, 4, 18, 'g').line(23, 18, 25, 18, 'g').px(3, 17, 'y').px(24, 17, 'y');
    },
  },
  // Living Storm: a black thundercloud splitting the sky with bolts and rain
  'elemental-t4': {
    frame: 'lightning',
    art: (g) => {
      g.ellipse(8, 9, 5, 4.5, 'k').ellipse(15, 6, 6, 5, 'k').ellipse(21, 9, 5, 4, 'k').rect(4, 9, 21, 5, 'k');
      g.ellipse(14, 5.5, 4, 3, 'm').ellipse(7.5, 8, 3, 2.5, 'm').px(11, 3, 'n').px(6, 7, 'n');
      g.rect(4, 13, 21, 1, 'e').rect(5, 12, 19, 1, 'D');
      bolt(g, [[9, 14], [6, 19], [10, 19], [6, 26]]);
      bolt(g, [[18, 14], [16, 18], [20, 18], [17, 24]]);
      for (const [x, y] of [[4, 16], [13, 16], [24, 16], [14, 21], [23, 21], [3, 22], [12, 25], [21, 25]] as const) g.line(x, y, x - 1, y + 2, 'b');
    },
  },
  // Overcharge: a moon-dial whose hand is a bolt, spinning fast
  'elemental-t5': {
    frame: 'magic',
    art: (g) => {
      g.ellipse(13.5, 13.5, 11, 11, 'k').ellipse(13.5, 13.5, 9.5, 9.5, 'T').ellipse(13, 13, 9, 9, 't');
      for (let h = 0; h < 12; h++) {
        const a = (h * Math.PI) / 6;
        g.px(13.5 + Math.cos(a) * 8, 13.5 + Math.sin(a) * 8, h % 3 === 0 ? 'C' : 'T');
      }
      // speed arc
      for (let a = 200; a <= 320; a += 3) { const t = (a * Math.PI) / 180; g.px(13.5 + Math.cos(t) * 6, 13.5 + Math.sin(t) * 6, 'q'); }
      g.px(19, 7, 'c').px(18, 6, 'c');
      // bolt hand
      bolt(g, [[19, 5], [14, 12], [17, 13], [10, 21]], 'y', 'G', 'w');
      bolt(g, [[18, 5], [13, 12], [16, 13], [9, 21]], 'g', 'G', 'w');
      bolt(g, [[20, 5], [15, 12], [18, 13], [11, 21]], 'y', 'h', 'w');
      g.ellipse(14, 13, 1.4, 1.4, 'C');
      // sparks outside
      g.px(3, 4, 'y').px(24, 3, 'q').px(25, 24, 'y').px(2, 23, 'q').px(1, 13, 'y');
    },
  },
  // Primal Core: an orb of stone and frost cracked open on a blue-white heart
  'elemental-t6': {
    frame: 'cold',
    art: (g) => {
      g.ellipse(13.5, 13.5, 11.5, 11.5, 'B').ellipse(12.8, 12.8, 10.5, 10.5, 'b');
      g.spans([[5, 8, 13], [6, 6, 10], [7, 5, 7]], 'i').px(7, 6, 'w').px(8, 5, 'w');
      // stone plates
      for (const [x, y, w, h] of [[16, 18, 6, 4], [5, 16, 5, 4], [17, 5, 4, 3]] as const) g.rect(x, y, w, h, 'm').rect(x, y + h - 1, w, 1, 'k');
      g.rect(19, 18, 3, 3, 'A');
      // the heart, cracked open
      g.ellipse(13.5, 13.5, 4, 4, 'i').ellipse(13.5, 13.5, 2.4, 2.4, 'w');
      for (const [a, b, c, d] of [[13, 9, 10, 3], [17, 13, 24, 10], [12, 17, 9, 24], [16, 16, 20, 23]] as const) g.line(a, b, c, d, 'i');
      g.px(2, 2, 'i').px(25, 25, 'w');
    },
  },
  // Fourfold Ruin (ULTIMATE): fire, frost, storm and stone whirl around one heart
  'elemental-t7': {
    frame: 'ult',
    art: (g) => {
      // swirl
      for (let a = 0; a < 720; a += 4) {
        const t = (a * Math.PI) / 180, r = 2 + a / 90;
        g.px(13.5 + Math.cos(t) * r, 13.5 + Math.sin(t) * r, a < 360 ? 'q' : 'c');
      }
      g.ellipse(13.5, 13.5, 2, 2, 'w');
      // fire: top-left
      flame(g, 6.5, 1, 10, 4);
      // frost: top-right snowflake
      g.line(17, 6, 25, 6, 'i').line(21, 2, 21, 10, 'i').line(18, 3, 24, 9, 'b').line(24, 3, 18, 9, 'b').px(21, 6, 'w');
      // storm: bottom-right
      bolt(g, [[23, 16], [19, 21], [23, 21], [19, 26]]);
      // stone: bottom-left
      poly(g, [[2, 25], [3, 19], [7, 16], [11, 18], [12, 24], [9, 26]], 'm');
      poly(g, [[3, 20], [7, 17], [8, 21], [4, 23]], 'n');
      g.line(8, 21, 11, 24, 'k').line(5, 24, 8, 21, 'k');
    },
  },
};
