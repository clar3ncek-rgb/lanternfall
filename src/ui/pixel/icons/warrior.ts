// 32 px icons: warrior group. Keys are the ids from icon-list.ts (ICON_GROUPS.warrior).
import type { IconDef } from '../icon-kit';
import { Grid } from '../core';

/** Arc of radius r from angle a0 to a1 (degrees, 0 = right, 90 = down), th px thick inward. */
const arc = (g: Grid, cx: number, cy: number, r: number, a0: number, a1: number, c: string, th = 1) => {
  for (let a = a0; a <= a1; a += 1) {
    const rad = (a * Math.PI) / 180;
    for (let k = 0; k < th; k++) g.px(cx + (r - k) * Math.cos(rad), cy + (r - k) * Math.sin(rad), c);
  }
};
/** A flame tongue pointing up: tip at (cx, top), widest (half-width w) at bot. */
const flame = (g: Grid, cx: number, top: number, bot: number, w: number, c: string) => {
  for (let y = top; y <= bot; y++) {
    const t = (y - top) / Math.max(1, bot - top);
    const hw = w * Math.sqrt(t);
    g.spans([[y, Math.round(cx - hw), Math.round(cx + hw)]], c);
  }
};
/** A small skull (bone, eye holes, teeth). */
const skull = (g: Grid, cx: number, cy: number, r: number) => {
  g.ellipse(cx, cy, r, r * 0.85, 't').rect(Math.round(cx - r * 0.6), Math.round(cy + r * 0.6), Math.max(2, Math.round(r * 1.2)) + 1, 2, 't');
  g.ellipse(cx + r * 0.45, cy + 0.3, r * 0.45, r * 0.6, 'T').ellipse(cx - 0.3, cy - 0.3, r * 0.6, r * 0.55, 't');
  const ex = Math.max(1, Math.round(r * 0.45));
  g.px(cx - ex, cy, 'e').px(cx + ex, cy, 'e');
  if (r >= 3) g.px(cx - ex - 1, cy, 'e').px(cx + ex + 1, cy, 'e').px(cx - ex, cy + 1, 'e').px(cx + ex, cy + 1, 'e');
  g.px(cx, cy + r * 0.6 + 1, 'e');
};
/** A blood drop: round bottom at (cx, cy) radius r, tip pointing up. */
const drop = (g: Grid, cx: number, cy: number, r: number) => {
  flame(g, cx, Math.round(cy - r * 2.2), Math.round(cy), r * 0.95, 'R');
  g.ellipse(cx, cy, r, r, 'R');
  flame(g, cx - 0.5, Math.round(cy - r * 2.2) + 1, Math.round(cy), r * 0.7, 'r');
  g.ellipse(cx - 0.5, cy - 0.5, r - 0.8, r - 0.8, 'r');
  g.px(cx - r * 0.5, cy - r * 0.4, 'p').px(cx - r * 0.5, cy - r * 0.4 - 1, 'p');
};

