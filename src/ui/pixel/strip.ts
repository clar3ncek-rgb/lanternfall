// Layout C portrait strip (DOM, so it can hold real buttons) and the CSS for the strip, icons and canvas.
import { dataUrl, draw } from './core';
import { namedSprites } from './allies';
import { elementColor } from './palette';

export interface NamedLook {
  i: number; look: string; element: string; level: number;
  share: number; affordable: boolean; immune: boolean; milestone: number;
}

export function namedPortraitSrc(look: string, element: string): string {
  const col = elementColor(element);
  return dataUrl(`named:${look}:${col}`, 16, 16, (g) => draw(g, namedSprites(look)[0], 0, 0, 1, col));
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

/** All owned Named as portrait buttons, in index order, plus "All N" at the end. */
export function namedStripHtml(named: NamedLook[], total: number): string {
  const list = named.slice().sort((a, b) => a.i - b.i);
  const hidden = Math.max(0, total - list.length);
  const btns = list.map((n) => {
    const col = elementColor(n.element);
    const cls = `px-nm${n.affordable ? ' aff' : ''}${n.immune ? ' imm' : ''}`;
    const label = `Level up Named ${n.i + 1} (level ${n.level})${n.immune ? ', foe is immune' : ''}${n.affordable ? ', you can afford it' : ''}`;
    return `<button type="button" class="${cls}" data-act="ally:${n.i}" data-long="namedinfo:${n.i}" style="--el:${col};--ms:${clamp01(n.milestone).toFixed(3)}" aria-label="${label}">`
      + `<span class="px-ring"></span><img class="px-face" src="${namedPortraitSrc(n.look, n.element)}" alt="" draggable="false">`
      + `<b class="px-lv"><small>Lv</small>${n.level}</b><i class="px-dot"></i><i class="px-share"><u style="width:${(clamp01(n.share) * 100).toFixed(1)}%"></u></i>`
      + (n.immune ? '<i class="px-imm" aria-hidden="true">⊘</i>' : '')
      + '</button>';
  }).join('');
  // run 2: with nobody hired yet, say what to do instead of "All 0 +1 hidden"
  if (!list.length) return `<div class="px-strip" role="group" aria-label="Named"><button type="button" class="px-all px-first" data-act="tab:named">${total ? 'Hire your first Named →' : 'The Named join you as you go deeper'}</button></div>`;
  const all = `<button type="button" class="px-all" data-act="tab:named" aria-label="Open the Named tab">Named ›${hidden ? `<small>${hidden} more to hire</small>` : `<small>${list.length} hired</small>`}</button>`;
  return `<div class="px-strip" role="group" aria-label="Named">${btns}${all}</div>`;
}

/** Append to style.css. Everything is prefixed px- so it cannot clash with the game's own classes. */
export const PIXEL_CSS = `
.px-strip .px-first { flex: 1; min-height: 44px; }
.px-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 0; pointer-events: none;
  image-rendering: pixelated; image-rendering: crisp-edges; }
.px-strip { display: flex; gap: 4px; padding: 5px 6px; overflow-x: auto; overscroll-behavior-x: contain; scrollbar-width: none;
  background: #0f0d11; border-top: 2px solid #2c2730; border-bottom: 2px solid #2c2730; -webkit-tap-highlight-color: transparent; }
.px-strip::-webkit-scrollbar { display: none; }
.px-nm { position: relative; flex: 0 0 42px; height: 48px; padding: 0; margin: 0; border: 1px solid #3a3242; border-radius: 6px;
  background: #1d1922; color: #f2e8d8; font: inherit; cursor: pointer; touch-action: manipulation; transition: filter .12s, border-color .12s; }
.px-nm:active { transform: translateY(1px); }
.px-ring { position: absolute; left: 3px; top: 2px; width: 34px; height: 34px; border-radius: 50%;
  background: conic-gradient(var(--el) calc(var(--ms) * 360deg), #ffffff14 0);
  -webkit-mask: radial-gradient(circle, transparent 15px, #000 15.5px); mask: radial-gradient(circle, transparent 15px, #000 15.5px); }
.px-face { position: absolute; left: 4px; top: 3px; width: 32px; height: 32px; image-rendering: pixelated; image-rendering: crisp-edges; pointer-events: none; }
.px-lv { position: absolute; left: 2px; bottom: 6px; font-size: 10px; line-height: 1; font-weight: 700; color: #f2e8d8;
  text-shadow: 0 1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 -1px 0 #000; font-variant-numeric: tabular-nums; }
.px-dot { position: absolute; right: 3px; top: 3px; width: 7px; height: 7px; border-radius: 50%; background: var(--el); box-shadow: 0 0 0 1px #000; }
.px-share { position: absolute; left: 3px; right: 3px; bottom: 2px; height: 3px; background: #ffffff1a; border-radius: 2px; overflow: hidden; }
.px-share u { display: block; height: 100%; background: var(--el); text-decoration: none; }
.px-nm.aff { border-color: #e9b949; box-shadow: 0 0 6px #e9b94999; animation: px-glow 1.4s ease-in-out infinite; }
.px-nm.imm .px-face, .px-nm.imm .px-ring { filter: grayscale(1) brightness(.55); }
.px-nm.imm .px-lv { color: #9a9088; }
.px-imm { position: absolute; left: 0; right: 0; top: 4px; text-align: center; font-size: 26px; line-height: 32px; font-style: normal; color: #e25b5bdd; pointer-events: none; }
.px-nm.px-hot { border-color: var(--el); filter: brightness(1.5); }
.px-all { flex: 0 0 auto; min-width: 54px; height: 48px; padding: 0 8px; border: 1px solid #3a3242; border-radius: 6px; background: #2a2430;
  color: #e9e1d2; font: inherit; font-size: 13px; line-height: 1.1; cursor: pointer; touch-action: manipulation; }
.px-all small { display: block; font-size: 10px; color: #9a9088; }
.px-lv small { font-size: 7px; font-weight: 400; margin-right: 1px; opacity: 0.8; }
.px-ic { image-rendering: pixelated; image-rendering: crisp-edges; vertical-align: middle; }
.px-item { border-radius: 4px; background: #00000059; box-shadow: inset 0 0 0 1px var(--rc, #3a3242); }
@keyframes px-glow { 50% { box-shadow: 0 0 11px #e9b949cc; } }
@media (prefers-reduced-motion: reduce) { .px-nm.aff { animation: none; } }
`;
