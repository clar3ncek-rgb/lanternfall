// Pixel-art core: sprite format, colour helpers, the draw() routine from the approved samples,
// a small grid painter for code-built sprites, and canvas / data-URL caches.

export interface Sprite { w: number; h: number; palette: Record<string, string>; rows: string[] }
export type Recolour = string | Record<string, string> | null | undefined;

// ---------------------------------------------------------------- colour
export function hexRgb(h: string): [number, number, number] {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)) as [number, number, number];
}
export function rgbHex(c: number[]): string {
  return '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function mix(a: string, b: string, t: number): string {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(A.map((v, i) => v + (B[i] - v) * t));
}
export const shade = (c: string) => mix(c, '#140f14', 0.45);
export const light = (c: string) => mix(c, '#fff6e0', 0.45);

/** A rarity / element hex derives the T (base), t (shade), u (highlight) channel, as in the samples. */
export function recolourMap(r: Recolour): Record<string, string> | null {
  if (!r) return null;
  if (typeof r === 'string') return { T: r, t: shade(r), u: light(r) };
  return r;
}

/** Full palette with every colour pulled toward `toward` (outline kept). Used for flashes, depth and realm tints. */
export function tintPalette(s: Sprite, rec: Recolour, toward: string, amt: number, keepOutline = true): Record<string, string> {
  const pal: Record<string, string> = { ...s.palette, ...(recolourMap(rec) || {}) };
  const out: Record<string, string> = {};
  for (const k in pal) out[k] = keepOutline && k === 'o' ? pal[k] : mix(pal[k], toward, amt);
  return out;
}

// ---------------------------------------------------------------- draw (same contract as the samples)
/** draw(ctx, sprite, x, y, scale = 1, recolour?, flip?) - paints a sprite with crisp square pixels. */
export function draw(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, scale = 1, recolour?: Recolour, flip = false): void {
  const pal = Object.assign({}, sprite.palette, recolourMap(recolour) || {});
  for (let r = 0; r < sprite.h; r++) {
    const row = sprite.rows[r];
    if (!row) continue;
    for (let c = 0; c < sprite.w; c++) {
      const k = row[c];
      if (k === '.' || k === undefined) continue;
      const col = pal[k];
      if (!col) continue;
      ctx.fillStyle = col;
      const cx = flip ? sprite.w - 1 - c : c;
      ctx.fillRect(x + cx * scale, y + r * scale, scale, scale);
    }
  }
}

// Sprites are drawn many times a frame; paint each (sprite, palette) once into a canvas and blit it.
const bake = new WeakMap<Sprite, Map<string, HTMLCanvasElement>>();
export function baked(sprite: Sprite, recolour?: Recolour, flip = false): HTMLCanvasElement {
  let m = bake.get(sprite);
  if (!m) { m = new Map(); bake.set(sprite, m); }
  const key = (typeof recolour === 'string' ? recolour : recolour ? JSON.stringify(recolour) : '') + (flip ? '|f' : '');
  let c = m.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = sprite.w; c.height = sprite.h;
    draw(c.getContext('2d')!, sprite, 0, 0, 1, recolour, flip);
    if (m.size > 64) m.clear();
    m.set(key, c);
  }
  return c;
}
/** Blit a sprite at logical position (integer), optional integer scale. */
export function blit(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, recolour?: Recolour, flip = false, scale = 1): void {
  ctx.drawImage(baked(sprite, recolour, flip), Math.round(x), Math.round(y), sprite.w * scale, sprite.h * scale);
}

// ---------------------------------------------------------------- seeded random
export function rng(seed: number): () => number {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---------------------------------------------------------------- grid painter for code-built sprites
/** Paint palette keys into a char grid, then outline with 'o' like the hand-made sprites. */
export class Grid {
  cells: string[][];
  constructor(public w: number, public h: number) {
    this.cells = Array.from({ length: h }, () => Array(w).fill('.'));
  }
  px(x: number, y: number, c: string): this {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.cells[y][x] = c;
    return this;
  }
  get(x: number, y: number): string { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.cells[y][x] : '.'; }
  rect(x: number, y: number, w: number, h: number, c: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
    return this;
  }
  /** Horizontal spans given as [y, x0, x1] (inclusive). Handy for tapered shapes. */
  spans(list: [number, number, number][], c: string): this {
    for (const [y, a, b] of list) for (let x = a; x <= b; x++) this.px(x, y, c);
    return this;
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
        if (((x - cx) / (rx + 0.35)) ** 2 + ((y - cy) / (ry + 0.35)) ** 2 <= 1) this.px(x, y, c);
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, c: string): this {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) this.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
    return this;
  }
  /** Replace colour `from` with `to` inside a rect (or everywhere). */
  swap(from: string, to: string, x = 0, y = 0, w = this.w, h = this.h): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (this.get(i, j) === from) this.px(i, j, to);
    return this;
  }
  /** Shift rows [y0, y1] down by dy (top rows clear). */
  shiftRows(y0: number, y1: number, dy: number): this {
    const copy = this.cells.map((r) => r.slice());
    for (let y = y1; y >= y0; y--) {
      const ty = y + dy;
      if (ty >= 0 && ty < this.h) this.cells[ty] = copy[y].slice();
    }
    for (let y = y0; y < y0 + dy; y++) this.cells[y] = Array(this.w).fill('.');
    return this;
  }
  /** Copy another grid's painted cells on top of this one. */
  stamp(g: Grid, dx = 0, dy = 0): this {
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const k = g.cells[y][x]; if (k !== '.') this.px(x + dx, y + dy, k); }
    return this;
  }
  outline(o = 'o'): this {
    const add: [number, number][] = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.cells[y][x] !== '.') continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const k = this.get(x + a, y + b); return k !== '.' && k !== o; })) add.push([x, y]);
    }
    for (const [x, y] of add) this.cells[y][x] = o;
    return this;
  }
  sprite(palette: Record<string, string>): Sprite {
    return { w: this.w, h: this.h, palette: { o: '#1b1418', ...palette }, rows: this.cells.map((r) => r.join('')) };
  }
}

/** Shift a finished sprite's upper rows down 1 px: the 2-frame idle bob used everywhere. */
export function bobFrame(s: Sprite, keepFrom: number): Sprite {
  const rows = s.rows.slice();
  const empty = '.'.repeat(s.w);
  for (let y = keepFrom - 1; y >= 1; y--) rows[y] = s.rows[y - 1];
  rows[0] = empty;
  // merge the row at keepFrom so feet stay planted
  return { ...s, rows };
}

/** Grow a sprite canvas by `pad` on every side (for auras, sacks, pips). */
export function padSprite(s: Sprite, pad: number): Sprite {
  const e = '.'.repeat(pad);
  const blank = '.'.repeat(s.w + pad * 2);
  return { w: s.w + pad * 2, h: s.h + pad * 2, palette: s.palette, rows: [...Array(pad).fill(blank), ...s.rows.map((r) => e + r + e), ...Array(pad).fill(blank)] };
}

// ---------------------------------------------------------------- data-URL icon cache
const urlCache = new Map<string, string>();
export function dataUrl(key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): string {
  let u = urlCache.get(key);
  if (u) return u;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  paint(g);
  u = c.toDataURL('image/png');
  urlCache.set(key, u);
  return u;
}
export const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
