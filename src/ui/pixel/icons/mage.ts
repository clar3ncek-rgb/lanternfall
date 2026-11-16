// 32 px icons: mage group. Keys are the ids from icon-list.ts (ICON_GROUPS.mage).
import type { IconDef } from '../icon-kit';
import type { Grid } from '../core';

/** A layered flame (deep, orange, pale, white core) standing on `base`, `h` tall, `w` half-wide. */
function flame(g: Grid, cx: number, base: number, h: number, w: number, lean = 0, layers = 4) {
  const L: [string, number][] = [['F', 1], ['f', 0.74], ['y', 0.46], ['w', 0.22]];
  for (const [c, s] of L.slice(0, layers)) {
    const hh = h * s, ww = w * s, bot = base - (1 - s) * h * 0.18, top = bot - hh;
    for (let y = Math.round(top); y <= Math.round(bot); y++) {
      const t = Math.max(0, Math.min(1, (y - top) / (bot - top)));
      const hw = ww * (t < 0.62 ? Math.sin((t / 0.62) * Math.PI / 2) : Math.sqrt(1 - ((t - 0.62) / 0.38) ** 2));
      const x = cx + lean * (1 - t) ** 2;
      if (hw < 0.25 && t > 0.1) continue;
      g.spans([[y, Math.round(x - hw), Math.round(x + hw)]], c);
    }
  }
}

/** A fireball travelling along (dx, dy) with a tapering trail behind it. */
function fireball(g: Grid, x: number, y: number, r: number, dx: number, dy: number, len: number) {
  for (let i = len; i >= 1; i--) {
    const k = i / len, rr = r * (1 - k) * 0.95;
    const c = k > 0.6 ? 'F' : 'f';
    g.ellipse(x - dx * i, y - dy * i, Math.max(0.2, rr), Math.max(0.2, rr), c);
  }
  g.ellipse(x, y, r, r, 'F').ellipse(x + dx * 0.4, y + dy * 0.4, r - 0.8, r - 0.8, 'f').ellipse(x + dx * 0.8, y + dy * 0.8, r - 1.8, r - 1.8, 'y').px(x + dx, y + dy, 'w');
}

/** A clock face of radius r (rim colours a/b, face colour f), hands pointing to (h1, h2) as unit vectors. */
function clock(g: Grid, cx: number, cy: number, r: number, rim: string, rimD: string, face: string, tick: string) {
  g.ellipse(cx, cy, r, r, rimD).ellipse(cx - 0.4, cy - 0.4, r - 0.6, r - 0.6, rim).ellipse(cx, cy, r - 2, r - 2, face);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.px(cx + Math.sin(a) * (r - 3), cy - Math.cos(a) * (r - 3), tick);
  }
}

