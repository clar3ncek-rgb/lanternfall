// Foes: the four approved sample foes plus code-built archetypes, chosen by name keyword.
// Every foe faces left (toward the hero). Each kind has two idle frames.
import { Grid, type Sprite, bobFrame, hash, mix, tintPalette } from './core';
import { realmTint } from './palette';
import { SAMPLE } from './sample-sprites';

export interface FoeLook {
  name: string; boss: boolean; land: number; realm?: string;
  treasure?: boolean; wanderer?: boolean; immune: string[]; weak: string[];
}
export interface FoeArt { a: Sprite; b: Sprite; fly: boolean; kind: string }

// ---------------------------------------------------------------- code-built archetypes
function robed(opts: { prop: 'bell' | 'candle' | 'book' | 'staff' | 'none' | 'chain'; c: string; C: string; k: string; eye: string }): [Sprite, Sprite] {
  const g = new Grid(32, 32);
  // robe body (widening toward the hem)
  for (let y = 14; y <= 30; y++) { const half = 5 + Math.floor((y - 14) / 3); g.rect(16 - half, y, half * 2 + 1, 1, 'c'); g.rect(16 + Math.ceil(half / 3), y, Math.floor(half * 2 / 3) + 1, 1, 'C'); }
  g.rect(9, 29, 16, 2, 'k').swap('k', 'c', 0, 30, 32, 1);
  for (let x = 9; x < 25; x += 3) g.px(x, 30, 'C');
  g.rect(12, 20, 9, 1, 'k').px(13, 21, 'k').px(13, 22, 'k');
  // hood with a shadowed face; eyes glow
  g.ellipse(16, 9, 6, 6, 'c').ellipse(18, 9, 4, 5, 'C');
  g.ellipse(13, 10, 3.2, 3.8, 'e');
  g.px(12, 10, 'y').px(15, 10, 'y').px(11, 10, 'f').px(14, 10, 'f');
  g.spans([[3, 15, 18], [2, 17, 19]], 'c');
  // front arm and hand
  g.line(13, 15, 9, 21, 'C').line(14, 15, 10, 21, 'C').line(12, 16, 8, 21, 'c');
  g.rect(7, 21, 3, 2, 's');
  switch (opts.prop) {
    case 'bell': g.line(8, 23, 8, 24, 'l').spans([[25, 6, 9], [26, 5, 10], [27, 5, 10], [28, 4, 11]], 'g').spans([[25, 9, 9], [26, 9, 10], [27, 9, 10], [28, 9, 11]], 'G').px(7, 29, 'G'); break;
    case 'candle': g.rect(8, 16, 1, 5, 'w').px(8, 15, 'f').px(8, 14, 'y').px(8, 13, 'f'); break;
    case 'book': g.rect(3, 19, 6, 5, 'k').rect(4, 20, 4, 3, 'w').px(6, 21, 'e'); break;
    case 'staff': g.line(8, 4, 8, 30, 'l').px(8, 3, 'y').px(7, 3, 'f').px(9, 3, 'f').px(8, 2, 'f'); break;
    case 'chain': g.line(9, 23, 6, 29, 'm').spans([[27, 2, 6], [28, 1, 7], [29, 1, 7]], 'g').px(4, 30, 'G'); break;
    case 'none': g.rect(6, 20, 4, 3, 's').px(6, 20, 'S'); break;
  }
  g.outline();
  const pal = { c: opts.c, C: opts.C, k: opts.k, e: '#0f0b10', y: '#fff2ae', f: opts.eye, s: '#b8ae9e', S: '#8a8070', w: '#e8dcc0', l: '#6a4a30', g: '#c89a3a', G: '#7a5a20', m: '#8a8690' };
  const a = g.sprite(pal);
  return [a, bobFrame(a, 28)];
}

function knight(c: string, k: string): [Sprite, Sprite] {
  const g = new Grid(32, 32);
  g.rect(11, 22, 4, 7, 'M').rect(17, 22, 4, 7, 'M').rect(10, 29, 5, 2, 'M').rect(16, 29, 5, 2, 'M').rect(12, 22, 1, 7, 'm');
  g.rect(10, 12, 12, 10, 'm').rect(18, 12, 4, 10, 'M').rect(13, 13, 5, 11, 'k').rect(13, 23, 5, 1, 'K');
  g.ellipse(11, 13, 2.5, 2, 'n').ellipse(21, 13, 2.5, 2, 'm');
  g.spans([[4, 12, 18], [5, 11, 19], [6, 11, 19], [7, 11, 19], [8, 11, 19], [9, 11, 19], [10, 11, 19], [11, 12, 18]], 'm');
  g.spans([[4, 12, 14], [5, 11, 13]], 'n').rect(17, 5, 3, 7, 'M');
  g.rect(11, 8, 6, 1, 'e').px(12, 8, 'f').px(15, 8, 'f');
  g.spans([[1, 14, 16], [2, 15, 18], [3, 16, 20]], 'k').px(21, 4, 'k');
  // sword held point-down in front
  g.rect(7, 19, 1, 11, 'n').rect(8, 19, 1, 11, 'm').rect(5, 18, 5, 1, 'G').rect(7, 15, 2, 3, 'l').px(7, 14, 'G').px(8, 14, 'G');
  g.rect(6, 15, 3, 2, 'M');
  g.outline();
  const a = g.sprite({ m: '#7a7884', M: '#4a4852', n: '#b8b6c0', k: c, K: k, e: '#0f0b10', f: '#f08a24', G: '#a8752a', l: '#4a3226' });
  return [a, bobFrame(a, 22)];
}

