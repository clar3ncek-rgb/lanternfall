// 32 px icons: ranger group. Keys are the ids from icon-list.ts (ICON_GROUPS.ranger).
import type { IconDef } from '../icon-kit';
import type { Grid } from '../core';

type Span = [number, number, number];

/** A bent line from (ax,ay) to (bx,by), bowed sideways by `bulge`, `thick` px wide. */
function curve(g: Grid, ax: number, ay: number, bx: number, by: number, bulge: number, c: string, thick = 1, off = 0) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len;
  const n = Math.ceil(len * 2);
  for (let i = 0; i <= n; i++) {
    const t = i / n, b = bulge * Math.sin(Math.PI * t) + off;
    const x = ax + dx * t + nx * b, y = ay + dy * t + ny * b;
    for (let k = 0; k < thick; k++) g.px(x + nx * k, y + ny * k, c);
  }
}

/** A diagonal arrow (dx, dy = +-1) from its nock at (x,y), `len` long, with a steel head and coloured fletching. */
function arrow(g: Grid, x: number, y: number, dx: number, dy: number, len: number, o: { head?: number; shaft?: string; fl?: string; fl2?: string; hl?: string; hm?: string } = {}) {
  const hs = o.head ?? 3, shaft = o.shaft ?? 'l', fl = o.fl ?? 'r', fl2 = o.fl2 ?? 'R', hl = o.hl ?? 'n', hm = o.hm ?? 'm';
  const tx = x + dx * len, ty = y + dy * len;
  g.line(x, y, tx - dx, ty - dy, shaft);
  for (let i = 1; i <= 3; i++) { g.px(x + dx * i - 1, y + dy * i, fl); g.px(x + dx * i + 1, y + dy * i, fl2); }
  g.px(x - dx, y - dy, 'L');
  for (let k = 0; k <= hs; k++) for (let j = 0; j + k <= hs; j++) g.px(tx - dx * j, ty - dy * k, k === 0 || j === 0 ? hl : hm);
  g.px(tx, ty, 'w');
}

/** A straight down-pointing arrow on column x from y0 (fletching) to y1 (tip). */
function arrowDown(g: Grid, x: number, y0: number, y1: number) {
  g.rect(x, y0, 1, y1 - y0 - 1, 'l');
  g.rect(x - 1, y0, 1, 3, 'r').rect(x + 1, y0, 1, 3, 'R');
  g.spans([[y1 - 2, x - 2, x + 2], [y1 - 1, x - 1, x + 1], [y1, x, x]], 'm').px(x - 2, y1 - 2, 'n').px(x - 1, y1 - 2, 'n').px(x, y1 - 2, 'n').px(x - 1, y1 - 1, 'n');
}

/** Mirror left-half spans (x <= 13) onto the right half of the 28 px grid. */
const mirror = (s: Span[]): Span[] => s.flatMap(([y, a, b]) => [[y, a, b], [y, 27 - b, 27 - a]] as Span[]);

/** A paw print centred on (x, y). */
function paw(g: Grid, x: number, y: number, c: string, hi: string) {
  g.spans([[y - 1, x - 2, x + 2], [y, x - 3, x + 3], [y + 1, x - 3, x + 3], [y + 2, x - 2, x + 2]], c).px(x - 1, y - 1, hi).px(x - 2, y, hi);
  for (const [ox, oy] of [[-4, -3], [-2, -5], [1, -5], [3, -3]] as const) g.rect(x + ox, y + oy, 2, 2, c).px(x + ox, y + oy, hi);
}

/** A thorn spike pointing in direction (dx, dy) from (x, y). */
function thorn(g: Grid, x: number, y: number, dx: number, dy: number, c = 't', c2 = 'T') {
  g.px(x, y, c2).px(x + dx, y + dy, c);
}

