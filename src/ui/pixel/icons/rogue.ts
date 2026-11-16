// 32 px icons: rogue group. Keys are the ids from icon-list.ts (ICON_GROUPS.rogue).
import type { IconDef } from '../icon-kit';
import type { Grid } from '../core';

/** A small mask: oval face, two eye holes, a mouth (1 smile, -1 frown, 0 flat). */
const mask = (g: Grid, cx: number, cy: number, lt: string, md: string, dk: string, mouth: number) => {
  g.ellipse(cx, cy, 5, 6.5, dk).ellipse(cx - 0.5, cy - 0.5, 4.5, 6, md).ellipse(cx - 1.5, cy - 2, 2, 2.5, lt);
  g.rect(Math.round(cx) - 3, Math.round(cy) - 2, 2, 2, 'e').rect(Math.round(cx) + 1, Math.round(cy) - 2, 2, 2, 'e');
  const x = Math.round(cx), y = Math.round(cy) + 3;
  if (mouth > 0) g.line(x - 2, y, x - 1, y + 1, 'e').line(x - 1, y + 1, x + 1, y + 1, 'e').line(x + 1, y + 1, x + 2, y, 'e');
  else if (mouth < 0) g.line(x - 2, y + 1, x - 1, y, 'e').line(x - 1, y, x + 1, y, 'e').line(x + 1, y, x + 2, y + 1, 'e');
  else g.line(x - 2, y, x + 2, y, 'e');
};