export const ICONS: Record<string, IconDef> = {
  // Warrior: a round wooden shield with an iron boss, a battle-axe raised behind it
  'class:warrior': { frame: 'phys', art: (g) => {
    g.line(15, 2, 24, 26, 'l').line(16, 2, 25, 26, 'L');
    const wd = [3, 5, 6, 7, 7, 7, 7, 6, 5, 3];
    for (let i = 0; i < wd.length; i++) {
      const y = 2 + i, x0 = Math.round(15 + 0.375 * (y - 2)) + 2;
      g.rect(x0, y, wd[i], 1, i > 6 ? 'k' : 'm').px(x0 + wd[i] - 1, y, 'n').px(x0, y, 'k');
    }
    g.rect(18, 2, 4, 1, 'n').px(22, 4, 'w').px(23, 5, 'w');
    g.px(14, 4, 'k').px(13, 5, 'k').px(14, 5, 'm');
    g.ellipse(10, 17, 8.5, 8.5, 'm').ellipse(10.6, 17.6, 8, 8, 'k').ellipse(10, 17, 6.8, 6.8, 'l');
    g.ellipse(11, 18, 5.5, 5.5, 'L').ellipse(10, 17, 5.2, 5.2, 'l');
    g.swap('l', 'L', 6, 9, 1, 17).swap('l', 'L', 14, 9, 1, 17);
    g.ellipse(10, 17, 2.4, 2.4, 'k').ellipse(9.6, 16.6, 1.6, 1.6, 'm').px(9, 16, 'n');
    for (const [x, y] of [[10, 11], [16, 17], [10, 23], [4, 17]] as const) g.px(x, y, 'n');
    g.px(5, 12, 'n').px(6, 11, 'n').px(4, 13, 'n');
  } },

  // Weapon Fundamentals: a plain, honest longsword held upright
  wa0: { frame: 'phys', art: (g) => {
    g.px(13, 1, 'n').px(14, 1, 'm');
    g.rect(12, 2, 1, 16, 'n').rect(13, 2, 1, 16, 'n').rect(14, 2, 1, 16, 'm').rect(15, 2, 1, 16, 'k');
    g.rect(13, 5, 1, 11, 'w').rect(14, 5, 1, 11, 'k');
    g.rect(5, 18, 18, 2, 'G').rect(5, 18, 18, 1, 'g').px(4, 17, 'g').px(23, 17, 'G').px(4, 18, 'G').px(23, 18, 'G');
    g.rect(12, 20, 4, 5, 'L').rect(12, 21, 4, 1, 'l').rect(12, 23, 4, 1, 'l').rect(12, 20, 1, 5, 'l');
    g.ellipse(13.5, 25.5, 1.8, 1.3, 'G').px(13, 25, 'g').px(12, 25, 'y');
    g.px(20, 6, 'y').px(21, 5, 'w').px(22, 6, 'y').px(21, 7, 'y').px(6, 10, 'y');
  } },

  // Guard Discipline: an hourglass that keeps most of its sand up top
  wa1: { frame: 'stat', art: (g) => {
    const T: [number, number][] = [[8, 19], [8, 19], [9, 18], [9, 18], [10, 17], [11, 16], [12, 15], [13, 14], [13, 14]];
    const B = [...T].reverse();
    T.forEach(([a, b], i) => g.spans([[5 + i, a, b]], 'a'));
    B.forEach(([a, b], i) => g.spans([[14 + i, a, b]], 'a'));
    for (let y = 5; y <= 22; y++) for (let x = 0; x < 28; x++) if (g.get(x, y) === 'a' && g.get(x + 1, y) !== 'a') g.px(x, y, 'A');
    for (let y = 8; y <= 12; y++) { const [a, b] = T[y - 5]; g.spans([[y, a + 1, b - 1]], 'g'); g.px(b - 1, y, 'G'); }
    g.spans([[8, 10, 17]], 'y');
    g.rect(13, 13, 1, 8, 'y');
    g.spans([[22, 9, 18], [21, 10, 17], [20, 12, 15], [19, 13, 14]], 'g').spans([[22, 15, 18], [21, 15, 17]], 'G').px(13, 19, 'y');
    g.px(9, 6, 'w').px(9, 7, 'w').px(10, 17, 'w').px(9, 18, 'w');
    g.rect(4, 2, 20, 3, 'L').rect(4, 2, 20, 1, 'l').rect(4, 23, 20, 3, 'L').rect(4, 23, 20, 1, 'l');
    g.rect(5, 5, 2, 18, 'k').rect(5, 5, 1, 18, 'm').rect(21, 5, 2, 18, 'k').rect(21, 5, 1, 18, 'm');
    g.px(4, 2, 'g').px(23, 2, 'G').px(4, 23, 'g').px(23, 23, 'G');
  } },

  // Shield Intercept: a kite shield chained shut, padlocked: the boss is locked in place
  wa2: { frame: 'cold', art: (g) => {
    const S: [number, number, number][] = [[3, 6, 21]];
    for (let y = 4; y <= 14; y++) S.push([y, 5, 22]);
    S.push([15, 6, 21], [16, 6, 21], [17, 7, 20], [18, 8, 19], [19, 8, 19], [20, 9, 18], [21, 10, 17], [22, 11, 16], [23, 12, 15], [24, 13, 14], [25, 13, 14]);
    g.spans(S, 'k');
    g.spans(S.filter(([y]) => y > 3 && y < 25).map(([y, a, b]) => [y, a + 1, b - 1] as [number, number, number]), 'B');
    g.spans(S.filter(([y]) => y > 3 && y < 25).map(([y, a, b]) => [y, a + 1, Math.floor((a + b) / 2)] as [number, number, number]), 'b');
    for (const [y, a] of S) g.px(a, y, 'n');
    g.rect(6, 3, 15, 1, 'n');
    for (const [x0, y0, x1, y1] of [[6, 5, 21, 21], [21, 5, 6, 21]] as const) {
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
        g.px(x, y, i % 3 === 0 ? 'k' : 'n').px(x + 1, y, i % 3 === 0 ? 'k' : 'm');
      }
    }
    g.rect(12, 9, 4, 1, 'm').rect(11, 10, 1, 3, 'm').rect(16, 10, 1, 3, 'k').px(12, 9, 'n');
    g.rect(10, 12, 8, 7, 'G').rect(10, 12, 7, 6, 'g').rect(10, 12, 7, 1, 'y');
    g.rect(13, 14, 2, 2, 'e').px(13, 16, 'e').px(14, 16, 'e').px(13, 17, 'h');
    g.px(3, 2, 'i').px(24, 4, 'i').px(25, 3, 'w').px(3, 24, 'i');
  } },

  // Last Bastion: a lone stone tower with a lit window and a red banner
  wa3: { frame: 'phys', art: (g) => {
    g.rect(7, 10, 14, 16, 'm');
    g.rect(5, 7, 18, 3, 'm').rect(5, 4, 4, 3, 'm').rect(12, 4, 4, 3, 'm').rect(19, 4, 4, 3, 'm');
    g.rect(5, 9, 18, 1, 'k').rect(19, 10, 2, 16, 'k').rect(21, 4, 2, 6, 'k').rect(14, 4, 2, 3, 'k').rect(7, 4, 2, 3, 'k');
    g.rect(7, 10, 1, 16, 'n').rect(5, 4, 1, 6, 'n').rect(12, 4, 1, 3, 'n').rect(19, 4, 1, 3, 'n').rect(5, 4, 4, 1, 'n').rect(12, 4, 4, 1, 'n').rect(19, 4, 4, 1, 'n');
    for (const y of [13, 17, 21]) g.rect(8, y, 11, 1, 'k');
    for (const [x, y] of [[11, 10], [16, 10], [13, 14], [9, 18], [16, 18], [12, 22]] as const) g.rect(x, y, 1, 3, 'k');
    g.rect(12, 21, 4, 5, 'e').rect(13, 20, 2, 1, 'e');
    g.rect(13, 13, 2, 4, 'f').px(13, 13, 'y').px(13, 14, 'y').rect(13, 13, 2, 1, 'e');
    g.rect(13, 1, 1, 4, 'L').rect(14, 1, 7, 3, 'r').rect(14, 3, 7, 1, 'R').px(20, 2, '.').px(19, 2, 'R').px(14, 1, 'p').px(15, 1, 'p');
    g.rect(3, 26, 22, 1, 'L').rect(5, 25, 2, 1, 'k').rect(21, 25, 3, 1, 'k');
  } },

  // Battle Fury: a bloodied axe wreathed in red rage-fire
  wa4: { frame: 'blood', art: (g) => {
    flame(g, 7, 3, 20, 5, 'R'); flame(g, 13, 1, 16, 5, 'R'); flame(g, 4, 9, 22, 3.5, 'R');
    flame(g, 7, 6, 20, 3.5, 'r'); flame(g, 13, 4, 16, 3.5, 'r'); flame(g, 4, 12, 22, 2, 'r');
    flame(g, 7, 10, 20, 1.6, 'f'); flame(g, 13, 8, 16, 1.6, 'f'); g.px(7, 15, 'y').px(13, 12, 'y');
    g.ellipse(20, 10, 6, 7, 'n').ellipse(20.6, 10.4, 5.6, 6.6, 'm').ellipse(15, 10, 3.8, 5, '.');
    g.swap('m', 'k', 14, 13, 14, 6).swap('n', 'm', 14, 14, 14, 5);
    g.px(25, 7, 'w').px(25, 8, 'w').px(26, 10, 'r').px(25, 13, 'r').px(24, 15, 'R').px(26, 11, 'R');
    g.line(5, 26, 18, 6, 'l').line(6, 26, 19, 6, 'L').px(18, 5, 'k').px(19, 5, 'k').px(4, 26, 'L');
    g.line(8, 21, 10, 18, 'h');
  } },

  // Blood Momentum: drops of blood growing as they fly, each feeding the next
  wa5: { frame: 'blood', art: (g) => {
    drop(g, 5, 23, 2.2); drop(g, 12, 19, 3.2); drop(g, 20.5, 14, 5);
    for (const [x, y, n] of [[1, 20, 2], [1, 23, 2], [6, 15, 3], [7, 19, 2], [12, 8, 4], [13, 12, 3]] as const) g.rect(x, y, n, 1, 'p');
    g.px(22, 3, 'y').px(25, 6, 'y').px(16, 24, 'R').px(18, 25, 'R').px(25, 23, 'R');
  } },

  // Unbroken Rage: a whirlwind of red blade-arcs with a burst at its heart
  wa6: { frame: 'blood', art: (g) => {
    arc(g, 13.5, 13.5, 12, 190, 330, 'R', 3); arc(g, 13.5, 13.5, 11.5, 195, 325, 'r', 2); arc(g, 13.5, 13.5, 12, 200, 310, 'p', 1);
    arc(g, 13.5, 13.5, 12, 10, 150, 'R', 3); arc(g, 13.5, 13.5, 11.5, 15, 145, 'r', 2); arc(g, 13.5, 13.5, 12, 20, 130, 'p', 1);
    arc(g, 13.5, 13.5, 7.5, 100, 230, 'R', 2); arc(g, 13.5, 13.5, 7.5, 105, 220, 'r', 1);
    arc(g, 13.5, 13.5, 7.5, 280, 410, 'R', 2); arc(g, 13.5, 13.5, 7.5, 285, 400, 'r', 1);
    for (const [x, y] of [[25, 8], [2, 19], [8, 6], [19, 21]] as const) g.rect(x, y, 2, 2, 'n').px(x + 1, y + 1, 'm').px(x, y, 'w');
    g.line(10, 13, 17, 14, 'y').line(13, 10, 14, 17, 'y').px(11, 11, 'f').px(16, 11, 'f').px(11, 16, 'f').px(16, 16, 'f');
    g.rect(13, 13, 2, 2, 'w');
  } },

  // Measured Footwork: two boot prints on a dotted path, step by careful step
  wa7: { frame: 'phys', art: (g) => {
    const boot = (cx: number, cy: number) => {
      g.ellipse(cx, cy, 3.6, 5, 'L').ellipse(cx - 0.4, cy - 0.4, 3, 4.4, 'l').rect(Math.round(cx - 2), cy + 6, 5, 4, 'L').rect(Math.round(cx - 2), cy + 6, 4, 3, 'l');
      for (const dy of [-3, -1, 1, 3]) g.rect(Math.round(cx - 2), cy + dy, 4, 1, 'L');
      g.rect(Math.round(cx - 1), cy + 7, 2, 1, 'L').px(Math.round(cx - 2), cy - 4, 'T');
    };
    boot(7, 13); boot(19, 6);
    for (const [x, y] of [[4, 25], [9, 25], [14, 24], [18, 22], [22, 19], [25, 16]] as const) g.rect(x, y, 2, 1, 'y');
    g.px(24, 3, 'w').px(3, 3, 'T').px(2, 4, 'T');
  } },

  // Riposte: two rapiers meet; one turns the other aside in a burst of sparks
  wa8: { frame: 'phys', art: (g) => {
    g.line(3, 7, 24, 18, 'k').line(3, 8, 24, 19, 'm').px(25, 19, 'm');
    g.line(2, 10, 5, 5, 'k').line(3, 10, 6, 5, 'm').line(1, 7, 3, 8, 'L').px(1, 6, 'k');
    g.line(5, 23, 24, 3, 'n').line(6, 23, 25, 3, 'm').px(25, 2, 'w');
    g.ellipse(5, 23, 2.6, 2.4, 'G').ellipse(4.6, 22.6, 2, 1.8, 'g').px(4, 22, 'y').line(2, 26, 4, 24, 'L');
    g.line(15, 8, 15, 18, 'y').line(10, 13, 20, 13, 'y').line(12, 10, 18, 16, 'y').line(18, 10, 12, 16, 'y');
    g.rect(14, 12, 3, 3, 'w');
    arc(g, 15, 13, 9, 300, 345, 'p', 1); g.px(23, 9, 'p').px(22, 9, 'p').px(23, 10, 'p');
  } },

  // Perfect Opening: a rapier thrust slips between two armour plates
  wa9: { frame: 'phys', art: (g) => {
    g.rect(17, 2, 8, 10, 'k').rect(17, 2, 7, 9, 'm').rect(17, 2, 7, 1, 'n').rect(17, 2, 1, 9, 'n').px(20, 5, 'k').px(20, 8, 'k');
    g.rect(17, 17, 8, 10, 'k').rect(17, 17, 7, 9, 'm').rect(17, 17, 7, 1, 'n').rect(17, 17, 1, 9, 'n').px(20, 20, 'k').px(20, 23, 'k');
    g.rect(8, 13, 18, 1, 'n').rect(8, 14, 18, 1, 'm').px(26, 13, 'w').px(26, 14, 'n');
    g.ellipse(6, 13.5, 2, 4, 'G').ellipse(5.6, 13, 1.5, 3.4, 'g').px(5, 11, 'y');
    g.rect(2, 13, 3, 2, 'L').px(2, 13, 'l').px(1, 13, 'g').px(1, 14, 'G');
    for (const [x, y, n] of [[9, 10, 5], [10, 17, 4], [3, 9, 3], [3, 18, 3]] as const) g.rect(x, y, n, 1, 'a');
    g.px(25, 12, 'y').px(25, 15, 'y').px(24, 13, 'y');
  } },

  // Guardian: a closed great helm with a blue crest
  'sub:warrior:Guardian': { frame: 'cold', art: (g) => {
    g.ellipse(13.5, 3, 5, 2.2, 'B').ellipse(12.8, 2.6, 4, 1.6, 'b').px(11, 2, 'i').px(12, 2, 'i');
    g.spans([[5, 10, 17], [6, 8, 19], [7, 7, 20], [8, 6, 21]], 'm').rect(6, 9, 16, 15, 'm');
    g.rect(19, 7, 3, 17, 'k').px(18, 6, 'k').px(19, 6, 'k');
    g.rect(6, 9, 1, 15, 'n').px(7, 7, 'n').px(8, 6, 'n').px(10, 5, 'n').px(11, 5, 'n');
    g.rect(13, 5, 2, 19, 'n').rect(14, 5, 1, 19, 'm');
    g.rect(7, 11, 12, 2, 'e').rect(13, 11, 2, 2, 'e').px(9, 11, 'i').px(17, 11, 'i').px(10, 11, 'b').px(16, 11, 'b');
    g.rect(7, 14, 6, 1, 'k').rect(15, 14, 5, 1, 'k');
    for (const [x, y] of [[9, 17], [11, 17], [9, 19], [11, 19], [16, 17], [18, 17], [16, 19], [18, 19]] as const) g.px(x, y, 'e');
    g.spans([[24, 5, 22], [25, 4, 23]], 'k').rect(5, 24, 9, 1, 'm').px(4, 25, 'm');
    g.px(8, 9, 'w').px(3, 6, 'i').px(24, 4, 'i');
  } },

  // Iron Vigil: one candle kept burning in an iron holder through the long night
  'warrior-guardian-t5': { frame: 'fire', art: (g) => {
    g.spans([[1, 13, 14], [2, 12, 15], [3, 12, 15], [4, 12, 15], [5, 13, 14]], 'f').spans([[2, 13, 13], [3, 13, 14], [4, 13, 14]], 'y').px(13, 3, 'w');
    g.px(14, 6, 'e');
    g.rect(10, 7, 8, 9, 't').rect(16, 7, 2, 9, 'T').rect(10, 7, 1, 9, 'w').px(15, 7, 'T').px(15, 8, 'T').px(11, 7, 'T').px(11, 8, 'T').px(11, 9, 'T');
    g.ellipse(13.5, 16.5, 7, 1.5, 'm').rect(7, 17, 14, 1, 'k');
    g.rect(12, 18, 4, 5, 'k').rect(12, 18, 1, 5, 'm').ellipse(13.5, 20, 2.4, 1, 'k').px(12, 20, 'm');
    g.spans([[23, 9, 18], [24, 7, 20], [25, 6, 21]], 'k').spans([[23, 9, 12], [24, 7, 10], [25, 6, 8]], 'm');
    arc(g, 22, 15, 3, 270, 450, 'k', 1); g.px(22, 12, 'm');
    for (const [x, y] of [[8, 3], [19, 3], [6, 8], [21, 8], [5, 13]] as const) g.px(x, y, 'y');
  } },

  // Unbowed: an armoured fist raised in defiance, light breaking behind it
  'warrior-guardian-t6': { frame: 'holy', art: (g) => {
    for (const [x1, y1] of [[2, 2], [13, 1], [25, 2], [2, 13], [26, 13]] as const) g.line(14, 11, x1, y1, 'y');
    g.rect(9, 17, 10, 10, 'm').rect(9, 17, 2, 10, 'n').rect(17, 17, 2, 10, 'k').rect(9, 20, 10, 1, 'k').rect(9, 24, 10, 1, 'k');
    g.rect(7, 5, 14, 12, 'm').spans([[4, 8, 10], [4, 11, 13], [4, 14, 16], [4, 17, 19]], 'n');
    g.rect(7, 5, 1, 12, 'n').rect(19, 5, 2, 12, 'k');
    for (const x of [10, 13, 16]) g.rect(x, 5, 1, 5, 'k');
    g.rect(8, 9, 12, 1, 'k');
    g.rect(6, 11, 9, 3, 'n').rect(6, 13, 9, 1, 'm').rect(14, 11, 1, 3, 'k').px(6, 11, 'w');
    g.rect(7, 16, 14, 1, 'k').px(9, 4, 'w').px(12, 4, 'w');
  } },

  // Wall of the Last Hour: a tower shield planted in the earth, a stopped clock on its face
  'warrior-guardian-t7': { frame: 'ult', art: (g) => {
    g.spans([[2, 9, 18], [3, 7, 20]], 'k').rect(6, 4, 16, 19, 'k');
    g.spans([[3, 9, 18]], 'm').rect(7, 4, 14, 18, 'B').rect(7, 4, 7, 18, 'b').rect(7, 4, 1, 18, 'i').rect(8, 3, 11, 1, 'n');
    g.ellipse(13.5, 12, 5.5, 5.5, 'G').ellipse(13.3, 11.8, 4.6, 4.6, 't').ellipse(14, 12.5, 4, 4, 'T').ellipse(13.3, 11.8, 3.8, 3.8, 't');
    for (const [x, y] of [[13, 8], [14, 8], [18, 12], [13, 16], [9, 12]] as const) g.px(x, y, 'k');
    g.rect(13, 9, 1, 4, 'e').rect(13, 12, 3, 1, 'e').px(12, 10, 'w');
    g.spans([[21, 3, 24], [22, 2, 25], [23, 2, 25], [24, 1, 26], [25, 1, 26], [26, 2, 25]], 'L').spans([[21, 4, 23], [22, 3, 11], [23, 3, 8]], 'l');
    g.rect(6, 21, 16, 2, 'k').rect(7, 21, 14, 1, 'B');
    g.px(3, 6, 'y').px(24, 5, 'y').px(25, 15, 'y').px(2, 14, 'y');
  } },

  // Berserker: a twin-bladed axe over three foes, one red stroke cleaving through all and carrying on
  'sub:warrior:Berserker': { frame: 'blood', art: (g) => {
    const w = [3, 5, 6, 7, 7, 7, 6, 5, 3];
    w.forEach((n, i) => {
      const y = 2 + i, c = i > 5 ? 'k' : 'm';
      g.rect(12 - n, y, n, 1, c).px(12 - n, y, 'n');
      g.rect(15, y, n, 1, c).px(14 + n, y, i > 5 ? 'm' : 'n');
    });
    g.rect(12, 1, 3, 14, 'l').rect(14, 1, 1, 14, 'L').px(12, 1, 'g').px(13, 1, 'g').px(14, 1, 'G');
    g.px(6, 3, 'w').px(5, 4, 'w');
    skull(g, 4.5, 19, 3.2); skull(g, 13, 20, 2.8); skull(g, 20.5, 21, 2.4);
    g.line(1, 21, 25, 24, 'p').line(1, 22, 25, 25, 'r');
    g.px(26, 24, 'p').px(26, 25, 'r').px(24, 23, 'w').px(25, 22, 'p').px(24, 21, 'p');
    g.px(5, 25, 'R').px(13, 26, 'R');
  } },

  // Red Haze: a horned helm whose eye-slits burn red in a crimson mist
  'warrior-berserker-t5': { frame: 'blood', art: (g) => {
    for (const [x, y] of [[2, 20], [4, 23], [24, 21], [22, 24], [1, 14], [26, 15], [7, 26], [19, 26]] as const) g.rect(x, y, 2, 1, 'R').px(x, y - 1, 'r');
    g.line(7, 12, 3, 8, 't').line(6, 11, 2, 7, 't').line(3, 8, 3, 3, 't').line(2, 7, 2, 4, 'T').line(7, 13, 4, 10, 'T').px(4, 2, 't');
    g.line(20, 12, 24, 8, 't').line(21, 11, 25, 7, 'T').line(24, 8, 24, 3, 't').line(25, 7, 25, 4, 'T').px(23, 2, 't');
    g.ellipse(13.5, 12, 7.5, 7, 'm').rect(6, 12, 16, 10, 'm').rect(19, 9, 3, 13, 'k').ellipse(16, 8, 3, 2, 'm');
    g.rect(6, 12, 1, 10, 'n').px(8, 7, 'n').px(9, 6, 'n').px(10, 5, 'n').px(11, 5, 'w');
    g.rect(6, 12, 16, 1, 'k').rect(6, 11, 16, 1, 'n');
    g.rect(8, 15, 4, 2, 'r').rect(16, 15, 4, 2, 'r').px(9, 15, 'p').px(17, 15, 'p').rect(8, 17, 4, 1, 'e').rect(16, 17, 4, 1, 'e');
    g.rect(13, 12, 2, 10, 'n').rect(14, 12, 1, 10, 'm');
    g.spans([[22, 7, 20]], 'k');
  } },

  // Carnage Wake: a rolling wave of blood carrying bones in its wake
  'warrior-berserker-t6': { frame: 'blood', art: (g) => {
    g.ellipse(16, 12, 9.5, 9, 'R').ellipse(15.5, 11.5, 8.5, 8, 'r').ellipse(19, 13, 4.5, 4.5, '.');
    g.rect(1, 18, 26, 9, 'R').spans([[17, 1, 8], [16, 2, 6]], 'R').rect(1, 18, 26, 5, 'r').spans([[17, 2, 7]], 'r');
    g.ellipse(19, 13, 4.5, 4.5, '.').rect(18, 17, 9, 1, '.').rect(22, 13, 5, 4, '.');
    arc(g, 16, 12, 9, 190, 330, 'p', 1); g.px(23, 6, 'p').px(24, 7, 'p').px(24, 8, 'R').px(24, 9, 'R');
    g.spans([[16, 2, 5], [17, 6, 8]], 'p').rect(9, 18, 6, 1, 'p');
    g.line(5, 22, 11, 20, 't').line(5, 23, 11, 21, 'T').px(4, 21, 't').px(4, 23, 't').px(12, 19, 't').px(12, 21, 't');
    skull(g, 18, 22, 2.6);
    g.px(25, 20, 'p').px(24, 23, 'p');
  } },

  // Endless Red: a screaming skull wreathed in red fire, crossed by two axes
  'warrior-berserker-t7': { frame: 'ult', art: (g) => {
    flame(g, 6, 3, 18, 4.5, 'R'); flame(g, 21, 3, 18, 4.5, 'R'); flame(g, 13.5, 1, 12, 6, 'R');
    flame(g, 6, 6, 18, 3, 'r'); flame(g, 21, 6, 18, 3, 'r'); flame(g, 13.5, 3, 12, 4, 'r');
    flame(g, 13.5, 6, 12, 2, 'f'); g.px(6, 13, 'f').px(21, 13, 'f');
    flame(g, 3, 12, 25, 2.5, 'R'); flame(g, 24, 12, 25, 2.5, 'R'); flame(g, 3, 16, 25, 1.4, 'r'); flame(g, 24, 16, 25, 1.4, 'r');
    g.ellipse(13.5, 13, 7.5, 7, 't').ellipse(15, 14, 5.5, 6, 'T').ellipse(13, 12.5, 6, 5.8, 't');
    g.rect(9, 18, 10, 7, 't').rect(16, 18, 3, 7, 'T');
    g.rect(9, 11, 3, 4, 'e').rect(16, 11, 3, 4, 'e').px(10, 12, 'r').px(17, 12, 'r').px(10, 13, 'p').px(17, 13, 'p');
    g.px(13, 16, 'e').px(14, 16, 'e');
    g.rect(11, 19, 6, 5, 'e').rect(12, 23, 4, 1, 'R');
    for (const x of [11, 13, 15]) g.px(x, 19, 't');
    g.px(9, 8, 'w').px(10, 7, 'w');
  } },

  // Duelist: a fine rapier with a swept gold hilt and a red sash
  'sub:warrior:Duelist': { frame: 'gold', art: (g) => {
    g.px(13, 1, 'w').rect(13, 2, 1, 16, 'n').rect(14, 2, 1, 16, 'm').px(14, 1, 'm');
    g.spans([[18, 22, 25], [19, 19, 25], [20, 17, 24], [21, 17, 22], [22, 18, 23], [23, 19, 25], [24, 21, 26], [25, 23, 26]], 'r');
    g.spans([[20, 20, 24], [21, 20, 22], [24, 23, 26], [25, 24, 26]], 'R').px(23, 18, 'p').px(20, 19, 'p');
    g.rect(7, 17, 14, 2, 'G').rect(7, 17, 14, 1, 'g').px(6, 16, 'g').px(21, 16, 'G');
    g.ellipse(13.5, 19.5, 3.4, 2, 'G').ellipse(13, 19, 2.6, 1.4, 'g').px(12, 19, 'y');
    arc(g, 13.5, 19, 6, 90, 180, 'g', 1); arc(g, 13.5, 19, 5, 90, 175, 'G', 1);
    g.rect(13, 21, 2, 4, 'L').px(13, 22, 'l').px(13, 24, 'l');
    g.ellipse(13.5, 26, 1.6, 1, 'g').px(13, 26, 'y');
    g.px(9, 5, 'y').px(18, 8, 'y').px(17, 7, 'w');
  } },

  // Thousand Cuts: a hanging banner sliced by a storm of small cuts
  'warrior-duelist-t5': { frame: 'blood', art: (g) => {
    g.rect(3, 2, 22, 2, 'l').rect(3, 3, 22, 1, 'L').px(2, 2, 'g').px(25, 2, 'g');
    g.rect(5, 4, 18, 18, 't').rect(19, 4, 4, 18, 'T').rect(5, 4, 1, 18, 'w');
    g.spans([[22, 5, 22], [23, 5, 12], [23, 16, 22], [24, 5, 10], [24, 18, 22], [25, 5, 8], [25, 20, 22]], 't').spans([[22, 19, 22], [23, 19, 22], [24, 19, 22], [25, 20, 22]], 'T');
    for (const [x, y, d] of [[7, 6, 1], [12, 7, -1], [17, 6, 1], [9, 11, -1], [14, 12, 1], [19, 11, -1], [7, 16, 1], [12, 17, -1], [17, 16, 1], [15, 21, 1]] as const) {
      g.line(x, y, x + 3 * d, y + 3, 'R').line(x + 1, y, x + 1 + 3 * d, y + 3, 'r').px(x + d, y + 1, 'e').px(x + 2 * d, y + 2, 'e');
    }
    g.px(4, 9, 'R').px(24, 14, 'R').px(3, 18, 'R');
  } },

  // Killing Line: one bright straight cut that splits a skull clean in two
  'warrior-duelist-t6': { frame: 'phys', art: (g) => {
    const s = new Grid(28, 28);
    s.ellipse(13.5, 12, 8, 7.5, 't').rect(8, 16, 12, 7, 't').ellipse(16, 13, 5, 6, 'T').ellipse(13, 11.5, 6.5, 6, 't').rect(17, 17, 3, 6, 'T');
    s.rect(8, 11, 4, 4, 'e').rect(16, 11, 4, 4, 'e').rect(13, 16, 2, 2, 'e');
    for (const x of [9, 11, 13, 15, 17]) s.rect(x, 20, 1, 3, 'e');
    s.px(9, 7, 'w');
    const L = new Grid(28, 28), R = new Grid(28, 28);
    for (let y = 0; y < 28; y++) for (let x = 0; x < 28; x++) { const k = s.get(x, y); if (k === '.') continue; (x < 14 ? L : R).px(x, y, k); }
    g.stamp(L, -2, -1).stamp(R, 2, 2);
    g.line(14, 1, 14, 26, 'w').line(13, 3, 13, 24, 'y').line(15, 3, 15, 24, 'y');
    g.px(14, 0, 'y').px(10, 25, 'R').px(19, 26, 'R');
  } },

  // Final Measure: a sword held point-down inside a golden sighting ring
  'warrior-duelist-t7': { frame: 'ult', art: (g) => {
    arc(g, 13.5, 13.5, 12, 0, 360, 'G', 2); arc(g, 13.5, 13.5, 12, 180, 300, 'g', 1); arc(g, 13.5, 13.5, 11, 190, 290, 'y', 1);
    for (const [x, y, w, h] of [[13, 0, 2, 4], [13, 24, 2, 4], [0, 13, 4, 2], [24, 13, 4, 2]] as const) g.rect(x, y, w, h, 'w');
    g.rect(12, 9, 1, 14, 'n').rect(13, 9, 2, 14, 'n').rect(14, 9, 1, 14, 'm').rect(15, 9, 1, 14, 'k');
    g.spans([[23, 12, 15], [24, 13, 14], [25, 13, 14]], 'm').px(13, 24, 'n');
    g.rect(13, 10, 1, 11, 'w');
    g.rect(7, 7, 14, 2, 'G').rect(7, 7, 14, 1, 'g').px(6, 6, 'g').px(21, 6, 'G');
    g.rect(12, 3, 4, 4, 'L').rect(12, 4, 4, 1, 'l').px(12, 3, 'l');
    g.rect(12, 1, 4, 2, 'g').px(12, 1, 'y');
    g.px(5, 5, 'y').px(22, 22, 'y');
  } },
};
