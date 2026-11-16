// Hand-made SVG chibi sprites. No AI images. Equipment drawn on the body,
// trimmed in its rarity colour, so new gear shows up on the hero.

import type { Item, State } from '../rules/game';
import { rarityDef, type Slot } from '../rules/data';

const SKIN: Record<string, string> = {
  human: '#c9a385', elf: '#b8b4b0', dwarf: '#c08a6e', orc: '#7d8a62', troll: '#6f8a8c',
};
const HAIR: Record<string, string> = {
  human: '#3b2a20', elf: '#e8e4dc', dwarf: '#8a4a2a', orc: '#1e1e1e', troll: '#c25a3a',
};
const MATERIAL = ['#4a4038', '#3d4248', '#5a4a3a', '#3a3640', '#4f3a32', '#41483f'];

function mat(it: Item | undefined, fallback: string): string {
  return it ? MATERIAL[it.id % MATERIAL.length] : fallback;
}
function trim(it: Item | undefined): string {
  return it ? rarityDef(it.rarity).color : 'none';
}
function glows(it: Item | undefined): boolean {
  return !!it && ['epic', 'legendary', 'artifact', 'ancestry'].includes(it.rarity);
}

function weapon(look: string | undefined, it: Item | undefined): string {
  const t = trim(it);
  const m = mat(it, '#6b6258');
  const g = glows(it) ? ' filter="url(#glow)"' : '';
  switch (look) {
    case 'axe':
      return `<g${g}><rect x="76" y="40" width="4" height="44" rx="2" fill="#5a4030"/><path d="M80 42 q16 4 14 18 q-8 -4 -14 -2z" fill="#9a9a96" stroke="${t}" stroke-width="1.5"/></g>`;
    case 'staff':
      return `<g${g}><rect x="77" y="28" width="4" height="66" rx="2" fill="#5a4030"/><circle cx="79" cy="26" r="7" fill="${it ? t : '#8a8aa0'}" opacity="0.85"/><circle cx="79" cy="26" r="3" fill="#fff8" /></g>`;
    case 'bow':
      return `<g${g}><path d="M74 34 q20 28 0 56" fill="none" stroke="${m}" stroke-width="4"/><path d="M74 34 q20 28 0 56" fill="none" stroke="${t}" stroke-width="1"/><line x1="74" y1="34" x2="74" y2="90" stroke="#ddd" stroke-width="0.8"/></g>`;
    case 'mace':
      return `<g${g}><rect x="77" y="46" width="4" height="38" rx="2" fill="#5a4030"/><circle cx="79" cy="44" r="8" fill="#8d8d88" stroke="${t}" stroke-width="1.5"/><path d="M79 33v-3M88 44h3M70 44h-3M79 55v2" stroke="#8d8d88" stroke-width="3"/></g>`;
    case 'blade':
    default:
      return `<g${g}><rect x="74" y="72" width="10" height="3" rx="1" fill="${t === 'none' ? '#7a6a50' : t}"/><path d="M77 72 L79 40 L81 72 Z" fill="#c4c4c0" stroke="${t}" stroke-width="0.8"/><rect x="77.5" y="75" width="3" height="8" fill="#4a3426"/></g>`;
  }
}

function offhand(look: string | undefined, it: Item | undefined): string {
  if (!it) return '';
  const t = trim(it);
  const m = mat(it, '#555');
  const g = glows(it) ? ' filter="url(#glow)"' : '';
  switch (look) {
    case 'shield':
      return `<g${g}><path d="M14 62 h22 v14 q-11 14 -22 0z" fill="${m}" stroke="${t}" stroke-width="2"/><circle cx="25" cy="70" r="3" fill="${t}"/></g>`;
    case 'tome':
      return `<g${g}><rect x="16" y="68" width="16" height="20" rx="2" fill="${m}" stroke="${t}" stroke-width="1.5"/><rect x="18" y="70" width="2" height="16" fill="${t}"/></g>`;
    case 'quiver':
      return `<g${g}><rect x="30" y="56" width="8" height="26" rx="3" fill="${m}" stroke="${t}" stroke-width="1" transform="rotate(-20 34 70)"/><path d="M28 54l-2 -6M32 53l0 -7M36 54l2 -6" stroke="#ccc" stroke-width="1.2"/></g>`;
    case 'relic':
      return `<g${g}><line x1="22" y1="62" x2="22" y2="70" stroke="#777" stroke-width="1"/><rect x="16" y="70" width="12" height="14" rx="3" fill="${m}" stroke="${t}" stroke-width="1.5"/><circle cx="22" cy="77" r="3" fill="#f2c56a" opacity="0.9"/></g>`;
    case 'blade':
    default:
      return `<g${g}><path d="M21 74 L18 50 L24 74 Z" fill="#c4c4c0" stroke="${t}" stroke-width="0.8"/><rect x="16" y="74" width="10" height="3" rx="1" fill="${t}"/></g>`;
  }
}

