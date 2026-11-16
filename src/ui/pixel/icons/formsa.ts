// 32 px icons: formsa group. Keys are the ids from icon-list.ts (ICON_GROUPS.formsa).
// Mortal Master (mastery), Vampire, Werewolf: one hand-drawn picture each.
import type { Grid } from '../core';
import type { IconDef } from '../icon-kit';

type Pt = [number, number];

/** Fill a polygon (pixel centres inside the outline). */
function poly(g: Grid, pts: Pt[], c: string): Grid {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++)
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const px = x + 0.01, py = y + 0.01;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) g.px(x, y, c);
    }
  return g;
}
/** Mirror the left half (x 0..13) onto the right (27 - x). */
function sym(g: Grid): Grid {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < 14; x++) g.cells[y][27 - x] = g.cells[y][x];
  return g;
}
/** Mirror a polygon across the centre line. */
const mir = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [27 - x, y] as Pt);
/** A small falling drop. */
function drop(g: Grid, x: number, y: number, c: string, hi: string) {
  g.px(x, y, c).rect(x - 1, y + 1, 3, 2, c).px(x, y + 3, c).px(x - 1, y + 1, hi);
}

export const ICONS: Record<string, IconDef> = {
  // ================================================================ MORTAL MASTER
  // Mortal Master: a plain monk sitting still inside a ring of dawn
  'form:mastery': { frame: 'holy', art: (g) => {
    g.ellipse(13.5, 12.5, 12, 11.5, 'g').ellipse(13.5, 12.5, 10.8, 10.3, '.');
    g.spans([[1, 10, 12], [2, 7, 9], [3, 5, 6]], 'y').px(4, 4, 'w');
    for (const [x, y] of [[13, 0], [1, 12], [26, 12], [4, 3], [23, 3]] as const) g.px(x, y, 'y');
    // head and topknot
    g.ellipse(13.5, 7, 2.6, 2.8, 's').px(15, 7, 'S').px(15, 8, 'S').px(14, 9, 'S').px(12, 6, 't');
    g.rect(13, 2, 2, 2, 'L').px(12, 3, 'L');
    // robe
    g.spans([[10, 11, 16], [11, 9, 18], [12, 8, 19], [13, 8, 19], [14, 7, 20], [15, 7, 20], [16, 7, 20], [17, 6, 21], [18, 6, 21]], 'm');
    g.spans([[11, 17, 18], [12, 17, 19], [13, 18, 19], [14, 18, 20], [15, 18, 20], [16, 19, 20], [17, 19, 21], [18, 19, 21]], 'k');
    g.spans([[11, 9, 10], [12, 8, 9], [13, 8, 8], [14, 7, 7]], 'n');
    g.line(13, 10, 11, 16, 'k');
    // crossed legs
    g.spans([[19, 4, 23], [20, 3, 24], [21, 3, 24], [22, 4, 23]], 'k').spans([[19, 5, 22], [20, 4, 14]], 'm').line(10, 21, 17, 20, 'm');
    // hands in the lap
    g.rect(12, 17, 4, 2, 's').px(15, 18, 'S').px(12, 17, 't');
  } },

  // Discipline: a fist bound in training wraps
  'mastery-0': { frame: 'phys', art: (g) => {
    g.rect(8, 18, 12, 9, 'a');
    for (const y of [20, 23, 26]) g.line(8, y, 19, y - 3, 'A');
    g.line(20, 21, 24, 25, 'a').line(21, 21, 25, 24, 'A');
    g.rect(5, 5, 18, 13, 's');
    g.px(5, 5, '.').px(22, 5, '.').px(5, 17, '.').px(22, 17, '.');
    for (const x of [9, 13, 17]) g.line(x, 5, x, 10, 'S');
    g.rect(5, 7, 18, 2, 'a').rect(5, 8, 18, 1, 'A');
    g.rect(21, 5, 1, 12, 'S').rect(6, 16, 16, 1, 'S');
    g.spans([[12, 5, 15], [13, 5, 16], [14, 5, 15]], 's').line(5, 11, 15, 11, 'S').line(6, 15, 15, 15, 'S').px(16, 12, 'S').px(16, 14, 'S');
    for (const x of [6, 10, 14, 18]) g.px(x, 5, 'w').px(x + 1, 5, 't');
    g.px(6, 12, 't').px(7, 12, 't');
  } },

  // Steady Hands: an open palm holding a cairn of stones perfectly still
  'mastery-1': { frame: 'phys', art: (g) => {
    g.spans([[19, 21, 23], [20, 5, 24], [21, 3, 24], [22, 3, 23], [23, 4, 22], [24, 5, 20]], 's');
    g.rect(3, 16, 2, 5, 's').px(3, 16, 't');
    g.spans([[23, 6, 22], [24, 5, 20]], 'S').line(5, 22, 9, 22, 'S').px(24, 21, 'S');
    g.line(2, 25, 7, 25, 's').line(2, 26, 7, 26, 'S');
    g.px(6, 20, 't').px(7, 20, 't');
    // stones, alternating tone so each sits clear
    g.ellipse(13.5, 17.5, 6.5, 2.2, 'k').spans([[16, 9, 17]], 'm');
    g.ellipse(13, 13.2, 5, 2, 'm').spans([[12, 10, 14]], 'n').px(17, 14, 'k').px(16, 15, 'k');
    g.ellipse(14, 9.2, 3.6, 1.8, 'k').spans([[8, 12, 15]], 'm');
    g.ellipse(13.5, 5.5, 2.4, 1.6, 'n').px(12, 5, 'w').px(15, 6, 'm');
    g.px(4, 6, 'y').px(23, 9, 'y').px(22, 4, 'w');
  } },

  // Conviction: a sword planted in the earth, a red vow-ribbon tied at the hilt
  'mastery-2': { frame: 'holy', art: (g) => {
    g.ellipse(13.5, 24.5, 10, 2.5, 'L').spans([[22, 7, 20]], 'l').px(8, 23, 'l');
    g.rect(13, 9, 2, 15, 'n').rect(14, 9, 1, 15, 'm').px(13, 10, 'w');
    g.rect(7, 7, 14, 2, 'G').rect(7, 7, 14, 1, 'g').px(7, 7, 'y').px(6, 8, 'G').px(21, 8, 'G');
    g.rect(13, 2, 2, 5, 'l').px(14, 3, 'L').px(14, 5, 'L');
    g.ellipse(13.5, 1.2, 1.5, 0.8, 'g').px(13, 1, 'y');
    // ribbon
    g.line(15, 9, 19, 11, 'r').line(15, 10, 19, 12, 'r').line(19, 11, 24, 9, 'r').line(19, 12, 24, 10, 'R');
    g.line(18, 12, 22, 17, 'r').line(19, 12, 23, 17, 'R').px(24, 8, 'p').px(22, 18, 'r');
    g.px(16, 9, 'p').px(17, 10, 'p');
    for (const [x, y] of [[4, 4], [23, 4], [3, 14], [8, 18]] as const) g.px(x, y, 'y');
  } },

  // Thrift: a patched coin purse, tied tight, two coins spilling
  'mastery-3': { frame: 'gold', art: (g) => {
    g.ellipse(13.5, 17.5, 9.5, 8, 'l');
    g.spans([[23, 8, 20], [24, 9, 19], [25, 11, 17]], 'L').spans([[14, 21, 22], [16, 22, 23], [18, 22, 23], [20, 21, 22], [22, 20, 21]], 'L');
    g.spans([[7, 10, 17], [8, 11, 16], [9, 11, 16]], 'l').spans([[4, 9, 11], [4, 13, 14], [4, 16, 18], [5, 8, 19], [6, 9, 18]], 'l');
    g.px(10, 5, 'L').px(13, 5, 'L').px(17, 5, 'L').px(15, 6, 'L');
    g.rect(9, 10, 10, 1, 'G').rect(9, 10, 10, 1, 'g').px(9, 10, 'y').line(18, 11, 20, 14, 'G').line(19, 11, 21, 13, 'g');
    g.spans([[12, 7, 9], [13, 6, 8], [14, 6, 7]], 'T');
    // patch with stitches
    g.rect(13, 15, 6, 5, 'h').px(13, 15, 't').px(18, 15, 't').px(13, 19, 't').px(18, 19, 't').px(15, 15, 't').px(16, 19, 't');
    // coins
    g.ellipse(4.5, 23.5, 2.5, 2, 'g').px(3, 23, 'y').px(6, 24, 'G').px(5, 25, 'G');
    g.ellipse(23, 24.5, 2.5, 2, 'G').ellipse(22.7, 24.2, 1.8, 1.4, 'g').px(22, 23, 'y');
    g.px(4, 19, 'w').px(24, 19, 'y');
  } },

  // Clear Mind: a lotus open on still water
  'mastery-4': { frame: 'magic', art: (g) => {
    g.ellipse(13.5, 22.5, 12.5, 3.2, 'B').line(3, 22, 7, 22, 'b').line(19, 24, 24, 24, 'b').line(10, 25, 15, 25, 'b');
    g.ellipse(4.5, 21, 2.5, 1.2, 'V').px(3, 20, 'v').ellipse(23, 22, 2.5, 1.2, 'V').px(22, 21, 'v');
    // low petals
    g.spans([[17, 5, 9], [18, 4, 12], [19, 5, 13]], 'C').spans([[17, 18, 22], [18, 15, 23], [19, 14, 22]], 'C').spans([[17, 6, 8], [18, 5, 7]], 'c').spans([[17, 19, 21]], 'c');
    // side petals
    g.spans([[9, 6, 7], [10, 6, 8], [11, 6, 9], [12, 7, 10], [13, 7, 11], [14, 8, 12], [15, 9, 12], [16, 10, 13], [17, 11, 13]], 'c');
    g.spans([[9, 20, 21], [10, 19, 21], [11, 18, 21], [12, 17, 20], [13, 16, 20], [14, 15, 19], [15, 15, 18], [16, 14, 17], [17, 14, 16]], 'C');
    g.line(6, 9, 9, 15, 'q').line(21, 10, 18, 15, 'c');
    // centre petal
    g.spans([[4, 13, 14], [5, 12, 15], [6, 12, 15], [7, 11, 16], [8, 11, 16], [9, 11, 16], [10, 11, 16], [11, 11, 16], [12, 11, 16], [13, 12, 15], [14, 12, 15], [15, 12, 15], [16, 12, 15], [17, 12, 15], [18, 13, 14]], 'q');
    g.line(12, 6, 11, 12, 'w').line(16, 8, 15, 16, 'c').px(13, 4, 'w');
    g.rect(12, 18, 4, 1, 'y').px(13, 17, 'g').px(14, 17, 'g');
    g.px(3, 4, 'q').px(24, 6, 'w').px(22, 3, 'q');
  } },

  // One Breath: an hourglass, a breath of air curling through its waist
  'mastery-5': { frame: 'holy', art: (g) => {
    g.rect(5, 2, 18, 2, 'l').rect(5, 2, 18, 1, 'G').rect(5, 24, 18, 2, 'L').rect(5, 24, 18, 1, 'l');
    g.rect(6, 4, 1, 20, 'L').rect(21, 4, 1, 20, 'L');
    g.spans([[4, 8, 19], [5, 8, 19], [6, 8, 19], [7, 9, 18], [8, 9, 18], [9, 10, 17], [10, 11, 16], [11, 12, 15], [12, 13, 14], [13, 13, 14],
      [14, 13, 14], [15, 12, 15], [16, 11, 16], [17, 10, 17], [18, 9, 18], [19, 9, 18], [20, 8, 19], [21, 8, 19], [22, 8, 19], [23, 8, 19]], 'a');
    g.spans([[8, 10, 17], [9, 11, 16], [10, 12, 15], [11, 13, 14]], 'g').px(10, 8, 'y');
    g.px(13, 13, 'g').px(14, 15, 'g').px(13, 17, 'g');
    g.spans([[20, 12, 15], [21, 10, 17], [22, 9, 18], [23, 9, 18]], 'g').spans([[23, 9, 18]], 'G').px(12, 21, 'y');
    g.line(8, 5, 8, 7, 'w').line(9, 17, 9, 19, 'w');
    // breath
    g.line(1, 15, 5, 13, 'i').line(5, 13, 11, 13, 'w').line(16, 13, 22, 14, 'w').line(22, 14, 25, 12, 'i');
    g.line(25, 12, 25, 10, 'i').line(25, 10, 23, 9, 'i').px(22, 10, 'i');
    g.line(2, 18, 5, 16, 'i').px(1, 11, 'i');
  } },

  // Daily Form: a fighter in a deep stance, fist out, black against the rising sun
  'mastery-t4': { frame: 'gold', art: (g) => {
    g.ellipse(13.5, 13, 12.5, 12.5, 'f').ellipse(13.5, 13, 10.5, 10.5, 'g').ellipse(13.5, 13, 8, 8, 'y').ellipse(16, 8, 3, 3, 'w');
    for (let y = 22; y < 28; y++) g.line(0, y, 27, y, '.');
    g.rect(1, 22, 26, 4, 'L').rect(1, 22, 26, 1, 'l').px(4, 23, 'h').px(15, 24, 'h').px(23, 23, 'h');
    // fighter silhouette
    g.ellipse(11.5, 5.5, 2, 2.2, 'D').px(11, 2, 'D').px(12, 2, 'D');
    g.rect(11, 8, 2, 1, 'D');
    poly(g, [[8, 9], [15, 9], [14, 16], [9, 16]], 'D');
    g.rect(14, 10, 8, 2, 'D').rect(21, 9, 3, 4, 'D').px(24, 10, 'D').px(24, 11, 'D');
    g.line(9, 10, 6, 13, 'D').line(8, 10, 5, 13, 'D').rect(5, 13, 4, 3, 'D');
    g.rect(8, 15, 8, 1, 'r').line(9, 16, 7, 19, 'r').px(8, 16, 'R');
    poly(g, [[8, 16], [16, 16], [17, 18], [7, 18]], 'D');
    g.line(8, 17, 4, 19, 'D').line(8, 18, 4, 20, 'D').rect(3, 19, 2, 4, 'D').rect(2, 21, 4, 1, 'D');
    g.line(15, 17, 19, 19, 'D').line(15, 18, 19, 20, 'D').rect(19, 19, 2, 4, 'D').rect(19, 21, 4, 1, 'D');
    // rim light from the sun
    g.px(10, 4, 'd').px(10, 5, 'd').px(11, 3, 'd').line(8, 10, 8, 12, 'd').line(14, 10, 21, 10, 'd').px(21, 9, 'd').px(22, 9, 'd').px(4, 19, 'd').px(16, 17, 'd');
    // strike flash at the fist
    g.px(25, 7, 'w').px(26, 9, 'w').px(26, 12, 'w').px(25, 14, 'w');
  } },

  // Perfect Repetition: a wooden training post, its face worn hollow where one blow lands again and again
  'mastery-t5': { frame: 'phys', art: (g) => {
    g.rect(7, 23, 14, 3, 'L').rect(7, 23, 14, 1, 'l');
    g.rect(11, 2, 6, 21, 'l').rect(15, 2, 2, 21, 'L').rect(11, 2, 1, 21, 'T').ellipse(13.5, 2, 2.5, 0.8, 'T');
    g.rect(3, 8, 8, 2, 'l').rect(3, 9, 8, 1, 'L').rect(17, 6, 8, 2, 'l').rect(17, 7, 8, 1, 'L');
    g.rect(17, 16, 6, 2, 'l').rect(17, 17, 6, 1, 'L');
    for (const y of [5, 12, 20]) g.line(12, y, 14, y, 'L');
    // worn hollow and impact
    g.ellipse(13.5, 13, 1.6, 1.6, 'h').px(13, 13, 'e').px(14, 13, 'L');
    g.px(7, 13, 'y').px(8, 13, 'w').px(9, 13, 'y').line(8, 11, 9, 12, 'y').line(8, 15, 9, 14, 'y').px(6, 13, 'g').px(5, 11, 'g').px(5, 15, 'g');
    g.line(1, 13, 4, 13, 'a').line(2, 16, 5, 15, 'a').line(2, 10, 5, 11, 'a');
    g.px(4, 4, 'w').px(23, 12, 'y');
  } },

  // Human Limit: a lone peak, a small red flag on the very top
  'mastery-t6': { frame: 'phys', art: (g) => {
    poly(g, [[1, 26], [7, 12], [10, 15], [13, 10], [22, 26]], 'A');
    poly(g, [[5, 27], [14, 5], [26, 27]], 'm');
    poly(g, [[14, 5], [26, 27], [20, 27], [16, 14], [15, 9]], 'k');
    poly(g, [[14, 5], [17, 11], [15, 10], [14, 12], [12, 10], [10, 12]], 'n');
    g.px(14, 5, 'w').px(13, 7, 'w').line(9, 18, 11, 16, 'n').line(8, 23, 10, 21, 'n');
    g.line(14, 0, 14, 5, 'T').rect(15, 0, 5, 3, 'r').rect(15, 2, 5, 1, 'R').px(19, 0, 'p').px(15, 0, 'p');
    g.px(3, 4, 'w').px(23, 6, 'w').px(6, 8, 'a');
  } },

  // Every Morning at Once (ULTIMATE): one open palm before a risen sun, a thousand strikes ringing it like rays
  'mastery-t7': { frame: 'ult', art: (g) => {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, c = i % 2 ? 'g' : 'y';
      g.line(13.5 + Math.cos(a) * 8, 13.5 + Math.sin(a) * 8, 13.5 + Math.cos(a) * 12.6, 13.5 + Math.sin(a) * 12.6, c);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.26, x = Math.round(13.5 + Math.cos(a) * 10.8), y = Math.round(13.5 + Math.sin(a) * 10.8);
      g.rect(x - 1, y - 1, 3, 3, 'f').px(x + 1, y + 1, 'F').px(x - 1, y - 1, 'y');
    }
    g.ellipse(13.5, 13.5, 8, 8, 'g').ellipse(13.5, 13.5, 7, 7, 'y').ellipse(12.5, 12.5, 4, 4, 'w');
    // palm
    g.rect(10, 12, 8, 7, 's').rect(11, 19, 6, 3, 's').rect(16, 19, 1, 3, 'S');
    g.rect(10, 7, 2, 5, 's').rect(12, 5, 2, 7, 's').rect(14, 6, 2, 6, 's').rect(16, 8, 2, 4, 's');
    for (const [x, y0] of [[11, 7], [13, 5], [15, 6], [17, 8]] as const) g.rect(x, y0, 1, 12 - y0, 'S');
    g.line(9, 16, 7, 12, 's').line(10, 16, 8, 12, 's').px(7, 11, 's').px(8, 12, 'S');
    g.rect(10, 18, 8, 1, 'S').rect(17, 12, 1, 7, 'S').px(10, 7, 't').px(12, 5, 't').px(14, 6, 't').px(16, 8, 't').px(11, 13, 't');
    g.px(1, 1, 'w').px(26, 26, 'y');
  } },

  // ================================================================ VAMPIRE
  // Vampire: a pale lord in a high red-lined collar, red eyes, fangs
  'form:vampire': { frame: 'blood', art: (g) => {
    poly(g, [[1, 27], [2, 21], [8, 19], [13, 22], [13, 27]], 'D');
    poly(g, [[2, 9], [9, 20], [7, 21], [2, 19]], 'R');
    g.line(2, 9, 2, 20, 'r').line(3, 11, 7, 19, 'p');
    g.ellipse(13.5, 12.5, 5.6, 7.2, 't');
    poly(g, [[7, 3], [14, 1], [14, 8], [13, 9], [11, 6], [8, 8], [7, 12]], 'D');
    g.px(9, 4, 'd').px(10, 3, 'd').px(8, 6, 'd');
    g.line(10, 11, 12, 12, 'e').px(11, 12, 'r').px(10, 12, 'R');
    g.px(13, 15, 'T').px(10, 15, 'T');
    g.line(11, 18, 13, 18, 'R').px(12, 19, 'w');
    g.px(9, 10, 'T').px(9, 9, 'w');
    sym(g);
    g.spans([[10, 17, 19], [11, 18, 19], [13, 18, 19], [14, 17, 19], [15, 17, 18], [16, 16, 18], [17, 15, 17], [18, 15, 16], [19, 14, 15]], 'T');
    g.px(14, 15, 'T').px(13, 15, '.').px(13, 15, 'T').px(14, 15, 't');
    g.px(14, 18, 'R').px(13, 18, 'R');
    g.px(9, 9, 'w');
  } },

  // Blood Hunger: a gold goblet brimming with blood, spilling over
  'vampire-0': { frame: 'blood', art: (g) => {
    g.spans([[4, 5, 22], [5, 5, 22], [6, 6, 21], [7, 6, 21], [8, 7, 20], [9, 7, 20], [10, 8, 19], [11, 9, 18], [12, 10, 17], [13, 12, 15]], 'G');
    g.spans([[6, 7, 9], [7, 7, 8], [8, 8, 8], [9, 8, 8]], 'g').px(7, 6, 'y');
    g.spans([[8, 17, 19], [9, 17, 19], [10, 16, 18], [11, 15, 17], [12, 14, 16]], 'h');
    g.ellipse(13.5, 4, 8, 1.4, 'r').spans([[3, 9, 15]], 'p').px(10, 3, 'w');
    g.rect(13, 14, 2, 7, 'G').px(13, 14, 'g').ellipse(13.5, 17, 2, 1, 'g').px(14, 17, 'G');
    g.spans([[21, 10, 17], [22, 8, 19], [23, 7, 20]], 'G').spans([[21, 10, 13], [22, 8, 11]], 'g').spans([[23, 15, 20]], 'h');
    // spill
    g.line(22, 5, 22, 9, 'r').px(23, 9, 'R').px(22, 10, 'r');
    drop(g, 23, 13, 'r', 'p');
    g.line(5, 5, 5, 7, 'r').px(5, 8, 'R');
    g.ellipse(21, 25, 3, 1, 'R').px(20, 25, 'r');
    g.px(3, 10, 'p').px(25, 3, 'w');
  } },

  // Elder Blood: an ancient signet ring set with a ruby
  'vampire-1': { frame: 'blood', art: (g) => {
    g.ellipse(13.5, 17.5, 9.5, 7.5, 'G').ellipse(13.5, 18.5, 6.5, 4.6, '.');
    g.spans([[12, 7, 9], [13, 5, 7], [14, 5, 6], [15, 4, 5], [16, 4, 5], [17, 4, 4]], 'g').px(5, 14, 'y').px(4, 16, 'y');
    g.spans([[23, 14, 19], [24, 11, 17], [22, 19, 21], [20, 21, 22]], 'h');
    // bezel and ruby
    g.ellipse(13.5, 8.5, 6, 5, 'G').ellipse(13.5, 8.2, 5, 4, 'g');
    g.px(8, 4, 'y').px(19, 4, 'G').px(8, 12, 'G').px(19, 12, 'h');
    g.ellipse(13.5, 8.5, 3.6, 3.2, 'R').ellipse(13, 8, 2.8, 2.4, 'r');
    g.px(11, 6, 'p').px(12, 6, 'p').px(11, 7, 'p').px(12, 5, 'w').px(16, 10, 'R').px(15, 11, 'R');
    g.px(3, 4, 'w').px(24, 6, 'p');
  } },

  // Sanguine Thirst: two long fangs, blood running from the tips
  'vampire-2': { frame: 'magic', art: (g) => {
    poly(g, [[2, 3], [26, 3], [24, 8], [3, 8]], 'R');
    g.spans([[3, 4, 23], [4, 5, 22]], 'r').px(6, 3, 'p').px(7, 3, 'p').px(8, 4, 'p');
    g.rect(4, 8, 20, 2, 't').rect(4, 9, 20, 1, 'T');
    for (const x of [8, 11, 16, 19]) g.px(x, 8, 'T');
    // fangs
    poly(g, [[5, 9], [10, 9], [8, 19]], 'w');
    poly(g, [[17, 9], [22, 9], [19, 19]], 'w');
    g.line(9, 10, 8, 18, 'a').line(21, 10, 19, 18, 'a').px(8, 18, 'a').px(19, 18, 'a');
    g.px(6, 10, 'n').px(18, 10, 'n');
    // blood
    g.px(8, 19, 'r').px(19, 19, 'r');
    drop(g, 8, 21, 'r', 'p');
    drop(g, 19, 22, 'r', 'p');
    g.px(13, 24, 'R').px(14, 25, 'r');
    g.px(13, 13, 'q').px(14, 17, 'q').px(25, 14, 'q').px(2, 15, 'q');
  } },

  // Mesmer Gaze: an unblinking eye, its red iris ringed like a spinning charm
  'vampire-3': { frame: 'magic', art: (g) => {
    g.line(3, 9, 9, 6, 'D').line(9, 6, 18, 6, 'D').line(18, 6, 24, 9, 'D').line(4, 8, 9, 5, 'd').line(9, 5, 18, 5, 'd').line(18, 5, 23, 8, 'd');
    g.spans([[9, 7, 20], [10, 5, 22], [11, 4, 23], [12, 3, 24], [13, 2, 25], [14, 2, 25], [15, 3, 24], [16, 4, 23], [17, 5, 22], [18, 7, 20]], 'n');
    g.spans([[16, 5, 22], [17, 6, 21], [18, 8, 19]], 'a').spans([[9, 9, 12], [10, 7, 9]], 'w');
    g.ellipse(13.5, 13.5, 5.5, 5.5, 'R').ellipse(13.5, 13.5, 4.5, 4.5, 'r').ellipse(13.5, 13.5, 3.2, 3.2, 'R').ellipse(13.5, 13.5, 2.2, 2.2, 'r');
    g.rect(13, 10, 2, 8, 'e').px(11, 11, 'p').px(12, 10, 'w');
    for (const [x, y] of [[13, 1], [5, 3], [22, 3], [4, 21], [23, 21], [13, 23]] as const) g.px(x, y, 'q');
    g.line(7, 22, 10, 24, 'c').line(20, 22, 17, 24, 'c').line(11, 25, 16, 25, 'c');
  } },

  // Night Wings: a bat, wings flung wide
  'vampire-4': { frame: 'shadow', art: (g) => {
    const wing: Pt[] = [[12, 10], [7, 4], [1, 7], [2, 13], [4, 12], [6, 17], [8, 14], [10, 19], [12, 17]];
    poly(g, wing, 'c');
    poly(g, mir(wing), 'c');
    g.line(12, 10, 7, 4, 'C').line(7, 4, 3, 12, 'C').line(7, 4, 7, 15, 'C').line(8, 5, 10, 17, 'C');
    g.line(15, 10, 20, 4, 'C').line(20, 4, 24, 12, 'C').line(20, 4, 20, 15, 'C').line(19, 5, 17, 17, 'C');
    g.line(6, 4, 1, 7, 'q').line(21, 4, 26, 7, 'q').px(7, 3, 'w').px(20, 3, 'q');
    g.ellipse(13.5, 14.5, 2.6, 5, 'D').ellipse(13, 13.5, 1.4, 3, 'd');
    g.ellipse(13.5, 8.5, 2.2, 2.2, 'D').px(11, 5, 'D').px(11, 6, 'D').px(16, 5, 'D').px(16, 6, 'D').px(12, 7, 'd');
    g.px(12, 8, 'r').px(15, 8, 'r').px(13, 10, 'w').px(14, 10, 'w');
    g.px(12, 20, 'D').px(15, 20, 'D');
    g.px(3, 22, 'q').px(24, 23, 'q').px(13, 25, 'c');
  } },

  // The Long Thirst: a coffin, and one candle burning beside it
  'vampire-5': { frame: 'shadow', art: (g) => {
    poly(g, [[8, 1], [17, 1], [21, 7], [18, 27], [8, 27], [4, 7]], 'L');
    poly(g, [[9, 2], [16, 2], [19, 7], [16, 25], [10, 25], [6, 7]], 'l');
    g.line(9, 2, 6, 7, 'T').line(6, 7, 9, 23, 'T');
    g.line(16, 3, 19, 7, 'L').line(19, 8, 16, 24, 'L');
    // iron cross-bands and studs
    g.rect(7, 8, 12, 1, 'k').rect(8, 16, 10, 1, 'k').px(7, 8, 'm').px(8, 16, 'm');
    g.rect(12, 5, 2, 18, 'h').px(12, 5, 'G').rect(9, 9, 8, 2, 'h');
    for (const [x, y] of [[9, 4], [16, 4], [9, 22], [15, 22]] as const) g.px(x, y, 'G');
    // candle
    g.rect(21, 17, 4, 9, 't').rect(24, 17, 1, 9, 'T').px(21, 18, 'w').px(22, 16, 'T');
    g.rect(20, 26, 6, 1, 'k');
    g.px(22, 15, 'e').px(22, 14, 'f').px(22, 13, 'y').px(23, 13, 'f').px(22, 12, 'y').px(22, 11, 'w').px(21, 14, 'f');
    g.px(24, 9, 'g').px(26, 12, 'g').px(20, 10, 'g');
  } },

  // Crimson Feast: a blood-red rose, petals still wet
  'vampire-t4': { frame: 'blood', art: (g) => {
    g.line(13, 16, 12, 26, 'V').line(14, 16, 13, 26, 'V').px(12, 20, 'v');
    g.px(11, 22, 'u').px(14, 23, 'u');
    poly(g, [[12, 21], [5, 18], [3, 21], [7, 23]], 'V');
    g.line(11, 21, 5, 20, 'v');
    poly(g, [[14, 18], [22, 16], [24, 19], [18, 21]], 'V');
    g.line(15, 18, 22, 17, 'v');
    // bloom
    g.ellipse(13.5, 9.5, 8.5, 7, 'R');
    g.ellipse(12.8, 8.8, 7.2, 5.8, 'r');
    g.ellipse(13.5, 9, 4.5, 3.6, 'R').ellipse(13, 8.5, 3.4, 2.6, 'r').ellipse(13.5, 9, 1.8, 1.4, 'R').px(13, 8, 'r');
    g.line(6, 10, 9, 14, 'R').line(21, 10, 18, 14, 'R').line(10, 15, 17, 15, 'R');
    g.px(7, 6, 'p').px(8, 5, 'p').px(9, 4, 'p').px(11, 6, 'p').px(8, 4, 'w');
    g.spans([[16, 9, 18]], 'R').px(5, 11, 'p');
    drop(g, 19, 17, 'r', 'p');
    g.px(19, 23, 'R');
  } },

  // Opened Vein: a fine bleeding-lancet, blood dripping into a dark pool
  'vampire-t5': { frame: 'blood', art: (g) => {
    g.ellipse(13.5, 24, 11, 2.6, 'R').spans([[22, 7, 17]], 'r').px(9, 22, 'p').px(10, 22, 'p');
    // handle (upper right)
    g.line(19, 2, 24, 7, 'L').line(20, 2, 25, 7, 'l').line(20, 1, 25, 6, 'l').px(25, 8, 'L');
    g.line(15, 6, 20, 11, 'G').line(16, 6, 21, 11, 'g').px(16, 6, 'y');
    // blade
    poly(g, [[17, 8], [19, 10], [7, 17], [3, 18], [5, 15]], 'n');
    g.line(18, 10, 7, 17, 'm').line(16, 8, 6, 14, 'w').px(4, 17, 'm');
    g.line(9, 15, 5, 17, 'r').px(4, 18, 'r').px(7, 16, 'p');
    drop(g, 4, 19, 'r', 'p');
    g.px(22, 13, 'p').px(3, 4, 'p').px(12, 3, 'w');
  } },

  // Night Sovereign: an iron crown set with rubies, bat wings spread from its sides
  'vampire-t6': { frame: 'shadow', art: (g) => {
    const w: Pt[] = [[6, 14], [0, 7], [1, 15], [3, 13], [3, 19], [5, 16], [6, 22]];
    poly(g, w, 'c');
    g.line(6, 14, 1, 8, 'q').line(1, 8, 3, 18, 'C').px(1, 7, 'w');
    poly(g, [[6, 22], [6, 10], [8, 14], [10, 4], [12, 11], [13, 1], [13, 22]], 'm');
    g.line(6, 10, 6, 21, 'n').line(10, 4, 8, 14, 'n').line(13, 1, 12, 11, 'n').px(10, 4, 'w').px(13, 1, 'w');
    sym(g);
    g.line(14, 2, 15, 12, 'k').line(17, 5, 19, 14, 'k').line(21, 11, 21, 21, 'k');
    g.rect(6, 17, 16, 5, 'm').rect(6, 17, 16, 1, 'n').rect(6, 21, 16, 1, 'k').rect(21, 17, 1, 5, 'k').px(6, 17, 'w');
    for (const x of [8, 13, 18]) g.rect(x, 18, 2, 2, 'r').px(x, 18, 'p').px(x + 1, 19, 'R');
    g.ellipse(13.5, 11, 1.4, 1.4, 'r').px(13, 10, 'p').px(14, 12, 'R');
    g.px(10, 3, 'r').px(17, 3, 'r').px(13, 0, 'r').px(14, 0, 'r');
    g.px(4, 25, 'q').px(23, 25, 'q').px(13, 25, 'c');
  } },

  // Red Eclipse (ULTIMATE): the moon swallowed in red, its rim burning, light dripping away
  'vampire-t7': { frame: 'ult', art: (g) => {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.line(13.5 + Math.cos(a) * 10, 12.5 + Math.sin(a) * 10, 13.5 + Math.cos(a) * 12.5, 12.5 + Math.sin(a) * 12.2, i % 2 ? 'R' : 'r');
    }
    g.ellipse(13.5, 12.5, 9.5, 9.5, 'p').ellipse(13.5, 12.5, 8.6, 8.6, 'r');
    g.ellipse(12.4, 11.4, 8, 8, 'D').ellipse(11.5, 10.5, 6, 6, 'e');
    g.px(7, 8, 'd').px(9, 6, 'd').px(14, 14, 'd');
    g.px(21, 15, 'w').px(20, 18, 'p').px(18, 20, 'p').px(22, 12, 'p');
    // dripping
    g.rect(15, 21, 1, 3, 'r').px(15, 24, 'R').rect(10, 21, 1, 2, 'r').px(19, 20, 'r').rect(19, 21, 1, 2, 'r');
    drop(g, 15, 23, 'r', 'p');
    g.px(10, 23, 'R').px(19, 23, 'R');
  } },

  // ================================================================ WEREWOLF
  // Werewolf: a grey wolf's face, ears up, yellow eyes
  'form:werewolf': { frame: 'nature', art: (g) => {
    poly(g, [[3, 1], [10, 7], [14, 7], [14, 26], [11, 26], [7, 20], [2, 18], [5, 15], [3, 12]], 'm');
    poly(g, [[4, 3], [9, 7], [6, 9]], 'D');
    g.line(3, 1, 3, 11, 'n').px(4, 2, 'n');
    g.px(2, 17, 'n').px(3, 16, 'n').line(4, 13, 6, 13, 'n');
    g.line(7, 10, 11, 12, 'k').line(8, 12, 10, 13, 'y').px(10, 12, 'g').px(9, 12, 'y').px(10, 13, 'e');
    poly(g, [[10, 14], [14, 14], [14, 24], [12, 24]], 'n');
    g.rect(11, 16, 3, 2, 'e').px(12, 16, 'k');
    g.line(13, 20, 11, 21, 'e').line(11, 21, 11, 22, 'e');
    sym(g);
    // right side in shade
    g.swap('m', 'k', 16, 0, 12, 28);
    g.swap('n', 'm', 17, 0, 11, 28);
    g.px(11, 16, 'k');
    g.px(11, 23, 'w').px(16, 23, 'w');
  } },

  // Rending Claws: a furred paw, talons out
  'werewolf-0': { frame: 'phys', art: (g) => {
    g.ellipse(14, 17.5, 8, 6.5, 'l');
    g.rect(6, 10, 3, 8, 'l').rect(10, 8, 3, 9, 'l').rect(14, 8, 3, 9, 'l').rect(18, 10, 3, 8, 'l');
    for (const x of [8, 12, 16, 20]) g.line(x, 9, x, 16, 'L');
    g.spans([[22, 8, 21], [23, 10, 20]], 'L').line(21, 15, 21, 21, 'L').line(22, 17, 21, 20, 'L');
    g.px(6, 10, 'T').px(10, 8, 'T').px(14, 8, 'T').px(18, 10, 'T').px(9, 16, 'T');
    // wrist fur
    g.rect(9, 23, 10, 4, 'L').px(8, 24, 'L').px(19, 24, 'L').px(10, 27, 'L').px(13, 27, 'L').px(17, 27, 'L').px(11, 23, 'l').px(15, 23, 'l');
    // pads
    g.ellipse(14, 18, 3, 2, 'h').px(13, 17, 'L');
    // claws
    for (const [x, y, dx] of [[7, 9, -1], [11, 7, 0], [15, 7, 0], [19, 9, 1]] as const) {
      g.line(x, y, x + dx, y - 4, 'n').px(x + 1, y, 'm').px(x + dx * 2, y - 5, 'w');
    }
    g.line(5, 16, 3, 13, 'n').px(2, 12, 'w').px(4, 16, 'l').px(5, 15, 'l');
    g.px(24, 4, 'w').px(3, 5, 'n');
  } },

  // Moon-Hunt: a grey wolf stalking low under the hunting moon
  'werewolf-1': { frame: 'shadow', art: (g) => {
    g.ellipse(6, 5, 4, 4, 'n').ellipse(8.2, 3.6, 3.4, 3.4, '.').px(3, 4, 'w').px(4, 8, 'a').px(6, 9, 'a');
    for (const [x, y] of [[14, 2], [19, 4], [25, 2], [11, 6]] as const) g.px(x, y, 'q');
    // tail
    poly(g, [[6, 12], [2, 12], [0, 15], [1, 18], [3, 16], [7, 16]], 'm');
    g.line(1, 15, 2, 13, 'n').px(1, 17, 'n').px(0, 16, 'n').line(3, 15, 6, 15, 'k');
    // legs (far pair darker)
    g.rect(9, 18, 2, 7, 'k').rect(15, 18, 2, 7, 'k').px(8, 24, 'k').px(14, 24, 'k');
    g.rect(5, 18, 2, 7, 'm').px(4, 24, 'm').rect(18, 18, 2, 3, 'm').line(19, 20, 21, 22, 'm').line(18, 20, 20, 22, 'm').rect(20, 22, 2, 1, 'm').px(22, 22, 'm');
    // body
    g.ellipse(12, 15.5, 7.5, 3.5, 'm');
    poly(g, [[16, 12], [20, 10], [23, 13], [21, 18], [17, 18]], 'm');
    // head with long snout and pointed ears
    poly(g, [[18, 9], [22, 7], [26, 11], [26, 14], [21, 15], [18, 14]], 'm');
    poly(g, [[18, 10], [19, 5], [21, 9]], 'm');
    poly(g, [[20, 9], [22, 5], [23, 9]], 'k');
    g.px(16, 11, 'n').px(15, 12, 'n').px(17, 10, 'n');
    g.px(20, 7, 'D').px(20, 8, 'D');
    // shading and fur
    g.line(5, 12, 17, 12, 'n').line(17, 11, 20, 9, 'n').line(21, 8, 25, 10, 'n');
    g.line(7, 18, 17, 18, 'k').line(6, 17, 17, 17, 'k').line(21, 14, 25, 13, 'k').line(20, 15, 21, 17, 'n');
    g.px(26, 11, 'e').px(26, 12, 'e').line(21, 13, 25, 13, 'e').px(21, 10, 'y').px(22, 10, 'g');
    g.px(24, 14, 'w').px(22, 14, 'w');
    // ground
    g.rect(1, 25, 26, 2, 'D').px(3, 24, 'V').px(12, 24, 'V').px(22, 24, 'V').px(25, 24, 'V');
  } },

  // Scent of Gold: a wolf's snout lifted, catching the scent rising off a gold coin
  'werewolf-2': { frame: 'gold', art: (g) => {
    poly(g, [[1, 8], [4, 5], [5, 1], [8, 5], [13, 6], [20, 8], [23, 10], [22, 13], [16, 14], [11, 16], [6, 21], [1, 21]], 'm');
    g.line(5, 2, 7, 6, 'n').line(4, 6, 2, 9, 'n').line(9, 6, 18, 8, 'n');
    poly(g, [[5, 3], [6, 6], [4, 7]], 'D');
    g.spans([[13, 14, 21], [14, 11, 16], [15, 8, 12], [16, 6, 9], [17, 4, 7], [18, 2, 6], [19, 1, 6], [20, 1, 6]], 'k');
    g.rect(21, 9, 3, 3, 'e').px(21, 9, 'k').px(22, 9, 'm');
    g.line(15, 12, 22, 12, 'e');
    g.line(9, 9, 11, 9, 'y').px(10, 10, 'g').px(11, 10, 'e');
    // coin and scent
    g.ellipse(20.5, 22.5, 4, 3.5, 'G').ellipse(20, 22, 3.2, 2.8, 'g').ellipse(20.5, 22.5, 1.6, 1.4, 'G').px(18, 20, 'y').px(19, 20, 'w');
    g.px(23, 18, 'y').px(24, 17, 'y').px(24, 16, 'g').px(25, 15, 'y').px(25, 14, 'g').px(24, 13, 'y');
    g.px(19, 18, 'y').px(18, 17, 'g').px(18, 16, 'y').px(19, 15, 'y');
    g.px(3, 25, 'y').px(10, 24, 'g');
  } },

  // Frenzy: a snarl, every tooth bared
  'werewolf-3': { frame: 'blood', art: (g) => {
    g.ellipse(13.5, 15.5, 11, 7, 'R').ellipse(13.5, 16, 8, 4.5, 'e');
    poly(g, [[1, 13], [3, 4], [8, 1], [13, 2], [13, 12], [8, 11], [3, 14]], 'k');
    poly(g, [[2, 21], [7, 22], [13, 22], [13, 27], [6, 27], [2, 24]], 'k');
    g.line(3, 5, 8, 2, 'm').line(8, 2, 13, 3, 'm').line(4, 8, 7, 7, 'm').line(5, 10, 9, 9, 'm').line(6, 23, 12, 23, 'm');
    g.rect(12, 3, 2, 2, 'e').px(12, 3, 'm');
    g.line(4, 3, 8, 5, 'r').px(5, 4, 'p').px(6, 4, 'p');
    // fangs
    poly(g, [[5, 12], [8, 12], [6, 19]], 'w');
    g.spans([[12, 9, 13], [13, 9, 13]], 't').px(10, 14, 't').px(12, 14, 't');
    poly(g, [[5, 22], [8, 22], [7, 16]], 'n');
    g.spans([[21, 9, 13], [20, 10, 10], [20, 12, 12]], 't');
    g.px(7, 15, 'a').px(7, 20, 'a');
    sym(g);
    g.px(1, 14, 'R').px(26, 14, 'R');
    g.line(6, 19, 6, 21, 'i').px(21, 19, 'i').px(21, 20, 'i');
  } },

  // Pack Howl: a wolf howling, two of the pack behind, the call ringing out
  'werewolf-4': { frame: 'nature', art: (g) => {
    // one of the pack behind (dark)
    poly(g, [[1, 27], [1, 18], [3, 13], [4, 9], [6, 12], [9, 9], [10, 11], [8, 15], [8, 27]], 'D');
    g.px(4, 13, 'r');
    // the howler: neck, skull, ear, jaws open to the sky
    poly(g, [[6, 27], [8, 19], [10, 13], [16, 14], [17, 20], [19, 27]], 'm');
    g.ellipse(12.5, 10, 3.5, 3.5, 'm');
    poly(g, [[10, 8], [9, 2], [14, 7]], 'm');
    g.px(10, 4, 'D').px(10, 5, 'D').px(11, 6, 'D');
    poly(g, [[12, 7], [17, 5], [22, 1], [25, 2], [20, 7], [15, 11]], 'm');
    poly(g, [[15, 12], [20, 8], [23, 8], [18, 12], [16, 15]], 'm');
    poly(g, [[15, 11], [20, 7], [22, 8], [15, 12]], 'R');
    g.px(24, 1, 'e').px(25, 2, 'e').px(13, 9, 'y').px(14, 9, 'e');
    g.line(13, 6, 21, 2, 'n').line(10, 9, 9, 13, 'n').line(9, 15, 7, 21, 'n').px(9, 3, 'n');
    g.line(16, 15, 17, 21, 'k').line(17, 21, 18, 26, 'k').line(18, 12, 16, 14, 'k').px(21, 9, 'k');
    g.px(14, 16, 'n').px(13, 18, 'n');
    // the call
    g.line(24, 6, 26, 8, 'u').line(26, 9, 26, 11, 'u').px(23, 10, 'v').px(24, 11, 'v');
  } },

  // Leash the Beast: a spiked iron collar, chain hanging from its ring
  'werewolf-5': { frame: 'phys', art: (g) => {
    g.ellipse(13.5, 17.5, 11, 6.5, 'L').ellipse(13.5, 16.5, 8.3, 4, '.');
    g.spans([[12, 7, 12], [13, 4, 6], [14, 3, 4]], 'l').spans([[20, 4, 6], [21, 7, 9]], 'l');
    g.spans([[23, 9, 18], [22, 20, 22]], 'h');
    // spikes
    for (const x of [4, 9, 18, 23]) { const y = x < 6 || x > 21 ? 21 : 23; g.px(x, y + 1, 'm').px(x + 1, y + 1, 'k').px(x, y + 2, 'n').px(x, y + 3, 'w'); }
    g.rect(13, 23, 2, 2, 'm').px(13, 25, 'n').px(14, 26, 'n');
    // ring
    g.ellipse(13.5, 9.5, 2.5, 2.5, 'G').ellipse(13.5, 9.5, 1, 1, '.').px(12, 8, 'g').px(11, 9, 'g');
    // chain
    g.ellipse(17, 6, 2, 1.4, 'm').px(17, 6, '.').px(16, 5, 'n');
    g.ellipse(20, 4, 1.4, 2, 'k').px(20, 4, '.').px(19, 3, 'm');
    g.ellipse(23, 2, 2, 1.4, 'm').px(23, 2, '.').px(22, 1, 'n');
    g.px(3, 4, 'w').px(6, 2, 'n');
  } },

  // Moonblood: a paw print in blood, a silver crescent shining over it
  'werewolf-t4': { frame: 'nature', art: (g) => {
    g.ellipse(7, 6, 5, 5, 'n').ellipse(9.5, 4.3, 4.3, 4.3, '.').px(3, 5, 'w').px(4, 9, 'a').px(6, 10, 'a');
    g.ellipse(15, 19, 6.5, 5.5, 'R').ellipse(14.5, 18.5, 5.5, 4.6, 'r').px(11, 16, 'p').px(12, 15, 'p');
    g.spans([[24, 13, 17]], 'R');
    for (const [x, y] of [[8, 12], [12.5, 9], [17.5, 9], [22, 12]] as const) {
      g.ellipse(x, y, 2, 2.4, 'R').ellipse(x - 0.4, y - 0.4, 1.4, 1.8, 'r').px(Math.round(x - 1), Math.round(y - 1), 'p');
    }
    g.px(24, 25, 'r').px(25, 26, 'R').px(5, 20, 'r');
    g.px(21, 3, 'a').px(25, 5, 'w');
  } },

  // Mauling Rhythm: three claw gashes torn deep into an oak door
  'werewolf-t5': { frame: 'phys', art: (g) => {
    g.rect(2, 2, 24, 24, 'l');
    for (const x of [8, 14, 20]) g.rect(x, 2, 1, 24, 'L');
    g.rect(2, 2, 24, 1, 'T').rect(2, 2, 1, 24, 'T').rect(25, 2, 1, 24, 'L').rect(2, 25, 24, 1, 'L');
    g.px(4, 7, 'L').px(5, 8, 'L').px(11, 20, 'L').px(17, 5, 'L').px(23, 18, 'L').px(23, 19, 'L');
    for (const [x0, y0, x1, y1] of [[6, 4, 11, 22], [12, 3, 17, 23], [18, 5, 22, 20]] as const) {
      g.line(x0 - 1, y0, x1 - 1, y1, 't').line(x0, y0, x1, y1, 'e').line(x0 + 1, y0 + 1, x1 + 1, y1, 'e').line(x0 + 2, y0 + 2, x1 + 1, y1 - 1, 'h');
      g.px(x0 - 2, y0 + 3, 't').px(x1 - 2, y1 - 2, 't').px(x0 - 1, y0 - 1, 'y');
    }
    g.px(3, 3, 'y');
  } },

  // Apex Hunter: a great wolf skull, the trophy of the top of the hunt
  'werewolf-t6': { frame: 'phys', art: (g) => {
    g.ellipse(13.5, 7.5, 8, 6, 't');
    poly(g, [[2, 9], [7, 7], [9, 14], [5, 15], [2, 13]], 't');
    poly(g, [[8, 12], [13, 12], [13, 26], [11, 26], [9, 20]], 't');
    g.line(9, 14, 5, 15, 'T').line(2, 13, 5, 15, 'T');
    poly(g, [[6, 9], [11, 11], [11, 13], [9, 14], [7, 12]], 'e');
    g.px(9, 12, 'C').px(8, 11, 'R');
    g.rect(12, 18, 2, 3, 'e').px(13, 21, 'e');
    // fangs
    poly(g, [[9, 21], [11, 21], [10, 26]], 'w');
    g.px(11, 22, 'n').px(11, 23, 'n').px(12, 24, 'n');
    g.line(7, 3, 10, 2, 'w').px(6, 4, 'w');
    sym(g);
    g.swap('t', 'T', 16, 0, 12, 28);
    g.line(13, 2, 13, 8, 'T').px(14, 9, 'T');
    g.px(17, 4, 't').px(18, 3, 't');
  } },

  // The Hungering Moon (ULTIMATE): the full moon opens a fanged maw
  'werewolf-t7': { frame: 'ult', art: (g) => {
    g.ellipse(13.5, 13.5, 12, 12, 'R').ellipse(13.5, 13.5, 11, 11, 't');
    g.ellipse(11, 10, 9, 9, 'y').ellipse(9, 8, 4, 4, 'w');
    g.ellipse(17, 7, 2, 1.6, 'T').ellipse(7, 13, 1.6, 1.3, 'T').ellipse(20, 12, 1.3, 1, 'T').px(12, 5, 'T');
    // the maw
    g.spans([[15, 4, 23], [16, 3, 24], [17, 3, 24], [18, 4, 23], [19, 5, 22], [20, 6, 21], [21, 8, 19], [22, 10, 17]], 'e');
    g.spans([[16, 5, 22], [17, 5, 22], [18, 6, 21], [19, 7, 20], [20, 9, 18]], 'R');
    for (const x of [5, 9, 13, 17, 21]) g.px(x, 16, 'w').px(x + 1, 16, 'w').px(x, 17, 'w').px(x + 1, 17, 'n').px(x, 18, 'n');
    for (const x of [8, 12, 16]) g.px(x, 21, 'w').px(x + 1, 21, 'w').px(x + 1, 20, 'n').px(x, 20, 'w');
    g.line(4, 14, 23, 14, 'T').line(9, 23, 18, 23, 'T');
    g.px(14, 22, 'r').px(14, 23, 'r').px(14, 24, 'R');
    g.px(26, 1, 'y').px(1, 26, 'y').px(1, 2, 'w');
  } },
};
