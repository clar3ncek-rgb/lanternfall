// 32 px framed pixel icons (SAMPLE set, 10 Nov 2026): one unique picture per skill, spell or stat,
// in a frame coloured by element or kind. Approved samples become the pattern for the full set.
import { Grid, dataUrl, draw, mix } from './core';

const P: Record<string, string> = {
  o: '#1a1218', e: '#140c12', w: '#ffffff',
  k: '#4a4650', m: '#9a9aa6', n: '#e4e6ee',
  g: '#f0c050', G: '#a8752a', y: '#fff2ae', h: '#6a4418',
  r: '#d8402e', R: '#7a1e18', p: '#ff8a7a',
  v: '#4fd060', V: '#1f7a34', u: '#c0ffa0',
  b: '#4a8ff0', B: '#203f8a', i: '#a8ecff',
  c: '#8a5ad0', C: '#3e2468', q: '#d0b0ff',
  l: '#8a5a36', L: '#4a3020',
  s: '#eab995', S: '#b0765a',
  f: '#f08a24', F: '#b0400e',
  t: '#ece0c4', T: '#a89878',
};

/** Frame colours by element or kind. */
export const FRAME: Record<string, string> = {
  phys: '#a9a49c', magic: '#a070e0', fire: '#f08a24', cold: '#6ac8f0', lightning: '#f0d040', poison: '#50c050',
  gold: '#e0b45a', blood: '#d04a3a', stat: '#b08a5a',
};

