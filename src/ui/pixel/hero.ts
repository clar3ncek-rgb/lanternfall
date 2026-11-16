// The hero, built from layers in the style of the approved rogue / warrior / mage samples.
// Race sets skin, ears, beard and tusks; class sets clothes, headgear and the weapon / off-hand look;
// every worn slot gets its own rarity-coloured trim channel; forms re-tint skin and eyes; scars add a mark.
import { CLASSES } from '../../rules/data';
import { Grid, type Sprite, hash, light, shade } from './core';
import { rarityColor } from './palette';

export interface HeroLook {
  race: string; cls: string; form: string;
  gear: Partial<Record<string, { rarity: string; look?: string }>>;
  scars: number;
}

export const HERO_W = 40;
export const HERO_H = 32;
export type HeroPose = 'a' | 'b' | 'strike';

// Slot -> [base key, shade key] in the hero grid.
const TRIM: Record<string, [string, string]> = {
  head: ['1', '!'], shoulders: ['2', '@'], chest: ['3', '#'], hands: ['4', '$'], legs: ['5', '%'],
  feet: ['6', '^'], back: ['7', '&'], mainHand: ['8', '*'], offHand: ['9', '('], waist: ['0', ')'],
  wrists: ['W', 'V'], neck: ['N', 'N'],
};

const CLOTH: Record<string, { c: string; C: string; r: string; R: string }> = {
  rogue: { c: '#3f4f3f', C: '#29352b', r: '#2e3b33', R: '#1d2621' },
  warrior: { c: '#7a3a32', C: '#4e2420', r: '#6a2a2e', R: '#431b22' },
  mage: { c: '#4a4372', C: '#2f2a4c', r: '#3a345a', R: '#25203c' },
  ranger: { c: '#55602f', C: '#363f1d', r: '#5d4b3f', R: '#3b2f29' },
  cleric: { c: '#d8d0c2', C: '#a1978a', r: '#6b5f52', R: '#4a3f36' },
};

const RACE: Record<string, { s: string; S: string; h: string; H: string }> = {
  human: { s: '#e8b995', S: '#b57a5e', h: '#5a3a24', H: '#3a2416' },
  elf: { s: '#f0c8a8', S: '#c08a70', h: '#e0cf8a', H: '#a8925a' },
  dwarf: { s: '#e8b090', S: '#b07858', h: '#b0582a', H: '#7a3a1c' },
  orc: { s: '#86a85a', S: '#58783a', h: '#2a2420', H: '#16110f' },
  troll: { s: '#76a2a6', S: '#4a7078', h: '#c0502a', H: '#86361c' },
};

const FORM: Record<string, Partial<Record<string, string>>> = {
  mortal: {},
  vampire: { s: '#e6dfec', S: '#b4a6c2', E: '#d8202e', p: '#8a2030' },
  werewolf: { s: '#8a6a4a', S: '#5e4630', E: '#f0c040', f: '#6a4e34', F: '#46321f' },
  draconic: { s: '#6aa070', S: '#3f6a48', E: '#f0c040', a: '#e2d6b0', A: '#a3967b' },
  undead: { s: '#9aa596', S: '#6a7468', E: '#7fe8c8', w: '#2a2a2e', p: '#6a7468' },
  elemental: { s: '#a6e4ff', S: '#5aa6d6', E: '#ffffff', w: '#e0f8ff', p: '#5aa6d6', o: '#24406e' },
};

function weaponOf(h: HeroLook): string {
  const look = (h.gear.mainHand?.look || '').toLowerCase();
  for (const k of ['blade', 'axe', 'staff', 'bow', 'mace']) if (look.includes(k)) return k;
  if (/dagger|stiletto|sword/.test(look)) return 'blade';
  if (/cleaver/.test(look)) return 'axe';
  if (/rod|crook/.test(look)) return 'staff';
  if (/flail|morningstar/.test(look)) return 'mace';
  return CLASSES.find((c) => c.id === h.cls)?.weapon ?? 'blade';
}
function offHandOf(h: HeroLook): string {
  const look = (h.gear.offHand?.look || '').toLowerCase();
  for (const k of ['blade', 'shield', 'tome', 'quiver', 'relic']) if (look.includes(k)) return k;
  if (/buckler|pavise/.test(look)) return 'shield';
  if (/grimoire|codex/.test(look)) return 'tome';
  if (/reliquary|censer|symbol/.test(look)) return 'relic';
  if (/dagger|stiletto/.test(look)) return 'blade';
  return CLASSES.find((c) => c.id === h.cls)?.offHand ?? 'blade';
}
function headgearOf(h: HeroLook): string | null {
  const g = h.gear.head;
  if (!g) return null;
  const look = (g.look || '').toLowerCase();
  if (/helm/.test(look)) return 'helm';
  if (/mask/.test(look)) return 'mask';
  if (/hood|cowl/.test(look)) return h.cls === 'mage' ? 'hat' : 'hood';
  return { rogue: 'hood', warrior: 'helm', mage: 'hat', ranger: 'cap', cleric: 'cowl' }[h.cls] ?? 'hood';
}