export const ICONS: Record<string, IconDef> = {
  // Ranger emblem: a leather quiver of red-fletched arrows across a longbow
  'class:ranger': {
    frame: 'nature',
    art: (g) => {
      curve(g, 3, 22, 22, 3, -7, 'L', 2);
      curve(g, 3, 22, 22, 3, -7, 'l');
      g.line(4, 21, 21, 4, 'a').px(3, 22, 't').px(22, 3, 't');
      for (const [x, c, c2] of [[11, 'r', 'R'], [14, 't', 'T'], [17, 'r', 'R']] as const) {
        g.rect(x, 3, 1, 7, 'l');
        g.spans([[2, x - 1, x + 1], [3, x - 1, x + 1], [4, x - 1, x + 1], [5, x - 1, x + 1]], c).rect(x + 1, 3, 1, 3, c2).px(x, 2, 'w');
      }
      g.rect(10, 9, 9, 16, 'l').rect(10, 9, 2, 16, 'S').rect(17, 9, 2, 16, 'L').rect(10, 25, 9, 1, 'L');
      g.rect(9, 9, 11, 2, 'g').rect(9, 10, 11, 1, 'G').rect(10, 20, 9, 2, 'g').rect(10, 21, 9, 1, 'G').px(10, 9, 'y');
      g.rect(13, 14, 3, 3, 'h').px(14, 15, 'v');
      g.spans([[24, 3, 6], [25, 4, 8], [23, 5, 7]], 'v').px(4, 24, 'u').px(8, 25, 'V').px(7, 24, 'V');
      g.spans([[25, 20, 23], [24, 21, 24], [23, 23, 24]], 'v').px(24, 23, 'u').px(21, 25, 'V');
    },
  },

  // Steady Aim: a calm crosshair, breath held, the red dot dead centre
  ra0: {
    frame: 'phys',
    art: (g) => {
      g.ellipse(13.5, 13.5, 10, 10, 'm').ellipse(13.5, 13.5, 8.6, 8.6, '.');
      g.swap('m', 'n', 0, 0, 14, 14).swap('m', 'k', 14, 14, 14, 14);
      g.rect(13, 1, 2, 8, 'n').rect(13, 19, 2, 8, 'm').rect(1, 13, 8, 2, 'n').rect(19, 13, 8, 2, 'm');
      g.px(14, 1, 'm').px(1, 14, 'm').px(14, 26, 'k').px(26, 14, 'k');
      g.ellipse(13.5, 13.5, 1.6, 1.6, 'r').px(13, 13, 'p');
      g.spans([[3, 3, 5], [4, 2, 3], [5, 2, 2]], 'a').spans([[22, 24, 24], [23, 23, 24], [24, 21, 23]], 'a');
      g.px(7, 6, 'w').px(6, 8, 'w');
    },
  },

  // Volley: three arrows loosed together, flying on their own
  ra1: {
    frame: 'phys',
    art: (g) => {
      arrow(g, 3, 18, 1, -1, 14);
      arrow(g, 6, 25, 1, -1, 17);
      arrow(g, 13, 25, 1, -1, 12);
      g.px(2, 12, 'a').px(3, 11, 'a').px(9, 26, 'a').px(19, 26, 'a').px(20, 25, 'a');
    },
  },

  // Long Draw: the bow bent to full, string pulled far back
  ra2: {
    frame: 'phys',
    art: (g) => {
      for (let y = 2; y <= 25; y++) {
        const x = Math.round(13 + 8 * Math.sin((Math.PI * (y - 2)) / 23));
        g.px(x, y, 'l').px(x + 1, y, 'L');
        if (y < 8) g.px(x, y, 'S');
      }
      g.px(13, 1, 't').px(13, 26, 't');
      g.line(13, 2, 3, 13, 'a').line(13, 25, 3, 14, 'a');
      g.rect(3, 13, 21, 1, 'l').rect(3, 14, 1, 1, 'L');
      g.spans([[10, 23, 23], [11, 23, 24], [12, 23, 25], [13, 23, 26], [14, 23, 25], [15, 23, 24], [16, 23, 23]], 'm').spans([[10, 23, 23], [11, 23, 24], [12, 23, 25]], 'n').px(26, 13, 'w');
      g.rect(20, 11, 2, 5, 'h').px(20, 11, 'G');
      g.rect(4, 11, 4, 2, 'r').rect(4, 15, 4, 2, 'R').px(4, 11, 'p');
      g.px(2, 8, 'y').px(1, 10, 'y').px(2, 18, 'y').px(1, 16, 'y');
    },
  },

  // Rain of Arrows: shafts fall from a darkened sky
  ra3: {
    frame: 'phys',
    art: (g) => {
      g.ellipse(5, 6, 3.5, 2.5, 'D').ellipse(10, 4, 4, 3, 'D').ellipse(17, 3.5, 4.5, 3, 'D').ellipse(22.5, 5.5, 3.5, 2.5, 'D');
      g.ellipse(5, 5.5, 2.8, 2, 'd').ellipse(10, 3.4, 3.2, 2.3, 'd').ellipse(17, 3, 3.6, 2.3, 'd').ellipse(22.5, 5, 2.6, 1.8, 'd');
      g.px(8, 2, 'q').px(9, 2, 'c').px(15, 1, 'q').px(16, 1, 'c').px(3, 4, 'c').px(21, 4, 'c');
      arrowDown(g, 5, 11, 21);
      arrowDown(g, 11, 13, 26);
      arrowDown(g, 17, 10, 20);
      arrowDown(g, 22, 14, 26);
      g.px(8, 10, 'a').px(14, 9, 'a').px(20, 12, 'a').px(25, 10, 'a').px(2, 14, 'a');
    },
  },

  // Call the Pack: an ivory hunting horn blown, the call carrying
  ra4: {
    frame: 'nature',
    art: (g) => {
      const pts: [number, number, number][] = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const x = 4 + 14 * t + 4 * Math.sin(Math.PI * t);
        const y = 22 - 12 * t + 4 * Math.sin(Math.PI * t * 0.9);
        pts.push([x, y, 0.8 + 4.2 * t * t]);
      }
      for (const [x, y, r] of pts) g.ellipse(x + 0.5, y + 0.6, r, r, 'T');
      for (const [x, y, r] of pts) g.ellipse(x, y, r * 0.85, r * 0.85, 't');
      g.ellipse(18.7, 9.2, 3.3, 3.3, 'L').ellipse(19.2, 8.7, 2.2, 2.2, 'e');
      g.rect(3, 21, 2, 3, 'g').px(3, 21, 'y');
      g.line(9, 21, 11, 18, 'G').line(10, 21, 12, 18, 'g').line(14, 16, 16, 13, 'G').line(15, 16, 17, 13, 'g');
      g.px(6, 20, 'w').px(8, 18, 'w');
      curve(g, 5, 24, 16, 18, -3, 'l');
      for (const [r, c] of [[4, 'y'], [7, 'a']] as const) {
        for (let a = -0.9; a <= 0.9; a += 0.12) g.px(19 + Math.cos(a - 0.7) * r * 1.0 + 1, 8 + Math.sin(a - 0.7) * r, c);
      }
    },
  },

  // Pack Bond: a trail of pawprints running side by side as one
  ra5: {
    frame: 'nature',
    art: (g) => {
      paw(g, 6, 23, 'm', 'n');
      paw(g, 16, 20, 'm', 'n');
      paw(g, 10, 11, 'A', 'a');
      paw(g, 20, 8, 'A', 'a');
      g.px(24, 15, 'v').px(3, 15, 'v').px(4, 16, 'V').px(24, 25, 'v').px(23, 26, 'V');
    },
  },

  // Hunter's Share: a hunter's game bag, strap over, arrows tucked behind the flap, gold spilling out
  ra6: {
    frame: 'gold',
    art: (g) => {
      curve(g, 5, 12, 21, 12, -10, 'L', 3);
      curve(g, 5, 12, 21, 12, -10, 'l', 1, 1);
      g.px(7, 6, 'S').px(8, 5, 'S');
      for (const [x0, x1, c, c2] of [[15, 18, 'r', 'R'], [18, 22, 't', 'T']] as const) {
        g.line(x0, 11, x1, 4, 'l');
        g.spans([[2, x1 - 1, x1 + 1], [3, x1 - 1, x1 + 1], [4, x1 - 1, x1 + 1]], c).rect(x1 + 1, 2, 1, 3, c2).px(x1, 1, 'w');
      }
      g.rect(4, 12, 18, 10, 'l').spans([[22, 5, 20], [23, 6, 19]], 'l');
      g.rect(4, 12, 2, 10, 'S').rect(20, 12, 2, 10, 'L').spans([[22, 18, 20], [23, 6, 19]], 'L');
      g.rect(3, 10, 20, 6, 'L').spans([[16, 4, 21], [17, 6, 19]], 'L').rect(3, 10, 20, 1, 'l').px(3, 10, 'S');
      for (let x = 5; x <= 20; x += 2) g.px(x, 15, 'G');
      g.rect(12, 17, 3, 4, 'L').rect(11, 16, 5, 4, 'g').rect(12, 17, 3, 2, 'h').px(11, 16, 'y').rect(11, 19, 5, 1, 'G');
      g.px(7, 19, 'L').px(8, 20, 'L').px(17, 20, 'L');
      for (const [x, y] of [[23, 24], [18, 25], [24, 19]] as const) g.ellipse(x, y, 2, 2, 'G').ellipse(x - 0.4, y - 0.4, 1.5, 1.5, 'g').px(x - 1, y - 1, 'y').px(x + 1, y + 1, 'G');
      g.rect(25, 14, 1, 2, 'g').px(25, 14, 'y').px(23, 12, 'y').px(2, 7, 'y').px(14, 25, 'g').px(13, 25, 'G');
    },
  },

  // Bark Skin: an old oak that outlasts every storm
  ra7: {
    frame: 'nature',
    art: (g) => {
      g.spans([[26, 4, 23], [25, 6, 21], [24, 8, 19], [23, 9, 18]], 'L');
      g.rect(10, 13, 8, 11, 'l').rect(10, 13, 2, 11, 'S').rect(16, 13, 2, 11, 'L');
      g.line(13, 15, 13, 22, 'L').line(15, 14, 14, 20, 'L').px(12, 18, 'L');
      g.line(10, 15, 5, 11, 'l').line(17, 15, 22, 10, 'L').line(17, 14, 22, 9, 'l');
      g.ellipse(9, 8, 6, 4.5, 'V').ellipse(18, 7, 6.5, 5, 'V').ellipse(13.5, 5, 6, 4, 'V').ellipse(5, 11, 3, 2.5, 'V').ellipse(22, 11, 3.5, 2.5, 'V');
      g.ellipse(8.5, 7, 4.5, 3, 'v').ellipse(17, 6, 5, 3.5, 'v').ellipse(13, 4, 4.5, 2.5, 'v');
      g.px(7, 5, 'u').px(8, 5, 'u').px(15, 3, 'u').px(16, 4, 'u').px(12, 2, 'u');
      g.rect(13, 17, 2, 2, 'e').px(13, 17, 'h');
    },
  },

  // Briar Snare: thorned roots bind the hourglass, the boss clock held
  ra8: {
    frame: 'nature',
    art: (g) => {
      g.rect(6, 2, 16, 3, 'l').rect(6, 2, 16, 1, 'S').rect(6, 23, 16, 3, 'l').rect(6, 25, 16, 1, 'L');
      g.spans([[5, 8, 19], [6, 8, 19], [7, 9, 18], [8, 10, 17], [9, 11, 16], [10, 12, 15], [11, 12, 15], [12, 13, 14], [13, 13, 14],
        [14, 12, 15], [15, 12, 15], [16, 11, 16], [17, 10, 17], [18, 9, 18], [19, 8, 19], [20, 8, 19], [21, 8, 19], [22, 8, 19]], 'a');
      g.spans([[6, 10, 17], [7, 11, 16], [8, 12, 15], [9, 13, 14], [18, 13, 14], [19, 11, 16], [20, 10, 17], [21, 9, 18], [22, 9, 18]], 'g').rect(13, 10, 2, 8, 'G');
      g.px(9, 5, 'w').px(9, 20, 'w');
      curve(g, 3, 7, 25, 21, 4, 'V', 2);
      curve(g, 3, 21, 25, 7, -4, 'V', 2);
      curve(g, 3, 7, 25, 21, 4, 'v');
      curve(g, 3, 21, 25, 7, -4, 'v');
      for (const [x, y, dx, dy] of [[6, 7, 0, -1], [10, 13, -1, 0], [18, 13, 1, 0], [22, 16, 1, 0], [5, 19, -1, 0], [22, 8, 0, -1], [15, 18, 0, 1], [9, 17, 0, 1]] as const) thorn(g, x, y, dx, dy);
      g.px(2, 6, 'v').px(25, 22, 'v');
    },
  },

  // Thorn Tips: an arrow barbed with thorns from tip to fletching
  ra9: {
    frame: 'phys',
    art: (g) => {
      g.line(4, 23, 22, 5, 'V').line(5, 23, 23, 5, 'v').line(4, 22, 22, 4, 'u');
      for (const [x, y] of [[8, 19], [12, 15], [16, 11]] as const) { g.px(x - 1, y - 2, 'T').px(x - 2, y - 3, 't'); g.px(x + 2, y + 1, 'T').px(x + 3, y + 2, 't'); }
      for (let k = 0; k <= 5; k++) for (let j = 0; j + k <= 5; j++) g.px(25 - j, 2 + k, j + k === 5 ? 'L' : k === 0 ? 'S' : 'l');
      g.px(25, 2, 'w').px(24, 3, 'S').px(19, 2, 'L').px(25, 8, 'L').px(18, 1, 'T').px(26, 9, 'T');
      for (let i = 0; i < 3; i++) { g.px(4 + i - 1, 23 - i - 1, 'u').px(4 + i - 2, 23 - i - 1, 'v'); g.px(4 + i + 1, 23 - i + 1, 'V').px(4 + i + 2, 23 - i + 1, 'V'); }
      g.px(2, 25, 'L').px(3, 24, 'L');
    },
  },

  // ---- Marksman
  // Marksman emblem: a straw target, an arrow dead in the gold
  'sub:ranger:Marksman': {
    frame: 'phys',
    art: (g) => {
      g.line(6, 20, 3, 26, 'L').line(21, 20, 24, 26, 'L').line(7, 20, 4, 26, 'l').line(20, 20, 23, 26, 'l');
      g.ellipse(13.5, 12, 11, 11, 'T').ellipse(13, 11.5, 10.4, 10.4, 't');
      g.ellipse(13.5, 12, 8, 8, 'R').ellipse(13.5, 12, 7, 7, 'r');
      g.ellipse(13.5, 12, 5, 5, 't').ellipse(13.5, 12, 3, 3, 'g').ellipse(13.5, 12, 1.5, 1.5, 'G');
      g.px(7, 5, 'w').px(6, 6, 'w');
      g.line(15, 13, 22, 20, 'l').line(16, 13, 23, 20, 'L');
      g.spans([[19, 22, 23], [20, 21, 24], [21, 22, 25], [22, 23, 25], [23, 24, 25]], 'r').spans([[21, 25, 25], [22, 25, 26], [23, 25, 26]], 'R').px(22, 20, 'p');
      g.px(14, 12, 'k').px(13, 11, 'e');
    },
  },

  // Deadeye: the hunter's eye, iris red, crosshair on the pupil
  'ranger-marksman-t5': {
    frame: 'blood',
    art: (g) => {
      const sp: Span[] = [];
      for (let x = 2; x <= 25; x++) { const h = Math.round(7 * Math.sin((Math.PI * (x - 1.5)) / 25)); sp.push([13 - h, x, x], [14 + h, x, x]); }
      for (let x = 2; x <= 25; x++) { const h = Math.round(7 * Math.sin((Math.PI * (x - 1.5)) / 25)); g.rect(x, 13 - h, 1, 2 * h + 2, 't'); }
      g.swap('t', 'T', 0, 17, 28, 11);
      g.ellipse(13.5, 13.5, 5.5, 5.5, 'R').ellipse(13.2, 13.2, 4.6, 4.6, 'r').ellipse(13.5, 13.5, 1.8, 1.8, 'e');
      g.rect(13, 7, 2, 4, 'e').rect(13, 17, 2, 4, 'e').rect(7, 13, 4, 2, 'e').rect(17, 13, 4, 2, 'e');
      g.px(11, 10, 'w').px(10, 11, 'p');
      for (const [y, a, b] of sp) if (y < 13) g.rect(a, y, b - a + 1, 1, 'L');
      g.rect(13, 1, 2, 3, 'n').rect(13, 24, 2, 3, 'm').px(14, 26, 'k');
      g.px(4, 6, 'L').px(8, 4, 'L').px(19, 4, 'L').px(23, 6, 'L').px(13, 4, '.');
    },
  },

  // Piercing Shaft: one arrow punched clean through a steel plate
  'ranger-marksman-t6': {
    frame: 'phys',
    art: (g) => {
      g.spans([[3, 11, 16], [4, 10, 17], [24, 10, 17], [25, 11, 16]], 'm').rect(10, 5, 8, 19, 'm');
      g.rect(10, 4, 2, 20, 'n').rect(16, 5, 2, 20, 'k').px(11, 3, 'n').px(11, 6, 'w');
      g.px(12, 7, 'k').px(15, 7, 'k').px(12, 21, 'k').px(15, 21, 'k').px(12, 6, 'n').px(15, 6, 'n');
      g.rect(1, 13, 25, 1, 'l').rect(1, 14, 9, 1, 'L');
      g.spans([[10, 22, 22], [11, 22, 23], [12, 22, 24], [13, 22, 26], [14, 22, 24], [15, 22, 23], [16, 22, 22]], 'm').spans([[10, 22, 22], [11, 22, 23], [12, 22, 24]], 'n').px(26, 13, 'w');
      g.rect(1, 11, 4, 2, 'r').rect(1, 15, 4, 2, 'R').px(1, 11, 'p');
      g.line(11, 10, 13, 12, 'e').line(16, 10, 14, 12, 'e').line(11, 17, 13, 15, 'e').line(17, 16, 15, 15, 'e').rect(12, 12, 4, 4, 'e').rect(10, 13, 9, 1, 'l');
      g.px(19, 11, 'y').px(20, 9, 'y').px(19, 16, 'y').px(21, 17, 'g').px(18, 8, 'g');
    },
  },

  // Sky of Shafts (ULTIMATE): arrows blot out the moon
  'ranger-marksman-t7': {
    frame: 'ult',
    art: (g) => {
      g.ellipse(17.5, 9.5, 8.5, 8.5, 'G').ellipse(17, 9, 7.8, 7.8, 'g').ellipse(15.5, 7.5, 4.5, 4, 'y').px(13, 5, 'w').px(14, 4, 'w');
      g.ellipse(21, 13, 1.5, 1.2, 'G').ellipse(20, 5, 1, 1, 'G');
      for (const [x, y, l] of [[2, 2, 10], [12, 2, 11], [2, 13, 11], [12, 12, 12], [20, 18, 6]] as const) arrow(g, x, y, 1, 1, l);
      g.px(25, 2, 'y').px(7, 23, 'y').px(2, 8, 'q').px(9, 9, 'q').px(25, 25, 'q');
    },
  },

  // ---- Beastmaster
  // Beastmaster emblem: the grey wolf's head, eyes lit in the dark
  'sub:ranger:Beastmaster': {
    frame: 'shadow',
    art: (g) => {
      g.spans(mirror([[2, 4, 5], [3, 4, 6], [4, 4, 7], [5, 4, 8], [6, 4, 13], [7, 3, 13], [8, 3, 13], [9, 3, 13], [10, 3, 13], [11, 3, 13], [12, 2, 13], [13, 1, 13], [14, 1, 13], [15, 2, 13],
        [16, 3, 13], [17, 5, 13], [18, 7, 13], [19, 8, 13], [20, 9, 13], [21, 10, 13], [22, 11, 13], [23, 12, 13], [24, 12, 13]]), 'm');
      g.swap('m', 'n', 0, 0, 14, 12).swap('m', 'k', 14, 12, 14, 16).spans(mirror([[13, 1, 2], [14, 1, 3], [15, 2, 4], [16, 3, 5]]), 'k');
      g.spans([[13, 1, 2], [14, 1, 2], [15, 2, 3]], 'm');
      g.spans(mirror([[3, 5, 5], [4, 5, 6], [5, 5, 7]]), 'D');
      g.rect(13, 5, 2, 6, 'k');
      g.spans(mirror([[14, 9, 13], [15, 9, 13], [16, 9, 13], [17, 10, 13], [18, 10, 13], [19, 11, 13], [20, 11, 13], [21, 12, 13], [22, 12, 13]]), 't');
      g.spans([[17, 15, 17], [18, 15, 16], [19, 14, 15], [20, 14, 15]], 'T');
      g.spans([[17, 11, 16], [18, 12, 15], [19, 13, 14]], 'e').px(12, 17, 'k');
      g.rect(13, 22, 2, 2, 'k');
      g.spans([[10, 7, 10], [11, 8, 10]], 'g').spans([[10, 17, 20], [11, 17, 19]], 'g').px(9, 10, 'y').px(18, 10, 'y').px(10, 11, 'e').px(17, 11, 'e');
      g.px(6, 7, 'w');
    },
  },

  // Alpha's Call: a necklace of wolf fangs, the alpha's tooth at its heart
  'ranger-beastmaster-t5': {
    frame: 'nature',
    art: (g) => {
      curve(g, 3, 2, 24, 2, 13, 'L', 2);
      curve(g, 3, 2, 24, 2, 13, 'l');
      const fang = (x: number, y: number, h: number) => {
        for (let i = 0; i < h; i++) { const w = Math.max(0, Math.round(((h - i) / h) * 1.6)); g.rect(x - w, y + i, 2 * w + 1, 1, 't'); g.px(x + w, y + i, 'T'); }
        g.px(x - 1, y, 'G').px(x, y, 'G').px(x + 1, y, 'G').px(x - 1, y + 1, 'w');
      };
      fang(6, 10, 6); fang(9, 13, 7); fang(18, 13, 7); fang(21, 10, 6);
      for (let i = 0; i < 11; i++) { const w = Math.round(((11 - i) / 11) * 2.6); g.rect(13 - w + 1, 15 + i, 2 * w, 1, 't'); g.px(13 + w, 15 + i, 'T'); }
      g.rect(12, 14, 4, 2, 'g').px(12, 14, 'y').px(12, 16, 'w').px(12, 17, 'w');
      g.ellipse(13.5, 12, 1.5, 1.5, 'r').px(13, 11, 'p');
      g.px(3, 22, 'v').px(24, 22, 'v').px(2, 25, 'V');
    },
  },

  // Pack Hunt: claws rake twice, two sets of wounds
  'ranger-beastmaster-t6': {
    frame: 'blood',
    art: (g) => {
      const rake = (x: number, y: number, n: number) => {
        for (let k = 0; k < 3; k++) {
          const ox = x + k * 4, oy = y;
          curve(g, ox, oy, ox + n * 0.45, oy + n, 1.2, 'R', 2);
          curve(g, ox, oy, ox + n * 0.45, oy + n, 1.2, 'r');
          g.px(ox, oy, 'p').px(ox, oy + 1, 'p');
        }
      };
      rake(2, 2, 13);
      rake(13, 12, 13);
      g.ellipse(9, 22, 1.2, 1.5, 'R').px(9, 24, 'R').ellipse(5, 19, 1, 1, 'R').ellipse(24, 6, 1.2, 1.5, 'R').px(22, 9, 'R');
      g.px(14, 6, 'w').px(3, 26, 'w').px(25, 2, 'w');
    },
  },

  // The Great Hunt (ULTIMATE): one howl under the blood moon, the whole pack answers
  'ranger-beastmaster-t7': {
    frame: 'ult',
    art: (g) => {
      g.ellipse(14, 11, 10.5, 10.5, 'R').ellipse(13.5, 10.5, 9.8, 9.8, 'r').ellipse(11, 8, 5, 4, 'p').px(8, 5, 'w');
      g.ellipse(18, 15, 1.5, 1.2, 'R').ellipse(19, 6, 1.2, 1, 'R');
      // a sitting wolf in silhouette, muzzle thrown up to the moon, jaws open
      g.spans([[4, 5, 6], [5, 6, 8], [6, 7, 10], [7, 9, 13], [8, 10, 14], [8, 6, 7], [9, 7, 14], [10, 9, 15], [3, 12, 12], [4, 12, 13], [5, 11, 13], [6, 11, 13],
        [11, 10, 15], [12, 10, 16], [13, 10, 17], [14, 10, 18], [15, 10, 19], [16, 10, 20], [17, 10, 21], [18, 11, 22], [19, 11, 22], [20, 11, 23], [21, 10, 23], [22, 9, 24]], 'e');
      g.spans([[19, 24, 24], [20, 24, 25], [21, 24, 26], [22, 25, 26]], 'e').spans([[19, 13, 13], [20, 13, 13], [21, 13, 13]], 'R');
      g.px(11, 7, 'p').px(12, 7, 'r');
      g.spans([[23, 2, 25], [24, 1, 26], [25, 1, 26], [26, 1, 26]], 'D').spans([[23, 3, 8], [23, 20, 24]], 'd');
      g.px(4, 25, 'g').px(6, 25, 'g').px(21, 25, 'g').px(23, 25, 'g').px(2, 20, 'y').px(4, 20, 'y');
    },
  },

  // ---- Thornwarden
  // Thornwarden emblem: a wreath of briar, leaves and blood-red berries
  'sub:ranger:Thornwarden': {
    frame: 'nature',
    art: (g) => {
      g.ellipse(13.5, 13.5, 10, 10, 'V').ellipse(13.5, 13.5, 6.6, 6.6, '.');
      g.ellipse(13.5, 13.5, 9, 9, 'v').ellipse(13.5, 13.5, 7.6, 7.6, '.');
      g.swap('v', 'V', 14, 14, 14, 14);
      for (let a = 0; a < 12; a++) {
        const t = (a / 12) * Math.PI * 2;
        g.px(13.5 + Math.cos(t) * 10.7, 13.5 + Math.sin(t) * 10.7, 'T').px(13.5 + Math.cos(t) * 11.7, 13.5 + Math.sin(t) * 11.7, 't');
      }
      for (const [x, y] of [[6, 5], [22, 6], [4, 18], [20, 22]] as const) g.ellipse(x, y, 2, 1.3, 'v').px(x - 1, y - 1, 'u');
      for (const [x, y] of [[13, 3], [24, 14], [8, 23], [3, 11]] as const) g.rect(x, y, 2, 2, 'r').px(x, y, 'p').px(x + 1, y + 1, 'R');
    },
  },

  // Heartwood: a cut trunk, its rings old, its heart glowing amber
  'ranger-thornwarden-t5': {
    frame: 'nature',
    art: (g) => {
      g.ellipse(13.5, 15, 11, 10, 'L').ellipse(13, 14.5, 10, 9, 'l');
      g.ellipse(13.5, 15, 8.5, 7.5, 'T').ellipse(13.5, 15, 7.5, 6.5, 't').ellipse(13.5, 15, 6, 5, 'T').ellipse(13.5, 15, 5, 4, 't').ellipse(13.5, 15, 3.5, 2.6, 'T');
      g.ellipse(13.5, 15, 2.5, 2, 'f').ellipse(13.2, 14.6, 1.3, 1, 'y');
      g.line(19, 10, 16, 14, 'T').px(20, 9, 'L');
      g.line(13, 5, 13, 1, 'V').ellipse(10, 2, 2.5, 1.2, 'v').ellipse(16.5, 3, 2.5, 1.2, 'V').px(9, 1, 'u').px(16, 2, 'v');
      g.px(5, 10, 'S').px(4, 13, 'S').px(7, 22, 'L').px(19, 23, 'L');
      g.px(9, 11, 'w');
    },
  },

  // Thornmail: a breastplate grown from bark and briar, thorns out
  'ranger-thornwarden-t6': {
    frame: 'poison',
    art: (g) => {
      g.spans(mirror([[4, 4, 9], [5, 3, 10], [6, 3, 11], [7, 3, 13], [8, 4, 13], [9, 5, 13], [10, 6, 13], [11, 6, 13], [12, 6, 13], [13, 6, 13], [14, 6, 13], [15, 6, 13], [16, 6, 13],
        [17, 6, 13], [18, 6, 13], [19, 7, 13], [20, 7, 13], [21, 7, 13], [22, 8, 13], [23, 9, 13]]), 'l');
      g.swap('l', 'S', 0, 0, 9, 28).swap('l', 'L', 19, 0, 9, 28);
      g.spans([[5, 11, 16], [6, 12, 15]], '.').spans([[4, 10, 10], [4, 17, 17]], '.');
      g.rect(13, 8, 2, 15, 'L').rect(7, 14, 14, 1, 'L');
      curve(g, 4, 6, 20, 22, 3, 'V', 2);
      curve(g, 4, 6, 20, 22, 3, 'v');
      for (const [x, y, dx, dy] of [[2, 6, -1, 0], [25, 6, 1, 0], [4, 12, -1, 0], [23, 12, 1, 0], [5, 18, -1, 0], [22, 18, 1, 0], [9, 24, 0, 1], [18, 24, 0, 1], [6, 3, 0, -1], [21, 3, 0, -1]] as const) thorn(g, x, y, dx, dy);
      for (const [x, y] of [[9, 12], [12, 17], [16, 20], [7, 9]] as const) g.px(x, y, 'T').px(x + 1, y - 1, 't');
      g.px(5, 5, 'y').px(16, 10, 'u');
    },
  },

  // Bramble Wake (ULTIMATE): thorn spears burst up out of the cracked ground
  'ranger-thornwarden-t7': {
    frame: 'ult',
    art: (g) => {
      const spike = (x: number, base: number, top: number, w: number) => {
        const h = base - top;
        for (let i = 0; i <= h; i++) {
          const half = Math.round((i / h) * w);
          g.rect(x - half, top + i, 2 * half + 1, 1, 'V');
          g.px(x - half, top + i, 'v');
          if (half > 1) g.px(x - half + 1, top + i, 'u');
        }
        g.px(x, top, 'u');
        for (let i = 4; i < h - 1; i += 4) { const half = Math.round((i / h) * w); g.px(x - half - 1, top + i, 'T'); g.px(x + half + 1, top + i + 1, 'T'); }
      };
      spike(5, 22, 9, 2);
      spike(22, 22, 7, 2);
      spike(13, 23, 1, 3);
      spike(9, 22, 13, 2);
      spike(18, 22, 12, 2);
      g.spans([[22, 1, 26], [23, 1, 26], [24, 1, 26], [25, 1, 26], [26, 2, 25]], 'L').rect(1, 22, 26, 1, 'l');
      g.line(4, 23, 7, 26, 'e').line(13, 24, 11, 26, 'e').line(20, 23, 23, 26, 'e').line(16, 24, 17, 26, 'e');
      g.px(2, 18, 'T').px(1, 14, 't').px(25, 15, 'T').px(26, 12, 't').px(10, 7, 't').px(17, 5, 'T');
    },
  },

};