export const ICONS: Record<string, IconDef> = {
  // Mage: a tall pointed hat with a gold band and a star
  'class:mage': { frame: 'magic', art: (g) => {
    for (let y = 2; y <= 19; y++) {
      const t = (y - 2) / 17, cx = 18.5 - t * 5 + (t < 0.25 ? (0.25 - t) * 10 : 0), hw = 0.5 + t * 6.2;
      g.spans([[y, Math.round(cx - hw), Math.round(cx + hw)]], 'c');
      g.px(Math.round(cx + hw), y, 'C').px(Math.round(cx + hw) - 1, y, 'C');
      if (y > 5) g.px(Math.round(cx - hw), y, 'q');
    }
    g.px(22, 2, 'c').px(23, 3, 'c').px(23, 2, 'C');
    g.ellipse(13.5, 22, 12.5, 3.2, 'C').ellipse(13, 21.3, 11.5, 2.2, 'c').spans([[20, 4, 10]], 'q');
    g.rect(7, 17, 14, 2, 'g').rect(7, 18, 14, 1, 'G').rect(12, 16, 4, 4, 'G').rect(13, 17, 2, 2, 'y');
    g.px(13, 10, 'y').px(12, 10, 'g').px(14, 10, 'g').px(13, 9, 'g').px(13, 11, 'g').px(13, 10, 'w');
    g.px(16, 6, 'y').px(10, 14, 'q').px(3, 6, 'q').px(24, 10, 'y').px(25, 15, 'q');
  } },

  // Arcane Study: an open spellbook, a rune glowing above it
  ma0: { frame: 'magic', art: (g) => {
    g.spans([[14, 3, 12], [15, 3, 13], [16, 3, 13], [17, 3, 13], [18, 3, 13], [19, 3, 13], [20, 3, 13], [21, 3, 13], [22, 4, 13]], 't');
    g.spans([[14, 15, 24], [15, 14, 24], [16, 14, 24], [17, 14, 24], [18, 14, 24], [19, 14, 24], [20, 14, 24], [21, 14, 24], [22, 14, 23]], 't');
    g.spans([[13, 4, 10], [13, 17, 23]], 't');
    g.rect(12, 14, 1, 9, 'T').rect(15, 14, 1, 9, 'T').rect(13, 15, 2, 9, 'L').px(13, 14, 'T').px(14, 14, 'T');
    g.rect(2, 23, 24, 2, 'C').rect(3, 25, 22, 1, 'C').rect(12, 23, 4, 3, 'c').rect(2, 23, 1, 1, 'c');
    for (const y of [16, 18, 20]) { g.line(5, y, 10, y, 'T').line(17, y, 22, y, 'T'); }
    g.px(6, 16, 'c').px(19, 18, 'c').px(8, 20, 'c');
    g.ellipse(13.5, 6.5, 5, 5, 'c').ellipse(13.5, 6.5, 3.7, 3.7, '.').ellipse(13.5, 6.5, 1.5, 3.5, 'q').ellipse(13.5, 6.5, 3.5, 1.2, 'q').px(13, 6, 'w').px(14, 7, 'w').px(13, 7, 'w').px(14, 6, 'w');
    g.px(9, 3, 'q').px(18, 3, 'q').px(13, 12, 'q').px(14, 11, 'c').px(4, 9, 'q').px(23, 8, 'q');
  } },

  // Ember Bolt: a volley of three fireballs streaking right
  ma1: { frame: 'fire', art: (g) => {
    fireball(g, 20, 7, 3.4, 1, 0.35, 12);
    fireball(g, 23, 14, 3.2, 1, 0.1, 15);
    fireball(g, 18, 22, 3.4, 1, -0.3, 12);
    g.px(26, 9, 'y').px(13, 2, 'f').px(9, 18, 'f').px(26, 19, 'y');
  } },

  // Kindling: a little stack of sticks, smouldering, a curl of smoke
  ma2: { frame: 'fire', art: (g) => {
    g.line(3, 25, 22, 19, 'L').line(3, 24, 22, 18, 'l').line(4, 23, 22, 17, 'l').line(4, 22, 21, 16, 'h');
    g.line(5, 17, 24, 24, 'L').line(5, 18, 24, 25, 'L').line(5, 16, 24, 23, 'l').line(6, 15, 23, 21, 'l');
    g.ellipse(13.5, 20, 4, 2.2, 'F').ellipse(13.5, 20, 2.5, 1.2, 'f').px(13, 20, 'y').px(14, 20, 'y');
    flame(g, 13.5, 19, 7, 2.4, 0.5, 3);
    g.px(9, 21, 'f').px(18, 21, 'f').px(11, 22, 'F').px(16, 22, 'F');
    g.px(14, 10, 'A').px(13, 9, 'A').px(12, 8, 'A').px(12, 7, 'a').px(13, 6, 'A').px(14, 5, 'A').px(15, 4, 'a').px(15, 3, 'A').px(14, 2, 'a');
    g.px(8, 11, 'f').px(19, 9, 'y').px(21, 13, 'f').px(6, 7, 'F');
  } },

  // Firestorm: a wall of flames rising from scorched ground
  ma3: { frame: 'fire', art: (g) => {
    g.rect(1, 23, 26, 4, 'L').rect(1, 23, 26, 1, 'h').line(4, 25, 8, 24, 'F').line(14, 26, 19, 25, 'F').line(21, 24, 24, 25, 'R');
    flame(g, 4.5, 23, 12, 3.4, -0.5);
    flame(g, 22.5, 23, 13, 3.6, 0.5);
    flame(g, 9.5, 23, 18, 4.2, -1);
    flame(g, 18, 23, 17, 4, 1);
    flame(g, 13.5, 23, 22, 4.6, 0);
    g.px(2, 6, 'f').px(25, 4, 'y').px(6, 2, 'y').px(22, 7, 'f');
  } },

  // Slow Hour: an hourglass frozen in ice, the sand stopped in the air
  ma4: { frame: 'cold', art: (g) => {
    g.rect(5, 2, 18, 3, 'l').rect(5, 2, 18, 1, 'G').rect(5, 23, 18, 3, 'l').rect(5, 25, 18, 1, 'L');
    g.rect(6, 5, 2, 18, 'L').rect(20, 5, 2, 18, 'L').px(6, 5, 'l').px(20, 5, 'l');
    g.spans([[5, 9, 18], [6, 9, 18], [7, 9, 18], [8, 10, 17], [9, 10, 17], [10, 11, 16], [11, 12, 15], [12, 13, 14],
      [13, 13, 14], [14, 12, 15], [15, 11, 16], [16, 10, 17], [17, 10, 17], [18, 9, 18], [19, 9, 18], [20, 9, 18], [21, 9, 18], [22, 9, 18]], 'a');
    g.spans([[8, 11, 16], [9, 11, 16], [10, 12, 15], [11, 13, 14]], 'g').rect(11, 8, 2, 1, 'y');
    g.spans([[19, 12, 15], [20, 10, 17], [21, 10, 17], [22, 9, 18]], 'g').spans([[21, 10, 17], [22, 9, 18]], 'G');
    g.px(13, 14, 'g').px(14, 16, 'g').px(13, 17, 'G');
    g.px(10, 6, 'w').px(10, 7, 'w').px(10, 18, 'w');
    // ice
    g.spans([[5, 1, 4], [6, 2, 4], [7, 2, 4], [8, 3, 4], [9, 3, 3]], 'i').spans([[5, 23, 26], [6, 23, 25], [7, 23, 25], [8, 23, 24], [9, 24, 24]], 'b').px(25, 6, 'i');
    g.spans([[16, 2, 4], [17, 1, 4], [18, 1, 5], [19, 2, 5], [20, 1, 5], [21, 2, 4], [22, 2, 4]], 'i').spans([[18, 3, 4], [20, 3, 4]], 'b');
    g.spans([[12, 22, 25], [13, 22, 26], [14, 23, 26], [15, 22, 25]], 'b').px(23, 13, 'i').px(24, 12, 'i');
    g.px(9, 14, 'i').px(17, 12, 'i').px(1, 12, 'w').px(26, 20, 'w').px(2, 16, 'w');
  } },

  // Borrowed Time: a gold pocket watch swinging on its chain, lent by the night
  ma5: { frame: 'shadow', art: (g) => {
    g.line(6, 2, 10, 7, 'm').line(7, 2, 11, 7, 'k').px(8, 4, 'n').px(10, 6, 'n');
    g.rect(14, 5, 3, 2, 'G').rect(15, 4, 1, 1, 'g').ellipse(15.5, 3.6, 1.6, 1.4, 'G').px(15, 3, '.').px(16, 3, '.');
    g.line(10, 7, 14, 4, 'm').px(12, 5, 'n');
    clock(g, 15.5, 16, 9, 'g', 'G', 't', 'L');
    g.ellipse(15.5, 16, 6.5, 6.5, 't').ellipse(16.5, 17, 5.5, 5.5, 'T').ellipse(15.5, 16, 5.6, 5.6, 't');
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.px(15.5 + Math.sin(a) * 5.3, 16 - Math.cos(a) * 5.3, i % 3 === 0 ? 'h' : 'T'); }
    g.line(15, 16, 15, 11, 'e').line(15, 16, 19, 18, 'e').px(15, 16, 'r');
    g.px(10, 11, 'y').px(9, 12, 'y').px(11, 10, 'w');
    // bony fingers gripping the chain at the top-left
    g.px(5, 1, 'm').px(4, 1, 'k').px(3, 2, 'm').px(2, 3, 'k').px(2, 4, 'm').px(2, 5, 'k').px(3, 6, 'm');
    g.px(23, 8, 'q').px(25, 13, 'q').px(5, 20, 'q').px(24, 22, 'c');
  } },

  // Echo: a drop of mana sending out rings
  ma6: { frame: 'magic', art: (g) => {
    g.ellipse(13.5, 21, 12.5, 4.5, 'B').ellipse(13.5, 21, 11, 3.4, '.');
    g.ellipse(13.5, 21, 9, 3.2, 'b').ellipse(13.5, 21, 7.6, 2.2, '.');
    g.ellipse(13.5, 21, 5.5, 1.8, 'i').ellipse(13.5, 21, 4, 1, '.');
    g.spans([[2, 13, 14], [3, 13, 14], [4, 12, 15], [5, 12, 15], [6, 11, 16], [7, 10, 17], [8, 10, 17]], 'B').ellipse(13.5, 12, 4.6, 4.6, 'B');
    g.spans([[3, 13, 13], [4, 12, 14], [5, 12, 14], [6, 11, 15], [7, 10, 16], [8, 10, 16]], 'b').ellipse(13, 11.5, 3.8, 3.8, 'b');
    g.rect(10, 9, 2, 4, 'i').px(11, 7, 'i').px(12, 5, 'w').px(10, 10, 'w');
    g.px(13, 19, 'i').px(14, 19, 'i').px(13.5, 18, 'b');
    g.px(4, 13, 'q').px(23, 9, 'q').px(22, 14, 'i');
  } },

  // Spellblade: a staff wrapped in a blade of violet force
  ma7: { frame: 'magic', art: (g) => {
    g.line(3, 25, 17, 11, 'L').line(4, 25, 18, 11, 'l').line(3, 24, 17, 10, 'l').px(2, 26, 'G').px(3, 26, 'g');
    g.spans([[12, 14, 17]], 'G').line(13, 13, 17, 17, 'G').line(14, 12, 18, 16, 'g');
    // force blade
    for (let i = 0; i <= 11; i++) { const x = 17 + i * 0.85, y = 10 - i * 0.85, w = 2.6 * (1 - i / 13); g.ellipse(x, y, w + 0.6, w + 0.6, 'C'); }
    for (let i = 0; i <= 11; i++) { const x = 17 + i * 0.85, y = 10 - i * 0.85, w = 2.6 * (1 - i / 13); g.ellipse(x, y, w, w, 'c'); }
    g.line(17, 9, 25, 1, 'q').line(16, 9, 24, 1, 'w').line(18, 10, 25, 3, 'q');
    g.ellipse(17, 11, 1.6, 1.6, 'q').px(17, 11, 'w');
    g.px(9, 15, 'q').px(12, 21, 'c').px(6, 19, 'q').px(14, 16, 'c').px(22, 13, 'q').px(10, 6, 'c');
  } },

  // Runed Edge: a sword etched with runes, crackling
  ma8: { frame: 'lightning', art: (g) => {
    g.spans([[1, 13, 14], [2, 12, 15]], 'n').rect(11, 3, 6, 15, 'm').rect(11, 3, 2, 15, 'n').rect(15, 3, 2, 15, 'k').px(13, 1, 'w');
    g.px(14, 5, 'b').px(13, 6, 'b').px(14, 7, 'b').px(13, 9, 'i').px(14, 9, 'i').px(13, 10, 'b').px(14, 12, 'b').px(13, 13, 'i').px(14, 14, 'b').px(13, 15, 'b').px(14, 15, 'i');
    g.rect(5, 18, 18, 2, 'g').rect(5, 19, 18, 1, 'G').px(4, 18, 'G').px(23, 18, 'G').rect(12, 17, 4, 4, 'G').rect(13, 18, 2, 2, 'b');
    g.rect(12, 21, 4, 4, 'L').px(12, 22, 'l').px(12, 24, 'l').ellipse(13.5, 25.5, 2, 1.4, 'g').px(13, 25, 'y');
    g.line(9, 4, 6, 7, 'y').line(6, 7, 8, 9, 'y').line(8, 9, 4, 13, 'y').px(5, 8, 'g').px(8, 10, 'g');
    g.line(18, 8, 21, 10, 'y').line(21, 10, 19, 12, 'y').line(19, 12, 24, 15, 'y').px(22, 11, 'g').px(23, 15, 'g');
    g.px(4, 3, 'w').px(23, 4, 'y').px(3, 16, 'g');
  } },

  // Deep Well: a stone well brimming with glowing mana
  ma9: { frame: 'magic', art: (g) => {
    g.rect(4, 3, 2, 13, 'L').rect(22, 3, 2, 13, 'L').px(4, 3, 'l').px(22, 3, 'l');
    g.spans([[1, 7, 20], [2, 4, 23], [3, 2, 25]], 'L').spans([[1, 8, 19], [2, 5, 22]], 'l');
    g.line(6, 6, 21, 6, 'h').line(13, 7, 13, 10, 'T').rect(12, 10, 3, 3, 'l').rect(12, 10, 3, 1, 'G');
    g.ellipse(13.5, 15, 10.5, 3.2, 'k').ellipse(13.5, 15, 9, 2.2, 'b').ellipse(13, 14.6, 6.5, 1.4, 'i').px(11, 14, 'w').px(16, 15, 'w');
    g.rect(3, 15, 22, 10, 'm');
    g.spans([[25, 4, 23]], 'k');
    for (const y of [17, 20, 23]) g.line(3, y, 24, y, 'k');
    for (const [y, xs] of [[15, [8, 15, 21]], [18, [5, 11, 18, 23]], [21, [8, 15, 21]], [24, [5, 11, 18, 23]]] as [number, number[]][]) for (const x of xs) g.line(x, y, x, y + 1, 'k');
    g.rect(3, 16, 2, 9, 'n').rect(22, 16, 3, 9, 'k').rect(5, 16, 1, 1, 'n').rect(12, 19, 1, 1, 'n');
    g.px(9, 9, 'i').px(18, 8, 'i').px(7, 11, 'b').px(20, 12, 'b').px(16, 10, 'w');
  } },

  // Elementalist: a flame held in an open palm
  'sub:mage:Elementalist': { frame: 'fire', art: (g) => {
    flame(g, 13.5, 15, 14, 5, 0.6);
    g.spans([[17, 6, 21], [18, 6, 21], [19, 7, 20], [20, 7, 20], [21, 8, 19], [22, 9, 18]], 's');
    g.rect(4, 14, 2, 5, 's').rect(22, 14, 2, 5, 's').px(5, 13, 's').px(22, 13, 's').px(4, 13, 'S').px(23, 13, 'S');
    g.spans([[16, 6, 7], [16, 20, 21]], 's').rect(23, 14, 1, 5, 'S').spans([[19, 18, 20], [20, 17, 20], [21, 16, 19], [22, 15, 18]], 'S');
    g.line(8, 18, 19, 18, 'S').px(7, 17, 'S').px(20, 17, 'S');
    g.rect(9, 23, 10, 4, 'c').rect(9, 23, 10, 1, 'q').rect(15, 24, 4, 3, 'C');
    g.px(5, 4, 'f').px(22, 3, 'y').px(3, 9, 'y').px(24, 8, 'f').px(13, 17, 'y');
  } },

  // Cinder Heart: a heart of glowing coal, cracked with fire
  'mage-elementalist-t5': { frame: 'fire', art: (g) => {
    const heart = (c: string, s: number) => {
      g.ellipse(8.5, 10, 5.5 * s, 5 * s, c).ellipse(18.5, 10, 5.5 * s, 5 * s, c);
      for (let y = 11; y <= 25; y++) { const hw = 11 * s * (1 - (y - 11) / 14.5); if (hw >= 0) g.spans([[y, Math.round(13.5 - hw), Math.round(13.5 + hw)]], c); }
    };
    heart('e', 1.05); heart('R', 1); g.ellipse(8, 9, 3.4, 3, 'r').ellipse(17.5, 9, 2.4, 2, 'r').px(6, 7, 'p').px(7, 6, 'p');
    g.line(13, 9, 11, 13, 'f').line(11, 13, 15, 16, 'f').line(15, 16, 12, 21, 'f').line(15, 16, 20, 13, 'F').line(11, 13, 6, 14, 'F');
    g.px(13, 9, 'y').px(12, 14, 'y').px(14, 16, 'y').px(13, 19, 'y').px(14, 15, 'w');
    flame(g, 9, 6, 6, 1.6, -0.4, 3); flame(g, 19, 5, 5, 1.4, 0.4, 3);
    g.px(3, 4, 'f').px(25, 3, 'y').px(23, 19, 'f');
  } },

  // Wildfire: a blaze whose sparks leap to light two more fires
  'mage-elementalist-t6': { frame: 'fire', art: (g) => {
    g.rect(1, 24, 26, 3, 'L').rect(1, 24, 26, 1, 'h');
    flame(g, 6.5, 24, 20, 5, -0.5);
    flame(g, 16, 24, 11, 3.2, 0.3);
    flame(g, 23.5, 24, 7, 2.4, 0.2);
    for (const [x, y] of [[10, 4], [12, 4], [14, 5], [15, 7], [16, 9], [18, 10], [20, 12], [21, 14], [22, 16]] as const) g.px(x, y, 'y');
    g.px(11, 3, 'f').px(16, 8, 'f').px(21, 13, 'f').px(13, 4, 'w').px(19, 11, 'w');
    g.px(26, 9, 'y').px(2, 3, 'f');
  } },

  // Ashfall (ULTIMATE): a black storm cloud raining burning stones
  'mage-elementalist-t7': { frame: 'ult', art: (g) => {
    g.ellipse(7, 6, 5.5, 3.6, 'D').ellipse(14, 4.5, 6, 4, 'D').ellipse(21, 6, 5.5, 3.6, 'D').rect(2, 6, 24, 4, 'D');
    g.ellipse(7, 5.4, 4.4, 2.6, 'd').ellipse(14, 3.8, 5, 2.8, 'd').ellipse(21, 5.4, 4.4, 2.6, 'd').rect(3, 8, 22, 2, 'D');
    g.px(11, 2, 'k').px(13, 1, 'k').px(5, 3, 'k').px(20, 3, 'k');
    g.spans([[10, 4, 6], [10, 11, 15], [10, 20, 23]], 'F');
    fireball(g, 6, 18, 2.4, -0.45, 1, 6);
    fireball(g, 15, 23, 2.8, -0.45, 1, 9);
    fireball(g, 23, 17, 2.2, -0.45, 1, 5);
    fireball(g, 11, 14, 1.6, -0.45, 1, 3);
    g.px(19, 24, 'f').px(3, 25, 'f').px(25, 24, 'y').px(20, 13, 'f');
  } },

  // Chronomancer: an ornate teal clock face, hands at the hour
  'sub:mage:Chronomancer': { frame: 'cold', art: (g) => {
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; g.ellipse(13.5 + Math.sin(a) * 11, 13.5 - Math.cos(a) * 11, 1.6, 1.6, i < 3 || i === 7 ? 'x' : 'X'); }
    clock(g, 13.5, 13.5, 11, 'x', 'X', 'a', 'X');
    g.ellipse(13.5, 13.5, 8.6, 8.6, 'a').ellipse(14.5, 14.5, 7.6, 7.6, 'A').ellipse(13.5, 13.5, 7.6, 7.6, 'a');
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.px(13.5 + Math.sin(a) * 7.2, 13.5 - Math.cos(a) * 7.2, i % 3 === 0 ? 'e' : 'X'); }
    g.line(13, 14, 13, 7, 'e').line(14, 14, 14, 8, 'D').line(13, 14, 18, 17, 'e').ellipse(13.5, 13.5, 1.2, 1.2, 'g').px(13, 13, 'y');
    g.px(7, 5, 'w').px(6, 6, 'i').px(5, 8, 'i').px(9, 9, 'w');
  } },

  // Stolen Seconds: a creeping snail, a trail of golden sand behind it
  'mage-chronomancer-t5': { frame: 'magic', art: (g) => {
    g.spans([[23, 6, 25], [24, 6, 26], [22, 20, 24], [21, 21, 24], [20, 22, 24], [19, 22, 24], [18, 23, 24]], 'A').spans([[22, 7, 19], [21, 8, 10]], 'a').spans([[25, 7, 25]], 'k');
    g.line(22, 18, 21, 13, 'A').line(24, 18, 25, 13, 'A').px(21, 12, 'e').px(25, 12, 'e').px(21, 13, 'a').px(23, 20, 'e');
    g.ellipse(13, 13, 8.5, 8.5, 'C').ellipse(12.5, 12.5, 7.8, 7.8, 'c');
    for (let i = 0; i <= 140; i++) { const a = (i / 140) * Math.PI * 4.2, r = 7.2 * (1 - i / 160); g.px(13 + Math.cos(a) * r, 13 + Math.sin(a) * r, 'C'); }
    g.px(13, 13, 'q').px(8, 8, 'q').px(9, 7, 'q').px(7, 10, 'q').px(10, 6, 'w');
    g.spans([[24, 1, 3]], 'G').px(4, 23, 'g').px(2, 22, 'g').px(1, 25, 'g').px(3, 26, 'y').px(5, 25, 'g').px(4, 21, 'y');
    g.px(23, 3, 'q').px(19, 6, 'c').px(25, 8, 'q');
  } },

  // Rewound Hour: a great arrow turning back around a small hourglass
  'mage-chronomancer-t6': { frame: 'magic', art: (g) => {
    for (let i = 0; i <= 60; i++) {
      const a = -0.3 - (i / 60) * Math.PI * 1.55, x = 13.5 + Math.cos(a) * 9.5, y = 14 + Math.sin(a) * 9.5;
      g.ellipse(x, y, 1.6, 1.6, i > 45 ? 'i' : 'x');
    }
    for (let i = 0; i <= 60; i++) { const a = -0.3 - (i / 60) * Math.PI * 1.55; g.px(13.5 + Math.cos(a) * 8.3, 14 + Math.sin(a) * 8.3, 'X'); }
    // arrowhead at the start (pointing anti-clockwise, i.e. down along the right side)
    g.spans([[16, 19, 26], [17, 20, 25], [18, 21, 24], [19, 22, 23]], 'i').spans([[15, 19, 26]], 'x').px(22, 20, 'i').px(23, 20, 'i');
    // small hourglass inside
    g.rect(10, 8, 8, 2, 'G').rect(10, 19, 8, 2, 'G').rect(10, 8, 8, 1, 'g');
    g.spans([[10, 11, 16], [11, 11, 16], [12, 12, 15], [13, 13, 14], [14, 13, 14], [15, 12, 15], [16, 11, 16], [17, 11, 16], [18, 11, 16]], 'q');
    g.spans([[16, 12, 15], [17, 11, 16], [18, 11, 16], [11, 12, 15]], 'g').px(13, 14, 'g').px(12, 10, 'w');
    g.px(4, 4, 'i').px(24, 25, 'q').px(3, 22, 'w');
  } },

  // The Hour Unstruck (ULTIMATE): the hour bell bound silent in chains
  'mage-chronomancer-t7': { frame: 'ult', art: (g) => {
    g.rect(12, 1, 4, 2, 'G').rect(13, 0, 2, 1, 'G');
    g.spans([[3, 10, 17], [4, 9, 18], [5, 8, 19], [6, 8, 19], [7, 7, 20], [8, 7, 20], [9, 7, 20], [10, 7, 20], [11, 7, 20], [12, 6, 21], [13, 6, 21], [14, 6, 21], [15, 5, 22], [16, 4, 23], [17, 3, 24], [18, 3, 24]], 'g');
    g.spans([[4, 16, 18], [6, 17, 19], [8, 18, 20], [10, 18, 20], [12, 18, 21], [14, 19, 21], [16, 20, 23], [17, 21, 24], [18, 21, 24]], 'G');
    g.rect(3, 19, 22, 2, 'G').rect(9, 5, 2, 9, 'y').ellipse(13.5, 22.5, 2, 1.6, 'h');
    // chains in an X across the bell
    for (let i = 0; i <= 22; i += 2) { g.rect(2 + i, 4 + i, 2, 2, 'm').px(2 + i, 4 + i, 'n').rect(24 - i, 4 + i, 2, 2, 'm').px(24 - i, 4 + i, 'n'); }
    for (let i = 1; i <= 22; i += 2) { g.px(3 + i, 5 + i, 'k').px(24 - i, 5 + i, 'k'); }
    g.ellipse(13.5, 15, 2.2, 2.2, 'k').ellipse(13.5, 15, 1.2, 1.2, 'm').px(13, 14, 'n');
    g.px(1, 13, 'i').px(26, 12, 'i').px(2, 24, 'w').px(25, 25, 'i');
  } },

  // Battlemage: a sword and a crystal staff crossed
  'sub:mage:Battlemage': { frame: 'phys', art: (g) => {
    g.line(4, 25, 21, 8, 'L').line(5, 25, 22, 8, 'l').px(3, 26, 'G').px(4, 26, 'g');
    g.ellipse(22.5, 5.5, 3, 3, 'C').ellipse(22, 5, 2.2, 2.2, 'c').px(21, 4, 'q').px(21, 5, 'w');
    g.spans([[9, 19, 20], [8, 24, 25]], 'G').px(19, 8, 'G').px(25, 9, 'G');
    g.line(6, 4, 19, 17, 'n').line(7, 4, 20, 17, 'm').line(7, 3, 20, 16, 'n').line(8, 4, 21, 17, 'k').px(5, 3, 'w').px(6, 3, 'n').px(5, 2, 'n');
    g.line(16, 22, 23, 15, 'G').line(17, 22, 24, 15, 'g').line(20, 20, 24, 24, 'L').line(21, 20, 25, 24, 'L').ellipse(25.5, 25, 1.4, 1.4, 'g');
    g.px(23, 2, 'q').px(26, 7, 'q').px(19, 3, 'q');
  } },

  // Arcane Sever: a violet crescent cut through the air
  'mage-battlemage-t5': { frame: 'magic', art: (g) => {
    const arc = (k: number) => { const a = Math.PI * (0.32 + k * 0.86); return [17 + Math.cos(a) * 12, 10 + Math.sin(a) * 12, Math.sin(k * Math.PI)] as const; };
    for (let i = 0; i <= 90; i++) { const [x, y, s] = arc(i / 90); g.ellipse(x, y, s * 2.8 + 0.6, s * 2.8 + 0.6, 'C'); }
    for (let i = 0; i <= 90; i++) { const [x, y, s] = arc(i / 90); g.ellipse(x, y, s * 2.8, s * 2.8, 'c'); }
    for (let i = 10; i <= 80; i++) { const [x, y, s] = arc(i / 90); g.px(x + 1, y - 1, s > 0.8 ? 'w' : 'q'); }
    for (const [k, len] of [[0.35, 6], [0.55, 7], [0.75, 5]] as const) { const [x, y] = arc(k); const ex = x + 6, ey = y - 6; g.line(x + 3, y - 3, x + 3 + len * 0.7, y - 3 - len * 0.7, 'q').px(ex - 6 + 3 + len * 0.7 + 1, ey + 6 - 3 - len * 0.7 - 1, 'c'); }
    g.spans([[19, 21, 25], [20, 22, 24]], 'q').line(23, 17, 23, 23, 'q').px(23, 20, 'w').px(22, 19, 'w').px(24, 21, 'w');
    g.px(20, 4, 'w').px(24, 6, 'q').px(15, 6, 'c');
  } },

  // Runeflood: a runestone and its glowing double rising from a wave of mana
  'mage-battlemage-t6': { frame: 'magic', art: (g) => {
    const stone = (x: number, y: number, a: string, b: string, c: string, glyph: string, glow: string) => {
      g.ellipse(x + 4, y + 2.5, 4.5, 3, b).rect(x, y + 2, 9, 11, b).ellipse(x + 3.5, y + 2, 3.5, 2.4, a).rect(x, y + 2, 7, 10, a).rect(x, y + 2, 1, 10, c);
      g.line(x + 4, y + 2, x + 4, y + 10, glyph).line(x + 2, y + 4, x + 4, y + 6, glyph).line(x + 6, y + 4, x + 4, y + 6, glyph).line(x + 2, y + 9, x + 6, y + 9, glyph).px(x + 4, y + 6, glow);
    };
    stone(13, 2, 'c', 'C', 'q', 'i', 'w');
    stone(4, 7, 'm', 'k', 'n', 'b', 'i');
    g.ellipse(13.5, 24, 13, 3, 'B').ellipse(13.5, 23.5, 12, 2.2, 'b');
    g.spans([[21, 2, 5], [20, 4, 6], [21, 20, 23], [20, 22, 24], [21, 11, 14]], 'b').px(5, 20, 'i').px(23, 20, 'i').px(12, 21, 'i');
    g.line(4, 23, 9, 23, 'i').line(16, 24, 22, 24, 'i').px(11, 25, 'i');
    g.px(24, 4, 'q').px(25, 9, 'i').px(2, 4, 'q').px(25, 15, 'q');
  } },

  // Sundering Rune (ULTIMATE): a great rune circle split in two by a crack in the air
  'mage-battlemage-t7': { frame: 'ult', art: (g) => {
    const ring = (dy: number, left: boolean) => {
      const half = (x: number) => (left ? x <= 13 : x >= 14);
      const tmp: [number, number, string][] = [];
      const put = (x: number, y: number, c: string) => { x = Math.round(x); y = Math.round(y); if (half(x)) tmp.push([x, y + dy, c]); };
      for (let i = 0; i < 240; i++) { const a = (i / 240) * Math.PI * 2; for (const [r, c] of [[11, 'C'], [10.2, 'c'], [9.4, 'q'], [8.6, 'c']] as const) put(13.5 + Math.cos(a) * r, 13.5 + Math.sin(a) * r, c); }
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + 0.3, x = 13.5 + Math.cos(a) * 5, y = 13.5 + Math.sin(a) * 5;
        put(x, y, 'q'); put(x + 1, y, 'c'); put(x, y + 1, 'c'); put(x - 1, y, 'c');
      }
      for (const [x, y, c] of tmp) g.px(x, y, c);
    };
    ring(-2, true); ring(2, false);
    g.line(13, 0, 14, 5, 'w').line(14, 5, 12, 10, 'w').line(12, 10, 15, 16, 'w').line(15, 16, 13, 21, 'w').line(13, 21, 14, 27, 'w');
    g.line(14, 0, 15, 5, 'y').line(15, 5, 13, 10, 'y').line(13, 10, 16, 16, 'y').line(16, 16, 14, 21, 'y').line(14, 21, 15, 27, 'y');
    g.px(11, 6, 'w').px(17, 19, 'w').px(10, 17, 'q').px(18, 9, 'q').px(3, 3, 'q').px(24, 24, 'q');
  } },
};