// ---------------------------------------------------------------- layers
function layer(): Grid { return new Grid(HERO_W, HERO_H); }

function paintWeapon(g: Grid, kind: string, strike: boolean, bx: number) {
  const X = (x: number) => x + bx;
  if (!strike) {
    switch (kind) {
      case 'blade':
        g.line(X(24), 24, X(28), 19, 'n').line(X(25), 24, X(29), 19, 'm');
        g.px(X(23), 25, '8').px(X(24), 25, '8').px(X(22), 26, 'L').px(X(21), 27, '*');
        break;
      case 'axe':
        g.line(X(25), 28, X(25), 11, 'l').px(X(25), 11, 'L');
        g.rect(X(26), 12, 3, 5, 'm').rect(X(29), 11, 1, 7, 'n').px(X(26), 12, 'M').px(X(26), 16, 'M');
        g.px(X(25), 17, '8').px(X(25), 18, '8');
        break;
      case 'staff':
        g.line(X(25), 30, X(25), 6, 'l').px(X(25), 7, 'L').px(X(25), 12, 'L');
        g.ellipse(X(25), 3, 2, 2, '8').px(X(25), 3, 'y').px(X(24), 2, 'u');
        g.px(X(23), 5, 'G').px(X(27), 5, 'G');
        break;
      case 'bow':
        g.line(X(24), 12, X(24), 29, 'n');
        g.spans([[12, X(24), X(25)], [13, X(25), X(26)], [14, X(26), X(26)], [15, X(27), X(27)], [16, X(27), X(27)], [17, X(28), X(28)], [18, X(28), X(28)], [19, X(28), X(28)], [20, X(28), X(28)], [21, X(28), X(28)], [22, X(28), X(28)], [23, X(28), X(28)], [24, X(27), X(27)], [25, X(27), X(27)], [26, X(26), X(26)], [27, X(25), X(26)], [28, X(24), X(25)]], 'l');
        g.rect(X(28), 19, 1, 4, '8');
        break;
      case 'mace':
        g.line(X(25), 28, X(25), 16, 'l');
        g.ellipse(X(25), 13, 2, 2, 'm').px(X(24), 12, 'n').px(X(25), 10, 'n').px(X(22), 13, 'n').px(X(28), 13, 'n').px(X(25), 13, 'M');
        g.px(X(25), 17, '8').px(X(25), 27, '*');
        break;
    }
    return;
  }
  // strike pose: weapon thrust or swung forward
  switch (kind) {
    case 'blade':
      g.rect(X(26), 23, 9, 1, 'n').rect(X(26), 24, 8, 1, 'm').px(X(35), 23, 'u');
      g.rect(X(24), 22, 1, 3, '8').px(X(23), 23, 'L').px(X(22), 23, '*');
      break;
    case 'axe':
      g.line(X(22), 26, X(32), 17, 'l');
      g.rect(X(31), 13, 4, 5, 'm').rect(X(35), 12, 1, 7, 'n').px(X(31), 13, 'M').px(X(26), 22, '8');
      break;
    case 'staff':
      g.line(X(14), 26, X(34), 20, 'l');
      g.ellipse(X(36), 19, 2, 2, '8').px(X(36), 19, 'y').px(X(37), 18, 'y').px(X(35), 18, 'u');
      break;
    case 'bow':
      g.line(X(27), 12, X(27), 30, 'n');
      g.spans([[12, X(27), X(28)], [13, X(28), X(29)], [14, X(29), X(30)], [15, X(30), X(30)], [16, X(30), X(30)], [17, X(31), X(31)], [18, X(31), X(31)], [19, X(31), X(31)], [20, X(31), X(31)], [21, X(31), X(31)], [22, X(31), X(31)], [23, X(31), X(31)], [24, X(31), X(31)], [25, X(30), X(30)], [26, X(30), X(30)], [27, X(30), X(30)], [28, X(29), X(30)], [29, X(28), X(29)], [30, X(27), X(28)]], 'l');
      g.rect(X(31), 19, 1, 4, '8');
      g.rect(X(24), 21, 13, 1, 'L').px(X(37), 21, 'n').px(X(38), 21, 'n').px(X(24), 20, 'w').px(X(24), 22, 'w');
      break;
    case 'mace':
      g.line(X(23), 25, X(31), 18, 'l');
      g.ellipse(X(33), 16, 2, 2, 'm').px(X(33), 13, 'n').px(X(36), 16, 'n').px(X(34), 19, 'n').px(X(32), 15, 'n').px(X(27), 21, '8');
      break;
  }
}