/** The player's chibi, facing right. */
export function heroSvg(s: State, opts: { scale?: number } = {}): string {
  const e = s.equipped;
  const race = s.hero.race;
  const form = s.hero.form;
  let skin = SKIN[race] ?? SKIN.human;
  if (form === 'undead') skin = '#a3b29a';
  if (form === 'vampire') skin = '#d8d2cc';
  const hair = HAIR[race] ?? '#333';
  const eye = form === 'vampire' ? '#e0303a' : form === 'undead' ? '#9cff9c' : form === 'elemental' ? '#7fd8ff' : form === 'werewolf' ? '#f2b23a' : '#1c1c1c';
  const it = (k: Slot) => e[k];
  const cloth = '#3a332c';
  const parts: string[] = [];
  parts.push(`<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`);
  parts.push(`<ellipse cx="50" cy="113" rx="24" ry="5" fill="#0008"/>`);
  if (form === 'elemental') parts.push(`<circle cx="50" cy="70" r="40" fill="#7fd8ff" opacity="0.08"/>`);
  // cloak behind
  if (it('back')) parts.push(`<path d="M34 64 Q30 96 26 108 L74 108 Q70 96 66 64Z" fill="${mat(it('back'), '#2a2a2a')}" stroke="${trim(it('back'))}" stroke-width="1.5"/>`);
  if (e.offHand?.look === 'quiver') parts.push(offhand('quiver', e.offHand));
  // legs and boots
  const legs = mat(it('legs'), cloth);
  parts.push(`<rect x="39" y="88" width="9" height="18" rx="3" fill="${legs}" stroke="${trim(it('legs'))}" stroke-width="1"/>`);
  parts.push(`<rect x="52" y="88" width="9" height="18" rx="3" fill="${legs}" stroke="${trim(it('legs'))}" stroke-width="1"/>`);
  const boots = it('feet') ? mat(it('feet'), '#2b231d') : '#2b231d';
  parts.push(`<rect x="37" y="103" width="13" height="8" rx="3" fill="${boots}" stroke="${trim(it('feet'))}" stroke-width="1"/>`);
  parts.push(`<rect x="51" y="103" width="13" height="8" rx="3" fill="${boots}" stroke="${trim(it('feet'))}" stroke-width="1"/>`);
  // off-hand arm (behind)
  const gloves = it('hands') ? mat(it('hands'), skin) : skin;
  parts.push(`<rect x="22" y="66" width="10" height="18" rx="5" fill="${mat(it('chest'), cloth)}"/>`);
  parts.push(`<circle cx="26" cy="85" r="5" fill="${gloves}" stroke="${trim(it('hands'))}" stroke-width="1"/>`);
  if (e.offHand && e.offHand.look !== 'quiver') parts.push(offhand(e.offHand.look, e.offHand));
  // torso
  parts.push(`<rect x="33" y="62" width="34" height="30" rx="9" fill="${mat(it('chest'), cloth)}" stroke="${trim(it('chest'))}" stroke-width="1.6"/>`);
  if (it('waist')) parts.push(`<rect x="33" y="84" width="34" height="5" fill="${mat(it('waist'), '#2a2018')}" stroke="${trim(it('waist'))}" stroke-width="1"/><rect x="47" y="84" width="6" height="5" fill="${trim(it('waist'))}"/>`);
  if (it('neck')) parts.push(`<circle cx="50" cy="68" r="3" fill="${trim(it('neck'))}"${glows(it('neck')) ? ' filter="url(#glow)"' : ''}/>`);
  if (form === 'werewolf') parts.push(`<path d="M35 72 l4 3 l-4 3 M65 72 l-4 3 l4 3" stroke="#6b5a48" stroke-width="2" fill="none"/>`);
  // main arm and weapon
  parts.push(weapon(e.mainHand?.look, e.mainHand));
  parts.push(`<rect x="66" y="66" width="10" height="16" rx="5" fill="${mat(it('chest'), cloth)}"/>`);
  if (it('wrists')) parts.push(`<rect x="66" y="76" width="10" height="4" fill="${mat(it('wrists'), '#555')}" stroke="${trim(it('wrists'))}" stroke-width="1"/>`);
  parts.push(`<circle cx="79" cy="78" r="5" fill="${gloves}" stroke="${trim(it('hands'))}" stroke-width="1"/>`);
  // shoulders
  if (it('shoulders')) {
    const m = mat(it('shoulders'), '#555');
    const t = trim(it('shoulders'));
    parts.push(`<ellipse cx="33" cy="64" rx="9" ry="6" fill="${m}" stroke="${t}" stroke-width="1.5"/><ellipse cx="67" cy="64" rx="9" ry="6" fill="${m}" stroke="${t}" stroke-width="1.5"/>`);
  }
  // head
  const ears =
    race === 'elf' ? `<path d="M30 40 L14 28 L32 46Z M70 40 L86 28 L68 46Z" fill="${skin}"/>`
    : race === 'troll' ? `<path d="M30 42 L12 46 L31 50Z M70 42 L88 46 L69 50Z" fill="${skin}"/>`
    : race === 'orc' ? `<path d="M29 42 L22 36 L31 48Z M71 42 L78 36 L69 48Z" fill="${skin}"/>`
    : `<circle cx="28" cy="44" r="4" fill="${skin}"/><circle cx="72" cy="44" r="4" fill="${skin}"/>`;
  parts.push(ears);
  if (form === 'werewolf') parts.push(`<path d="M32 26 L30 12 L40 22Z M68 26 L70 12 L60 22Z" fill="#6b5a48"/>`);
  if (form === 'draconic') parts.push(`<path d="M36 24 Q30 10 26 8 Q36 12 40 22Z M64 24 Q70 10 74 8 Q64 12 60 22Z" fill="#4a3a2e" stroke="#c48a3a" stroke-width="0.8"/>`);
  parts.push(`<circle cx="50" cy="42" r="22" fill="${skin}"/>`);
  if (!it('head')) parts.push(`<path d="M28 40 Q30 18 50 18 Q72 18 72 38 Q62 28 50 30 Q38 28 28 40Z" fill="${hair}"/>`);
  parts.push(`<ellipse cx="57" cy="45" rx="2.6" ry="3.4" fill="${eye}"/><ellipse cx="67" cy="45" rx="2.4" ry="3.2" fill="${eye}"/>`);
  if (form === 'vampire' || form === 'undead' || form === 'elemental') parts.push(`<ellipse cx="57" cy="45" rx="4" ry="5" fill="${eye}" opacity="0.25"/><ellipse cx="67" cy="45" rx="4" ry="5" fill="${eye}" opacity="0.25"/>`);
  if (race === 'dwarf') parts.push(`<path d="M40 52 Q50 74 66 52 Q58 58 50 56 Q44 58 40 52Z" fill="${hair}"/>`);
  if (race === 'orc' || race === 'troll') parts.push(`<path d="M56 56 l1 -5 l2 5z M64 56 l1 -5 l2 5z" fill="#eee8d8"/>`);
  if (form === 'vampire') parts.push(`<path d="M60 55 l1 3 l1 -3z M64 55 l1 3 l1 -3z" fill="#fff"/>`);
  // scars show as a mark across the face
  if (s.scars.length) parts.push(`<path d="M44 34 L52 50" stroke="#7a3030" stroke-width="1.6" opacity="${Math.min(1, 0.4 + s.scars.length * 0.15)}"/>`);
  if (it('head')) {
    const m = mat(it('head'), '#444');
    const t = trim(it('head'));
    const hood = it('head')!.id % 2 === 0;
    parts.push(hood
      ? `<path d="M26 46 Q24 16 50 14 Q78 16 76 46 Q72 30 50 30 Q30 30 26 46Z" fill="${m}" stroke="${t}" stroke-width="1.6"/><path d="M48 14 L44 4 L56 14Z" fill="${m}"/>`
      : `<path d="M27 40 Q28 16 50 16 Q72 16 73 40 L73 44 L27 44Z" fill="${m}" stroke="${t}" stroke-width="1.6"/><rect x="48" y="16" width="4" height="26" fill="${t}" opacity="0.6"/>`);
  }
  const sc = opts.scale ?? 1;
  return `<svg viewBox="0 0 100 120" width="${100 * sc}" height="${120 * sc}" class="sprite hero-sprite">${parts.join('')}</svg>`;
}

