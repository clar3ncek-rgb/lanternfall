// 32 px icons: general group. Keys are the ids from icon-list.ts (ICON_GROUPS.general).
import type { IconDef } from '../icon-kit';
import type { Grid } from '../core';

/** A small sheet ghost: round head, wavy tail, dark eyes. */
const ghost = (g: Grid, x: number, y: number, w: number, h: number, L: string, D: string) => {
  const r = w / 2;
  g.ellipse(x + r - 0.5, y + r, r, r, L).rect(x, y + r, w, h - r - 1, L);
  for (let i = 0; i < w; i += 2) g.px(x + i, y + h - 1, L);
  g.rect(x + w - 1, y + r, 1, h - r - 1, D).px(x + w - 1, y + h - 1, D);
  const ey = y + r;
  g.rect(x + Math.floor(w / 2) - 2, ey, 1, 2, 'e').rect(x + Math.floor(w / 2) + 1, ey, 1, 2, 'e');
};

/** A down-pointing tapping hand (cuff, back of hand, index finger) in three tones. */
const tapHand = (g: Grid, x: number, y: number, L: string, M: string, D: string) => {
  g.rect(x, y - 2, 8, 2, D).rect(x, y, 8, 7, M).rect(x, y, 8, 1, L).rect(x, y, 1, 7, L).rect(x + 7, y, 1, 7, D);
  g.px(x + 3, y + 6, D).px(x + 5, y + 6, D).px(x + 6, y + 5, D);
  g.rect(x + 1, y + 7, 3, 7, M).rect(x + 1, y + 7, 1, 7, L).rect(x + 3, y + 7, 1, 7, D);
};