function wraith(opts: { a: string; A: string; k: string; erased: boolean; bell: boolean }): [Sprite, Sprite] {
  const mk = (ph: number) => {
    const g = new Grid(32, 32);
    for (let y = 12; y <= 27; y++) { const half = 4 + Math.floor((y - 12) / 2.5); g.rect(16 - half, y, half * 2 + 1, 1, 'a'); g.rect(17, y, half, 1, 'A'); }
    for (let x = 6; x <= 26; x++) if ((x + ph) % 3 !== 0) g.px(x, 28, (x & 1) ? 'a' : 'A');
    for (let x = 7; x <= 25; x += 3) g.px(x + ph % 2, 29, 'A');
    g.ellipse(15, 7, 5, 5.5, 'a').ellipse(17, 7, 3, 5, 'A').ellipse(14, 7, 3, 3, 'i');
    if (opts.erased) { g.rect(11, 7, 6, 1, 'e').px(10, 8, 'e').px(17, 6, 'e'); }
    else { g.px(12, 7, 'e').px(15, 7, 'e').px(12, 8, 'f').px(15, 8, 'f').rect(13, 10, 2, 1, 'e'); }
    g.line(12, 14, 6 - ph, 20, 'a').line(13, 15, 7 - ph, 21, 'A').px(5 - ph, 21, 'i').px(4 - ph, 20, 'i');
    if (opts.bell) { g.line(16, 16, 16, 21, 'k').line(14, 22, 18, 22, 'k').spans([[23, 13, 19], [24, 12, 20], [25, 12, 20], [26, 11, 21]], 'g').spans([[23, 18, 19], [24, 18, 20], [25, 18, 20], [26, 18, 21]], 'G'); }
    g.outline();
    return g.sprite({ a: opts.a, A: opts.A, i: mix(opts.a, '#ffffff', 0.4), e: '#0f0b10', f: opts.k, k: '#8a8690', g: '#b08a3a', G: '#6a4e1e' });
  };
  return [mk(0), mk(1)];
}

function crawler(): [Sprite, Sprite] {
  const mk = (ph: number) => {
    const g = new Grid(40, 32);
    for (let i = 0; i < 4; i++) {
      const bx = 13 + i * 5, kx = 8 + i * 7 + (i % 2 === ph ? 1 : -1), fx = 4 + i * 9;
      g.line(bx, 23, kx, 16 + (i % 2 === ph ? 0 : 1), 'B').line(kx, 16 + (i % 2 === ph ? 0 : 1), fx, 30, 'B');
    }
    g.ellipse(23, 22, 9, 5, 'b').ellipse(25, 21, 6, 3, 'k').ellipse(11, 23, 4, 3.5, 'b');
    g.line(24, 17, 21, 10, 'l').line(28, 18, 31, 9, 'l').line(31, 9, 34, 7, 'l').line(21, 10, 18, 7, 'l').px(22, 12, 'v').px(30, 11, 'v');
    for (let x = 16; x < 31; x += 3) g.px(x, 19, 'v');
    g.px(8, 22, 'y').px(10, 21, 'y').px(9, 24, 'f').px(11, 23, 'f').px(7, 25, 'w').px(9, 26, 'w');
    for (let i = 0; i < 4; i++) { const bx = 13 + i * 5, kx = 10 + i * 7; g.line(bx, 25, kx, 27, 'B').line(kx, 27, kx - 2, 30, 'B'); }
    g.outline();
    return g.sprite({ b: '#3a2a1e', B: '#22180f', k: '#4e3a28', l: '#5a4030', v: '#6a8a3a', y: '#e0f080', f: '#a0c040', w: '#d9cfb4' });
  };
  return [mk(0), mk(1)];
}

function rootMother(): [Sprite, Sprite] {
  const mk = (ph: number) => {
    const g = new Grid(48, 48);
    // roots spreading at the base
    g.line(20, 40, 8, 46, 'B').line(22, 41, 14, 47, 'B').line(30, 40, 40, 46, 'B').line(28, 41, 34, 47, 'B').rect(17, 42, 16, 5, 'B');
    // trunk body
    g.spans(Array.from({ length: 30 }, (_, i) => [14 + i, 18 - (i > 24 ? i - 24 : 0), 31 + (i > 24 ? i - 24 : 0)] as [number, number, number]), 'b');
    for (let y = 15; y < 44; y += 3) g.px(28, y, 'B').px(29, y + 1, 'B').px(20, y + 2, 'k');
    // head crown of branches
    g.ellipse(24, 12, 9, 7, 'b').ellipse(26, 10, 6, 4, 'k');
    g.line(19, 7, 12 + ph, 0, 'l').line(29, 6, 36 - ph, 0, 'l').line(24, 5, 24, 0, 'l').line(15 + ph, 3, 9, 3, 'l');
    g.ellipse(10 + ph, 1, 3, 1.5, 'v').ellipse(36 - ph, 1, 3, 2, 'v').ellipse(24, 1, 2, 1.5, 'V');
    // face
    g.px(20, 13, 'y').px(21, 13, 'y').px(27, 13, 'y').px(28, 13, 'y').px(20, 14, 'f').px(27, 14, 'f');
    g.rect(21, 17, 6, 3, 'e').px(22, 18, 'w').px(25, 18, 'w');
    // long reaching arm with twig claws
    g.line(18, 20, 8, 26 + ph, 'b').line(18, 21, 8, 27 + ph, 'b').line(8, 26 + ph, 2, 24 + ph, 'l').line(8, 27 + ph, 1, 29 + ph, 'l').line(8, 27 + ph, 4, 31 + ph, 'l');
    g.line(31, 20, 40, 28, 'B').line(31, 21, 40, 29, 'B').line(40, 28, 44, 34, 'l');
    // moss and hanging roots
    for (let x = 17; x <= 31; x += 2) g.px(x, 20 + (x % 3), 'v');
    for (let x = 16; x <= 32; x += 4) g.line(x, 18, x + ph, 23, 'V');
    g.outline();
    return g.sprite({ b: '#3e2e22', B: '#281c14', k: '#56402c', l: '#4a3626', v: '#5a7a34', V: '#3a5222', y: '#f4f0a0', f: '#c0d040', e: '#0f0b10', w: '#d9cfb4' });
  };
  return [mk(0), mk(1)];
}

