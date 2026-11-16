// The Named (ghostly dead of Lanternfall, one prop each) and pets (12 bodies), 16 x 16, facing right.
// T / t / u is the element channel, exactly like the rarity channel on the hero.
import { Grid, type Sprite, bobFrame, mix } from './core';
import { SAMPLE } from './sample-sprites';

// ---------------------------------------------------------------- Named
function named(look: string): Sprite {
  const g = new Grid(16, 16);
  // ghost body with tattered hem
  g.ellipse(7, 6, 4, 4, 'a');
  g.spans([[9, 3, 11], [10, 3, 11], [11, 3, 11], [12, 4, 10], [13, 4, 10]], 'a');
  for (let x = 4; x <= 10; x++) if (x % 2 === 0) g.px(x, 14, 'A');
  g.spans([[3, 4, 5], [4, 3, 4], [5, 3, 3]], 'i');
  g.rect(3, 6, 1, 7, 'A').rect(4, 12, 7, 1, 'A');
  g.rect(3, 10, 9, 1, 'T').px(4, 11, 't').px(10, 11, 't');
  g.px(7, 6, 'w').px(8, 6, 'e').px(10, 6, 'w').px(11, 6, 'e').px(8, 7, 'e').px(11, 7, 'e').px(9, 9, 'p');
  g.px(11, 9, 'a').px(12, 9, 'a');
  switch (look) {
    case 'spade':
      g.rect(5, 2, 6, 1, 'L').rect(4, 1, 6, 1, 'l');
      g.line(13, 1, 13, 11, 'l').rect(12, 12, 3, 3, 'm').px(14, 14, 'M'); break;
    case 'lamp':
      g.spans([[1, 5, 9], [2, 4, 10]], 'h').px(13, 8, 'G').rect(12, 9, 3, 1, 'G').rect(12, 10, 3, 3, 'u').px(13, 11, 'w').rect(12, 13, 3, 1, 'G'); break;
    case 'monk':
      g.spans([[1, 5, 9], [2, 3, 11], [3, 3, 11], [4, 3, 4], [5, 3, 3]], 'c').rect(3, 6, 1, 4, 'c');
      g.rect(12, 7, 2, 2, 'a').px(13, 7, 'i'); break;
    case 'archer':
      g.spans([[2, 4, 9], [3, 3, 5]], 'h').line(2, 3, 1, 7, 'h');
      g.spans([[1, 12, 12], [2, 13, 13], [3, 14, 14], [4, 14, 14], [5, 14, 14], [6, 14, 14], [7, 14, 14], [8, 14, 14], [9, 14, 14], [10, 13, 13], [11, 12, 12]], 'l').line(12, 1, 12, 11, 'n'); break;
    case 'spear':
      g.spans([[1, 5, 9], [2, 4, 10]], 'm').px(5, 1, 'n');
      g.line(13, 3, 13, 14, 'l').spans([[0, 13, 13], [1, 12, 14], [2, 13, 13]], 'n').px(13, 4, 'T'); break;
    case 'nun':
      g.spans([[1, 4, 10], [2, 3, 11], [3, 3, 11]], 'k').rect(2, 4, 2, 9, 'k').rect(3, 4, 9, 1, 'w');
      g.rect(11, 8, 3, 3, 'T').rect(12, 9, 1, 1, 'w'); break;
    case 'thief':
      g.spans([[1, 5, 9], [2, 3, 11], [3, 3, 11], [4, 3, 5], [5, 3, 4]], 'k').rect(6, 8, 6, 1, 'k');
      g.line(13, 6, 13, 10, 'n').px(13, 11, 'G').px(12, 11, 'G').px(14, 11, 'G').px(13, 12, 'l');
      for (let y = 4; y < 14; y++) for (let x = 3; x < 7; x++) if (g.get(x, y) === 'a' && (x + y) % 2 === 0) g.px(x, y, 'A'); break;
    case 'oar':
      g.spans([[2, 4, 9], [3, 3, 4]], 'h');
      g.line(14, 0, 11, 11, 'l').rect(9, 11, 3, 4, 'l').px(10, 12, 'L').px(10, 13, 'L'); break;
    case 'captain':
      g.spans([[0, 6, 8], [1, 3, 11], [2, 2, 12], [3, 4, 10]], 'k').rect(4, 3, 7, 1, 'G').px(7, 1, 'w');
      g.line(12, 10, 15, 6, 'n').px(12, 11, 'G').px(11, 10, 'G'); g.spans([[8, 6, 10], [9, 7, 9]], 'm'); break;
    case 'abbot':
      g.spans([[1, 5, 9], [2, 4, 10]], 'G').px(7, 0, 'G');
      g.line(13, 3, 13, 14, 'G').spans([[0, 12, 14], [1, 11, 11], [1, 15, 15], [2, 15, 15], [3, 14, 14]], 'G').px(13, 1, 'u'); break;
    default:
      g.px(13, 8, 'G').rect(12, 9, 3, 3, 'u');
  }
  g.outline();
  return g.sprite({
    a: '#c3d3d6', A: '#7d95a0', i: '#eef6f2', e: '#221a22', w: '#f6ecd4', p: '#9aaab0',
    l: '#7a5436', L: '#4a3226', m: '#a9a49c', M: '#69646a', n: '#e2ddd0', G: '#c89a3a', h: '#8a9aa6', c: '#6a5444', k: '#2e2a36',
    T: '#9d9d9d', t: '#5f5f5f', u: '#d2d2d2',
  });
}