export const ICONS: Record<string, IconDef> = {
  // ---------------------------------------------------------------- shared spells
  // Lantern Strike: the lantern calls down lightning (approved sample)
  'lantern-strike': { frame: 'lightning', art: (g) => {
    g.rect(12, 2, 4, 2, 'G').px(13, 1, 'g').px(14, 1, 'g');
    g.rect(9, 4, 10, 2, 'G').rect(9, 16, 10, 2, 'G').rect(8, 6, 2, 10, 'G').rect(18, 6, 2, 10, 'G');
    g.rect(10, 6, 8, 10, 'y').rect(13, 8, 2, 6, 'w').rect(10, 6, 2, 10, 'g').rect(16, 6, 2, 10, 'g').rect(11, 18, 6, 1, 'h');
    g.line(14, 19, 11, 22, 'y').line(11, 22, 15, 22, 'y').line(15, 22, 11, 27, 'y').line(15, 19, 12, 22, 'w').line(16, 22, 12, 27, 'g');
    for (const [x, y] of [[4, 8], [23, 9], [5, 14], [22, 15]] as const) g.px(x, y, 'y').px(x + 1, y, 'g');
  } },
  // Ferryman's Toll: the coin for the ferryman, a skull stamped on it (approved sample)
  'ferrymans-toll': { frame: 'gold', art: (g) => {
    g.ellipse(13.5, 13.5, 11, 11, 'G').ellipse(13.5, 13, 10, 10, 'g').ellipse(13.5, 13.5, 8, 8, 'G').ellipse(13.5, 13, 7.5, 7.5, 'g');
    g.ellipse(13.5, 12, 4.5, 4, 't').rect(11, 14, 6, 3, 't').rect(11, 11, 2, 2, 'e').rect(15, 11, 2, 2, 'e').px(13, 14, 'e').px(14, 14, 'e');
    g.px(12, 17, 'T').px(14, 17, 'T').px(16, 17, 'T');
    g.spans([[4, 9, 12], [5, 7, 9], [6, 6, 7]], 'y').px(20, 21, 'h').px(21, 20, 'h');
  } },
  // Grave Sight: an eye opens on a gravestone (approved sample)
  'grave-sight': { frame: 'magic', art: (g) => {
    g.spans([[3, 10, 17], [4, 8, 19], [5, 7, 20], [6, 6, 21]], 'm').rect(6, 7, 16, 17, 'm').rect(18, 4, 4, 20, 'k').rect(6, 22, 16, 2, 'k');
    g.rect(3, 24, 22, 3, 'V').rect(3, 24, 22, 1, 'v').px(5, 23, 'v').px(22, 23, 'v');
    g.spans([[11, 10, 17], [12, 9, 18], [13, 8, 19], [14, 8, 19], [15, 9, 18], [16, 10, 17]], 'w');
    g.ellipse(13.5, 13.5, 2.5, 2.5, 'c').rect(13, 13, 2, 2, 'e').px(12, 12, 'w');
    g.line(9, 18, 18, 18, 'k').px(8, 8, 'n').px(9, 7, 'n');
  } },
  // Call the Named: a raised open hand, and the ghosts of the Named rise to it
  'call-the-named': { frame: 'shadow', art: (g) => {
    ghost(g, 2, 3, 7, 10, 'a', 'A');
    ghost(g, 19, 3, 7, 10, 'a', 'A');
    ghost(g, 10, 1, 8, 10, 'i', 'a');
    // hand
    g.rect(10, 17, 8, 7, 's').rect(10, 13, 2, 5, 's').rect(12, 12, 2, 6, 's').rect(14, 12, 2, 6, 's').rect(16, 13, 2, 5, 's').rect(7, 17, 3, 3, 's');
    g.px(11, 13, 'S').px(13, 12, 'S').px(15, 12, 'S').px(17, 13, 'S').rect(17, 17, 1, 7, 'S').rect(7, 19, 3, 1, 'S');
    g.px(10, 14, 'w').px(12, 13, 'w').px(10, 18, 'w');
    g.rect(10, 24, 8, 3, 'C').rect(10, 24, 8, 1, 'c');
    // calling glow
    g.px(5, 16, 'q').px(22, 16, 'q').px(6, 22, 'q').px(21, 22, 'q').px(4, 19, 'i').px(23, 19, 'i');
  } },
  // Bell Frenzy: a bell swinging wildly (approved sample)
  'bell-frenzy': { frame: 'gold', art: (g) => {
    g.rect(13, 2, 2, 2, 'G').spans([[4, 11, 16], [5, 10, 17], [6, 9, 18], [7, 9, 18], [8, 8, 19], [9, 8, 19], [10, 8, 19], [11, 8, 19], [12, 8, 19], [13, 7, 20], [14, 7, 20], [15, 6, 21], [16, 5, 22], [17, 4, 23]], 'g');
    g.spans([[6, 16, 18], [8, 17, 19], [10, 17, 19], [12, 17, 19], [14, 18, 20], [16, 19, 22], [17, 20, 23]], 'G');
    g.rect(4, 18, 20, 2, 'G').rect(10, 6, 2, 8, 'y').ellipse(13.5, 21, 2, 1.5, 'h');
    g.line(2, 8, 2, 14, 'y').line(4, 6, 4, 10, 'g').line(25, 8, 25, 14, 'y').line(23, 6, 23, 10, 'g');
    g.line(1, 18, 3, 22, 'y').line(26, 18, 24, 22, 'y');
  } },
  // Echo Hands: a ghostly tapping hand and its fading echoes, rippling the ground
  'echo-hands': { frame: 'cold', art: (g) => {
    // an open ghost hand, with two fading echoes of it trailing up-left
    const hand = (dx: number, dy: number, c: string) => {
      g.rect(9 + dx, 6 + dy, 2, 8, c).rect(12 + dx, 4 + dy, 2, 10, c).rect(15 + dx, 5 + dy, 2, 9, c).rect(18 + dx, 8 + dy, 2, 6, c);
      g.rect(9 + dx, 13 + dy, 11, 8, c).ellipse(14 + dx, 20 + dy, 5, 2.5, c).line(8 + dx, 17 + dy, 5 + dx, 13 + dy, c).line(9 + dx, 17 + dy, 6 + dx, 13 + dy, c).line(8 + dx, 16 + dy, 6 + dx, 14 + dy, c);
    };
    hand(-3, -2, 'B');
    hand(-1, -1, 'b');
    hand(2, 1, 'i');
    g.rect(14, 22, 7, 2, 'i').spans([[24, 15, 20], [25, 16, 18]], 'a').px(19, 26, 'a');
    g.rect(21, 10, 1, 13, 'a').rect(18, 7, 1, 7, 'a').rect(15, 6, 1, 8, 'a').px(12, 8, 'a').rect(11, 23, 10, 1, 'a');
    g.px(11, 7, 'w').px(14, 5, 'w').px(17, 6, 'w').px(12, 15, 'w').px(13, 14, 'w');
    g.px(24, 4, 'i').px(25, 17, 'i').px(3, 24, 'i').px(23, 25, 'b');
  } },

  // ---------------------------------------------------------------- stats
  // Strength: a flexed arm with a leather bracer
  'stat:str': { frame: 'stat', art: (g) => {
    g.ellipse(9, 16, 6, 5, 's').rect(3, 17, 14, 6, 's').rect(14, 7, 7, 16, 's').ellipse(17.5, 6, 4.5, 4, 's');
    g.rect(3, 22, 18, 1, 'S').rect(20, 8, 1, 15, 'S').line(14, 14, 14, 18, 'S').line(5, 20, 12, 20, 'S');
    g.px(15, 4, 'S').px(17, 3, 'S').px(19, 4, 'S').line(14, 7, 21, 7, 'S');
    g.rect(14, 10, 7, 3, 'l').rect(14, 10, 7, 1, 'G').rect(14, 12, 7, 1, 'L').px(16, 11, 'g').px(19, 11, 'g');
    g.rect(2, 16, 3, 8, 'R').rect(2, 16, 1, 8, 'r');
    g.px(7, 12, 'w').px(8, 12, 'w').px(6, 13, 'w').px(15, 15, 'w').px(15, 3, 'w');
  } },
  // Agility: a winged boot
  'stat:agi': { frame: 'stat', art: (g) => {
    g.rect(10, 6, 7, 12, 'l').rect(10, 17, 12, 5, 'l').ellipse(21, 19.5, 3, 2.5, 'l');
    g.rect(15, 7, 2, 11, 'L').rect(10, 21, 14, 1, 'L').rect(9, 22, 16, 2, 'L').rect(9, 22, 16, 1, 'h');
    g.rect(9, 4, 9, 2, 'G').rect(9, 4, 9, 1, 'g').px(11, 8, 'p').px(11, 9, 'l');
    g.px(11, 7, 'w').px(18, 18, 'w');
    g.spans([[5, 4, 9], [7, 2, 9], [9, 3, 9], [11, 4, 9], [13, 6, 9]], 'n');
    g.spans([[6, 3, 9], [8, 2, 9], [10, 3, 9], [12, 5, 9], [14, 7, 9]], 'm');
    g.px(4, 5, 'w').px(2, 7, 'w');
    g.line(21, 8, 25, 8, 'a').line(19, 11, 25, 11, 'A').line(22, 14, 25, 14, 'a');
  } },
  // Stamina: a stout beating heart
  'stat:sta': { frame: 'stat', art: (g) => {
    const heart = (c: string, shrink: number, up: number) => {
      g.ellipse(9 - shrink * 0.3, 10 - up, 6 - shrink, 6 - shrink, c).ellipse(18 - shrink * 0.3, 10 - up, 6 - shrink, 6 - shrink, c);
      for (let y = 12; y <= 24 - shrink * 2; y++) {
        const a = Math.round(3 + shrink + (y - 12) * 0.88), b = Math.round(24 - shrink * 2 - (y - 12) * 0.88);
        if (a <= b) g.rect(a, y - up, b - a + 1, 1, c);
      }
    };
    heart('R', 0, 0);
    heart('r', 1, 1);
    g.ellipse(7, 8, 2, 1.5, 'p').px(6, 7, 'w').px(7, 7, 'w').px(16, 6, 'p');
  } },
  // Intellect: a scrying crystal ball on a gold claw stand
  'stat:int': { frame: 'stat', art: (g) => {
    g.ellipse(13.5, 11, 9, 9, 'C').ellipse(13, 10.5, 8, 8, 'c').ellipse(12, 9, 5, 5, 'q');
    g.line(9, 12, 13, 14, 'c').line(13, 14, 17, 11, 'c').line(11, 7, 14, 6, 'w');
    g.ellipse(9.5, 6.5, 1.5, 1.5, 'w');
    g.rect(8, 20, 12, 2, 'g').spans([[22, 7, 20], [23, 6, 21], [24, 5, 22], [25, 5, 22]], 'G').rect(6, 22, 16, 1, 'g');
    g.px(7, 19, 'g').px(20, 19, 'g').px(6, 18, 'G').px(21, 18, 'G').px(9, 24, 'h').px(13, 24, 'h').px(17, 24, 'h');
    g.px(3, 4, 'q').px(24, 6, 'q').px(23, 15, 'q');
  } },
  // Spirit: a teal soul flame with a face
  'stat:spi': { frame: 'stat', art: (g) => {
    g.ellipse(13.5, 17, 8, 7.5, 'X').spans([[3, 15, 16], [4, 14, 17], [5, 13, 17], [6, 12, 18], [7, 11, 18], [8, 10, 19], [9, 9, 20], [10, 8, 20]], 'X');
    g.ellipse(13, 17, 6.5, 6.5, 'x').spans([[5, 14, 15], [6, 13, 16], [7, 12, 16], [8, 11, 17], [9, 10, 17], [10, 9, 18]], 'x');
    g.ellipse(13, 18, 3.5, 4, 'i').px(15, 3, 'w').px(14, 6, 'i');
    g.rect(10, 16, 2, 3, 'e').rect(15, 16, 2, 3, 'e').px(12, 21, 'X').px(13, 21, 'X').px(14, 21, 'X');
    g.px(4, 9, 'x').px(3, 14, 'i').px(24, 11, 'x').px(25, 17, 'i').px(5, 24, 'x').px(23, 24, 'x');
  } },
  // Crit damage: a red impact burst, white-hot at the heart
  'stat:critdmg': { frame: 'stat', art: (g) => {
    const c = 13.5;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8, len = i % 2 ? 9 : 13;
      const x = c + Math.cos(a) * len, y = c + Math.sin(a) * len;
      g.line(c, c, x, y, 'R').line(c + 1, c, x + 1, y, 'R').line(c, c + 1, x, y + 1, 'R');
      g.line(c, c, c + Math.cos(a) * (len - 3), c + Math.sin(a) * (len - 3), 'r');
    }
    g.ellipse(c, c, 6, 6, 'r').ellipse(c, c, 4.5, 4.5, 'f').ellipse(c, c, 2.5, 2.5, 'y').rect(13, 13, 2, 2, 'w');
    g.px(4, 4, 'p').px(23, 3, 'p').px(24, 23, 'p').px(3, 22, 'p');
  } },
  // Named damage per second: a ghost ally holding a sword
  'stat:named': { frame: 'stat', art: (g) => {
    g.ellipse(11, 9, 7, 7, 'a').rect(4, 9, 15, 10, 'a');
    g.spans([[19, 4, 18], [20, 4, 7], [20, 10, 12], [20, 15, 18], [21, 5, 6], [21, 11, 11], [21, 16, 17]], 'a');
    g.rect(17, 7, 2, 13, 'A').px(16, 4, 'A').px(17, 5, 'A').rect(4, 19, 15, 1, 'A');
    g.rect(7, 8, 3, 4, 'e').rect(13, 8, 3, 4, 'e').px(8, 9, 'x').px(14, 9, 'x').rect(10, 14, 3, 2, 'e');
    g.px(7, 4, 'w').px(6, 5, 'w');
    g.rect(21, 2, 1, 16, 'n').rect(22, 2, 1, 16, 'm').px(21, 1, 'w').rect(18, 18, 8, 2, 'G').rect(18, 18, 8, 1, 'g');
    g.rect(21, 20, 2, 4, 'l').rect(21, 24, 2, 2, 'g');
    g.rect(17, 20, 4, 2, 'a');
  } },
  // Boss time: a dripping candle on its dish
  'stat:bosstime': { frame: 'stat', art: (g) => {
    g.rect(10, 10, 8, 14, 't').rect(16, 10, 2, 14, 'T').rect(10, 10, 8, 1, 'w');
    g.rect(9, 11, 1, 4, 't').rect(18, 11, 1, 7, 'T').px(12, 11, 'T').px(12, 12, 'T');
    g.line(14, 7, 14, 9, 'e');
    g.spans([[1, 14, 14], [2, 13, 15], [3, 13, 15], [4, 12, 16], [5, 12, 16], [6, 12, 16], [7, 13, 15]], 'f');
    g.spans([[3, 14, 14], [4, 13, 15], [5, 13, 15], [6, 14, 14]], 'y').px(14, 4, 'w');
    g.rect(4, 24, 20, 2, 'G').rect(4, 24, 20, 1, 'g').rect(6, 26, 16, 1, 'h');
    g.ellipse(24.5, 22, 2, 2, 'G').px(24, 22, '.').px(25, 22, '.');
    g.px(9, 4, 'y').px(19, 4, 'y').px(8, 7, 'g').px(20, 7, 'g');
  } },
  // Mana: a round blue potion flask
  'stat:mana': { frame: 'stat', art: (g) => {
    g.rect(11, 5, 6, 6, 'a').rect(15, 5, 2, 6, 'A').rect(10, 5, 8, 1, 'A');
    g.rect(11, 2, 6, 3, 'l').rect(11, 2, 6, 1, 'G').rect(15, 2, 2, 3, 'L');
    g.ellipse(13.5, 17, 9, 8.5, 'B').ellipse(13, 16.5, 8, 7.5, 'b');
    g.rect(10, 9, 8, 2, 'b').rect(11, 10, 6, 1, 'i');
    g.ellipse(9, 14, 2, 3, 'i').px(8, 12, 'w').px(8, 13, 'w');
    g.px(15, 19, 'i').px(17, 16, 'i').px(13, 22, 'i').px(18, 21, 'w');
  } },
  // Skill power: a rune stone with a glowing diamond sigil
  'stat:skill': { frame: 'stat', art: (g) => {
    g.spans([[3, 9, 18], [4, 7, 20], [5, 6, 21]], 'm').rect(5, 6, 18, 18, 'm').spans([[24, 6, 21], [25, 8, 19]], 'k');
    g.rect(20, 5, 3, 19, 'k').rect(5, 6, 1, 17, 'n').spans([[3, 9, 15], [4, 7, 9], [5, 6, 7]], 'n');
    g.line(14, 7, 20, 13, 'b').line(20, 13, 14, 19, 'b').line(14, 19, 8, 13, 'b').line(8, 13, 14, 7, 'b');
    g.line(14, 8, 19, 13, 'i').line(19, 13, 14, 18, 'i').line(14, 18, 9, 13, 'i').line(9, 13, 14, 8, 'i');
    g.rect(13, 12, 2, 2, 'w').px(14, 10, 'i').px(14, 15, 'i').px(11, 13, 'i').px(17, 13, 'i');
    g.px(14, 4, 'i').px(14, 22, 'i').px(3, 13, 'i').px(25, 13, 'i').px(2, 4, 'b').px(25, 25, 'b');
  } },
  // Gold: a heap of round gold coins with a sparkle
  'stat:gold': { frame: 'stat', art: (g) => {
    const coin = (x: number, y: number) => {
      g.ellipse(x, y, 4, 4, 'h').ellipse(x, y, 3.2, 3.2, 'G').ellipse(x - 0.4, y - 0.4, 2.6, 2.6, 'g');
      g.rect(x - 1, y - 1, 2, 2, 'G').px(x - 2, y - 2, 'y').px(x - 1, y - 3, 'y').px(x - 3, y - 1, 'y');
    };
    coin(14, 7);
    coin(10.5, 12); coin(17.5, 12);
    coin(7, 17); coin(14, 17); coin(21, 17);
    coin(4, 22); coin(10.5, 22.5); coin(17.5, 22.5); coin(24, 22);
    g.line(23, 2, 23, 8, 'y').line(20, 5, 26, 5, 'y').px(23, 5, 'w').px(22, 4, 'w').px(24, 6, 'w').px(23, 4, 'w').px(23, 6, 'w');
    g.px(4, 9, 'y').px(3, 13, 'w');
  } },
  // Crit: a target split by a blade (approved sample)
  'stat:crit': { frame: 'stat', art: (g) => {
    g.ellipse(13.5, 13.5, 11, 11, 'w').ellipse(13.5, 13.5, 9, 9, 'r').ellipse(13.5, 13.5, 6.5, 6.5, 'w').ellipse(13.5, 13.5, 4, 4, 'r').ellipse(13.5, 13.5, 1.5, 1.5, 'y');
    g.line(3, 24, 24, 3, 'n').line(4, 24, 25, 3, 'm').line(2, 23, 23, 2, 'w').px(25, 2, 'w');
    g.spans([[20, 19, 22], [21, 20, 23], [22, 21, 24]], 'R');
  } },
  // Tap: a fist with a burst of impact (approved sample)
  'stat:tap': { frame: 'stat', art: (g) => {
    for (const [x, y] of [[22, 4], [25, 9], [20, 2], [26, 14]] as const) g.px(x, y, 'y');
    g.line(19, 6, 24, 1, 'y').line(21, 9, 26, 6, 'g').line(22, 12, 26, 12, 'y');
    g.rect(6, 9, 13, 11, 's').rect(6, 7, 3, 4, 's').rect(9, 6, 3, 4, 's').rect(12, 6, 3, 4, 's').rect(15, 7, 3, 4, 's');
    g.rect(6, 10, 12, 1, 'S').line(8, 7, 8, 10, 'S').line(11, 6, 11, 10, 'S').line(14, 6, 14, 10, 'S').rect(3, 14, 4, 5, 's').rect(3, 18, 4, 1, 'S');
    g.rect(7, 20, 11, 6, 'l').rect(7, 20, 11, 1, 'L').rect(7, 24, 11, 1, 'G');
    g.px(10, 7, 'w').px(13, 7, 'w').px(7, 12, 'w');
  } },
  // Boss damage: a crowned skull (approved sample)
  'stat:bossdmg': { frame: 'stat', art: (g) => {
    g.spans([[2, 7, 8], [2, 13, 14], [2, 19, 20], [3, 7, 9], [3, 12, 15], [3, 18, 20], [4, 7, 20], [5, 7, 20], [6, 7, 20]], 'g').rect(7, 6, 14, 1, 'G').px(13, 4, 'r').px(14, 4, 'r');
    g.ellipse(13.5, 14, 8, 7, 't').rect(9, 18, 10, 5, 't').rect(19, 10, 2, 9, 'T').rect(9, 22, 10, 1, 'T');
    g.rect(9, 12, 4, 4, 'e').rect(15, 12, 4, 4, 'e').px(10, 13, 'r').px(11, 13, 'r').px(16, 13, 'r').px(17, 13, 'r').px(13, 17, 'e').px(14, 17, 'e');
    g.px(10, 20, 'e').px(12, 20, 'e').px(14, 20, 'e').px(16, 20, 'e').px(18, 20, 'e').px(9, 9, 'w');
  } },
  // Cleave: a big axe mid-swing, its bright slash cutting through two foes at once
  'stat:cleave': { frame: 'stat', art: (g) => {
    const foe = (x: number, y: number) => {
      g.ellipse(x, y, 2.5, 2.5, 'V').px(x - 2, y - 3, 'V').px(x + 2, y - 3, 'V');
      g.spans([[y + 2, x - 2, x + 2], [y + 3, x - 3, x + 3], [y + 4, x - 3, x + 3], [y + 5, x - 2, x + 2], [y + 6, x - 2, x + 2], [y + 7, x - 2, x - 1], [y + 7, x + 1, x + 2]], 'V');
      g.px(x - 1, y - 1, 'v').rect(x - 2, y + 2, 1, 4, 'v').px(x - 1, y, 'r').px(x + 1, y, 'r');
    };
    foe(15, 8); foe(23, 10);
    for (let x = 11; x <= 26; x++) {
      const y = 13 + (x - 11) * 0.2 + 0.03 * (x - 11) * (26 - x);
      g.px(x, y - 1, 'i').px(x, y, 'w').px(x, y + 1, 'i');
    }
    g.px(14, 17, 'R').px(16, 18, 'r').px(22, 20, 'R').px(24, 19, 'r');
    // axe: an upright haft with a broad blade facing the foes
    g.rect(3, 4, 2, 23, 'l').rect(4, 4, 1, 23, 'L').rect(3, 3, 2, 1, 'G').rect(3, 26, 2, 1, 'G');
    g.ellipse(7, 13, 4, 6.5, 'n').ellipse(6.5, 13, 3.4, 5.8, 'm').rect(0, 5, 5, 16, '.');
    g.rect(3, 4, 2, 23, 'l').rect(4, 4, 1, 23, 'L').rect(2, 10, 4, 6, 'k').rect(2, 10, 4, 1, 'm');
    g.rect(6, 7, 2, 1, 'k').rect(6, 19, 2, 1, 'k').px(10, 11, 'w').px(10, 13, 'w').px(10, 15, 'w');
  } },
  // Best stage: a red banner planted on a stone cairn
  'stat:best': { frame: 'stat', art: (g) => {
    g.spans([[18, 10, 15], [19, 8, 17], [20, 6, 19], [21, 5, 20], [22, 4, 22], [23, 3, 23], [24, 2, 24], [25, 2, 25]], 'm');
    g.spans([[20, 16, 19], [21, 17, 20], [22, 18, 22], [23, 19, 23], [24, 20, 24], [25, 20, 25]], 'k');
    g.line(5, 23, 9, 23, 'k').line(10, 21, 14, 21, 'k').line(13, 24, 17, 24, 'k').px(8, 20, 'n').px(4, 23, 'n').px(11, 19, 'n');
    g.rect(12, 3, 2, 18, 'l').rect(13, 3, 1, 18, 'L').ellipse(12.5, 2, 1.5, 1.2, 'g');
    g.spans([[4, 14, 23], [5, 14, 24], [6, 14, 24], [7, 14, 23], [8, 14, 21], [9, 14, 22], [10, 14, 24], [11, 14, 24], [12, 14, 23]], 'r');
    g.rect(14, 4, 9, 1, 'p').spans([[11, 15, 24], [12, 15, 23]], 'R').px(21, 8, 'R').px(22, 8, '.').px(23, 8, '.');
    g.rect(14, 4, 1, 9, 'R');
    g.px(4, 6, 'y').px(6, 3, 'w').px(25, 15, 'y');
  } },

  // ---------------------------------------------------------------- bottom tabs (bold and simple)
  // Hero: a crested great helm with a T visor
  'tab:hero': { frame: 'gold', art: (g) => {
    g.spans([[1, 11, 16], [2, 9, 18], [3, 8, 19]], 'r').rect(9, 1, 9, 1, 'p');
    g.ellipse(13.5, 12, 9.5, 9, 'm').rect(4, 12, 20, 13, 'm');
    g.rect(20, 7, 4, 18, 'k').rect(4, 10, 2, 15, 'n').spans([[4, 10, 15], [5, 8, 11], [6, 7, 8]], 'n');
    g.rect(6, 11, 16, 3, 'e').rect(12, 11, 4, 10, 'e');
    g.rect(4, 24, 20, 2, 'G').rect(4, 24, 20, 1, 'g');
  } },
  // Named: two hooded spirit allies side by side
  'tab:named': { frame: 'cold', art: (g) => {
    g.ellipse(19, 9, 6, 6.5, 'C').spans([[13, 13, 25], [16, 12, 25], [19, 12, 26], [22, 11, 26], [25, 11, 26]], 'C').rect(12, 13, 14, 13, 'C');
    g.ellipse(19, 10, 3, 3.5, 'e').px(18, 10, 'q').px(20, 10, 'q').rect(15, 5, 2, 6, 'c');
    g.ellipse(10, 11, 7.5, 7.5, 'a').rect(2, 14, 16, 12, 'a').rect(1, 20, 18, 6, 'a');
    g.rect(16, 11, 2, 15, 'A').rect(18, 20, 1, 6, 'A').rect(2, 9, 1, 8, 'w');
    g.ellipse(10, 12.5, 4, 4, 'e').px(8, 12, 'i').px(11, 12, 'i');
    g.rect(9, 18, 2, 8, 'A');
  } },
  // Gear: a steel breastplate
  'tab:gear': { frame: 'phys', art: (g) => {
    g.spans([[4, 4, 9], [4, 18, 23], [5, 3, 10], [5, 17, 24], [6, 3, 24], [7, 3, 24], [8, 3, 24], [9, 3, 24], [10, 5, 22], [11, 5, 22], [12, 5, 22], [13, 5, 22],
      [14, 6, 21], [15, 6, 21], [16, 6, 21], [17, 6, 21], [18, 6, 21], [19, 6, 21], [20, 6, 21], [21, 7, 20], [22, 7, 20], [23, 7, 20], [24, 8, 19]], 'm');
    g.ellipse(13.5, 4, 4, 3.5, '.');
    g.spans([[4, 4, 8], [5, 3, 5], [6, 3, 4], [7, 3, 4], [8, 3, 4], [9, 3, 4], [10, 5, 6], [11, 5, 6], [12, 5, 6], [13, 5, 6], [14, 6, 7], [15, 6, 7], [16, 6, 7]], 'n');
    g.rect(19, 10, 3, 4, 'k').rect(19, 14, 3, 7, 'k').rect(23, 6, 2, 4, 'k').rect(18, 21, 3, 3, 'k').rect(8, 24, 12, 1, 'k');
    g.line(13, 8, 13, 23, 'n').line(14, 8, 14, 23, 'k');
    g.spans([[7, 9, 11], [8, 10, 12], [7, 16, 18], [8, 15, 17]], 'g');
    g.rect(7, 21, 14, 2, 'l').rect(12, 21, 4, 2, 'g');
  } },
  // Skills: an open spellbook with a star rising from it
  'tab:skills': { frame: 'magic', art: (g) => {
    g.rect(1, 13, 26, 12, 'C').rect(1, 24, 26, 1, 'D');
    g.spans([[10, 3, 11], [11, 2, 12], [12, 2, 13]], 't').rect(2, 12, 12, 11, 't');
    g.spans([[10, 16, 24], [11, 15, 25], [12, 14, 25]], 't').rect(14, 12, 12, 11, 't');
    g.rect(12, 11, 2, 12, 'T').rect(14, 11, 2, 12, 'T').rect(13, 10, 2, 14, 'L');
    g.line(4, 15, 10, 15, 'T').line(4, 18, 10, 18, 'T').line(17, 15, 23, 15, 'T').line(17, 18, 23, 18, 'T');
    g.spans([[1, 13, 14], [2, 13, 14], [3, 11, 16], [4, 9, 18], [5, 11, 16], [6, 13, 14], [7, 13, 14]], 'q').rect(13, 3, 2, 3, 'w');
    g.px(6, 3, 'q').px(21, 2, 'q').px(23, 7, 'i');
  } },
  // Pets: a big paw print
  'tab:pets': { frame: 'nature', art: (g) => {
    g.ellipse(13.5, 19, 8, 6.5, 'T').ellipse(13, 18.5, 7, 5.5, 't');
    for (const [x, y] of [[4.5, 11], [10, 5.5], [17, 5.5], [22.5, 11]] as const) g.ellipse(x, y, 3, 3.8, 'T').ellipse(x - 0.4, y - 0.4, 2.2, 3, 't');
    g.px(9, 16, 'w').px(8, 17, 'w').px(3, 9, 'w').px(9, 3, 'w').px(16, 3, 'w').px(21, 9, 'w');
  } },
  // Quests: a scroll sealed with red wax
  'tab:quests': { frame: 'gold', art: (g) => {
    g.rect(6, 6, 16, 16, 't').rect(19, 6, 3, 16, 'T');
    g.line(8, 9, 18, 9, 'T').line(8, 12, 17, 12, 'T').line(8, 15, 15, 15, 'T');
    g.rect(4, 3, 20, 4, 'T').rect(4, 3, 20, 1, 't').ellipse(4, 5, 1.5, 2, 'l').ellipse(23.5, 5, 1.5, 2, 'L');
    g.rect(4, 21, 20, 4, 'T').rect(4, 21, 20, 1, 't').ellipse(4, 23, 1.5, 2, 'l').ellipse(23.5, 23, 1.5, 2, 'L');
    g.ellipse(17, 18, 3.5, 3.5, 'R').ellipse(16.5, 17.5, 2.5, 2.5, 'r').px(16, 16, 'p');
    g.line(16, 21, 15, 26, 'R').line(18, 21, 19, 26, 'R');
  } },
  // Death: a skull over crossed bones, embers in its eyes
  'tab:death': { frame: 'shadow', art: (g) => {
    for (const [x0, y0, x1, y1] of [[4, 17, 23, 25], [4, 25, 23, 17]] as const) {
      g.line(x0, y0, x1, y1, 't').line(x0, y0 + 1, x1, y1 + 1, 'T');
      g.ellipse(x0, y0, 1.5, 1.5, 't').ellipse(x1, y1, 1.5, 1.5, 't');
    }
    g.ellipse(13.5, 10, 8.5, 8, 't').rect(9, 15, 10, 5, 't').rect(19, 7, 2, 9, 'T').rect(17, 15, 2, 5, 'T').rect(9, 19, 10, 1, 'T');
    g.ellipse(10, 11, 2, 2, 'e').ellipse(17, 11, 2, 2, 'e').px(10, 11, 'f').px(17, 11, 'f');
    g.px(13, 15, 'e').px(14, 15, 'e').px(11, 18, 'e').px(13, 18, 'e').px(15, 18, 'e');
    g.px(8, 5, 'w').px(9, 4, 'w');
  } },
  // Menu: three bold bars
  'tab:menu': { frame: 'stat', art: (g) => {
    for (const y of [5, 12, 19]) g.rect(4, y, 20, 4, 't').rect(4, y, 20, 1, 'w').rect(4, y + 3, 20, 1, 'T').rect(23, y, 1, 4, 'T');
  } },
};