function greatRobed(opts: { head: 'mitre' | 'hood' | 'crown' | 'void'; c: string; C: string; k: string; face: string; eye: string; prop: 'crozier' | 'baton' | 'scales' | 'orb' }): [Sprite, Sprite] {
  const g = new Grid(48, 48);
  for (let y = 18; y <= 46; y++) { const half = 8 + Math.floor((y - 18) / 2.6); g.rect(25 - half, y, half * 2 + 1, 1, 'c'); g.rect(26 + Math.floor(half / 3), y, Math.ceil(half * 2 / 3), 1, 'C'); }
  g.rect(14, 45, 23, 2, 'k').rect(23, 20, 4, 25, 'k').rect(24, 21, 2, 23, 'K');
  g.ellipse(17, 20, 4, 3, 'c').ellipse(33, 20, 4, 3, 'C');
  // head
  g.ellipse(24, 13, 6, 6.5, opts.head === 'void' ? 'e' : 'C');
  g.ellipse(23, 14, 4.5, 5, opts.head === 'void' ? 'e' : 's');
  if (opts.head !== 'void') { g.rect(20, 13, 2, 2, 'e').rect(25, 13, 2, 2, 'e').px(20, 13, 'f').px(25, 13, 'f').rect(21, 18, 4, 1, 'e'); }
  else { for (let i = 0; i < 7; i++) g.px(19 + ((i * 5) % 9), 9 + ((i * 3) % 10), 'y'); g.px(21, 13, 'f').px(25, 13, 'f'); }
  if (opts.head === 'mitre') { g.spans([[0, 23, 25], [1, 22, 26], [2, 21, 27], [3, 20, 28], [4, 19, 29], [5, 19, 29], [6, 18, 30], [7, 18, 30]], 'w').rect(23, 1, 2, 7, 'k').rect(18, 7, 13, 1, 'k'); }
  if (opts.head === 'hood') { g.spans([[5, 20, 28], [6, 18, 30], [7, 17, 31]], 'c').rect(17, 8, 2, 10, 'c').rect(30, 8, 2, 10, 'C'); }
  if (opts.head === 'crown') { g.rect(18, 5, 13, 2, 'k').px(18, 3, 'k').px(18, 4, 'k').px(22, 2, 'k').px(22, 3, 'k').px(22, 4, 'k').px(26, 3, 'k').px(26, 4, 'k').px(30, 3, 'k').px(30, 4, 'k').px(24, 5, 'y'); }
  // arms forward-left
  g.line(17, 21, 9, 28, 'c').line(18, 22, 10, 29, 'C').line(16, 22, 8, 28, 'c').rect(6, 27, 4, 3, 's');
  switch (opts.prop) {
    case 'crozier': g.line(7, 6, 7, 46, 'k').spans([[2, 5, 9], [3, 4, 4], [3, 10, 10], [4, 4, 4], [4, 10, 10], [5, 9, 10]], 'k').px(7, 4, 'y'); break;
    case 'baton': g.line(8, 27, 3, 18, 'w').px(2, 17, 'y').px(3, 16, 'y').px(1, 16, 'f').px(4, 15, 'f'); break;
    case 'scales': g.line(7, 26, 7, 14, 'k').rect(2, 14, 11, 1, 'k').line(2, 15, 2, 19, 'm').line(12, 15, 12, 17, 'm').spans([[20, 0, 4], [18, 10, 14]], 'k').px(2, 19, 'f'); break;
    case 'orb': g.ellipse(6, 23, 3, 3, 'y').ellipse(6, 23, 1.5, 1.5, 'w').px(4, 21, 'f'); break;
  }
  g.outline();
  const pal = { c: opts.c, C: opts.C, k: opts.k, K: mix(opts.k, '#000000', 0.35), s: opts.face, e: '#0f0b10', f: opts.eye, y: '#fff2ae', w: '#e8e0d0', m: '#8a8690' };
  const a = g.sprite(pal);
  return [a, bobFrame(a, 40)];
}

