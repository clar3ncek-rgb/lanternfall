// 24 px pixel icons (spells, items, pets) and the hero portrait, as cached data-URL PNG <img> tags.
import { Grid, type Sprite, dataUrl, draw, escAttr, hash } from './core';
import { petSprites } from './allies';
import { type HeroLook, heroSprite, heroSig } from './hero';
import { elementColor, rarityColor } from './palette';

const BASE: Record<string, string> = {
  m: '#a9a49c', M: '#69646a', n: '#e2ddd0', l: '#7a5436', L: '#4a3226', g: '#e9b949', G: '#a8752a', y: '#fff2ae',
  w: '#f6ecd4', e: '#221a22', a: '#c3d3d6', A: '#7d95a0', s: '#e8b995', S: '#b57a5e', r: '#c0402a', R: '#7a2418',
  b: '#3f8fe0', c: '#5a4a6a', C: '#3a2e46', v: '#3fbf4a', f: '#f08a24', k: '#3a3436', i: '#9fe8ff',
};
const img = (src: string, size: number, cls: string, extra = '') => `<img class="${cls}" src="${src}" width="${size}" height="${size}" alt="" draggable="false"${extra}>`;
const paintSprite = (s: Sprite, ox = 0, oy = 0) => (g: CanvasRenderingContext2D) => draw(g, s, ox, oy);