function paintOffHand(g: Grid, kind: string, bx: number) {
  const X = (x: number) => x + bx;
  switch (kind) {
    case 'blade':
      g.line(X(8), 27, X(5), 30, 'n').line(X(9), 27, X(6), 30, 'm').px(X(9), 26, '9').px(X(10), 26, '9');
      break;
    case 'shield':
      g.spans([[18, X(4), X(9)], [19, X(3), X(10)], [20, X(3), X(10)], [21, X(3), X(10)], [22, X(3), X(10)], [23, X(3), X(10)], [24, X(3), X(10)], [25, X(4), X(9)], [26, X(5), X(8)], [27, X(6), X(7)]], '9');
      g.spans([[19, X(4), X(9)], [20, X(4), X(9)], [21, X(4), X(9)], [22, X(4), X(9)], [23, X(4), X(9)], [24, X(4), X(9)], [25, X(5), X(8)], [26, X(6), X(7)]], 'R');
      g.rect(X(6), 20, 2, 4, 'g').rect(X(5), 21, 4, 2, 'g').px(X(6), 21, 'y').px(X(4), 19, 'r');
      break;
    case 'tome':
      g.rect(X(3), 21, 6, 6, '9').rect(X(4), 22, 4, 4, '(').rect(X(9), 22, 1, 4, 'w').px(X(5), 23, 'g').px(X(6), 23, 'g').px(X(5), 24, 'g');
      break;
    case 'quiver':
      g.line(X(5), 14, X(9), 24, 'l').line(X(6), 14, X(10), 24, 'L').line(X(4), 15, X(8), 25, 'l');
      g.px(X(4), 12, 'w').px(X(5), 11, 'w').px(X(6), 12, '9').px(X(7), 11, '9').px(X(3), 13, 'n').px(X(6), 13, 'n');
      g.px(X(6), 18, '9').px(X(7), 18, '9').px(X(5), 18, '9');
      break;
    case 'relic':
      g.px(X(7), 20, 'G').rect(X(5), 21, 5, 1, '9').rect(X(5), 22, 5, 4, 'G').rect(X(6), 22, 3, 3, 'y').px(X(7), 23, 'g').rect(X(5), 26, 5, 1, '9');
      break;
  }
}