function eel(): [Sprite, Sprite] {
  const mk = (ph: number) => {
    const g = new Grid(60, 44);
    for (let x = 12; x <= 58; x++) {
      const cy = 26 + Math.round(7 * Math.sin((x + ph * 5) / 7));
      const th = Math.max(1, Math.round(7 - (x - 12) / 8));
      g.rect(x, cy - th, 1, th * 2 + 1, 'b').rect(x, cy + Math.ceil(th / 2), 1, Math.max(1, th - Math.ceil(th / 2)), 'B');
      if (x % 5 === 0) g.px(x, cy - th, 'k').px(x, cy - th - 1, 'k');
    }
    g.ellipse(10, 24, 9, 7, 'b').ellipse(11, 28, 7, 3, 'B');
    g.rect(1, 26, 11, 3, 'e');
    for (let x = 2; x < 12; x += 2) g.px(x, 26, 'w').px(x + 1, 28, 'w');
    g.ellipse(8, 21, 1.5, 1.5, 'y').px(8, 21, 'f');
    g.line(12, 17, 9, 9, 'k').line(9, 9, 3, 6 + ph, 'k');
    g.ellipse(2, 4 + ph, 2.5, 2.5, 'y').px(2, 4 + ph, 'w');
    g.line(22, 20, 27, 14, 'k').line(36, 20, 39, 15, 'k').line(48, 22, 50, 18, 'k');
    g.outline();
    return g.sprite({ b: '#25424a', B: '#4f8a8a', k: '#183036', e: '#0f0b10', w: '#e8e0d0', y: '#fff2ae', f: '#f0c040' });
  };
  return [mk(0), mk(1)];
}

/** Run 3: a figure grown through with roots, branches from head and shoulders, roots for feet. */
function rooted(opts: { b: string; B: string; k: string; v: string; eye: string }): [Sprite, Sprite] {
  const mk = (ph: number) => {
    const g = new Grid(32, 32);
    // root feet spreading into the ground
    g.line(14, 26, 8, 31, 'B').line(15, 27, 11, 31, 'b').line(18, 26, 24, 31, 'B').line(17, 27, 20, 31, 'b').rect(13, 24, 7, 4, 'b');
    // trunk-body, widening at the hips
    for (let y = 13; y <= 25; y++) { const half = 4 + (y > 21 ? y - 21 : 0) - (y < 15 ? 1 : 0); g.rect(16 - half, y, half * 2 + 1, 1, 'b'); g.rect(17 + (half >> 1), y, half - (half >> 1), 1, 'B'); }
    for (let y = 14; y < 25; y += 3) g.px(14, y, 'k').px(15, y + 1, 'k').px(19, y + 1, 'B').px(13, y + 2, 'B');
    // head: a knot of wood with a hollow face
    g.ellipse(15, 8, 4.5, 5, 'b').ellipse(17.5, 8, 2, 4.5, 'B').px(13, 4, 'k').px(14, 3, 'k');
    g.rect(12, 8, 4, 3, 'e').px(12, 8, 'f').px(15, 8, 'f').px(13, 10, 'B');
    // branches: crown and shoulders, swaying between frames
    g.line(14, 4, 10 - ph, 0, 'l').line(17, 4, 21 + ph, 0, 'l').line(19, 3, 23 + ph, 3, 'l').line(12, 6, 8 - ph, 4, 'l');
    g.line(20, 14, 26 + ph, 9, 'l').line(24 + ph, 11, 27 + ph, 12, 'l').line(11, 14, 9, 11, 'l');
    g.px(10 - ph, 0, 'v').px(9 - ph, 1, 'v').px(21 + ph, 0, 'v').px(22 + ph, 0, 'V').px(23 + ph, 2, 'v').px(26 + ph, 8, 'v').px(27 + ph, 9, 'V').px(8 - ph, 3, 'v').px(9, 10, 'v');
    // reaching arm with twig fingers
    g.line(13, 15, 7, 20, 'b').line(14, 16, 8, 21, 'B').line(7, 20, 3, 18 + ph, 'l').line(7, 21, 3, 22, 'l').line(8, 21, 6, 25 - ph, 'l');
    // moss and hanging root threads
    for (let x = 12; x <= 20; x += 2) g.px(x, 13 + (x % 3), 'v');
    g.line(19, 17, 19 + ph, 22, 'V').px(12, 19, 'V').px(12, 20, 'V');
    g.outline();
    return g.sprite({ b: opts.b, B: opts.B, k: opts.k, l: mix(opts.b, '#000000', 0.15), v: opts.v, V: mix(opts.v, '#000000', 0.35), e: '#0f0b10', f: opts.eye });
  };
  return [mk(0), mk(1)];
}

