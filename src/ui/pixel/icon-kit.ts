// Shared kit for the 32 px framed icons (10 Nov 2026).
// Each icon: a 32x32 frame coloured by element or kind, and 28x28 pixel art drawn with Grid at (2,2), outlined.
import { Grid, mix } from './core';

/** Palette letters for icon art. '.' is empty. 'o' is the outline (added automatically by outline()). */
export const P: Record<string, string> = {
  o: '#1a1218', e: '#140c12', w: '#ffffff',
  k: '#4a4650', m: '#9a9aa6', n: '#e4e6ee', // steel: dark, mid, light
  g: '#f0c050', G: '#a8752a', y: '#fff2ae', h: '#6a4418', // gold: mid, dark, pale, deep brown
  r: '#d8402e', R: '#7a1e18', p: '#ff8a7a', // red: mid, dark, pink/light
  v: '#4fd060', V: '#1f7a34', u: '#c0ffa0', // green: mid, dark, light
  b: '#4a8ff0', B: '#203f8a', i: '#a8ecff', // blue: mid, dark, ice
  c: '#8a5ad0', C: '#3e2468', q: '#d0b0ff', // purple: mid, dark, lilac
  l: '#8a5a36', L: '#4a3020', // wood: mid, dark
  s: '#eab995', S: '#b0765a', // skin: light, shade
  f: '#f08a24', F: '#b0400e', // fire: orange, deep
  t: '#ece0c4', T: '#a89878', // bone/parchment: light, shade
  x: '#40c0b0', X: '#1a6a60', // teal: mid, dark
  a: '#c3d3d6', A: '#7d95a0', // pale blue-grey: light, dark (cloth, mist)
  d: '#5a3a5a', D: '#2a1a2a', // dusk plum: mid, dark (shadow, night)
};

/** Frame colours. Pick by element (phys, magic, fire, cold, lightning, poison) or kind. */
export const FRAME: Record<string, string> = {
  phys: '#a9a49c', magic: '#a070e0', fire: '#f08a24', cold: '#6ac8f0', lightning: '#f0d040', poison: '#50c050',
  gold: '#e0b45a', blood: '#d04a3a', holy: '#f4e2a0', nature: '#7ab048', shadow: '#6a5a7a', stat: '#b08a5a', ult: '#ffd56a',
};

export type Art = (g: Grid) => void;
export interface IconDef {
  frame: keyof typeof FRAME | string;
  art: Art;
  /** Optional extra or replacement palette letters for this icon only. */
  pal?: Record<string, string>;
}

/** A bevelled frame: dark rim, coloured edge, lit top-left, shaded bottom-right, tinted ground. Ultimates get a double rim. */
export function paintFrame(ctx: CanvasRenderingContext2D, col: string, ult = false) {
  const px = (x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  px(1, 0, 30, 32, '#0c080b'); px(0, 1, 32, 30, '#0c080b');
  px(1, 1, 30, 30, col);
  for (let y = 2; y < 30; y++) px(2, y, 28, 1, mix(col, '#100b10', 0.7 + (y / 30) * 0.22));
  px(1, 1, 30, 1, mix(col, '#fff6e0', 0.45)); px(1, 1, 1, 30, mix(col, '#fff6e0', 0.3));
  px(1, 30, 30, 1, mix(col, '#100b10', 0.45)); px(30, 1, 1, 30, mix(col, '#100b10', 0.35));
  if (ult) { px(2, 2, 28, 1, mix(col, '#fff6e0', 0.6)); px(2, 29, 28, 1, mix(col, '#100b10', 0.3)); px(2, 2, 1, 28, mix(col, '#fff6e0', 0.5)); px(29, 2, 1, 28, mix(col, '#100b10', 0.3)); }
  px(1, 1, 1, 1, '#0c080b'); px(30, 1, 1, 1, '#0c080b'); px(1, 30, 1, 1, '#0c080b'); px(30, 30, 1, 1, '#0c080b');
}

export const newArt = () => new Grid(28, 28);