function build(h: HeroLook, pose: HeroPose): Sprite {
  const strike = pose === 'strike';
  const bx = strike ? 3 : 0;
  const X = (x: number) => x + bx;
  const has = (s: string) => !!h.gear[s];
  const weapon = weaponOf(h), off = offHandOf(h), hg = headgearOf(h);
  const race = RACE[h.race] ? h.race : 'human';
  const out = layer();
  const put = (paint: (g: Grid) => void, outline = true) => { const g = layer(); paint(g); if (outline) g.outline(); out.stamp(g); };

  // quiver sits behind everything
  if (off === 'quiver') put((g) => paintOffHand(g, 'quiver', bx));
  // cape
  if (has('back')) put((g) => {
    g.spans([[19, X(9), X(11)], [20, X(8), X(11)], [21, X(8), X(11)], [22, X(7), X(11)], [23, X(7), X(11)], [24, X(6), X(11)], [25, X(6), X(11)], [26, X(6), X(11)], [27, X(6), X(11)]], '7');
    g.spans([[28, X(6), X(11)]], '&').px(X(8), 22, '&').px(X(7), 25, '&');
  });
  // back arm (lunges back on strike)
  put((g) => {
    const ay = strike ? 0 : 0;
    g.rect(X(9), 19 + ay, 3, 5, 'C').rect(X(9), 23 + ay, 3, 1, has('wrists') ? 'V' : 'C');
    g.rect(X(8), 24 + ay, 3, 2, has('hands') ? '$' : 'S');
  });
  // legs + boots (stride on strike)
  put((g) => {
    const lx = strike ? -1 : 0, rx = strike ? 2 : 0;
    g.rect(X(12 + lx), 26, 4, 3, 'R').rect(X(17 + rx), 26, 4, 3, 'r');
    if (has('legs')) { g.rect(X(12 + lx), 27, 4, 1, '%').rect(X(17 + rx), 27, 4, 1, '5'); g.px(X(17 + rx), 26, '5'); }
    g.rect(X(12 + lx), 29, 4, 1, has('feet') ? '^' : 'L').rect(X(17 + rx), 29, 4, 1, has('feet') ? '6' : 'L');
    g.rect(X(11 + lx), 30, 5, 1, 'L').rect(X(17 + rx), 30, 5, 1, 'L');
  });
  // torso
  put((g) => {
    g.spans([[18, X(12), X(20)]], 'c');
    g.rect(X(11), 19, 11, 6, 'c').rect(X(11), 19, 2, 6, 'C').rect(X(21), 19, 1, 6, 'C');
    if (has('chest')) { g.rect(X(13), 18, 7, 1, '3').rect(X(16), 19, 1, 5, '#').rect(X(11), 24, 11, 1, '3'); }
    g.rect(X(11), 25, 11, 1, has('waist') ? ')' : 'L');
    g.rect(X(16), 25, 2, 1, has('waist') ? '0' : 'G');
    if (h.cls === 'cleric') g.rect(X(15), 20, 3, 1, 'g').rect(X(16), 19, 1, 4, 'g');
    if (has('neck')) g.px(X(16), 19, 'N').px(X(15), 18, 'G').px(X(17), 18, 'G');
    if (has('shoulders')) {
      g.rect(X(9), 18, 4, 2, '2').rect(X(9), 20, 4, 1, '@');
      g.rect(X(19), 18, 4, 2, '2').rect(X(19), 20, 4, 1, '@');
    }
  });
  // head (face + hair / headgear + race / form details)
  put((g) => {
    const H = 0;
    g.spans([[9, X(13), X(22)], [10, X(12), X(23)], [11, X(12), X(23)], [12, X(12), X(23)], [13, X(12), X(23)], [14, X(12), X(23)], [15, X(12), X(23)], [16, X(13), X(22)], [17, X(14), X(21)]], 's');
    g.spans([[15, X(21), X(23)], [16, X(19), X(22)], [17, X(18), X(21)]], 'S');
    g.rect(X(15), 18 + H, 4, 1, 'S');
    // eyes
    g.px(X(16), 12, 'w').px(X(17), 12, 'E').px(X(16), 13, 'E').px(X(17), 13, 'E');
    g.px(X(20), 12, 'w').px(X(21), 12, 'E').px(X(20), 13, 'E').px(X(21), 13, 'E');
    g.px(X(15), 14, 'p').px(X(22), 14, 'p').px(X(19), 15, 'S');
    if (h.form === 'draconic') for (let y = 9; y < 18; y++) for (let x = X(12); x <= X(23); x++) if (g.get(x, y) === 's' && (x + y * 2) % 4 === 0) g.px(x, y, 'S');
    if (h.form === 'vampire') g.px(X(18), 16, 'w').px(X(20), 16, 'w');
    if (h.form === 'werewolf') { g.rect(X(21), 13, 4, 3, 'f').rect(X(22), 15, 3, 1, 'F').px(X(24), 13, 'e').px(X(21), 13, 'f'); }
    // race
    if (race === 'elf' || race === 'troll') {
      const ear: [number, number][] = race === 'elf' ? [[11, 12], [10, 11], [9, 10], [8, 9], [11, 13], [10, 12]] : [[11, 12], [10, 12], [9, 13], [8, 14], [11, 13], [10, 13]];
      for (const [x, y] of ear) g.px(X(x), y, 's');
      g.px(X(10), race === 'elf' ? 12 : 13, 'S');
    }
    if (race === 'orc') g.px(X(11), 12, 's').px(X(10), 11, 's').px(X(11), 13, 'S');
    if (race === 'orc' || race === 'troll') g.px(X(18), 16, 'w').px(X(21), 16, 'w').px(X(18), 15, 'w');
    if (race === 'dwarf') {
      g.spans([[14, X(13), X(14)], [14, X(22), X(23)], [15, X(13), X(23)], [16, X(13), X(22)], [17, X(13), X(22)], [18, X(14), X(21)], [19, X(15), X(20)], [20, X(16), X(19)]], 'h');
      g.px(X(18), 15, 'p').px(X(19), 15, 'p').px(X(15), 17, 'H').px(X(18), 18, 'H').px(X(20), 17, 'H').px(X(17), 20, 'H');
    }
    // scars: a pale-red slash across the cheek
    if (h.scars > 0) { g.px(X(14), 11, 'x').px(X(15), 12, 'x').px(X(15), 13, 'x').px(X(16), 14, 'x'); if (h.scars > 2) g.px(X(22), 11, 'x').px(X(23), 12, 'x'); }
    // hair or headgear
    switch (hg) {
      case null:
        g.spans([[5, X(15), X(20)], [6, X(13), X(22)], [7, X(12), X(23)], [8, X(12), X(23)], [9, X(12), X(23)]], 'h');
        g.spans([[10, X(12), X(13)], [11, X(12), X(12)], [10, X(23), X(23)]], 'h').px(X(11), 9, 'H').px(X(11), 10, 'H').px(X(14), 9, 'H').px(X(18), 9, 'H');
        g.spans([[6, X(14), X(17)]], 'H');
        if (race === 'troll') g.spans([[3, X(15), X(18)], [4, X(14), X(19)]], 'h');
        break;
      case 'hood': case 'cowl': case 'mask': {
        const c = hg === 'cowl' ? 'c' : 'c';
        g.spans([[3, X(15), X(18)], [4, X(12), X(20)], [5, X(10), X(22)], [6, X(9), X(23)], [7, X(9), X(24)], [8, X(9), X(24)]], c);
        g.spans([[9, X(9), X(12)], [10, X(9), X(11)], [11, X(9), X(11)], [12, X(10), X(11)], [13, X(10), X(11)], [14, X(10), X(11)], [15, X(11), X(11)], [9, X(23), X(24)], [10, X(24), X(24)], [11, X(24), X(24)], [12, X(24), X(24)]], 'C');
        g.spans([[3, X(15), X(15)], [4, X(12), X(13)], [5, X(10), X(11)], [6, X(9), X(10)]], 'C');
        g.rect(X(13), 8, 10, 1, '1').rect(X(12), 9, 1, 7, '!').rect(X(23), 9, 1, 3, '!');
        if (hg === 'mask') g.rect(X(13), 14, 10, 3, '1').rect(X(14), 15, 8, 1, '!');
        if (hg === 'cowl') g.px(X(17), 6, 'g').px(X(17), 5, 'g').px(X(16), 6, 'g').px(X(18), 6, 'g');
        break;
      }
      case 'helm':
        g.spans([[3, X(14), X(20)], [4, X(12), X(22)], [5, X(11), X(23)], [6, X(11), X(23)], [7, X(11), X(23)], [8, X(11), X(23)]], 'm');
        g.spans([[3, X(15), X(18)], [4, X(13), X(16)], [5, X(12), X(14)]], 'n');
        g.rect(X(11), 9, 13, 1, '1').rect(X(11), 10, 2, 5, 'M').rect(X(23), 10, 1, 2, 'M').rect(X(18), 10, 1, 2, 'M');
        g.spans([[1, X(12), X(16)], [2, X(11), X(15)], [3, X(9), X(12)], [4, X(8), X(10)]], '!');
        g.spans([[1, X(13), X(15)], [2, X(12), X(13)]], '1');
        break;
      case 'hat':
        g.spans([[0, X(9), X(10)], [1, X(10), X(13)], [2, X(12), X(16)], [3, X(14), X(18)], [4, X(14), X(19)], [5, X(13), X(20)], [6, X(12), X(21)]], 'c');
        g.spans([[1, X(10), X(11)], [3, X(14), X(14)], [5, X(13), X(14)]], 'C');
        g.rect(X(11), 7, 13, 1, '1').rect(X(8), 8, 19, 1, 'C').rect(X(9), 8, 17, 1, 'c').px(X(17), 4, 'g').px(X(18), 5, 'y');
        g.spans([[9, X(12), X(23)]], 'h');
        break;
      case 'cap':
        g.spans([[5, X(14), X(20)], [6, X(12), X(22)], [7, X(12), X(23)], [8, X(12), X(23)]], 'c').rect(X(12), 8, 12, 1, '1');
        g.rect(X(19), 9, 7, 1, 'C').rect(X(12), 9, 2, 3, 'h').px(X(23), 9, 'h');
        g.line(X(12), 6, X(8), 1, '1').line(X(11), 6, X(7), 2, '!');
        break;
    }
    if (race === 'elf' && hg && hg !== 'helm') { g.px(X(8), 9, 's').px(X(9), 10, 's'); }
    // form extras on top of the head
    if (h.form === 'werewolf') g.spans([[1, X(13), X(13)], [2, X(13), X(14)], [3, X(12), X(14)], [1, X(20), X(20)], [2, X(19), X(20)], [3, X(19), X(21)]], 'f').px(X(13), 3, 'F').px(X(20), 3, 'F');
    if (h.form === 'draconic') g.line(X(12), 5, X(9), 1, 'a').px(X(10), 3, 'A').line(X(20), 4, X(22), 1, 'a');
  });
  // off hand (in front of the back arm) and front arm, weapon, hand
  if (off !== 'quiver') put((g) => paintOffHand(g, off, bx));
  put((g) => {
    if (strike) { g.rect(X(21), 20, 4, 3, 'c').rect(X(24), 21, 1, 1, has('wrists') ? 'W' : 'c'); }
    else { g.rect(X(21), 19, 3, 4, 'c').rect(X(21), 22, 3, 1, has('wrists') ? 'W' : 'c'); }
  });
  put((g) => paintWeapon(g, weapon, strike, bx));
  put((g) => {
    if (strike) g.rect(X(24), 21, 2, 3, has('hands') ? '4' : 's');
    else g.rect(X(22), 23, 3, 2, has('hands') ? '4' : 's');
  });
  if (pose === 'b') out.shiftRows(0, 24, 1);
  out.outline();
  return out.sprite(palette(h));
}