// ---------------------------------------------------------------- spells
function spellGrid(kind: string): Grid {
  const g = new Grid(24, 24);
  switch (kind) {
    case 'sword':
      // a sword falling point-first, with motion lines
      g.rect(10, 1, 4, 2, 'g').rect(11, 3, 2, 3, 'L').rect(7, 6, 10, 1, 'g').rect(8, 7, 8, 1, 'G');
      g.rect(11, 8, 1, 12, 'n').rect(12, 8, 1, 12, 'm').px(11, 20, 'n').px(11, 21, 'n');
      for (const x of [4, 7, 16, 19]) g.line(x, 1 + (x % 3), x, 7 + (x % 3), 'y');
      g.rect(8, 22, 8, 1, 'L');
      break;
    case 'coin':
      g.ellipse(11.5, 11.5, 8, 8, 'g').ellipse(11.5, 11.5, 6, 6, 'G').ellipse(11.5, 11.5, 5, 5, 'g');
      g.rect(9, 9, 2, 2, 'e').rect(13, 9, 2, 2, 'e').px(9, 9, 'f').rect(10, 14, 4, 1, 'G').px(11, 12, 'G').px(12, 12, 'G').spans([[5, 9, 11], [6, 8, 9]], 'y');
      break;
    case 'eye':
      g.spans([[3, 8, 15], [4, 6, 17], [5, 5, 18]], 'm').rect(4, 6, 16, 16, 'm').rect(17, 4, 3, 18, 'M').rect(4, 21, 16, 1, 'M');
      g.spans([[11, 7, 16], [12, 6, 17], [13, 6, 17], [14, 7, 16]], 'w').ellipse(11.5, 12.5, 2, 1.5, 'b').rect(11, 12, 2, 2, 'e').px(11, 12, 'y');
      g.rect(5, 18, 2, 2, 'v').rect(17, 17, 2, 3, 'v');
      break;
    case 'banner':
      g.rect(5, 2, 1, 20, 'l').px(5, 1, 'g').rect(6, 3, 13, 9, 'r').rect(6, 3, 13, 1, 'g');
      g.spans([[12, 6, 18], [13, 6, 9], [13, 15, 18], [14, 6, 7], [14, 17, 18]], 'r').rect(11, 5, 2, 5, 'g').rect(9, 6, 6, 2, 'g');
      g.ellipse(14, 18, 3, 3, 'a').px(13, 18, 'e').px(15, 18, 'e').ellipse(19, 19, 2.5, 2.5, 'A');
      break;
    case 'fist':
      g.rect(6, 8, 11, 9, 's').rect(6, 8, 11, 1, 'S').rect(9, 8, 1, 4, 'S').rect(12, 8, 1, 4, 'S').rect(15, 8, 1, 4, 'S');
      g.rect(5, 12, 4, 4, 's').rect(5, 15, 4, 1, 'S').rect(8, 17, 8, 4, 'l').rect(8, 17, 8, 1, 'L');
      for (const [x, y] of [[3, 4], [19, 5], [2, 18], [20, 17], [11, 3]]) g.px(x, y, 'y').px(x + 1, y, 'f');
      break;
    case 'echo':
      for (const [ox, col, sh] of [[0, 'A', 'A'], [6, 'a', 'A']] as [number, string, string][]) {
        g.rect(4 + ox, 9, 8, 8, col).rect(4 + ox, 5, 2, 5, col).rect(7 + ox, 4, 2, 6, col).rect(10 + ox, 5, 2, 5, col).rect(13 + ox, 9, 2, 4, col);
        g.spans([[17, 5 + ox, 10 + ox], [18, 6 + ox, 9 + ox], [19, 7 + ox, 8 + ox]], sh);
      }
      g.px(20, 4, 'i').px(21, 6, 'i').px(2, 20, 'i');
      break;
    case 'lantern':
      g.rect(11, 1, 2, 2, 'G').rect(8, 3, 8, 2, 'G').rect(8, 5, 8, 10, 'g').rect(9, 6, 6, 8, 'y').rect(11, 8, 2, 4, 'w').rect(8, 15, 8, 2, 'G');
      for (const [x, y] of [[3, 6], [20, 7], [4, 15], [19, 15], [11, 20], [2, 11], [21, 11]]) g.px(x, y, 'f');
      g.line(5, 9, 3, 9, 'y').line(18, 9, 20, 9, 'y').line(9, 18, 7, 20, 'y').line(14, 18, 16, 20, 'y');
      break;
    case 'bell':
      g.spans([[3, 10, 13], [4, 9, 14], [5, 8, 15], [6, 8, 15], [7, 8, 15], [8, 7, 16], [9, 7, 16], [10, 7, 16], [11, 7, 16], [12, 6, 17], [13, 6, 17], [14, 5, 18], [15, 4, 19]], 'g');
      g.rect(14, 4, 2, 11, 'G').rect(4, 16, 16, 1, 'G').rect(11, 17, 2, 2, 'G').px(11, 1, 'G').px(12, 2, 'G').px(9, 6, 'y').px(9, 8, 'y');
      g.line(2, 6, 4, 10, 'n').line(21, 6, 19, 10, 'n').line(1, 12, 2, 15, 'n').line(22, 12, 21, 15, 'n');
      break;
    case 'flame':
      g.spans([[3, 12, 12], [4, 11, 13], [5, 10, 14], [6, 10, 15], [7, 9, 15], [8, 8, 16], [9, 7, 16], [10, 7, 17], [11, 6, 17], [12, 6, 18], [13, 6, 18], [14, 6, 18], [15, 6, 17], [16, 7, 17], [17, 8, 16], [18, 9, 15]], 'r');
      g.spans([[9, 11, 13], [10, 10, 14], [11, 10, 15], [12, 9, 15], [13, 9, 15], [14, 9, 15], [15, 10, 14], [16, 10, 14]], 'f').ellipse(12, 14, 1.5, 2, 'y');
      break;
    case 'frost':
      g.line(12, 2, 12, 21, 'i').line(3, 7, 21, 16, 'i').line(3, 16, 21, 7, 'i');
      for (const [x, y] of [[12, 2], [12, 21], [3, 7], [21, 16], [3, 16], [21, 7]]) g.px(x - 1, y, 'w').px(x + 1, y, 'w');
      g.ellipse(12, 11.5, 2, 2, 'w');
      break;
    case 'bolt':
      g.spans([[2, 13, 16], [3, 12, 15], [4, 11, 14], [5, 10, 13], [6, 9, 12], [7, 8, 11], [8, 7, 16], [9, 8, 15], [10, 11, 14], [11, 10, 13], [12, 9, 12], [13, 8, 11], [14, 7, 10], [15, 6, 9], [16, 6, 8], [17, 5, 7], [18, 5, 6], [19, 4, 5]], 'y');
      g.spans([[8, 13, 16], [9, 13, 15]], 'g');
      break;
    case 'drop':
      g.spans([[3, 11, 12], [4, 11, 12], [5, 10, 13], [6, 10, 13], [7, 9, 14], [8, 8, 15], [9, 7, 16], [10, 7, 16], [11, 6, 17], [12, 6, 17], [13, 6, 17], [14, 6, 17], [15, 6, 17], [16, 7, 16], [17, 8, 15], [18, 9, 14]], 'v');
      g.rect(8, 11, 2, 4, 'w').px(9, 10, 'w');
      break;
    case 'shield':
      g.spans([[3, 5, 18], [4, 4, 19], [5, 4, 19], [6, 4, 19], [7, 4, 19], [8, 4, 19], [9, 4, 19], [10, 4, 19], [11, 4, 19], [12, 5, 18], [13, 5, 18], [14, 6, 17], [15, 7, 16], [16, 8, 15], [17, 9, 14], [18, 10, 13], [19, 11, 12]], 'm');
      g.spans([[5, 6, 17], [6, 6, 17], [7, 6, 17], [8, 6, 17], [9, 6, 17], [10, 6, 17], [11, 6, 17], [12, 7, 16], [13, 7, 16], [14, 8, 15], [15, 9, 14], [16, 10, 13], [17, 11, 12]], 'b');
      g.rect(11, 6, 2, 10, 'g').rect(8, 9, 8, 2, 'g');
      break;
    case 'clock':
      g.rect(6, 2, 12, 2, 'G').rect(6, 20, 12, 2, 'G').rect(7, 4, 1, 16, 'l').rect(16, 4, 1, 16, 'l');
      g.spans([[4, 8, 15], [5, 8, 15], [6, 9, 14], [7, 9, 14], [8, 10, 13], [9, 11, 12], [10, 11, 12], [11, 11, 12], [12, 10, 13], [13, 10, 13], [14, 9, 14], [15, 9, 14], [16, 8, 15], [17, 8, 15], [18, 8, 15], [19, 8, 15]], 'a');
      g.spans([[5, 9, 14], [6, 10, 13], [7, 10, 13], [8, 11, 12], [17, 9, 14], [18, 9, 14], [19, 9, 14], [16, 10, 13], [12, 11, 12], [13, 11, 12], [14, 11, 12], [15, 11, 12]], 'g');
      break;
    case 'skull':
      g.ellipse(11.5, 10, 7, 7, 'w').rect(7, 15, 10, 4, 'w').rect(7, 9, 3, 3, 'e').rect(14, 9, 3, 3, 'e').px(8, 10, 'r').px(15, 10, 'r');
      g.rect(11, 13, 2, 2, 'e').px(9, 18, 'e').px(11, 18, 'e').px(13, 18, 'e').px(15, 18, 'e');
      break;
    case 'book':
      g.rect(4, 4, 16, 16, 'c').rect(5, 5, 14, 14, 'C').rect(18, 5, 2, 14, 'w').rect(10, 8, 4, 6, 'g').rect(8, 10, 8, 2, 'g').rect(4, 4, 2, 2, 'g').rect(4, 18, 2, 2, 'g');
      break;
    case 'heart':
      g.ellipse(8, 9, 4, 4, 'r').ellipse(15, 9, 4, 4, 'r').spans([[11, 4, 19], [12, 5, 18], [13, 6, 17], [14, 7, 16], [15, 8, 15], [16, 9, 14], [17, 10, 13], [18, 11, 12]], 'r').px(7, 7, 'w').px(6, 8, 'w');
      break;
    case 'hand':
      g.rect(7, 10, 9, 8, 'a').rect(7, 4, 2, 7, 'a').rect(9, 3, 2, 8, 'a').rect(11, 3, 2, 8, 'a').rect(13, 4, 2, 7, 'a').rect(16, 9, 2, 4, 'a').rect(15, 11, 1, 1, 'a').rect(8, 18, 7, 3, 'A');
      for (const [x, y] of [[3, 5], [20, 4], [3, 15], [20, 16]]) g.ellipse(x, y, 1.5, 1.5, 'A').px(x, y, 'e');
      break;
    default: // a rune star
      g.line(12, 2, 12, 21, 'g').line(2, 12, 21, 12, 'g').line(5, 5, 18, 18, 'G').line(5, 18, 18, 5, 'G').ellipse(12, 12, 3, 3, 'y').px(12, 12, 'w');
  }
  return g;
}
function spellKind(hint: string): string {
  const h = hint.toLowerCase();
  const rules: [RegExp, string][] = [
    [/sword|blade|strike|falling/, 'sword'], [/coin|gold|toll/, 'coin'], [/eye|sight|see/, 'eye'], [/banner|flag|rally|call/, 'banner'],
    [/fist|frenzy|punch|rage/, 'fist'], [/echo|hands|twin|auto/, 'echo'], [/lantern|lamp/, 'lantern'], [/bell|ring|toll/, 'bell'],
    [/fire|flame|burn|ember/, 'flame'], [/frost|ice|snow|cold|freeze/, 'frost'], [/bolt|lightning|storm|spark/, 'bolt'],
    [/poison|drop|venom/, 'drop'], [/shield|ward|guard/, 'shield'], [/clock|hour|time|slow/, 'clock'], [/skull|death|bone/, 'skull'],
    [/book|tome|page/, 'book'], [/heart|life|heal/, 'heart'], [/hand|palm/, 'hand'],
  ];
  for (const [re, k] of rules) if (re.test(h)) return k;
  return 'star';
}
export function spellIcon(id: string, hint: string): string {
  const kind = spellKind(hint || id);
  const src = dataUrl('spell:' + kind, 24, 24, (g) => { const gr = spellGrid(kind); gr.outline(); draw(g, gr.sprite(BASE), 0, 0); });
  return img(src, 24, 'px-ic px-spell', ` data-icon="${escAttr(kind)}"`);
}

