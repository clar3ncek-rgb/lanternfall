// Colour lookups shared by every pixel module. Reads the game's tables but never changes them.
import { ELEMENT_COLOR, RARITIES } from '../../rules/data';

export function elementColor(id: string): string {
  return (ELEMENT_COLOR as Record<string, string>)[id] ?? (id.startsWith('#') ? id : '#b8b0a4');
}
export function rarityColor(id: string): string {
  const r = RARITIES.find((x) => x.id === id);
  if (r) return r.color;
  if (id.startsWith('#')) return id;
  return '#9d9d9d';
}

/** Realm tints (escapes): ash red, sea teal, winter ice, court crimson, astral violet. */
export const REALM_TINT: Record<string, string> = {
  ash: '#d0502a', sea: '#2fa39a', winter: '#a8dcf4', court: '#b4203c', astral: '#8a5ad8',
};
export const realmTint = (id?: string) => (id && REALM_TINT[id]) || '#8a5ad8';

export const OUTLINE = '#1b1418';
export const GOLD = '#e9b949';