const namedCache = new Map<string, [Sprite, Sprite]>();
export function namedSprites(look: string): [Sprite, Sprite] {
  let p = namedCache.get(look);
  if (!p) { const a = named(look); p = [a, bobFrame(a, 12)]; namedCache.set(look, p); }
  return p;
}

// ---------------------------------------------------------------- pets
export const PET_BODIES = ['crow', 'wisp', 'hound', 'rat', 'moth', 'cat', 'toad', 'skull', 'snake', 'owl', 'bat', 'spider'] as const;
export const PET_FLYERS = new Set(['crow', 'wisp', 'moth', 'skull', 'owl', 'bat']);

function flipSprite(s: Sprite): Sprite { return { ...s, rows: s.rows.map((r) => r.split('').reverse().join('')) }; }

function pet(body: string, ph: number): Sprite {
  const g = new Grid(16, 16);
  const pal: Record<string, string> = { b: '#4a4250', B: '#2e2834', k: '#6a6072', e: '#221a22', w: '#f6ecd4', j: '#d9cfb4', J: '#a3967b', r: '#c97b70', y: '#fff2ae' };
  switch (body) {
    case 'wisp':
      g.ellipse(8, 9, 4, 4, 'T').spans([[4, 7, 9], [3, 8 - ph, 9 - ph], [2, 8 - ph, 8 - ph]], 'T').ellipse(8, 9, 2.5, 2.5, 'u').ellipse(8, 10, 1, 1, 'w');
      g.px(7, 9, 'e').px(10, 9, 'e').px(5 + ph, 14, 't').px(11 - ph, 14, 't'); break;
    case 'hound':
      g.rect(3, 8, 8, 4, 'b').rect(3, 11, 8, 1, 'B').ellipse(12, 7, 2.5, 2, 'b').rect(13, 8, 3, 2, 'k').px(15, 8, 'e');
      g.px(11, 4, 'B').px(11, 5, 'b').px(12, 5, 'B');
      g.rect(4, 12, 1, 2 + ph, 'B').rect(6, 12, 1, 3 - ph, 'b').rect(9, 12, 1, 3 - ph, 'B').rect(10, 12, 1, 2 + ph, 'b');
      g.line(3, 8, 1, 5 - ph, 'b').px(12, 6, 'T').rect(10, 9, 1, 2, 'T').px(6, 9, 'j').px(7, 9, 'j').px(8, 9, 'j'); break;
    case 'rat':
      g.ellipse(7, 11, 4, 2.5, 'b').ellipse(11, 11, 2, 1.5, 'b').rect(12, 11, 2, 1, 'k').px(14, 11, 'r').px(10, 8, 'k').px(10, 9, 'b');
      g.px(11, 10, 'T').line(3, 12, 1, 9 + ph, 'r').px(5, 14, 'B').px(9, 14, 'B'); break;
    case 'moth':
      g.ellipse(6, 6 + ph, 4, 3.5 - ph, 'b').ellipse(6, 11, 3, 2.5, 'k').px(5, 6 + ph, 'T').px(6, 6 + ph, 'T').px(4, 11, 'T').px(4, 5 + ph, 'u');
      g.rect(9, 6, 2, 7, 'B').px(10, 5, 'B').line(10, 5, 13, 2, 'B').line(11, 5, 14, 4, 'B').px(10, 7, 'T'); break;
    case 'cat':
      g.ellipse(7, 10, 3.5, 4, 'b').ellipse(10, 6, 3, 2.5, 'b').spans([[3, 8, 8], [3, 12, 12], [2, 8, 8], [2, 12, 12]], 'b');
      g.px(9, 6, 'T').px(11, 6, 'T').px(10, 7, 'r').line(4, 13, 1, 11 - ph, 'B').line(1, 11 - ph, 2, 8 - ph, 'B').rect(6, 14, 2, 1, 'B').rect(9, 14, 2, 1, 'B'); break;
    case 'toad':
      g.ellipse(8, 11, 5.5, 3.5, 'b').ellipse(8, 12, 4, 2, 'k').ellipse(5, 8, 1.5, 1.5, 'b').ellipse(11, 8, 1.5, 1.5, 'b');
      g.px(5, 8, 'T').px(11, 8, 'T').px(4, 10, 't').px(12, 10, 't').px(8, 9, 't').rect(6, 12 + ph, 5, 1, 'B'); break;
    case 'skull':
      g.ellipse(8, 7, 4.5, 4, 'j').rect(5, 10, 6, 3, 'j').rect(9, 4, 3, 2, 'w');
      g.rect(5, 7, 2, 2, 'e').rect(9, 7, 2, 2, 'e').px(6, 8, 'T').px(10, 8, 'T').px(8, 10, 'e').px(6, 12, 'J').px(8, 12, 'J').px(10, 12, 'J');
      g.px(4 + ph, 14, 't').px(11 - ph, 14, 't'); break;
    case 'snake':
      g.ellipse(6, 12, 5, 2.5, 'b').ellipse(6, 12, 2.5, 1, 'B').line(10, 11, 11, 6, 'b').line(11, 11, 12, 6, 'b').ellipse(12, 5, 2, 1.5, 'b');
      g.px(13, 4, 'T').px(15, 6 - ph, 'r').px(14, 6, 'r');
      for (let x = 2; x < 11; x += 3) g.px(x, 11, 'T'); break;
    case 'owl':
      g.ellipse(8, 9, 4.5, 5, 'b').ellipse(8, 7, 3.5, 2.5, 'w').spans([[3, 4, 4], [3, 12, 12], [2, 4, 4], [2, 12, 12]], 'b');
      g.px(6, 7, 'T').px(10, 7, 'T').px(6, 7, 'T').px(7, 8, 'e').px(11, 8, 'e').px(8, 9, 'J').rect(4, 10 + ph, 2, 3, 'B').rect(11, 10 + ph, 2, 3, 'B').rect(6, 14, 1, 1, 'J').rect(9, 14, 1, 1, 'J'); break;
    case 'bat':
      g.ellipse(8, 8, 2, 2.5, 'b').px(7, 5, 'b').px(9, 5, 'b');
      if (ph === 0) { g.spans([[6, 2, 5], [7, 1, 6], [8, 1, 6], [9, 2, 3], [9, 5, 5], [6, 11, 14], [7, 10, 15], [8, 10, 15], [9, 13, 14], [9, 11, 11]], 'k'); }
      else { g.spans([[8, 2, 6], [9, 1, 6], [10, 1, 3], [11, 1, 1], [8, 10, 14], [9, 10, 15], [10, 13, 15], [11, 15, 15]], 'k'); }
      g.px(7, 8, 'T').px(9, 8, 'T').px(8, 10, 'w'); break;
    case 'spider':
      for (let i = 0; i < 4; i++) { const x = 5 + i * 2; g.line(x, 10, x - 3 + i, 6 + ph, 'B').line(x - 3 + i, 6 + ph, x - 4 + i * 2, 14, 'B'); }
      g.ellipse(6, 10, 3.5, 2.5, 'b').ellipse(10, 11, 2, 2, 'k').px(11, 10, 'T').px(12, 11, 'T').px(11, 12, 'T').px(5, 9, 't').px(6, 10, 't').px(7, 9, 't'); break;
  }
  g.outline();
  return g.sprite(pal);
}