type Kind = 'beast' | 'humanoid' | 'swarm' | 'spirit' | 'bishop' | 'brute';

function kindFor(name: string, boss: boolean): Kind {
  const n = name.toLowerCase();
  if (n.includes('bishop')) return 'bishop';
  if (/hound|crawler|eel|wretch/.test(n)) return 'beast';
  if (/swarm|crow/.test(n)) return 'swarm';
  if (/choir|chorister|echo|erased|unmoored|pilgrim|nameless|spirit/.test(n)) return 'spirit';
  if (boss || /guardian|keeper|warden|mother|knight|magistrate/.test(n)) return 'brute';
  return 'humanoid';
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Enemy chibi, facing left. Tinted by zone or realm. */
export function foeSvg(name: string, boss: boolean, tint: string): string {
  const k = kindFor(name, boss);
  const h = hash(name);
  const body = ['#5b5148', '#4e5550', '#5a4a4e', '#4a4a58', '#5e5a44'][h % 5];
  const eye = boss ? '#ff5a3a' : '#e8d27a';
  const p: string[] = [`<ellipse cx="50" cy="113" rx="26" ry="5" fill="#0008"/>`];
  switch (k) {
    case 'beast':
      p.push(`<ellipse cx="52" cy="84" rx="30" ry="18" fill="${body}"/>`,
        `<circle cx="28" cy="72" r="16" fill="${body}"/>`,
        `<path d="M18 60 l-4 -12 l10 8z M32 58 l2 -12 l6 10z" fill="${body}"/>`,
        `<circle cx="22" cy="70" r="3" fill="${eye}"/><circle cx="31" cy="70" r="3" fill="${eye}"/>`,
        `<path d="M16 80 l4 4 l4 -4 l4 4 l4 -4" stroke="#ddd" stroke-width="1.5" fill="none"/>`,
        `<rect x="30" y="96" width="8" height="14" rx="3" fill="${body}"/><rect x="64" y="96" width="8" height="14" rx="3" fill="${body}"/>`);
      break;
    case 'swarm':
      for (let i = 0; i < 9; i++) {
        const x = 20 + ((h >> i) % 60);
        const y = 40 + ((h >> (i + 3)) % 55);
        p.push(`<path d="M${x} ${y} l-8 -4 l8 2 l8 -2z" fill="#1c1c1c"/><circle cx="${x - 1}" cy="${y}" r="1" fill="${eye}"/>`);
      }
      break;
    case 'spirit':
      p.push(`<path d="M30 110 Q34 60 50 40 Q66 60 70 110 Q62 100 58 110 Q54 100 50 110 Q46 100 42 110 Q38 100 30 110Z" fill="${body}" opacity="0.85"/>`,
        `<circle cx="50" cy="44" r="20" fill="#d8d4cc" opacity="0.9"/>`,
        `<ellipse cx="42" cy="44" rx="4" ry="6" fill="#111"/><ellipse cx="56" cy="44" rx="4" ry="6" fill="#111"/>`,
        `<ellipse cx="49" cy="56" rx="4" ry="5" fill="#111"/>`);
      break;
    case 'bishop':
      p.push(`<path d="M24 110 Q28 64 50 56 Q72 64 76 110Z" fill="#2a2430" stroke="#c8b27a" stroke-width="1.5"/>`,
        `<path d="M50 60 v46" stroke="#c8b27a" stroke-width="2"/>`,
        `<circle cx="50" cy="44" r="18" fill="#cfc8bc"/>`,
        `<path d="M34 34 L50 4 L66 34Z" fill="#e8e0cc" stroke="#c8b27a" stroke-width="1.5"/><path d="M50 8 v24 M44 18 h12" stroke="#a03030" stroke-width="2"/>`,
        `<ellipse cx="43" cy="46" rx="3" ry="4" fill="#111"/><ellipse cx="55" cy="46" rx="3" ry="4" fill="#111"/>`,
        `<path d="M16 66 h10 l2 6 h-14z" fill="#8a7a50"/><path d="M14 72 q7 14 14 0z" fill="#9a8a5a" stroke="#c8b27a"/><line x1="21" y1="56" x2="21" y2="66" stroke="#8a7a50" stroke-width="2"/>`);
      break;
    case 'brute':
      p.push(`<rect x="26" y="58" width="48" height="40" rx="14" fill="${body}"/>`,
        `<circle cx="50" cy="42" r="20" fill="${body}"/>`,
        `<path d="M32 30 l-6 -12 l12 8z M68 30 l6 -12 l-12 8z" fill="#8a8070"/>`,
        `<circle cx="42" cy="42" r="3.4" fill="${eye}"/><circle cx="54" cy="42" r="3.4" fill="${eye}"/>`,
        `<rect x="14" y="62" width="12" height="26" rx="6" fill="${body}"/><rect x="74" y="62" width="12" height="26" rx="6" fill="${body}"/>`,
        `<rect x="34" y="96" width="12" height="14" rx="4" fill="${body}"/><rect x="54" y="96" width="12" height="14" rx="4" fill="${body}"/>`,
        `<rect x="6" y="40" width="5" height="50" rx="2" fill="#5a4030"/><rect x="0" y="34" width="17" height="12" rx="3" fill="#8a8a86"/>`);
      break;
    default:
      p.push(`<rect x="36" y="62" width="28" height="30" rx="8" fill="${body}"/>`,
        `<circle cx="50" cy="44" r="19" fill="#9a9488"/>`,
        `<circle cx="42" cy="44" r="3" fill="${eye}"/><circle cx="53" cy="44" r="3" fill="${eye}"/>`,
        `<path d="M40 54 h14" stroke="#3a3a3a" stroke-width="2"/>`,
        `<rect x="40" y="90" width="8" height="18" rx="3" fill="${body}"/><rect x="52" y="90" width="8" height="18" rx="3" fill="${body}"/>`,
        `<rect x="26" y="64" width="9" height="18" rx="4" fill="${body}"/><rect x="65" y="64" width="9" height="18" rx="4" fill="${body}"/>`,
        h % 2 ? `<rect x="20" y="44" width="3" height="40" fill="#6a5a44"/><path d="M14 40 h15 l-3 8 h-9z" fill="#8a8a86"/>` : `<path d="M22 82 L18 56 L26 82Z" fill="#aaa"/>`);
  }
  if (boss) p.push(`<circle cx="50" cy="70" r="46" fill="${tint}" opacity="0.10"/>`);
  return `<svg viewBox="0 0 100 120" class="sprite foe-sprite${boss ? ' boss' : ''}">${p.join('')}</svg>`;
}

/** Small ghost of a Named ally standing behind the hero. */
export function namedSvg(look: string, i: number): string {
  const hue = ['#9fb3c8', '#c8b89f', '#b3c89f', '#c89fb3', '#9fc8c0'][i % 5];
  const prop: Record<string, string> = {
    spade: `<rect x="34" y="10" width="2" height="26" fill="${hue}"/><rect x="31" y="34" width="8" height="6" fill="${hue}"/>`,
    lamp: `<circle cx="34" cy="24" r="4" fill="#f2c56a"/>`,
    monk: `<circle cx="34" cy="26" r="3" fill="${hue}"/>`,
    archer: `<path d="M32 10 q8 14 0 28" stroke="${hue}" fill="none" stroke-width="1.6"/>`,
    spear: `<rect x="33" y="2" width="2" height="38" fill="${hue}"/><path d="M31 4 l3 -6 l3 6z" fill="${hue}"/>`,
    nun: `<path d="M8 14 q12 -12 24 0 v8 h-24z" fill="#ddd" opacity="0.7"/>`,
    thief: `<path d="M30 30 l6 -12 l1 12z" fill="${hue}"/>`,
    oar: `<rect x="33" y="4" width="2" height="34" fill="${hue}" transform="rotate(15 34 20)"/>`,
    captain: `<path d="M6 10 h28 l-4 -6 h-20z" fill="#333"/>`,
    abbot: `<rect x="32" y="6" width="3" height="34" fill="#c8b27a"/><circle cx="33.5" cy="6" r="3" fill="#c8b27a"/>`,
  };
  return `<svg viewBox="0 0 40 50" class="named" style="--d:${(i % 5) * 0.3}s"><path d="M8 48 Q8 22 20 14 Q32 22 32 48 Q26 42 20 48 Q14 42 8 48Z" fill="${hue}" opacity="0.55"/><circle cx="20" cy="14" r="9" fill="${hue}" opacity="0.7"/><circle cx="23" cy="13" r="1.4" fill="#111"/><circle cx="17" cy="13" r="1.4" fill="#111"/>${prop[look] ?? ''}</svg>`;
}