export const ICONS: Record<string, IconDef> = {
  // Rogue: a black domino mask over an upright dagger
  'class:rogue': { frame: 'shadow', art: (g) => {
    g.rect(13, 3, 1, 14, 'n').rect(14, 3, 1, 14, 'm').px(13, 2, 'n').px(13, 1, 'w').px(14, 2, 'k');
    g.rect(8, 17, 12, 2, 'G').rect(8, 17, 12, 1, 'g').px(7, 17, 'g').px(20, 18, 'G');
    g.rect(13, 19, 2, 5, 'L').rect(13, 19, 1, 5, 'l').ellipse(13.5, 25, 1.6, 1.2, 'G').px(13, 24, 'g');
    g.spans([[7, 6, 21], [8, 4, 23], [9, 3, 24], [10, 3, 24], [11, 4, 11], [11, 16, 23], [12, 5, 10], [12, 17, 22]], 'R');
    g.spans([[7, 6, 21], [8, 4, 11], [9, 3, 6]], 'r').px(6, 7, 'p').px(7, 7, 'p');
    g.rect(7, 9, 3, 2, 'e').rect(18, 9, 3, 2, 'e').px(7, 9, 'y').px(18, 9, 'y').px(8, 9, 'g').px(19, 9, 'g');
    g.line(2, 9, 1, 13, 'r').line(25, 9, 26, 13, 'R');
  } },
  // Twinfang (approved sample): two fang-daggers crossed
  ro0: { frame: 'phys', art: (g) => {
    g.line(7, 19, 20, 6, 'n').line(8, 19, 21, 6, 'm').line(8, 20, 21, 7, 'k').px(21, 5, 'w').px(22, 5, 'n');
    g.line(4, 16, 10, 22, 'G').line(5, 16, 11, 22, 'g').line(3, 23, 6, 20, 'l').px(2, 24, 'g').px(3, 24, 'G');
    g.line(20, 19, 7, 6, 'n').line(19, 19, 6, 6, 'm').line(19, 20, 6, 7, 'k').px(6, 5, 'w').px(5, 5, 'n');
    g.line(23, 16, 17, 22, 'G').line(22, 16, 16, 22, 'g').line(24, 23, 21, 20, 'l').px(25, 24, 'g').px(24, 24, 'G');
    g.px(13, 12, 'w').px(14, 13, 'w').px(13, 13, 'y');
    g.px(21, 8, 'v').px(21, 9, 'v').px(6, 8, 'v').px(6, 9, 'u');
  } },
  // Widow's Kiss: dark plum lips, glossy, dripping poison-green venom
  ro1: { frame: 'poison', pal: { j: '#8a1a46', J: '#4a0c26', z: '#d0608a' }, art: (g) => {
    // upper lip with a cupid's bow
    g.spans([[4, 6, 10], [4, 17, 21], [5, 4, 12], [5, 15, 23], [6, 3, 13], [6, 14, 24], [7, 2, 25], [8, 2, 25], [9, 3, 24]], 'j');
    g.spans([[9, 3, 24], [8, 20, 25]], 'J').px(13, 6, 'J').px(14, 6, 'J');
    g.spans([[5, 6, 9], [6, 5, 8]], 'z').px(7, 4, 'z').px(18, 5, 'z').px(19, 5, 'z').px(6, 5, 'w');
    // seam, glowing with venom
    g.spans([[10, 3, 24]], 'e').px(2, 9, 'e').px(25, 9, 'e').rect(10, 10, 8, 1, 'V').px(12, 10, 'v').px(15, 10, 'v');
    // lower lip, full and glossy
    g.spans([[11, 3, 24], [12, 3, 24], [13, 4, 23], [14, 5, 22], [15, 7, 20], [16, 10, 17]], 'j');
    g.spans([[14, 17, 22], [15, 14, 20], [16, 10, 17], [13, 21, 23], [12, 23, 24]], 'J');
    g.spans([[12, 8, 13], [13, 9, 12]], 'z').px(9, 12, 'w').px(10, 12, 'w').px(16, 12, 'z').px(17, 12, 'z');
    // venom drips
    g.rect(11, 17, 1, 4, 'v').ellipse(11, 22, 1.2, 1.5, 'v').px(10, 21, 'u').px(12, 23, 'V');
    g.rect(15, 17, 1, 6, 'v').rect(16, 17, 1, 1, 'V').ellipse(15, 24.5, 1.6, 1.8, 'v').px(14, 23, 'u').px(14, 24, 'u').px(16, 25, 'V').px(15, 26, 'V');
    g.rect(19, 16, 1, 3, 'v').ellipse(19, 20, 1, 1.2, 'v').px(19, 19, 'u');
    g.px(7, 25, 'v').px(22, 24, 'v').px(23, 25, 'V');
  } },
  // Cut Deep (approved sample): three deep slashes that bleed
  ro2: { frame: 'blood', art: (g) => {
    for (const [dx, len] of [[0, 18], [5, 20], [10, 16]] as const) {
      g.line(3 + dx, 22, 3 + dx + len * 0.7, 22 - len, 'r').line(4 + dx, 22, 4 + dx + len * 0.7, 22 - len, 'R').line(2 + dx, 22, 2 + dx + len * 0.7, 22 - len, 'p');
    }
    g.ellipse(6, 25, 1.5, 1.5, 'R').px(6, 24, 'r').ellipse(12, 26, 1.2, 1.5, 'R').ellipse(17, 25, 1, 1.2, 'R').px(16, 27, 'R');
    g.px(16, 3, 'w').px(21, 5, 'w').px(11, 5, 'w');
  } },
  // Nightfall Flurry (approved sample): blades raining under a crescent moon
  ro3: { frame: 'magic', art: (g) => {
    g.ellipse(8, 8, 6, 6, 'q').ellipse(10.5, 6.5, 5, 5, '.').px(4, 8, 'w').px(5, 11, 'c').px(7, 13, 'c').px(4, 10, 'q');
    for (const [x, y] of [[16, 3], [21, 8], [13, 12], [19, 15], [9, 18], [15, 20]] as const) {
      g.line(x, y, x + 3, y + 5, 'n').line(x + 1, y, x + 4, y + 5, 'm').px(x + 4, y + 6, 'G').px(x - 1, y - 1, 'w');
    }
    g.px(24, 3, 'q').px(3, 22, 'q').px(25, 22, 'q');
  } },
  // Blackstep: a boot stepping out of a pool of shadow
  ro4: { frame: 'shadow', art: (g) => {
    g.ellipse(13.5, 22, 12, 4, 'C').ellipse(13.5, 22.5, 10, 3, 'D').ellipse(13.5, 23, 7, 1.8, 'e');
    g.spans([[18, 3, 10], [18, 18, 24], [19, 2, 6]], 'c').px(4, 18, 'q').px(20, 18, 'q');
    // boot
    g.rect(9, 4, 7, 12, 'L').rect(9, 4, 2, 12, 'l').rect(8, 3, 9, 2, 'l').rect(8, 3, 9, 1, 'S');
    g.spans([[15, 9, 19], [16, 9, 21], [17, 9, 22]], 'L').spans([[15, 9, 11], [16, 9, 10]], 'l').spans([[15, 16, 19]], 'l');
    g.rect(9, 18, 14, 1, 'k').px(22, 17, 'L');
    g.rect(9, 9, 7, 1, 'h').rect(12, 9, 2, 1, 'g').px(12, 9, 'y');
    // shadow wisps trailing the step
    g.line(2, 7, 6, 7, 'd').line(3, 11, 7, 11, 'C').line(2, 14, 6, 14, 'd').line(19, 8, 23, 6, 'C').line(20, 12, 24, 11, 'd');
    g.px(23, 4, 'q').px(4, 4, 'q');
  } },
  // False Opening: a shadow-dagger feints left, the real steel strikes right
  ro5: { frame: 'phys', art: (g) => {
    // the feint (a purple ghost blade)
    g.rect(4, 5, 12, 1, 'q').rect(4, 6, 12, 1, 'c').px(3, 6, 'q').px(2, 6, 'c');
    g.rect(16, 3, 2, 6, 'C').px(16, 3, 'c').rect(18, 5, 5, 2, 'd').px(23, 5, 'c').px(23, 6, 'c');
    g.px(6, 8, 'c').px(9, 8, 'd').px(12, 8, 'c');
    // the true strike
    g.rect(8, 16, 15, 1, 'n').rect(8, 17, 15, 1, 'm').rect(8, 18, 14, 1, 'k').px(23, 17, 'n').px(24, 17, 'w').px(23, 16, 'w');
    g.rect(6, 13, 2, 9, 'G').rect(6, 13, 1, 9, 'g').px(6, 13, 'y');
    g.rect(2, 16, 4, 3, 'l').rect(2, 18, 4, 1, 'L').px(1, 17, 'g');
    // a turning arc between them
    g.px(20, 9, 'a').px(21, 10, 'a').px(22, 11, 'a').px(22, 12, 'A').px(21, 13, 'A');
    g.px(25, 15, 'y').px(26, 17, 'y').px(25, 19, 'y');
  } },
  // Hushblade: a blade cuts the candle's wick; the flame dies to smoke
  ro6: { frame: 'shadow', art: (g) => {
    // candle and holder
    g.rect(10, 13, 8, 11, 't').rect(15, 13, 3, 11, 'T').rect(10, 13, 2, 11, 'y').px(16, 14, 't').px(17, 15, 'T');
    g.rect(10, 13, 8, 1, 'T').px(11, 14, 't').px(11, 15, 't');
    g.ellipse(13.5, 24.5, 9, 1.8, 'G').rect(5, 24, 18, 1, 'g').px(21, 25, 'h').px(22, 24, 'h');
    g.rect(13, 11, 1, 2, 'e');
    // smoke curling up
    g.px(13, 10, 'a').px(12, 9, 'a').px(12, 8, 'A').px(13, 7, 'a').px(14, 6, 'a').px(14, 5, 'A').px(13, 4, 'a').px(12, 3, 'a').px(12, 2, 'A');
    // the blade
    g.rect(3, 8, 14, 1, 'n').rect(3, 9, 14, 1, 'm').px(2, 9, 'n').px(1, 9, 'w');
    g.rect(17, 5, 2, 8, 'k').rect(17, 5, 1, 8, 'm');
    g.rect(19, 8, 5, 2, 'D').rect(19, 8, 5, 1, 'd').rect(24, 7, 2, 4, 'c').px(24, 7, 'q');
    g.px(6, 11, 'q').px(22, 15, 'q').px(4, 18, 'q');
  } },
  // Last Witness: one wide eye sees; two others sleep below
  ro7: { frame: 'magic', art: (g) => {
    g.spans([[6, 9, 18], [7, 6, 21], [8, 4, 23], [9, 3, 24], [10, 2, 25], [11, 2, 25], [12, 3, 24], [13, 4, 23], [14, 6, 21], [15, 9, 18]], 'n');
    g.spans([[13, 4, 23], [14, 6, 21], [15, 9, 18]], 'a');
    g.ellipse(13.5, 10.5, 4.5, 4.5, 'C').ellipse(13.2, 10.2, 3.6, 3.6, 'c').ellipse(12.2, 9.2, 1.8, 1.8, 'q');
    g.rect(13, 8, 2, 6, 'e').px(11, 8, 'w').px(12, 8, 'w').px(11, 9, 'w');
    g.line(5, 6, 4, 4, 'D').line(9, 5, 8, 3, 'D').line(14, 5, 14, 2, 'D').line(18, 5, 19, 3, 'D').line(22, 6, 23, 4, 'D');
    // two closed eyes
    for (const x0 of [3, 17]) {
      g.px(x0, 20, 'd').rect(x0 + 1, 21, 5, 1, 'd').px(x0 + 6, 20, 'd').px(x0 + 1, 22, 'D').px(x0 + 3, 23, 'D').px(x0 + 5, 22, 'D');
    }
  } },
  // Old Debts: a ledger scroll, sealed in red wax, and the coins owed
  ro8: { frame: 'gold', art: (g) => {
    g.rect(4, 5, 17, 13, 't').rect(17, 5, 4, 13, 'T').rect(4, 5, 2, 13, 'y');
    g.rect(2, 2, 21, 3, 'T').rect(2, 2, 21, 1, 't').rect(2, 18, 21, 3, 'T').rect(2, 18, 21, 1, 't').px(1, 3, 'T').px(23, 3, 'h').px(1, 19, 'T').px(23, 19, 'h');
    for (const y of [7, 9, 11, 13, 15]) g.rect(7, y, y === 15 ? 6 : 10, 1, 'T');
    // wax seal with ribbon tails
    g.line(6, 20, 4, 25, 'R').line(8, 20, 9, 25, 'R').ellipse(7, 18, 3, 3, 'R').ellipse(6.7, 17.7, 2, 2, 'r').px(6, 17, 'p');
    // coin stack
    for (const y of [25, 23, 21]) g.ellipse(21, y, 4, 1.5, 'G').rect(17, y - 1, 9, 1, 'g');
    g.px(18, 20, 'y').px(25, 18, 'y').px(26, 17, 'w');
  } },
  // Ash Memory: a funeral urn, its ashes rising with a few live embers
  ro9: { frame: 'fire', art: (g) => {
    g.ellipse(13.5, 18, 7.5, 6, 'h').ellipse(12.5, 17, 6, 5, 'G').ellipse(11, 15.5, 2.5, 2, 'g').px(10, 15, 'y');
    g.rect(10, 10, 8, 3, 'h').rect(10, 10, 5, 3, 'G').rect(8, 8, 12, 2, 'G').rect(8, 8, 12, 1, 'g');
    g.rect(10, 24, 8, 2, 'h').rect(10, 24, 4, 1, 'G').rect(8, 26, 12, 1, 'h');
    g.rect(7, 18, 14, 1, 'h').px(9, 18, 'g').px(12, 18, 'g');
    // ash rising
    g.px(13, 7, 'm').px(14, 6, 'm').px(14, 5, 'a').px(13, 4, 'a').px(12, 3, 'm').px(12, 2, 'a');
    g.px(16, 6, 'm').px(17, 5, 'a').px(18, 4, 'm').px(18, 3, 'a').px(10, 6, 'a').px(9, 5, 'm').px(9, 4, 'a');
    g.px(15, 3, 'f').px(11, 4, 'y').px(20, 5, 'f').px(7, 3, 'F').px(16, 1, 'y');
  } },
  // Assassin: a deep hood, only two green eyes in the dark
  'sub:rogue:Assassin': { frame: 'poison', art: (g) => {
    g.spans([[2, 12, 15], [3, 10, 17], [4, 8, 19], [5, 7, 20], [6, 6, 21]], 'd');
    g.rect(5, 7, 18, 13, 'd').spans([[20, 4, 23], [21, 3, 24], [22, 2, 25], [23, 2, 25], [24, 2, 25], [25, 2, 25]], 'd');
    g.spans([[4, 18, 19], [5, 18, 20], [6, 18, 21]], 'D').rect(19, 7, 4, 13, 'D').spans([[20, 19, 23], [21, 19, 24], [22, 19, 25], [23, 19, 25], [24, 19, 25], [25, 19, 25]], 'D');
    g.line(11, 3, 6, 9, 'q').line(6, 10, 5, 18, 'c').px(12, 2, 'q');
    g.spans([[8, 10, 17], [9, 9, 18], [10, 9, 18], [11, 9, 18], [12, 9, 18], [13, 9, 18], [14, 9, 18], [15, 10, 17], [16, 11, 16], [17, 12, 15]], 'e');
    g.rect(10, 11, 3, 1, 'v').rect(15, 11, 3, 1, 'v').px(10, 10, 'V').px(17, 10, 'V').px(11, 11, 'u').px(16, 11, 'u');
    g.line(13, 18, 13, 25, 'D').px(14, 19, 'D').px(9, 22, 'c').px(18, 22, 'C');
  } },
  // Black Venom: a flask of black venom with a green glow
  'rogue-assassin-t5': { frame: 'poison', art: (g) => {
    g.rect(10, 1, 8, 3, 'l').rect(10, 1, 8, 1, 'S').rect(16, 1, 2, 3, 'L');
    g.rect(11, 4, 6, 6, 'a').rect(15, 4, 2, 6, 'A').px(12, 5, 'w');
    g.ellipse(13.5, 17.5, 9.5, 8, 'a').swap('a', 'A', 18, 15, 10, 13);
    g.ellipse(13.5, 18, 8.5, 7, 'D').ellipse(14.5, 19.5, 6.5, 5, 'e').swap('D', 'a', 0, 0, 28, 14).swap('e', 'a', 0, 0, 28, 14);
    g.rect(5, 14, 17, 1, 'v').rect(8, 14, 5, 1, 'u');
    g.px(10, 18, 'v').px(15, 21, 'v').px(12, 22, 'V').px(17, 17, 'V').px(11, 20, 'u');
    g.rect(6, 10, 1, 4, 'w').px(7, 10, 'w').px(5, 15, 'w');
    g.px(17, 6, 'v').px(18, 7, 'v').px(18, 8, 'V').px(18, 9, 'v');
  } },
  // Death Mark: a skull caught in a red mark
  'rogue-assassin-t6': { frame: 'blood', art: (g) => {
    g.ellipse(13.5, 13.5, 12, 12, 'R').ellipse(13.5, 13.5, 10.5, 10.5, '.');
    g.ellipse(13.5, 13.5, 11.6, 11.6, 'R').ellipse(13.5, 13.5, 10.6, 10.6, '.');
    g.rect(13, 1, 2, 5, 'r').rect(13, 22, 2, 5, 'r').rect(1, 13, 5, 2, 'r').rect(22, 13, 5, 2, 'r');
    g.ellipse(13.5, 12, 6, 5.5, 't').rect(10, 15, 8, 4, 't').rect(16, 9, 3, 10, 'T').px(9, 9, 'y').px(10, 8, 'w');
    g.rect(10, 11, 3, 3, 'e').rect(15, 11, 3, 3, 'e').px(13, 15, 'e').px(14, 15, 'e');
    g.rect(10, 17, 8, 1, 'T').px(11, 18, 'e').px(13, 18, 'e').px(15, 18, 'e').px(11, 11, 'r').px(16, 11, 'r');
    g.ellipse(4, 4, 1, 1, 'p').ellipse(23, 23, 1, 1, 'p');
  } },
  // Thousand Wounds: poisoned blades close in from every side
  'rogue-assassin-t7': { frame: 'ult', art: (g) => {
    g.ellipse(13.5, 13.5, 4, 4, 'V').ellipse(13.5, 13.5, 2.8, 2.8, 'v').ellipse(13, 13, 1.4, 1.4, 'u').px(13, 13, 'w');
    const dirs: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (const [dx, dy] of dirs) {
      // two-wide blade, guard, grip
      const ox = dy !== 0 ? 1 : 0, oy = dx !== 0 ? 1 : 0;
      g.line(13 + dx * 9, 13 + dy * 9, 13 + dx * 5, 13 + dy * 5, 'n').line(13 + dx * 9 + ox, 13 + dy * 9 + oy, 13 + dx * 5 + ox, 13 + dy * 5 + oy, 'm');
      g.px(13 + dx * 5, 13 + dy * 5, 'v').px(13 + dx * 5 + ox, 13 + dy * 5 + oy, 'v');
      g.line(13 + dx * 10 - ox * 2, 13 + dy * 10 - oy * 2, 13 + dx * 10 + ox * 3, 13 + dy * 10 + oy * 3, 'G');
      g.line(13 + dx * 11, 13 + dy * 11, 13 + dx * 12, 13 + dy * 12, 'l').line(13 + dx * 11 + ox, 13 + dy * 11 + oy, 13 + dx * 12 + ox, 13 + dy * 12 + oy, 'L');
    }
    // the four diagonal knives
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
      const cx = sx > 0 ? 14 : 13, cy = sy > 0 ? 14 : 13;
      g.line(cx + sx * 4, cy + sy * 4, cx + sx * 8, cy + sy * 8, 'n').line(cx + sx * 5, cy + sy * 4, cx + sx * 8, cy + sy * 7, 'm');
      g.px(cx + sx * 4, cy + sy * 4, 'v').px(cx + sx * 9, cy + sy * 7, 'G').px(cx + sx * 7, cy + sy * 9, 'G').px(cx + sx * 8, cy + sy * 8, 'G');
      g.px(cx + sx * 9, cy + sy * 9, 'l').px(cx + sx * 10, cy + sy * 10, 'L');
    }
  } },
  // Trickster: three fanned cards, the front one marked with a crescent
  'sub:rogue:Trickster': { frame: 'magic', art: (g) => {
    // back card: purple, patterned
    g.rect(4, 3, 11, 17, 'c').rect(4, 3, 11, 1, 'q').rect(4, 3, 1, 17, 'q').rect(14, 3, 1, 17, 'C').rect(4, 19, 11, 1, 'C');
    g.rect(6, 5, 7, 13, 'C').rect(7, 6, 5, 11, 'c');
    for (const [x, y] of [[9, 7], [9, 13]] as const) g.px(x, y, 'q').px(x - 1, y + 1, 'q').px(x + 1, y + 1, 'q').px(x, y + 2, 'q');
    // front card: bone, a black crescent
    g.rect(12, 8, 11, 17, 't').rect(12, 8, 11, 1, 'y').rect(12, 8, 1, 17, 'y').rect(22, 8, 1, 17, 'T').rect(12, 24, 11, 1, 'T');
    g.ellipse(16.5, 16, 4, 4.5, 'D').ellipse(19, 14.6, 3, 3.4, 't');
    g.px(14, 10, 'R').px(15, 11, 'R').px(20, 22, 'R').px(19, 21, 'R').px(13, 9, 'w');
    g.px(2, 23, 'y').px(25, 4, 'q').px(25, 26, 'q');
  } },
  // Smoke and Mirrors: a hand mirror wreathed in smoke
  'rogue-trickster-t5': { frame: 'magic', art: (g) => {
    g.ellipse(4, 19, 3, 2.5, 'C').ellipse(3.6, 18.6, 2, 1.6, 'c').ellipse(7, 22, 2.5, 2, 'C').ellipse(6.6, 21.6, 1.6, 1.2, 'c');
    g.ellipse(22, 6, 3, 2.5, 'C').ellipse(21.6, 5.6, 2, 1.6, 'c').ellipse(24, 10, 2.2, 2, 'C').ellipse(23.6, 9.6, 1.4, 1.2, 'q');
    g.line(15, 19, 20, 25, 'G').line(16, 19, 21, 25, 'h').line(14, 19, 19, 25, 'g').px(21, 26, 'G');
    g.ellipse(12, 11, 7.5, 9, 'G').ellipse(11.6, 10.6, 6.8, 8.3, 'g').ellipse(12, 11, 5.5, 7, 'A').ellipse(11.4, 10.2, 4.5, 6, 'a');
    g.line(9, 6, 7, 10, 'w').line(10, 6, 8, 10, 'i').px(14, 15, 'i').px(15, 14, 'w');
    g.px(12, 1, 'y').px(5, 4, 'g').px(19, 19, 'G').px(13, 21, 'h');
    g.px(2, 24, 'q').px(25, 14, 'c');
  } },
  // Shadow Double: a rogue and the purple shadow that stands beside him
  'rogue-trickster-t6': { frame: 'shadow', art: (g) => {
    const fig = (cx: number, top: number, hood: string, body: string, edge: string, eyes: string) => {
      g.ellipse(cx, top + 4, 4, 4.2, hood).px(cx, top - 1, hood);
      for (let j = 0; j < 15; j++) { const half = 4 + Math.round(j * 0.3); g.rect(cx - half, top + 8 + j, half * 2 + 1, 1, body); }
      g.line(cx - 3, top + 2, cx - 4, top + 6, edge).line(cx - 5, top + 9, cx - 8, top + 22, edge);
      g.rect(cx - 2, top + 3, 5, 4, 'e').px(cx - 1, top + 4, eyes).px(cx + 1, top + 4, eyes);
    };
    fig(17, 2, 'C', 'C', 'c', 'q');
    fig(10, 3, 'A', 'A', 'a', 'y');
    g.rect(11, 12, 1, 9, 'k').rect(16, 13, 1, 10, 'd');
    g.line(15, 17, 19, 13, 'n').px(20, 12, 'w').px(14, 18, 'G');
    g.px(24, 4, 'q').px(3, 3, 'q');
  } },
  // Hundred Faces: masks upon masks
  'rogue-trickster-t7': { frame: 'ult', art: (g) => {
    mask(g, 6.5, 8.5, 'q', 'c', 'C', -1);
    mask(g, 20.5, 8.5, 't', 'T', 'h', 0);
    mask(g, 13.5, 16, 'w', 'n', 'm', 1);
    g.rect(2, 3, 1, 1, 'y').px(25, 2, 'y').px(2, 22, 'q').px(25, 22, 'q');
    g.line(8, 22, 5, 25, 'r').line(19, 22, 22, 25, 'r').px(4, 26, 'R').px(23, 26, 'R');
  } },
  // Survivor: a scarred heart, stitched shut, still beating
  'sub:rogue:Survivor': { frame: 'nature', art: (g) => {
    g.ellipse(8.5, 9.5, 6, 6, 'R').ellipse(18.5, 9.5, 6, 6, 'R');
    g.spans([[13, 2, 25], [14, 3, 24], [15, 4, 23], [16, 5, 22], [17, 6, 21], [18, 7, 20], [19, 8, 19], [20, 9, 18], [21, 10, 17], [22, 11, 16], [23, 12, 15], [24, 13, 14]], 'R');
    g.ellipse(8, 9, 5, 5, 'r').ellipse(18, 9, 5, 5, 'r').spans([[13, 3, 22], [14, 4, 21], [15, 5, 20], [16, 6, 19], [17, 7, 18], [18, 8, 17], [19, 9, 16], [20, 10, 15], [21, 11, 14], [22, 12, 13]], 'r');
    g.ellipse(6.5, 7.5, 2, 2, 'p').px(5, 6, 'w').px(6, 6, 'w');
    // the scar and its stitches
    g.line(8, 17, 20, 6, 'R').line(9, 17, 21, 6, 'e');
    for (const [x, y] of [[10, 15], [13, 12], [16, 9], [19, 7]] as const) g.line(x - 1, y - 2, x + 2, y + 1, 't');
    // a wrap of bandage
    g.spans([[19, 8, 19], [20, 9, 18]], 'a').rect(8, 19, 12, 1, 't').px(12, 20, 'A').px(16, 20, 'A');
  } },
  // Scavenger's Eye: a crow with a gold eye and a coin in its beak
  'rogue-survivor-t5': { frame: 'gold', art: (g) => {
    g.ellipse(10, 11, 7, 6.5, 'k').spans([[16, 4, 15], [17, 4, 14], [18, 5, 14], [19, 5, 13], [20, 6, 13], [21, 6, 12], [22, 7, 12], [23, 7, 11], [24, 8, 11], [25, 8, 10]], 'k');
    g.ellipse(8.5, 8.5, 4, 3, 'd').px(6, 7, 'm').px(7, 6, 'm').line(5, 18, 7, 24, 'd').line(9, 14, 11, 20, 'D');
    g.spans([[9, 16, 20], [10, 16, 23], [11, 16, 25], [12, 16, 24], [13, 16, 21]], 'm').spans([[9, 16, 20], [10, 16, 22]], 'n').spans([[13, 16, 21], [12, 22, 24]], 'k');
    g.ellipse(12, 9, 2.2, 2.2, 'g').rect(12, 9, 1, 2, 'e').px(11, 8, 'y').px(13, 8, 'G');
    g.ellipse(23, 16, 2.6, 2.6, 'G').ellipse(22.7, 15.7, 2, 2, 'g').px(22, 15, 'y').px(22, 14, 'w');
    g.px(4, 3, 'y').px(25, 4, 'y').px(20, 22, 'g').px(23, 25, 'G');
  } },
  // Nothing Wasted: a patched coin pouch catching a falling coin
  'rogue-survivor-t6': { frame: 'gold', art: (g) => {
    g.ellipse(13.5, 18.5, 10, 7.5, 'L').ellipse(12.5, 17.5, 8.5, 6.5, 'l').ellipse(9, 15, 3, 2.5, 'S');
    g.rect(10, 9, 8, 3, 'l').rect(15, 9, 3, 3, 'L').spans([[7, 8, 19], [8, 7, 20]], 'l').spans([[8, 15, 20]], 'L').px(9, 7, 'S');
    g.rect(9, 11, 10, 1, 'G').rect(9, 11, 4, 1, 'g').line(18, 12, 21, 15, 'G').px(22, 16, 'g');
    g.px(11, 6, 'g').px(13, 6, 'y').px(16, 6, 'g').rect(11, 7, 6, 1, 'G').px(13, 7, 'g');
    g.rect(14, 17, 6, 5, 'L').rect(14, 17, 6, 5, 'h');
    for (const [x, y] of [[14, 17], [16, 17], [18, 17], [19, 19], [19, 21], [14, 19], [14, 21], [16, 21]] as const) g.px(x, y, 't');
    g.ellipse(13.5, 2.5, 2.4, 1.6, 'G').ellipse(13.2, 2.2, 1.8, 1.1, 'g').px(12, 2, 'y');
    g.px(9, 3, 'y').px(18, 4, 'y').px(13, 4, 'y');
  } },
  // Last One Standing: one dagger left upright on the battle-mound, gold blazing behind
  'rogue-survivor-t7': { frame: 'ult', art: (g) => {
    for (const [x, y] of [[2, 3], [7, 1], [20, 1], [25, 3], [1, 10], [26, 10]] as const) g.line(13.5, 9, x, y, 'G');
    for (const [x, y] of [[4, 5], [9, 2], [18, 2], [23, 5], [3, 11], [24, 11]] as const) g.line(13.5, 9, x, y, 'g');
    g.ellipse(13.5, 9, 4, 4, 'y');
    // fallen stones on either side
    g.spans([[19, 3, 6], [20, 2, 6], [21, 2, 7]], 'k').rect(2, 22, 6, 1, 'k').px(3, 19, 'm').px(2, 20, 'm');
    g.spans([[18, 21, 24], [19, 21, 25], [20, 21, 25], [21, 20, 25]], 'k').px(21, 18, 'm').px(21, 19, 'm');
    g.ellipse(13.5, 24, 12, 3, 'L').ellipse(12.5, 23.5, 10, 2, 'l');
    // the dagger, driven into the mound
    g.rect(13, 9, 1, 13, 'n').rect(14, 9, 1, 13, 'm').px(13, 22, 'k');
    g.rect(9, 7, 10, 2, 'G').rect(9, 7, 10, 1, 'g').px(8, 7, 'g').px(19, 8, 'h');
    g.rect(13, 3, 2, 4, 'L').rect(13, 3, 1, 4, 'l').ellipse(13.5, 1.6, 1.4, 1, 'g').px(13, 1, 'y');
    for (const [x, y] of [[6, 24], [20, 25], [17, 22], [9, 22]] as const) g.ellipse(x, y, 1.5, 1, 'g').px(x - 1, y, 'y');
  } },
};
