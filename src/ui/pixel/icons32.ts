// 32 px framed icons: the registry. Each group file adds its own; see icon-kit.ts for the palette and frame rules.
import { dataUrl, draw, escAttr } from './core';
import { FRAME, P, newArt, paintFrame, type IconDef } from './icon-kit';
import { ICONS as warrior } from './icons/warrior';
import { ICONS as mage } from './icons/mage';
import { ICONS as rogue } from './icons/rogue';
import { ICONS as ranger } from './icons/ranger';
import { ICONS as cleric } from './icons/cleric';
import { ICONS as formsa } from './icons/formsa';
import { ICONS as formsb } from './icons/formsb';
import { ICONS as races } from './icons/races';
import { ICONS as general } from './icons/general';

export const ALL_ICONS: Record<string, IconDef> = { ...warrior, ...mage, ...rogue, ...ranger, ...cleric, ...formsa, ...formsb, ...races, ...general };

export const hasIcon32 = (id: string) => id in ALL_ICONS;

/** The icon as an <img>, or '' when it has not been drawn yet. */
export function icon32(id: string, size = 32, cls = ''): string {
  const def = ALL_ICONS[id];
  if (!def) return '';
  const col = FRAME[def.frame] ?? def.frame;
  const src = dataUrl(`i32:${id}`, 32, 32, (ctx) => {
    paintFrame(ctx, col, /ult|t7$/.test(def.frame === 'ult' ? 'ult' : id));
    const g = newArt();
    def.art(g);
    g.outline('o');
    draw(ctx, g.sprite(def.pal ? { ...P, ...def.pal } : P), 2, 2);
  });
  return `<img class="px-ic px32 ${cls}" src="${src}" width="${size}" height="${size}" alt="" draggable="false" data-i32="${escAttr(id)}">`;
}