type Art = (g: Grid) => void;
const ART: Record<string, Art> = {
  // Twinfang: two fangs-daggers crossed
  twinfang: (g) => {
    g.line(7, 19, 20, 6, 'n').line(8, 19, 21, 6, 'm').line(8, 20, 21, 7, 'k').px(21, 5, 'w').px(22, 5, 'n');
    g.line(4, 16, 10, 22, 'G').line(5, 16, 11, 22, 'g').line(3, 23, 6, 20, 'l').px(2, 24, 'g').px(3, 24, 'G');
    g.line(20, 19, 7, 6, 'n').line(19, 19, 6, 6, 'm').line(19, 20, 6, 7, 'k').px(6, 5, 'w').px(5, 5, 'n');
    g.line(23, 16, 17, 22, 'G').line(22, 16, 16, 22, 'g').line(24, 23, 21, 20, 'l').px(25, 24, 'g').px(24, 24, 'G');
    g.px(13, 12, 'w').px(14, 13, 'w').px(13, 13, 'y');
    g.px(21, 8, 'v').px(21, 9, 'v').px(6, 8, 'v').px(6, 9, 'u');
  },
  // Widow's Kiss: a poison drop with the widow's red hourglass
  widowskiss: (g) => {
    g.spans([[3, 13, 14], [4, 13, 14], [5, 12, 15], [6, 12, 15], [7, 11, 16], [8, 10, 17], [9, 10, 17], [10, 9, 18]], 'V').ellipse(13.5, 16, 7.5, 8, 'V');
    g.spans([[4, 13, 13], [5, 12, 14], [6, 12, 14], [7, 11, 15], [8, 10, 16], [9, 10, 16], [10, 9, 17]], 'v').ellipse(12.8, 15.2, 6.5, 7, 'v');
    g.rect(8, 11, 2, 5, 'u').px(10, 9, 'u').px(11, 7, 'w').px(8, 12, 'w');
    g.spans([[13, 12, 15], [14, 13, 14], [15, 13, 14], [16, 13, 14], [17, 12, 15]], 'e');
    g.spans([[13, 13, 14], [17, 13, 14]], 'r').px(13, 15, 'R').px(14, 15, 'R');
  },
  // Cut Deep: three deep slashes that bleed
  cutdeep: (g) => {
    for (const [dx, len] of [[0, 18], [5, 20], [10, 16]] as const) {
      g.line(3 + dx, 22, 3 + dx + len * 0.7, 22 - len, 'r').line(4 + dx, 22, 4 + dx + len * 0.7, 22 - len, 'R').line(2 + dx, 22, 2 + dx + len * 0.7, 22 - len, 'p');
    }
    g.ellipse(6, 25, 1.5, 1.5, 'R').px(6, 24, 'r').ellipse(12, 26, 1.2, 1.5, 'R').ellipse(17, 25, 1, 1.2, 'R').px(16, 27, 'R');
    g.px(16, 3, 'w').px(21, 5, 'w').px(11, 5, 'w');
  },
  // Nightfall Flurry: blades raining under a crescent moon
  nightfall: (g) => {
    g.ellipse(8, 8, 6, 6, 'q').ellipse(10.5, 6.5, 5, 5, '.').px(4, 8, 'w').px(5, 11, 'c').px(7, 13, 'c').px(4, 10, 'q');
    for (const [x, y] of [[16, 3], [21, 8], [13, 12], [19, 15], [9, 18], [15, 20]] as const) {
      g.line(x, y, x + 3, y + 5, 'n').line(x + 1, y, x + 4, y + 5, 'm').px(x + 4, y + 6, 'G').px(x - 1, y - 1, 'w');
    }
    g.px(24, 3, 'q').px(3, 22, 'q').px(25, 22, 'q');
  },
  // Lantern Strike: the lantern calls down lightning
  lanternstrike: (g) => {
    g.rect(12, 2, 4, 2, 'G').px(13, 1, 'g').px(14, 1, 'g');
    g.rect(9, 4, 10, 2, 'G').rect(9, 16, 10, 2, 'G').rect(8, 6, 2, 10, 'G').rect(18, 6, 2, 10, 'G');
    g.rect(10, 6, 8, 10, 'y').rect(13, 8, 2, 6, 'w').rect(10, 6, 2, 10, 'g').rect(16, 6, 2, 10, 'g').rect(11, 18, 6, 1, 'h');
    g.line(14, 19, 11, 22, 'y').line(11, 22, 15, 22, 'y').line(15, 22, 11, 27, 'y').line(15, 19, 12, 22, 'w').line(16, 22, 12, 27, 'g');
    for (const [x, y] of [[4, 8], [23, 9], [5, 14], [22, 15]] as const) g.px(x, y, 'y').px(x + 1, y, 'g');
  },
  // Ferryman's Toll: the coin for the ferryman, a skull stamped on it
  ferrymanstoll: (g) => {
    g.ellipse(13.5, 13.5, 11, 11, 'G').ellipse(13.5, 13, 10, 10, 'g').ellipse(13.5, 13.5, 8, 8, 'G').ellipse(13.5, 13, 7.5, 7.5, 'g');
    g.ellipse(13.5, 12, 4.5, 4, 't').rect(11, 14, 6, 3, 't').rect(11, 11, 2, 2, 'e').rect(15, 11, 2, 2, 'e').px(13, 14, 'e').px(14, 14, 'e');
    g.px(12, 17, 'T').px(14, 17, 'T').px(16, 17, 'T');
    g.spans([[4, 9, 12], [5, 7, 9], [6, 6, 7]], 'y').px(20, 21, 'h').px(21, 20, 'h');
  },
  // Grave Sight: an eye opens on a gravestone
  gravesight: (g) => {
    g.spans([[3, 10, 17], [4, 8, 19], [5, 7, 20], [6, 6, 21]], 'm').rect(6, 7, 16, 17, 'm').rect(18, 4, 4, 20, 'k').rect(6, 22, 16, 2, 'k');
    g.rect(3, 24, 22, 3, 'V').rect(3, 24, 22, 1, 'v').px(5, 23, 'v').px(22, 23, 'v');
    g.spans([[11, 10, 17], [12, 9, 18], [13, 8, 19], [14, 8, 19], [15, 9, 18], [16, 10, 17]], 'w');
    g.ellipse(13.5, 13.5, 2.5, 2.5, 'c').rect(13, 13, 2, 2, 'e').px(12, 12, 'w');
    g.line(9, 18, 18, 18, 'k').px(8, 8, 'n').px(9, 7, 'n');
  },
  // Bell Frenzy: a bell swinging wildly
  bellfrenzy: (g) => {
    g.rect(13, 2, 2, 2, 'G').spans([[4, 11, 16], [5, 10, 17], [6, 9, 18], [7, 9, 18], [8, 8, 19], [9, 8, 19], [10, 8, 19], [11, 8, 19], [12, 8, 19], [13, 7, 20], [14, 7, 20], [15, 6, 21], [16, 5, 22], [17, 4, 23]], 'g');
    g.spans([[6, 16, 18], [8, 17, 19], [10, 17, 19], [12, 17, 19], [14, 18, 20], [16, 19, 22], [17, 20, 23]], 'G');
    g.rect(4, 18, 20, 2, 'G').rect(10, 6, 2, 8, 'y').ellipse(13.5, 21, 2, 1.5, 'h');
    g.line(2, 8, 2, 14, 'y').line(4, 6, 4, 10, 'g').line(25, 8, 25, 14, 'y').line(23, 6, 23, 10, 'g');
    g.line(1, 18, 3, 22, 'y').line(26, 18, 24, 22, 'y');
  },
  // Tap: a fist with a burst of impact
  tap: (g) => {
    for (const [x, y] of [[22, 4], [25, 9], [20, 2], [26, 14]] as const) g.px(x, y, 'y');
    g.line(19, 6, 24, 1, 'y').line(21, 9, 26, 6, 'g').line(22, 12, 26, 12, 'y');
    g.rect(6, 9, 13, 11, 's').rect(6, 7, 3, 4, 's').rect(9, 6, 3, 4, 's').rect(12, 6, 3, 4, 's').rect(15, 7, 3, 4, 's');
    g.rect(6, 10, 12, 1, 'S').line(8, 7, 8, 10, 'S').line(11, 6, 11, 10, 'S').line(14, 6, 14, 10, 'S').rect(3, 14, 4, 5, 's').rect(3, 18, 4, 1, 'S');
    g.rect(7, 20, 11, 6, 'l').rect(7, 20, 11, 1, 'L').rect(7, 24, 11, 1, 'G');
    g.px(10, 7, 'w').px(13, 7, 'w').px(7, 12, 'w');
  },
  // Crit: a target split by a blade
  crit: (g) => {
    g.ellipse(13.5, 13.5, 11, 11, 'w').ellipse(13.5, 13.5, 9, 9, 'r').ellipse(13.5, 13.5, 6.5, 6.5, 'w').ellipse(13.5, 13.5, 4, 4, 'r').ellipse(13.5, 13.5, 1.5, 1.5, 'y');
    g.line(3, 24, 24, 3, 'n').line(4, 24, 25, 3, 'm').line(2, 23, 23, 2, 'w').px(25, 2, 'w');
    g.spans([[20, 19, 22], [21, 20, 23], [22, 21, 24]], 'R');
  },
  // Gold: a heap of coins
  gold: (g) => {
    for (const [x, y] of [[8, 21], [15, 21], [21, 21], [11, 17], [18, 17], [14, 13], [9, 12], [19, 10]] as const) {
      g.ellipse(x, y, 4, 2.5, 'G').ellipse(x, y - 1, 4, 2.5, 'g').rect(x - 1, y - 2, 2, 1, 'y');
    }
    g.ellipse(14, 7, 3.5, 3.5, 'g').ellipse(14, 7, 2, 2, 'G').px(13, 5, 'y').px(14, 7, 'y');
    g.px(4, 6, 'y').px(24, 5, 'y').px(5, 14, 'w');
  },
  // Boss damage: a crowned skull
  bossdmg: (g) => {
    g.spans([[2, 7, 8], [2, 13, 14], [2, 19, 20], [3, 7, 9], [3, 12, 15], [3, 18, 20], [4, 7, 20], [5, 7, 20], [6, 7, 20]], 'g').rect(7, 6, 14, 1, 'G').px(13, 4, 'r').px(14, 4, 'r');
    g.ellipse(13.5, 14, 8, 7, 't').rect(9, 18, 10, 5, 't').rect(19, 10, 2, 9, 'T').rect(9, 22, 10, 1, 'T');
    g.rect(9, 12, 4, 4, 'e').rect(15, 12, 4, 4, 'e').px(10, 13, 'r').px(11, 13, 'r').px(16, 13, 'r').px(17, 13, 'r').px(13, 17, 'e').px(14, 17, 'e');
    g.px(10, 20, 'e').px(12, 20, 'e').px(14, 20, 'e').px(16, 20, 'e').px(18, 20, 'e').px(9, 9, 'w');
  },
};