/** Run 3: a smouldering cinder figure, cracks glowing through charcoal, a flame for a crown. */
function ash(opts: { c: string; C: string; g: string; h: string }): [Sprite, Sprite] {
  const mk = (ph: number) => {
    const g = new Grid(32, 32);
    // legs and feet, hunched charcoal body
    g.rect(12, 23, 3, 7, 'c').rect(17, 23, 3, 7, 'C').rect(10, 29, 5, 2, 'c').rect(16, 29, 5, 2, 'C');
    for (let y = 12; y <= 23; y++) { const half = 5 - (y < 14 ? 1 : 0) - (y > 21 ? 1 : 0); g.rect(16 - half, y, half * 2 + 1, 1, 'c'); g.rect(18, y, half - 1, 1, 'C'); }
    g.ellipse(15, 8, 4, 4.5, 'c').ellipse(17, 8, 2, 4, 'C');
    // glowing cracks
    g.line(13, 13, 15, 16, 'g').line(15, 16, 13, 19, 'g').line(13, 19, 15, 22, 'G').line(18, 14, 17, 17, 'G').line(19, 19, 18, 22, 'g').px(15, 16, 'h').px(13, 19, 'h');
    g.line(13, 24, 13, 27, 'G').px(18, 26, 'g').px(16, 5, 'G').px(14, 11, 'g');
    // ember eyes and mouth
    g.px(12, 8, 'h').px(15, 8, 'h').px(12, 9, 'g').px(15, 9, 'g').rect(13, 10, 2, 1, 'G');
    // flame crown, flickering
    if (ph) g.spans([[0, 15, 15], [1, 14, 16], [2, 13, 17], [3, 12, 18]], 'g').spans([[1, 15, 15], [2, 14, 16], [3, 14, 16]], 'h').px(11, 1, 'G').px(19, 2, 'G');
    else g.spans([[0, 14, 14], [1, 13, 15], [1, 18, 18], [2, 12, 18], [3, 12, 18]], 'g').spans([[2, 14, 15], [3, 14, 16]], 'h').px(17, 0, 'G');
    // reaching arm, a fistful of embers
    g.line(12, 14, 7, 19, 'c').line(13, 15, 8, 20, 'C').rect(5, 19, 3, 3, 'C').px(5, 19, 'g').px(6, 20, 'h').px(4, 18 - ph, 'g').px(6, 17 - ph, 'G');
    // smoke
    g.px(21 + ph, 4, 's').px(22 + ph, 2, 's').px(21, 0, 's');
    g.outline();
    return g.sprite({ c: opts.c, C: opts.C, g: opts.g, G: mix(opts.g, '#000000', 0.35), h: opts.h, s: '#5a5050' });
  };
  return [mk(0), mk(1)];
}

// ---------------------------------------------------------------- recolours of the approved foes
function recolour(s: Sprite, over: Record<string, string>): Sprite { return { ...s, palette: { ...s.palette, ...over } }; }
const pair = (base: string, over?: Record<string, string>): [Sprite, Sprite] =>
  over ? [recolour(SAMPLE[base], over), recolour(SAMPLE[base + '_b'], over)] : [SAMPLE[base], SAMPLE[base + '_b']];