export function heroPalette(h: HeroLook): Record<string, string> { return palette(h); }

function palette(h: HeroLook): Record<string, string> {
  const cloth = CLOTH[h.cls] ?? CLOTH.rogue;
  const race = RACE[h.race] ?? RACE.human;
  const p: Record<string, string> = {
    ...cloth, ...race,
    w: '#f6ecd4', e: '#221a22', E: '#221a22', p: '#c97b70', x: '#d06a6a',
    l: '#7a5436', L: '#4a3226', m: '#a9a49c', n: '#e2ddd0', M: '#69646a',
    g: '#e9b949', G: '#a8752a', y: '#fff2ae', u: '#fff6e0', f: '#6a4e34', F: '#46321f', a: '#e2d6b0', A: '#a3967b',
  };
  // trims: worn slots take their rarity colour; empty slots fall back to plain colours
  const fallback: Record<string, string> = { mainHand: '#a8752a', offHand: '#9d9d9d', waist: '#a8752a' };
  for (const [slot, [k, k2]] of Object.entries(TRIM)) {
    const g = h.gear[slot];
    const col = g ? rarityColor(g.rarity) : (fallback[slot] ?? cloth.C);
    p[k] = col;
    p[k2] = slot === 'neck' ? light(col) : shade(col);
  }
  Object.assign(p, FORM[h.form] ?? {});
  return p;
}

const cache = new Map<string, Sprite>();
export function heroSig(h: HeroLook): string {
  return JSON.stringify([h.race, h.cls, h.form, h.scars > 0 ? (h.scars > 2 ? 2 : 1) : 0, Object.entries(h.gear).filter(([, v]) => v).map(([k, v]) => [k, v!.rarity, v!.look ?? '']).sort()]);
}
export function heroSprite(h: HeroLook, pose: HeroPose): Sprite {
  const key = heroSig(h) + pose;
  let s = cache.get(key);
  if (!s) {
    s = build(h, pose);
    if (cache.size > 60) cache.clear();
    cache.set(key, s);
  }
  return s;
}
export const heroSeed = (h: HeroLook) => hash(heroSig(h));