const petCache = new Map<string, [Sprite, Sprite]>();
/** Pet frames with the element colour on the T channel and the body pulled slightly toward it. */
export function petSprites(body: string, elementCol: string): [Sprite, Sprite] {
  const key = body + elementCol;
  let p = petCache.get(key);
  if (p) return p;
  let a: Sprite, b: Sprite;
  if (body === 'crow' || !PET_BODIES.includes(body as typeof PET_BODIES[number])) {
    a = flipSprite(SAMPLE.pet_crow); b = flipSprite(SAMPLE.pet_crow_b);
    const over = { p: elementCol, g: mix(elementCol, '#fff6e0', 0.5) };
    a = { ...a, palette: { ...a.palette, ...over } }; b = { ...b, palette: { ...b.palette, ...over } };
  } else {
    const t = (s: Sprite): Sprite => {
      const pal: Record<string, string> = { ...s.palette, T: elementCol, t: mix(elementCol, '#140f14', 0.45), u: mix(elementCol, '#fff6e0', 0.45) };
      for (const k of ['b', 'B', 'k']) pal[k] = mix(pal[k], elementCol, 0.18);
      return { ...s, palette: pal };
    };
    a = t(pet(body, 0)); b = t(pet(body, 1));
  }
  p = [a, b];
  petCache.set(key, p);
  return p;
}

/** The fairy: a small glowing wisp. */
export const FAIRY: [Sprite, Sprite] = (() => {
  const mk = (ph: number) => {
    const g = new Grid(11, 11);
    g.ellipse(5, 5, 2, 2, 'y').px(5, 5, 'w').px(5, 2 - ph, 'g').px(5, 8 + ph, 'g').px(2 - ph, 5, 'g').px(8 + ph, 5, 'g');
    g.px(3, 3, 'g').px(7, 3, 'g').px(3, 7, 'g').px(7, 7, 'g');
    if (ph) g.px(5, 0, 'G').px(0, 5, 'G').px(10, 5, 'G').px(5, 10, 'G');
    return g.sprite({ y: '#fff2ae', w: '#ffffff', g: '#e9d070', G: '#a8902a' });
  };
  return [mk(0), mk(1)];
})();