const KINDS: Record<string, () => [Sprite, Sprite]> = {
  hound: () => pair('rot_hound'),
  bogwretch: () => pair('rot_hound', { b: '#4a5a3a', B: '#2c3824', k: '#6a7a4a', x: '#3a2a1a', v: '#8aa040', V: '#50601e', f: '#e0e070' }),
  ghoul: () => pair('shovel_ghoul'),
  scavenger: () => pair('shovel_ghoul', { q: '#9a8a78', Q: '#6a5c4c', r: '#bcae98', c: '#3e3a44', C: '#2a2630', d: '#58525e', f: '#e0b040' }),
  thorncorpse: () => pair('shovel_ghoul', { q: '#7a8a4a', Q: '#4f5a2a', r: '#a0b060', c: '#3a2a1e', C: '#24180f', d: '#5a4030', f: '#c0e040', m: '#5a4030', M: '#3a2a1e', n: '#7a5a3a' }),
  swarm: () => pair('crow_swarm'),
  choir: () => pair('crow_swarm', { K: '#6a6a7a', k: '#a8aebb', p: '#e4e8ee', f: '#3a3044', F: '#211a28', g: '#3a6a9a' }),
  warden: () => pair('gravewarden'),
  keeper: () => pair('gravewarden', { m: '#5f7480', M: '#3a4a56', n: '#9ab4c0', G: '#4a7a70', g: '#7ac0a8', r: '#26404a', R: '#18282e', f: '#7fe0d0', y: '#c8fff0', F: '#3a8a7a' }),
  ashwarden: () => pair('gravewarden', { m: '#5a4a48', M: '#3a2e2c', n: '#8a7470', G: '#b2531c', g: '#f08a24', r: '#7a2a18', R: '#4a1a10', y: '#ffd080' }),
  sepulchre: () => pair('gravewarden', { m: '#8aa4b8', M: '#5a7088', n: '#d0e8f4', G: '#6a8aa8', g: '#bfe4ff', r: '#3a5a7a', R: '#24384c', f: '#9fe8ff', y: '#e8f8ff' }),
  crawler: crawler,
  rootmother: rootMother,
  eel: eel,
  knight: () => knight('#3a3a4a', '#24242e'),
  reach: () => knight('#3a5a6a', '#24384a'),
  monk: () => robed({ prop: 'none', c: '#5a4636', C: '#3a2c22', k: '#a8752a', eye: '#f08a24' }),
  acolyte: () => robed({ prop: 'book', c: '#3a4a6a', C: '#26304a', k: '#9a8a5a', eye: '#a0d0ff' }),
  ringer: () => robed({ prop: 'bell', c: '#4a3a4e', C: '#2e2232', k: '#a8752a', eye: '#f0c040' }),
  penitent: () => robed({ prop: 'candle', c: '#4a3430', C: '#2e1e1a', k: '#b2531c', eye: '#f08a24' }),
  clerk: () => robed({ prop: 'book', c: '#5a1e2a', C: '#3a121a', k: '#c8a050', eye: '#ff6060' }),
  pilgrim: () => robed({ prop: 'staff', c: '#4a4466', C: '#2e2a44', k: '#c0b0f0', eye: '#e0d0ff' }),
  reliquary: () => robed({ prop: 'chain', c: '#5a6a7a', C: '#3a4656', k: '#bfe4ff', eye: '#9fe8ff' }),
  erased: () => wraith({ a: '#b8b4c0', A: '#7a7684', k: '#e0e0e0', erased: true, bell: false }),
  bellbound: () => wraith({ a: '#9aa0a8', A: '#5e646e', k: '#f0c040', erased: false, bell: true }),
  drowned: () => wraith({ a: '#7aa8a8', A: '#4a7070', k: '#c8fff0', erased: false, bell: false }),
  choirmaster: () => greatRobed({ head: 'hood', c: '#3e2c48', C: '#281c30', k: '#c8a050', face: '#c8c0b0', eye: '#f0c040', prop: 'baton' }),
  bishop: () => greatRobed({ head: 'mitre', c: '#d8d0c2', C: '#a1978a', k: '#c8a050', face: '#b8b0a4', eye: '#f08a24', prop: 'crozier' }),
  magistrate: () => greatRobed({ head: 'crown', c: '#7a1a28', C: '#4a0e18', k: '#e0b050', face: '#d8c8b8', eye: '#ff4040', prop: 'scales' }),
  unmoored: () => greatRobed({ head: 'void', c: '#2a2448', C: '#18142e', k: '#8a7ad8', face: '#000000', eye: '#e0d0ff', prop: 'orb' }),
  // run 3: the deep lands (6 to 12)
  rooted: () => rooted({ b: '#4a3a28', B: '#2e2418', k: '#6a5438', v: '#5a7a34', eye: '#c0e040' }),
  ash: () => ash({ c: '#3a302c', C: '#241c1a', g: '#f08a24', h: '#ffd080' }),
  bellhand: () => wraith({ a: '#6a9a9a', A: '#3e6464', k: '#c8fff0', erased: false, bell: true }),
  drownedgreat: () => greatRobed({ head: 'hood', c: '#2e4a50', C: '#1c3036', k: '#7fe0d0', face: '#7a9a98', eye: '#c8fff0', prop: 'orb' }),
  rootabbot: () => greatRobed({ head: 'hood', c: '#3e3a22', C: '#28241a', k: '#7a9a3a', face: '#8a7a5a', eye: '#c0e040', prop: 'crozier' }),
  boneclerk: () => robed({ prop: 'book', c: '#a89c80', C: '#6a604c', k: '#4a3e2e', eye: '#f08a24' }),
  statue: () => { const [a, b] = knight('#5a564e', '#3a3832'); const over = { m: '#8a8478', M: '#5a564e', n: '#b8b0a0', G: '#6a6458', l: '#4a463e' }; return [recolour(a, over), recolour(b, over)]; },
  archivist: () => greatRobed({ head: 'hood', c: '#7a6e58', C: '#4e4636', k: '#c8b890', face: '#d8ccb0', eye: '#f0c040', prop: 'baton' }),
  unnamer: () => greatRobed({ head: 'void', c: '#4a4238', C: '#2a2620', k: '#c8b890', face: '#000000', eye: '#f0e0b0', prop: 'orb' }),
  ashhound: () => pair('rot_hound', { b: '#4a3e3a', B: '#2a2220', k: '#6a5a54', v: '#f08a24', V: '#b2531c', x: '#7a2a18', f: '#ffd080' }),
  embers: () => pair('crow_swarm', { K: '#3a1a10', k: '#7a3a1c', p: '#e08a3a', f: '#ffd080', F: '#f08a24', g: '#fff2ae' }),
  kilnmother: () => greatRobed({ head: 'hood', c: '#4a2e24', C: '#2e1c16', k: '#f08a24', face: '#3a2a24', eye: '#ffd080', prop: 'orb' }),
  cinderchoir: () => greatRobed({ head: 'void', c: '#3a2a24', C: '#241814', k: '#b2531c', face: '#000000', eye: '#ffd080', prop: 'baton' }),
  silentbell: () => wraith({ a: '#9a90b8', A: '#5e5680', k: '#d0b0ff', erased: false, bell: true }),
  sister: () => robed({ prop: 'candle', c: '#4a3e66', C: '#2e2644', k: '#a890d8', eye: '#d0b0ff' }),
  echo: () => wraith({ a: '#8a80b0', A: '#5a5080', k: '#e0d0ff', erased: false, bell: false }),
  abbess: () => greatRobed({ head: 'hood', c: '#3a3058', C: '#241e3a', k: '#a890d8', face: '#c8c0d0', eye: '#d0b0ff', prop: 'crozier' }),
  gaoler: () => robed({ prop: 'chain', c: '#4a1a22', C: '#2e1016', k: '#c8a050', eye: '#ff6060' }),
  oathbreaker: () => knight('#6a1a24', '#3a0e14'),
  bailiff: () => greatRobed({ head: 'hood', c: '#6a1622', C: '#400c14', k: '#e0b050', face: '#d8c8b8', eye: '#ff4040', prop: 'baton' }),
  verdict: () => greatRobed({ head: 'void', c: '#3a1018', C: '#22080e', k: '#c8a050', face: '#000000', eye: '#ff4040', prop: 'scales' }),
  deacon: () => robed({ prop: 'candle', c: '#2e2a36', C: '#1c1a22', k: '#8a7ad8', eye: '#c0b0ff' }),
  shadowbishop: () => greatRobed({ head: 'mitre', c: '#3a3444', C: '#24202c', k: '#8a7ad8', face: '#5a5464', eye: '#c0b0ff', prop: 'crozier' }),
  thousand: () => greatRobed({ head: 'void', c: '#2a2430', C: '#18141e', k: '#c8a050', face: '#000000', eye: '#fff2ae', prop: 'orb' }),
  bellunrung: () => greatRobed({ head: 'crown', c: '#5a4a30', C: '#3a2e1e', k: '#e0b050', face: '#c8b890', eye: '#f0c040', prop: 'orb' }),
  // fix round: The Bellrope Descent (land 6, stages 126-150)
  hanged: () => wraith({ a: '#a09888', A: '#625a50', k: '#c0a878', erased: true, bell: false }),
  sootchorister: () => robed({ prop: 'book', c: '#2c282a', C: '#1a1618', k: '#6a5e58', eye: '#e9b949' }),
  clapperimp: () => pair('crow_swarm', { K: '#3a2c18', k: '#7a6038', p: '#c8a050', f: '#f0c040', F: '#a8752a', g: '#fff2ae' }),
  ropekeeper: () => greatRobed({ head: 'hood', c: '#4a3e2c', C: '#2e261a', k: '#a08a5c', face: '#8a7a64', eye: '#e9b949', prop: 'crozier' }),
  hangedcantor: () => greatRobed({ head: 'void', c: '#3a3634', C: '#242020', k: '#c0a878', face: '#000000', eye: '#e0d8c0', prop: 'baton' }),
  knell: () => greatRobed({ head: 'hood', c: '#3a2c1e', C: '#241a12', k: '#e9b949', face: '#1a1410', eye: '#fff2ae', prop: 'orb' }),
  fallingmonk: () => robed({ prop: 'none', c: '#3a3436', C: '#242022', k: '#a08a5c', eye: '#e0d8c0' }),
};