export const ICON32_SAMPLES: { id: string; name: string; group: string; frame: string; old: string }[] = [
  { id: 'twinfang', name: 'Twinfang', group: 'Skill', frame: 'phys', old: 'twin' },
  { id: 'widowskiss', name: "Widow's Kiss", group: 'Skill', frame: 'poison', old: 'venom' },
  { id: 'cutdeep', name: 'Cut Deep', group: 'Skill', frame: 'blood', old: 'star' },
  { id: 'nightfall', name: 'Nightfall Flurry', group: 'Skill', frame: 'magic', old: 'strike' },
  { id: 'lanternstrike', name: 'Lantern Strike', group: 'Spell', frame: 'lightning', old: 'lantern' },
  { id: 'ferrymanstoll', name: "Ferryman's Toll", group: 'Spell', frame: 'gold', old: 'toll' },
  { id: 'gravesight', name: 'Grave Sight', group: 'Spell', frame: 'magic', old: 'sight' },
  { id: 'bellfrenzy', name: 'Bell Frenzy', group: 'Spell', frame: 'gold', old: 'frenzy' },
  { id: 'tap', name: 'Tap', group: 'Stat', frame: 'stat', old: 'fist' },
  { id: 'crit', name: 'Crit', group: 'Stat', frame: 'stat', old: 'eye' },
  { id: 'gold', name: 'Gold', group: 'Stat', frame: 'stat', old: 'coin' },
  { id: 'bossdmg', name: 'Boss damage', group: 'Stat', frame: 'stat', old: 'skull' },
];