// ---------------------------------------------------------------- items
function itemGrid(slot: string, look: string): Grid {
  const g = new Grid(24, 24);
  const s = slot.replace(/[12]$/, '');
  const L = look.toLowerCase();
  switch (s) {
    case 'head':
      if (/hood|cowl/.test(L)) { g.ellipse(12, 12, 8, 9, 'c').ellipse(11, 14, 5, 6, 'e').rect(6, 8, 12, 1, 'T').spans([[3, 10, 13], [2, 11, 12]], 'c'); }
      else if (/mask/.test(L)) { g.ellipse(12, 12, 8, 9, 'T').rect(7, 10, 4, 2, 'e').rect(13, 10, 4, 2, 'e').rect(10, 16, 4, 1, 't').ellipse(12, 6, 4, 2, 'u'); }
      else { g.ellipse(12, 11, 8, 8, 'm').rect(4, 11, 16, 9, 'm').rect(4, 13, 16, 2, 'e').rect(11, 13, 2, 7, 'M').rect(4, 11, 16, 1, 'T').ellipse(9, 7, 2, 2, 'n').spans([[1, 10, 14], [2, 9, 15]], 'T'); }
      break;
    case 'neck':
      g.line(5, 3, 12, 13, 'G').line(19, 3, 12, 13, 'G').ellipse(12, 16, 4, 4, 'g').ellipse(12, 16, 2.5, 2.5, 'T').px(11, 15, 'u');
      break;
    case 'shoulders':
      g.ellipse(6, 11, 5, 5, 'm').ellipse(18, 11, 5, 5, 'm').rect(1, 11, 22, 4, 'm').rect(1, 15, 22, 2, 'T').rect(9, 9, 6, 4, 'l').px(5, 8, 'n').px(17, 8, 'n');
      break;
    case 'back':
      g.spans([[3, 8, 15], [4, 7, 16], [5, 6, 17], [6, 6, 17]], 'T');
      for (let y = 7; y < 21; y++) g.rect(6 - ((y - 7) >> 2), y, 12 + ((y - 7) >> 1), 1, 'c');
      g.rect(4, 20, 16, 1, 'T').px(11, 4, 'g').px(12, 4, 'g');
      break;
    case 'chest':
      g.spans([[3, 4, 8], [3, 15, 19], [4, 3, 20], [5, 2, 21], [6, 2, 21], [7, 2, 21], [8, 5, 18], [9, 5, 18]], 'c');
      g.rect(5, 10, 14, 11, 'c').rect(9, 3, 6, 3, 'e').rect(11, 6, 2, 15, 'T').rect(5, 20, 14, 1, 'T').rect(5, 15, 14, 1, 'L').px(2, 8, 'C').px(21, 8, 'C');
      break;
    case 'wrists':
      g.rect(4, 7, 7, 11, 'l').rect(13, 7, 7, 11, 'l').rect(4, 7, 7, 2, 'T').rect(13, 7, 7, 2, 'T').rect(4, 16, 7, 2, 'T').rect(13, 16, 7, 2, 'T').px(7, 12, 'g').px(16, 12, 'g');
      break;
    case 'hands':
      g.rect(6, 8, 10, 10, 'l').rect(6, 3, 2, 6, 'l').rect(9, 2, 2, 7, 'l').rect(12, 3, 2, 6, 'l').rect(16, 9, 3, 5, 'l').rect(6, 17, 10, 4, 'T').rect(6, 8, 10, 1, 'L');
      break;
    case 'waist':
      g.rect(1, 9, 22, 6, 'l').rect(1, 9, 22, 1, 'L').rect(9, 8, 6, 8, 'T').rect(11, 10, 2, 4, 'e').px(4, 12, 'G').px(19, 12, 'G');
      break;
    case 'legs':
      g.rect(5, 2, 14, 4, 'c').rect(5, 6, 6, 16, 'c').rect(13, 6, 6, 16, 'c').rect(5, 2, 14, 1, 'L').rect(5, 12, 6, 2, 'T').rect(13, 12, 6, 2, 'T').rect(11, 6, 2, 1, 'C');
      break;
    case 'feet':
      g.rect(6, 3, 7, 13, 'l').rect(6, 15, 14, 5, 'l').rect(6, 20, 15, 2, 'L').rect(6, 3, 7, 2, 'T').rect(6, 12, 7, 1, 'T').px(18, 16, 'T');
      break;
    case 'ring':
      g.ellipse(12, 14, 7, 7, 'g').ellipse(12, 14, 4.5, 4.5, '.').ellipse(12, 6, 3, 3, 'T').px(11, 5, 'u');
      g.cells[14][12] = '.';
      break;
    case 'trinket':
      g.ellipse(12, 13, 6, 8, 'j').ellipse(12, 9, 4, 3, 'J').rect(9, 9, 2, 2, 'e').rect(13, 9, 2, 2, 'e').rect(6, 16, 12, 2, 'T').px(12, 3, 'T').px(12, 2, 'g');
      break;
    case 'mainHand': {
      const k = /axe|cleaver/.test(L) ? 'axe' : /staff|rod|crook/.test(L) ? 'staff' : /bow/.test(L) ? 'bow' : /mace|flail|morning/.test(L) ? 'mace' : 'blade';
      if (k === 'blade') { g.line(5, 18, 18, 5, 'n').line(6, 18, 19, 5, 'm').line(4, 15, 8, 19, 'T').line(3, 20, 5, 18, 'L').px(2, 21, 'T'); }
      if (k === 'axe') { g.line(5, 21, 16, 4, 'l').spans([[3, 14, 19], [4, 14, 21], [5, 15, 21], [6, 16, 21], [7, 17, 21], [8, 17, 20]], 'm').line(19, 3, 22, 7, 'n').px(9, 15, 'T').px(10, 14, 'T'); }
      if (k === 'staff') { g.line(5, 22, 15, 6, 'l').ellipse(17, 4, 3, 3, 'T').ellipse(17, 4, 1.5, 1.5, 'u').px(17, 4, 'y'); }
      if (k === 'bow') { g.spans([[2, 6, 9], [3, 9, 12], [4, 12, 14], [5, 14, 15], [6, 15, 16], [7, 16, 17], [8, 17, 17], [9, 17, 18], [10, 18, 18], [11, 18, 18], [12, 18, 18], [13, 17, 18], [14, 17, 17], [15, 16, 17], [16, 15, 16], [17, 14, 15], [18, 12, 14], [19, 9, 12], [20, 6, 9]], 'l').line(6, 2, 6, 20, 'n').rect(17, 10, 2, 3, 'T'); }
      if (k === 'mace') { g.line(5, 21, 13, 10, 'l').ellipse(15, 7, 4, 4, 'm').px(15, 2, 'n').px(20, 7, 'n').px(15, 12, 'n').px(10, 6, 'n').px(14, 6, 'n').px(8, 16, 'T').px(9, 15, 'T'); }
      break;
    }
    case 'offHand': {
      const k = /shield|buckler|pavise/.test(L) ? 'shield' : /tome|grimoire|codex/.test(L) ? 'tome' : /quiver/.test(L) ? 'quiver' : /relic|reliquary|censer|symbol/.test(L) ? 'relic' : /blade|dagger|stiletto/.test(L) ? 'blade' : 'shield';
      if (k === 'shield') { g.spans([[3, 4, 19], [4, 3, 20], [5, 3, 20], [6, 3, 20], [7, 3, 20], [8, 3, 20], [9, 3, 20], [10, 3, 20], [11, 3, 20], [12, 4, 19], [13, 4, 19], [14, 5, 18], [15, 6, 17], [16, 7, 16], [17, 8, 15], [18, 9, 14], [19, 10, 13], [20, 11, 12]], 'T').spans([[5, 5, 18], [6, 5, 18], [7, 5, 18], [8, 5, 18], [9, 5, 18], [10, 5, 18], [11, 5, 18], [12, 6, 17], [13, 6, 17], [14, 7, 16], [15, 8, 15], [16, 9, 14], [17, 10, 13], [18, 11, 12]], 'R').rect(11, 6, 2, 10, 'g').rect(8, 9, 8, 2, 'g'); }
      if (k === 'tome') { g.rect(4, 3, 15, 18, 'T').rect(5, 4, 13, 16, 't').rect(18, 4, 2, 16, 'w').rect(9, 8, 5, 6, 'g').rect(10, 9, 3, 4, 't'); }
      if (k === 'quiver') { g.line(6, 21, 15, 5, 'l').line(7, 21, 16, 5, 'l').line(8, 21, 17, 5, 'L').line(13, 7, 17, 2, 'n').line(15, 8, 20, 4, 'n').px(17, 1, 'w').px(20, 3, 'w').px(11, 12, 'T').px(12, 12, 'T').px(10, 13, 'T'); }
      if (k === 'relic') { g.px(12, 2, 'G').rect(8, 4, 8, 2, 'T').rect(8, 6, 8, 11, 'G').rect(9, 7, 6, 9, 'y').rect(11, 9, 2, 5, 'g').rect(8, 17, 8, 2, 'T'); }
      if (k === 'blade') { g.line(5, 18, 15, 8, 'n').line(6, 18, 16, 8, 'm').line(4, 15, 8, 19, 'T').line(3, 20, 5, 18, 'L'); }
      break;
    }
    default:
      g.ellipse(12, 12, 6, 6, 'T');
  }
  return g;
}
export function itemIcon(slot: string, rarity: string, look?: string): string {
  const col = rarityColor(rarity);
  const src = dataUrl(`item:${slot}:${col}:${look ?? ''}`, 24, 24, (g) => {
    const gr = itemGrid(slot, look ?? ''); gr.outline();
    draw(g, gr.sprite({ ...BASE, j: '#d9cfb4', J: '#a3967b' }), 0, 0, 1, col);
  });
  return img(src, 24, 'px-ic px-item', ` style="--rc:${col}"`);
}

// ---------------------------------------------------------------- pets and the hero
export function petIcon(body: string, element: string): string {
  const col = elementColor(element);
  // trim the 16 px pet to its painted box and blow it up by the largest integer that fits 24 px
  const src = dataUrl(`pet:${body}:${col}`, 24, 24, (g) => {
    const s = petSprites(body, col)[0];
    let x0 = s.w, y0 = s.h, x1 = -1, y1 = -1;
    s.rows.forEach((row, y) => { for (let x = 0; x < s.w; x++) if (row[x] !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } });
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, sc = Math.max(1, Math.floor(24 / Math.max(bw, bh)));
    draw(g, s, Math.floor((24 - bw * sc) / 2) - x0 * sc, Math.floor((24 - bh * sc) / 2) - y0 * sc, sc);
  });
  return img(src, 24, 'px-ic px-pet');
}
export function heroPortrait(h: HeroLook, size: number): string {
  const key = 'hero:' + heroSig(h);
  const src = dataUrl(key, 34, 34, paintSprite(heroSprite(h, 'a'), 1, 1));
  return img(src, size, 'px-ic px-hero', ` data-sig="${hash(key)}"`);
}