/**
 * Run 3: archetypes of the deep lands' foes in table order (3 foes, 3 bosses, treasure, wanderer), by land index 6..12.
 * Used for the placeholder names ("Deep Foe" ... "Deep Wanderer") shown until the lore is approved, so each land keeps its look.
 */
const DEEP_KINDS: string[][] = [
  ['bellhand', 'drowned', 'drowned', 'keeper', 'eel', 'drownedgreat', 'scavenger', 'drowned'],
  ['rooted', 'crawler', 'thorncorpse', 'rootabbot', 'rootmother', 'rootmother', 'scavenger', 'rooted'],
  ['ghoul', 'boneclerk', 'statue', 'archivist', 'unnamer', 'archivist', 'scavenger', 'pilgrim'],
  ['ash', 'ashhound', 'embers', 'ashwarden', 'kilnmother', 'cinderchoir', 'scavenger', 'penitent'],
  ['silentbell', 'sister', 'echo', 'abbess', 'unmoored', 'choirmaster', 'scavenger', 'silentbell'],
  ['clerk', 'gaoler', 'oathbreaker', 'magistrate', 'bailiff', 'verdict', 'clerk', 'erased'],
  ['deacon', 'bellbound', 'erased', 'shadowbishop', 'thousand', 'bellunrung', 'reliquary', 'hound'],
];
const PLACEHOLDERS = ['deep foe', 'deep crawler', 'deep shade', 'deep boss', 'deep warden', 'deep keeper', 'deep hoarder', 'deep wanderer'];
/** Placeholder names with no land known (sheets, tests): one sensible kind each. */
const PLACEHOLDER_DEFAULT = ['knight', 'crawler', 'drowned', 'bishop', 'warden', 'keeper', 'scavenger', 'pilgrim'];

/** Deep-land names (run 3), checked before the older rules so their words win; none of them matches an older name. */
const DEEP_RULES: [RegExp, string][] = [
  [/rope-hanged/, 'hanged'], [/soot chorister/, 'sootchorister'], [/clapper imp/, 'clapperimp'], [/rope-keeper/, 'ropekeeper'],
  [/hanged cantor/, 'hangedcantor'], [/\bknell\b/, 'knell'], [/coin-swallower/, 'scavenger'], [/falling monk/, 'fallingmonk'],
  [/bishop's hound/, 'hound'], [/bishop's shadow/, 'shadowbishop'], [/thousand/, 'thousand'], [/unrung/, 'bellunrung'],
  [/mother of silt/, 'eel'], [/bellwater/, 'drownedgreat'], [/sunken|toller/, 'keeper'], [/bellhand/, 'bellhand'], [/silt|tide|verger/, 'drowned'],
  [/wreck|hoarder|pedlar|clapper|grave-robber/, 'scavenger'], [/bribe|juror/, 'clerk'],
  [/rooted abbot/, 'rootabbot'], [/briar|heartwood/, 'rootmother'], [/leech/, 'crawler'], [/thorn choir/, 'thorncorpse'],
  [/root-bound|rooted|grove|sap\b/, 'rooted'],
  [/name-eater/, 'ghoul'], [/archivist|ledger/, 'archivist'], [/unnamer/, 'unnamer'], [/bone/, 'boneclerk'], [/stone|ossuary/, 'statue'],
  [/stair warden/, 'ashwarden'], [/kiln/, 'kilnmother'], [/smoulder|smolder/, 'cinderchoir'], [/ash hound/, 'ashhound'], [/ember moth/, 'embers'],
  [/cinder pilgrim|ashborn|\bember/, 'ash'],
  [/muted|bell that walks/, 'silentbell'], [/silent sister/, 'sister'], [/echo shade/, 'echo'], [/abbess|hushed/, 'abbess'], [/bellmaw/, 'unmoored'], [/peal/, 'choirmaster'],
  [/gallows/, 'gaoler'], [/oath/, 'oathbreaker'], [/red bailiff/, 'bailiff'], [/verdict/, 'verdict'], [/acquitted|unwritten/, 'erased'],
  [/deacon/, 'deacon'], [/martyr/, 'bellbound'],
];