/** A bevelled frame: dark rim, coloured edge, lit top-left, shaded bottom-right, tinted ground. */
function paintFrame(ctx: CanvasRenderingContext2D, col: string) {
  const px = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  px(1, 0, 30, 32, '#0c080b'); px(0, 1, 32, 30, '#0c080b');
  px(1, 1, 30, 30, col);
  px(2, 2, 28, 28, mix(col, '#100b10', 0.82));
  for (let y = 2; y < 30; y++) px(2, y, 28, 1, mix(col, '#100b10', 0.7 + (y / 30) * 0.22));
  px(1, 1, 30, 1, mix(col, '#fff6e0', 0.45)); px(1, 1, 1, 30, mix(col, '#fff6e0', 0.3));
  px(1, 30, 30, 1, mix(col, '#100b10', 0.45)); px(30, 1, 1, 30, mix(col, '#100b10', 0.35));
  px(1, 1, 1, 1, '#0c080b'); px(30, 1, 1, 1, '#0c080b'); px(1, 30, 1, 1, '#0c080b'); px(30, 30, 1, 1, '#0c080b');
}

export function icon32(id: string, frame: string, size = 32): string {
  const col = FRAME[frame] ?? FRAME.stat;
  const src = dataUrl(`i32:${id}:${col}`, 32, 32, (ctx) => {
    paintFrame(ctx, col);
    const g = new Grid(28, 28);
    (ART[id] ?? ((x: Grid) => x.ellipse(13.5, 13.5, 8, 8, 'g')))(g);
    g.outline('o');
    draw(ctx, g.sprite(P), 2, 2);
  });
  return `<img class="px-ic px32" src="${src}" width="${size}" height="${size}" alt="" draggable="false">`;
}