/** Map a foe name to an archetype. Keyword rules, then a sensible default. */
export function foeKind(name: string, boss: boolean, land = -1): string {
  const n = name.toLowerCase();
  const ph = PLACEHOLDERS.indexOf(n);
  if (ph >= 0) return DEEP_KINDS[land - 6]?.[ph] ?? PLACEHOLDER_DEFAULT[ph];
  for (const [re, k] of DEEP_RULES) if (re.test(n)) return k;
  const rules: [RegExp, string][] = [
    [/root-mother|root mother|mother/, 'rootmother'], [/eel|serpent|leviathan/, 'eel'],
    [/bishop/, 'bishop'], [/choirmaster/, 'choirmaster'], [/magistrate|judge/, 'magistrate'], [/unmoored|void/, 'unmoored'],
    [/ash warden/, 'ashwarden'], [/sepulchre keeper/, 'sepulchre'], [/causeway keeper/, 'keeper'],
    [/gravewarden|warden/, 'warden'],
    [/wretch|bog/, 'bogwretch'], [/hound|beast|wolf|dog|hog|jackal/, 'hound'],
    [/choir/, 'choir'], [/crow|swarm|flock|bats|moths/, 'swarm'],
    [/crawler|spider|tick|beetle|creeper/, 'crawler'],
    [/thorn|corpse|bramble/, 'thorncorpse'], [/scavenger|digger|grave robber/, 'scavenger'], [/ghoul/, 'ghoul'],
    [/reach|guardian|sentinel/, 'reach'], [/knight|keeper|soldier/, 'knight'],
    [/ringer|bell-ringer/, 'ringer'], [/bell-bound|bound|chained/, 'bellbound'],
    [/erased|faceless|forgotten/, 'erased'], [/drowned|chorister|ghost|wraith|shade/, 'drowned'],
    [/monk|friar/, 'monk'], [/acolyte|novice|scribe/, 'acolyte'], [/penitent|cinder|zealot/, 'penitent'],
    [/clerk|scribe|bailiff/, 'clerk'], [/pilgrim|wanderer|star/, 'pilgrim'], [/reliquary|frost|ice/, 'reliquary'],
  ];
  for (const [re, k] of rules) if (re.test(n)) return k;
  if (boss) return ['warden', 'choirmaster', 'keeper', 'bishop'][hash(n) % 4];
  return ['ghoul', 'hound', 'monk', 'knight', 'crawler', 'erased'][hash(n) % 6];
}

const FLYERS = new Set(['swarm', 'choir']);
const artCache = new Map<string, FoeArt>();

/** Two idle frames with realm / treasure tinting baked into the palette. */
export function foeArt(f: FoeLook): FoeArt {
  const kind = foeKind(f.name, f.boss, f.land);
  const key = `${kind}|${f.realm ?? ''}|${f.treasure ? 1 : 0}`;
  let art = artCache.get(key);
  if (art) return art;
  let [a, b] = KINDS[kind]();
  const tint = (s: Sprite, col: string, amt: number): Sprite => ({ ...s, palette: tintPalette(s, null, col, amt) });
  if (f.realm) { const c = realmTint(f.realm); a = tint(a, c, 0.3); b = tint(b, c, 0.3); }
  if (f.treasure) { a = tint(a, '#e9b949', 0.5); b = tint(b, '#e9b949', 0.5); }
  art = { a, b, fly: FLYERS.has(kind), kind };
  artCache.set(key, art);
  return art;
}

/** Last painted row (to stand the sprite on the ground line). */
export function footRow(s: Sprite): number {
  for (let y = s.h - 1; y >= 0; y--) if (/[^.]/.test(s.rows[y])) return y;
  return s.h - 1;
}
export function topRow(s: Sprite): number {
  for (let y = 0; y < s.h; y++) if (/[^.]/.test(s.rows[y])) return y;
  return 0;
}

/** Small treasure sack that sits beside a treasure foe. */
export const SACK: Sprite = (() => {
  const g = new Grid(12, 12);
  g.ellipse(6, 7.5, 4.5, 3.5, 's').rect(5, 2, 3, 2, 's').rect(4, 4, 5, 1, 'S').px(6, 1, 'S');
  g.px(4, 7, 'g').px(5, 8, 'g').px(8, 6, 'y').px(3, 10, 'S').px(9, 10, 'S');
  g.outline();
  return g.sprite({ s: '#a8752a', S: '#6a4a1a', g: '#e9b949', y: '#fff2ae' });
})();
