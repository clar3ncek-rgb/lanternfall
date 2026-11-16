// All game content for Unwritten Tapper. Names marked [main game] come from
// The Unwritten design log; everything else is a PROPOSAL for this spin-off and
// can be replaced when the main game settles its own version.

export type Attr = 'str' | 'agi' | 'sta' | 'int' | 'spi';
export const ATTRS: Attr[] = ['str', 'agi', 'sta', 'int', 'spi'];
export const ATTR_NAME: Record<Attr, string> = {
  str: 'Strength', agi: 'Agility', sta: 'Stamina', int: 'Intellect', spi: 'Spirit',
};
export const ATTR_HELP: Record<Attr, string> = {
  str: 'Main stat for Warriors: more tap damage.',
  agi: 'More crit chance and crit damage. Main stat for Rogues and Rangers.',
  sta: 'More time to beat each boss.',
  int: 'More mana and stronger skills. Main stat for Mages.',
  spi: 'Faster mana and stronger Named allies. Main stat for Clerics.',
};

/** Percent / flat stats that gear, skills, Faith, forms, rites and scars all add into. */
export type StatKey =
  | Attr
  | 'weapon' // flat weapon damage (main and off hand)
  | 'tapPct' | 'allyPct' | 'critChance' | 'critDmg' | 'bossPct' | 'goldPct'
  | 'timerSec' | 'skillPct' | 'manaRegen' | 'manaMax' | 'lootLuck' | 'emberPct' | 'offlinePct'
  // v2: elements (Diablo II set) and immunity piercing
  | 'physPct' | 'magicPct' | 'firePct' | 'coldPct' | 'lightPct' | 'poisonPct'
  | 'piercePhys' | 'pierceMagic' | 'pierceFire' | 'pierceCold' | 'pierceLight' | 'piercePoison' | 'pierceAll'
  // v2: systems
  | 'overkillPct' | 'fairyRate' | 'treasureRate' | 'wanderRate' | 'dungeonSec' | 'petPct' | 'xpPct' | 'markPct'
  | 'dmgPct' // run 5: damage from every source (taps, Named, pets, spells); the only damage stat race, faith and form may give
  | 'autoTap' | 'normalPct' | 'bossGoldPct' | 'treasureGoldPct' | 'durationSec' | 'cooldownPct'
  // v2: % to the base stats of gear worn in one slot type
  | 'headPct' | 'neckPct' | 'shouldersPct' | 'backPct' | 'chestPct' | 'wristsPct' | 'handsPct' | 'waistPct'
  | 'legsPct' | 'feetPct' | 'ringPct' | 'trinketPct' | 'mainHandPct' | 'offHandPct';

export const STAT_LABEL: Record<StatKey, string> = {
  str: 'Strength', agi: 'Agility', sta: 'Stamina', int: 'Intellect', spi: 'Spirit',
  weapon: 'Weapon damage', tapPct: '% tap damage', allyPct: '% Named damage',
  critChance: '% crit chance', critDmg: '% crit damage', bossPct: '% damage to bosses', dmgPct: '% damage (every source)',
  goldPct: '% gold', timerSec: 's boss time', skillPct: '% skill power',
  manaRegen: 'mana per second', manaMax: 'max mana', lootLuck: '% better loot',
  emberPct: '% Embers', offlinePct: '% offline gold',
  physPct: '% physical damage', magicPct: '% magic damage', firePct: '% fire damage', coldPct: '% cold damage',
  lightPct: '% lightning damage', poisonPct: '% poison damage',
  piercePhys: '% physical piercing', pierceMagic: '% magic piercing', pierceFire: '% fire piercing',
  pierceCold: '% cold piercing', pierceLight: '% lightning piercing', piercePoison: '% poison piercing', pierceAll: '% piercing (all)',
  overkillPct: '% overkill carried', fairyRate: '% fairy rate', treasureRate: '% treasure-foe rate', wanderRate: '% wandering-boss rate',
  dungeonSec: 's dungeon clock', petPct: '% pet power', xpPct: '% XP', markPct: '% Marks', autoTap: 'free taps per second',
  normalPct: '% damage to normal foes', bossGoldPct: '% gold from bosses', treasureGoldPct: '% treasure-foe gold',
  durationSec: 's skill duration', cooldownPct: '% shorter cooldowns',
  headPct: '% head gear stats', neckPct: '% neck gear stats', shouldersPct: '% shoulder gear stats', backPct: '% back gear stats',
  chestPct: '% chest gear stats', wristsPct: '% wrist gear stats', handsPct: '% hand gear stats', waistPct: '% waist gear stats',
  legsPct: '% leg gear stats', feetPct: '% feet gear stats', ringPct: '% ring stats', trinketPct: '% trinket stats',
  mainHandPct: '% main-hand stats', offHandPct: '% off-hand stats',
};

/** Diablo II damage types [main game: "follow D2 for now"]. */
export type Element = 'phys' | 'magic' | 'fire' | 'cold' | 'light' | 'poison';
export const ELEMENTS: Element[] = ['phys', 'magic', 'fire', 'cold', 'light', 'poison'];
export const ELEMENT_NAME: Record<Element, string> = { phys: 'Physical', magic: 'Magic', fire: 'Fire', cold: 'Cold', light: 'Lightning', poison: 'Poison' };
export const ELEMENT_COLOR: Record<Element, string> = { phys: '#b8b0a4', magic: '#a855d8', fire: '#f08a24', cold: '#3f8fe0', light: '#f0d040', poison: '#3fbf4a' };
export const ELEMENT_PCT: Record<Element, StatKey> = { phys: 'physPct', magic: 'magicPct', fire: 'firePct', cold: 'coldPct', light: 'lightPct', poison: 'poisonPct' };
export const ELEMENT_PIERCE: Record<Element, StatKey> = { phys: 'piercePhys', magic: 'pierceMagic', fire: 'pierceFire', cold: 'pierceCold', light: 'pierceLight', poison: 'piercePoison' };

export type Stats = Partial<Record<StatKey, number>>;

// ---------------------------------------------------------------- races [main game]
export interface Race { id: string; name: string; attrs: Record<Attr, number>; text: string }
export const RACES: Race[] = [
  // run 5 (Clarence): race must help every class equally, so every race starts with the same attributes; its rule is the difference
  { id: 'human', name: 'Human', attrs: { str: 6, agi: 6, sta: 6, int: 6, spi: 6 }, text: 'Adaptable: two shrine offerings in every land, and +10% gold.' },
  { id: 'elf', name: 'Elf', attrs: { str: 6, agi: 6, sta: 6, int: 6, spi: 6 }, text: 'Keen: elites come 50% more often, and a swift elite takes 12 s to flee.' },
  { id: 'dwarf', name: 'Dwarf', attrs: { str: 6, agi: 6, sta: 6, int: 6, spi: 6 }, text: 'Patient: +3 s on every boss clock, and the Forge costs half.' },
  { id: 'orc', name: 'Orc', attrs: { str: 6, agi: 6, sta: 6, int: 6, spi: 6 }, text: 'Brutal: damage left over from a kill carries twice as far, and +10% to normal foes.' },
  { id: 'troll', name: 'Troll', attrs: { str: 6, agi: 6, sta: 6, int: 6, spi: 6 }, text: 'Regrowth: a failed boss keeps the damage you dealt for the retry, and a failed escape leaves no scar.' },
];

// ---------------------------------------------------------------- skill trees
export type ActiveKind = 'tapBuff' | 'allyBuff' | 'critBuff' | 'autoTap' | 'freeze' | 'goldBuff' | 'dot' | 'burst' | 'dmgBuff';

export interface SkillNode {
  id: string;
  name: string;
  /** Warrior Berserker only: % of leftover damage carried to the next foes (cleave), per rank. */
  cleave?: number;
  branch: string; // '' for the foundation node
  tier: number; // 0 foundation, 1..3 down the branch
  kind: 'active' | 'passive';
  /** passive: stat added per rank */
  stat?: StatKey;
  perRank?: number;
  /** active: what it does */
  active?: ActiveKind;
  mana?: number;
  cooldown?: number; // seconds
  duration?: number; // seconds (0 for instant)
  text: string;
  mainGame?: boolean; // name comes from The Unwritten log
}

export const MAX_RANK = 5;

export const ACTIVE_HELP: Record<ActiveKind, (r: number) => string> = {
  tapBuff: (r) => `Taps deal x${(1 + 0.5 * r).toFixed(1)} damage.`,
  allyBuff: (r) => `Named deal x${(1 + 0.6 * r).toFixed(1)} damage.`,
  critBuff: (r) => `+${15 + 5 * r}% crit chance.`,
  autoTap: (r) => `Strikes ${4 + 2 * r} times a second by itself.`,
  freeze: (r) => `Stops the boss clock for ${3 + r} seconds.`,
  goldBuff: (r) => `x${1 + r} gold from kills.`,
  dot: (r) => `Each second deals ${50 * r}% of a tap's damage.`,
  burst: (r) => `Instantly strikes ${10 + 6 * r} times.`,
  dmgBuff: (r) => `+${Math.round(40 * r)}% damage from every source.`,
};

function tree(prefix: string, nodes: Omit<SkillNode, 'id'>[]): SkillNode[] {
  return nodes.map((n, i) => ({ ...n, id: `${prefix}${i}` }));
}

const A = (name: string, branch: string, tier: number, active: ActiveKind, mana: number, cooldown: number, duration: number, text: string, mainGame = false): Omit<SkillNode, 'id'> =>
  ({ name, branch, tier, kind: 'active', active, mana, cooldown, duration, text, mainGame });
const P = (name: string, branch: string, tier: number, stat: StatKey, perRank: number, text: string, mainGame = false): Omit<SkillNode, 'id'> =>
  ({ name, branch, tier, kind: 'passive', stat, perRank, text, mainGame });

export interface ClassDef {
  id: string;
  name: string;
  main: Attr;
  branches: string[];
  text: string;
  weapon: 'blade' | 'axe' | 'staff' | 'bow' | 'mace';
  offHand: 'blade' | 'shield' | 'tome' | 'quiver' | 'relic';
  tree: SkillNode[];
}

export const CLASSES: ClassDef[] = [
  {
    id: 'warrior', name: 'Warrior', main: 'str', weapon: 'axe', offHand: 'shield',
    text: 'Big hits and a long boss clock.',
    branches: ['Guardian', 'Berserker', 'Duelist'],
    tree: tree('wa', [
      P('Weapon Fundamentals', '', 0, 'tapPct', 10, 'Plain good technique.', true),
      P('Guard Discipline', 'Guardian', 1, 'timerSec', 1, 'Hold out longer against bosses.', true),
      A('Shield Intercept', 'Guardian', 2, 'freeze', 30, 60, 0, 'Lock the boss in place.', true),
      P('Last Bastion', 'Guardian', 3, 'bossPct', 15, 'Hit harder when it matters.', true),
      { ...A('Battle Fury', 'Berserker', 1, 'tapBuff', 25, 45, 20, 'Rage into every swing. Cleaves into the next foe.', true), cleave: 8 },
      { ...P('Blood Momentum', 'Berserker', 2, 'critDmg', 20, 'Wounds feed the next blow. Cleaves deeper.', true), cleave: 8 },
      { ...A('Unbroken Rage', 'Berserker', 3, 'burst', 40, 50, 0, 'A storm of blows at once. Cleaves deepest.', true), cleave: 4 },
      P('Measured Footwork', 'Duelist', 1, 'critChance', 2, 'Find the gap.', true),
      A('Riposte', 'Duelist', 2, 'critBuff', 25, 45, 15, 'Turn every opening into a crit.', true),
      P('Perfect Opening', 'Duelist', 3, 'tapPct', 25, 'Your best cuts land.', true),
    ]),
  },
  {
    id: 'mage', name: 'Mage', main: 'int', weapon: 'staff', offHand: 'tome',
    text: 'Strong skills, lots of mana.',
    branches: ['Elementalist', 'Chronomancer', 'Battlemage'],
    tree: tree('ma', [
      P('Arcane Study', '', 0, 'skillPct', 10, 'Every spell a little stronger.'),
      A('Ember Bolt', 'Elementalist', 1, 'burst', 25, 30, 0, 'Hurl a volley of fire.'),
      P('Kindling', 'Elementalist', 2, 'tapPct', 15, 'Your strikes smoulder.'),
      A('Firestorm', 'Elementalist', 3, 'dot', 40, 50, 15, 'The ground burns under the foe.'),
      A('Slow Hour', 'Chronomancer', 1, 'freeze', 30, 60, 0, 'Hold the boss clock still.'),
      P('Borrowed Time', 'Chronomancer', 2, 'timerSec', 1, 'More seconds against bosses.'),
      P('Echo', 'Chronomancer', 3, 'manaRegen', 0.2, 'Mana returns faster.'),
      A('Spellblade', 'Battlemage', 1, 'tapBuff', 25, 45, 20, 'Wrap your staff in force.'),
      P('Runed Edge', 'Battlemage', 2, 'critDmg', 20, 'Crits crackle.'),
      P('Deep Well', 'Battlemage', 3, 'manaMax', 10, 'Hold more mana.'),
    ]),
  },
  {
    id: 'rogue', name: 'Rogue', main: 'agi', weapon: 'blade', offHand: 'blade',
    text: 'Crits, poison and quick bursts.',
    branches: ['Assassin', 'Trickster', 'Survivor'],
    tree: tree('ro', [
      A('Twinfang', '', 0, 'tapBuff', 20, 40, 20, 'Two quick strikes for every tap.', true),
      A("Widow's Kiss", 'Assassin', 1, 'dot', 30, 45, 15, 'Poison that keeps biting.', true),
      P('Cut Deep', 'Assassin', 2, 'bossPct', 15, 'Go for the vitals.'),
      A('Nightfall Flurry', 'Assassin', 3, 'burst', 40, 50, 0, 'A sudden flurry of cuts.', true),
      P('Blackstep', 'Trickster', 1, 'critChance', 2, 'Step through shadow to the blind side.', true),
      P('False Opening', 'Trickster', 2, 'critDmg', 25, 'Feint, then strike true.', true),
      A('Hushblade', 'Trickster', 3, 'freeze', 30, 60, 0, 'Silence the foe and stop the boss clock.', true),
      P('Last Witness', 'Survivor', 1, 'goldPct', 10, 'You see what others miss.'),
      P('Old Debts', 'Survivor', 2, 'allyPct', 15, 'The Named fight harder for you.'),
      P('Ash Memory', 'Survivor', 3, 'skillPct', 10, 'You remember every lesson.'),
    ]),
  },
  {
    id: 'ranger', name: 'Ranger', main: 'agi', weapon: 'bow', offHand: 'quiver',
    text: 'Arrows that fly by themselves, beast and wood.',
    branches: ['Marksman', 'Beastmaster', 'Thornwarden'],
    tree: tree('ra', [
      P('Steady Aim', '', 0, 'critChance', 1, 'Breathe, then loose.'),
      A('Volley', 'Marksman', 1, 'autoTap', 25, 45, 15, 'Arrows fly on their own.'),
      P('Long Draw', 'Marksman', 2, 'critDmg', 20, 'Heavier shots.'),
      A('Rain of Arrows', 'Marksman', 3, 'burst', 40, 50, 0, 'The sky darkens with shafts.'),
      A('Call the Pack', 'Beastmaster', 1, 'allyBuff', 25, 45, 20, 'Your hounds join the Named.'),
      P('Pack Bond', 'Beastmaster', 2, 'allyPct', 15, 'The Named hunt as one.'),
      P("Hunter's Share", 'Beastmaster', 3, 'goldPct', 15, 'Nothing goes to waste.'),
      P('Bark Skin', 'Thornwarden', 1, 'timerSec', 1, 'Outlast the boss.'),
      A('Briar Snare', 'Thornwarden', 2, 'freeze', 30, 60, 0, 'Roots hold the boss and its clock.'),
      P('Thorn Tips', 'Thornwarden', 3, 'tapPct', 20, 'Every arrow barbed.'),
    ]),
  },
  {
    id: 'cleric', name: 'Cleric', main: 'spi', weapon: 'mace', offHand: 'relic',
    text: 'Strongest Named, wards and holy fire.',
    branches: ['Templar', 'Oracle', 'Inquisitor'],
    tree: tree('cl', [
      P('Rite of Names', '', 0, 'allyPct', 10, 'Speak the names of the dead.'),
      A('Consecrate', 'Templar', 1, 'allyBuff', 25, 45, 20, 'Bless the Named.'),
      P('Oathbound', 'Templar', 2, 'allyPct', 20, 'The dead keep their oaths.'),
      P('Sanctuary', 'Templar', 3, 'timerSec', 1, 'Hold the line longer.'),
      A('Foresight', 'Oracle', 1, 'freeze', 30, 60, 0, 'See it coming; the boss clock waits.'),
      P('Clear Sight', 'Oracle', 2, 'manaRegen', 0.2, 'Prayer comes easier.'),
      P('Tithe', 'Oracle', 3, 'goldPct', 15, 'The dead give up their coin.'),
      A('Judgement', 'Inquisitor', 1, 'tapBuff', 25, 45, 20, 'Your mace rings with verdict.'),
      P('Zeal', 'Inquisitor', 2, 'critChance', 2, 'Strike without doubt.'),
      A('Purging Flame', 'Inquisitor', 3, 'dot', 40, 50, 15, 'Holy fire clings to the wicked.'),
    ]),
  },
];

// ---------------------------------------------------------------- Faith (working names from the main log, section 28)
export interface Faith { id: string; name: string; stats: Stats; text: string }
export const FAITHS: Faith[] = [
  // run 5 (Clarence): a faith decides what you chase, and helps every class the same
  { id: 'lantern', name: 'Lantern Covenant', stats: { wanderRate: 100 }, text: 'Guard the lost. Wandering bosses come twice as often and stay twice as long.' },
  { id: 'redhunt', name: 'Red Hunt', stats: {}, text: 'Every fight a worthy hunt. Elites come twice as often and pay 8x gold; hunts pay double.' },
  { id: 'archive', name: 'Silent Archive', stats: { markPct: 50, fairyRate: 100 }, text: 'Keep names and truth. +50% Marks, and wisps come twice as often.' },
  { id: 'iron', name: 'Iron Testament', stats: { lootLuck: 10 }, text: 'Honour your tools. Bosses drop gear twice as often, better loot, and salvage pays 3x.' },
  { id: 'veiled', name: 'Veiled Balance', stats: { emberPct: 25 }, text: 'Pay your debts to the dead. +25% Embers, and the tithe can reach +40%.' },
  { id: 'unbound', name: 'Unbound', stats: {}, text: 'No patron, only conviction. Events come twice as often and last 50% longer.' },
];

// ---------------------------------------------------------------- transformations [main game roster]
export interface Form { id: string; name: string; stats: Stats; text: string }
export const FORMS: Form[] = [
  // run 5 (Clarence): a transformation must help every class the same, so each gives one class-neutral strength and one weakness
  { id: 'mortal', name: 'Mortal Master', stats: { dmgPct: 10, goldPct: 10 }, text: 'No transformation. +10% damage and gold, no weakness.' },
  { id: 'vampire', name: 'Vampire', stats: { bossPct: 50, timerSec: -3 }, text: '+50% damage to bosses (every source). Weakness: -3 s boss time.' },
  { id: 'werewolf', name: 'Werewolf', stats: { normalPct: 60, goldPct: -15 }, text: '+60% damage to normal foes (every source). Weakness: -15% gold.' },
  { id: 'draconic', name: 'Draconic', stats: { goldPct: 50, treasureGoldPct: 100, dmgPct: -10 }, text: '+50% gold, treasure foes pay double. Weakness: -10% damage.' },
  { id: 'undead', name: 'Undead', stats: { emberPct: 30, dmgPct: 15, timerSec: -2 }, text: '+30% Embers and +15% damage. Weakness: -2 s boss time.' },
  { id: 'elemental', name: 'Elemental', stats: { pierceAll: 30, goldPct: -10 }, text: 'Every source pierces immunities by 30%. Weakness: -10% gold.' },
];

// ---------------------------------------------------------------- the Named (allies)
export interface Ally { id: string; name: string; unlockStage: number; costBase: number; dpsBase: number; look: string; text: string }
// Each Named is a dead soul of Lanternfall whose stolen name you win back.
const allyNames: [string, string, string][] = [
  ['Hed the Gravedigger', 'spade', 'Dug the graves. Now fills them.'],
  ['Orla the Lampwright', 'lamp', 'Her lamps still burn the dead.'],
  ['Brother Tamsin', 'monk', 'Prays with his fists.'],
  ['Mirela Ashcombe', 'archer', 'Never missed a crow in life.'],
  ['Old Corvin', 'spear', 'Fought in three wars. Still fighting.'],
  ['Sister Nell', 'nun', 'Her hymns burn the Nameless.'],
  ['Jory Halfmark', 'thief', 'Only half his name came back.'],
  ['Wenna of the Ferry', 'oar', 'Rowed the dead. Now rows them back.'],
  ['The Drowned Captain', 'captain', 'Brought his crew. All of it.'],
  ['Abbot Rusk', 'abbot', 'Knew the Bishop. Wants him gone.'],
];
export const ALLIES: Ally[] = allyNames.map(([name, look, text], i) => ({
  id: `n${i}`, name, look, text,
  unlockStage: [1, 3, 8, 15, 25, 40, 60, 85, 120, 160][i],
  costBase: 30 * Math.pow(11, i),
  dpsBase: 3 * Math.pow(9.2, i),
}));

// ---------------------------------------------------------------- world zones
export interface Zone {
  from: number; name: string; foes: string[]; boss: string; sky: string; ground: string;
  /** Run 3: bosses that take turns by stage (boss stays the first one), the land's favourite immunity, and its arrival line. */
  bosses?: string[]; immune?: Element; line?: string;
  /** Run 3: past stage 500 the deep lands repeat as "Deeper" copies; base is the land index they copy (for art and special foes). */
  base?: number;
}
export const ZONES: Zone[] = [
  { from: 1, name: 'Lanternfall Graves', foes: ['Grave Scavenger', 'Rot Hound', 'Shovel Ghoul'], boss: 'Gravewarden', bosses: ['Gravewarden', "The Sexton's Widow", 'The Lantern-Keeper'], sky: '#2a2a33', ground: '#2f2b24' },
  { from: 26, name: 'Blackroot Approach', foes: ['Blackroot Crawler', 'Thorn Corpse', 'Crow Swarm'], boss: 'The Root-Mother', bosses: ['The Root-Mother', 'The Crow-King', 'The Blackroot Hunter'], sky: '#1f2a24', ground: '#232a1d' },
  { from: 51, name: 'The Broken Causeway', foes: ['Reach Guardian', 'Blinking Acolyte', 'Bog Wretch'], boss: 'Causeway Keeper', bosses: ['Causeway Keeper', 'The Drowned Ferryman', 'The Reach-Captain'], sky: '#232633', ground: '#262a2e' },
  { from: 76, name: 'Shrine Antechamber', foes: ['Nameless Monk', 'Bell Ringer', 'Hollow Choir'], boss: 'Choirmaster', bosses: ['Choirmaster', 'The Candle-Abbess', 'The Shrine Sentinel'], sky: '#2b2230', ground: '#2a2128' },
  { from: 101, name: 'Beneath the Bell', foes: ['Nameless Knight', 'Bell-Bound', 'Erased One'], boss: 'Echo of the Bishop', bosses: ['Echo of the Bishop', 'The Tongueless Monk', 'The Bell-Warden'], sky: '#1c1a22', ground: '#1f1b1b' },
  // run 3 fix round: land 5 split in two (Clarence approved, 11 Nov 2026; LORE-DRAFT.md)
  { from: 126, name: 'The Bellrope Descent', foes: ['Rope-Hanged', 'Soot Chorister', 'Clapper Imp'], boss: 'The Rope-Keeper', bosses: ['The Rope-Keeper', 'The Hanged Cantor', 'The Knell'], immune: 'light', line: "The Bell's rope runs down into the dark. Something is climbing up it.", sky: '#1a1820', ground: '#1c1716' },
];
/** Index of The Bellrope Descent in ZONES (the first land with an arrival card). */
export const BELLROPE = 5;
export const BISHOP_EVERY = 50; // the Hollow Bishop himself guards every 50th stage [main game]

/**
 * Run 3: the lands below the Bell (stages 151 to 500, one every 50). Names are Claude's DRAFT from The Unwritten's design log
 * (LORE-DRAFT.md). Until Clarence approves them, LORE_APPROVED stays false and the game shows the placeholder names instead.
 */
export const LORE_APPROVED = true; // Clarence approved LORE-DRAFT.md, 11 Nov 2026
interface DeepLand { name: string; foes: string[]; bosses: string[]; immune: Element; line: string; sky: string; ground: string; treasure: string; wanderer: string }
const DEEP_LANDS: DeepLand[] = [
  { name: 'The Drowned Belfry', foes: ['Drowned Bellhand', 'Silt Mourner', 'Tide Wraith'], bosses: ['The Sunken Toller', 'Mother of Silt', 'The Bellwater Thing'], immune: 'cold', line: "The bell's first tower lies drowned below. Its rope still moves.", sky: '#14222c', ground: '#122027', treasure: 'The Wreck-Picker', wanderer: 'The Drowned Verger' },
  { name: 'The Root Cathedral', foes: ['Root-Bound Priest', 'Sap Leech', 'Thorn Choir'], bosses: ['The Rooted Abbot', 'The Briar Saint', 'The Heartwood'], immune: 'poison', line: "Blackroot's roots reach this far down, and here they pray.", sky: '#1a2618', ground: '#1e2416', treasure: 'The Amber Hoarder', wanderer: 'The Walking Grove' },
  { name: 'The Ossuary of Names', foes: ['Name-Eater', 'Bone Clerk', 'Scratched Stone'], bosses: ['The Archivist of the Lost', 'The Unnamer', 'The Ledger of Bones'], immune: 'phys', line: 'Every name the Bishop took is kept here, filed in bone.', sky: '#262320', ground: '#2a251f', treasure: "The Grave-Robber's Ghost", wanderer: 'The Nameless Pilgrim' },
  { name: 'The Ash Stair', foes: ['Cinder Pilgrim', 'Ash Hound', 'Ember Moth'], bosses: ['The Stair Warden', 'The Kiln-Mother', 'The Smouldering Choir'], immune: 'fire', line: 'The stair grows warm. The Ashborn say the Hells breathe up through it.', sky: '#2e1a14', ground: '#2a1812', treasure: 'The Ashen Pedlar', wanderer: 'The Burning Penitent' },
  { name: 'The Hall of Silent Bells', foes: ['Muted Bell', 'Silent Sister', 'Echo Shade'], bosses: ['The Hushed Abbess', 'Bellmaw', 'The Last Peal'], immune: 'magic', line: 'Here every bell has had its tongue cut out.', sky: '#1e1c2c', ground: '#1c1a26', treasure: 'The Clapper-Thief', wanderer: 'The Bell That Walks' },
  { name: 'The Red Assizes', foes: ['Blood Juror', 'Gallows Clerk', 'Oathbreaker'], bosses: ['The Hanging Judge', 'The Red Bailiff', 'Verdict-in-Chains'], immune: 'light', line: 'Below the Bell the dead are tried again. Nobody has won.', sky: '#2c1418', ground: '#261216', treasure: 'The Bribe-Taker', wanderer: 'The Acquitted' },
  { name: "The Bishop's Undercroft", foes: ['Hollow Deacon', 'Bell-Bound Martyr', 'Unwritten One'], bosses: ["The Bishop's Shadow", 'The Thousand-Named', 'The Bell Unrung'], immune: 'magic', line: "The Hollow Bishop's own vault. The stolen bell hangs here, silent, waiting.", sky: '#17151c', ground: '#18141a', treasure: 'The Reliquary Thief', wanderer: "The Bishop's Hound" },
];
/** Placeholder names shown until the lore is approved. Foe words keep their art archetype (drowned, root, bone, ash, bell). */
const PLACEHOLDER = (i: number, d: DeepLand): DeepLand => LORE_APPROVED ? d : {
  ...d, name: `Land ${i + 6}`, line: 'A new land below the Bell. (Names wait for approval.)',
  foes: ['Deep Foe', 'Deep Crawler', 'Deep Shade'], bosses: ['Deep Boss', 'Deep Warden', 'Deep Keeper'],
  treasure: 'Deep Hoarder', wanderer: 'Deep Wanderer',
};
export const DEEP_SHOWN: DeepLand[] = DEEP_LANDS.map((d, i) => PLACEHOLDER(i, d));
/** The last land of the table ends here; deeper stages repeat lands 6 to 12. */
export const LANDS_END = 500;
export const LAND_SPAN = 50;
for (const [i, d] of DEEP_SHOWN.entries()) {
  ZONES.push({ from: 151 + i * LAND_SPAN, name: d.name, foes: d.foes, boss: d.bosses[0], bosses: d.bosses, immune: d.immune, line: d.line, sky: d.sky, ground: d.ground });
}
const darker = (hex: string) => '#' + [1, 3, 5].map((k) => Math.round(parseInt(hex.slice(k, k + 2), 16) * 0.7).toString(16).padStart(2, '0')).join('');
const DEEPER_CACHE: Zone[] = [];
/** Index of the first deep land (land 6) in ZONES. */
export const FIRST_DEEP = ZONES.length - DEEP_SHOWN.length;

export function zoneFor(stage: number): Zone {
  if (stage > LANDS_END) {
    const k = Math.floor((stage - LANDS_END - 1) / LAND_SPAN);
    const base = FIRST_DEEP + (k % DEEP_SHOWN.length);
    const lap = Math.floor(k / DEEP_SHOWN.length) + 1;
    const key = k;
    if (!DEEPER_CACHE[key]) {
      const b = ZONES[base];
      DEEPER_CACHE[key] = { ...b, from: LANDS_END + 1 + k * LAND_SPAN, name: `Deeper${lap > 1 ? ` ${lap}` : ''}: ${b.name}`, sky: darker(b.sky), ground: darker(b.ground), line: 'Deeper still. The bell is louder here.', base };
    }
    return DEEPER_CACHE[key];
  }
  let z = ZONES[0];
  for (const zz of ZONES) if (stage >= zz.from) z = zz;
  return z;
}

// ---------------------------------------------------------------- death realms [main game, section 6]
export interface Realm { id: string; name: string; foe: string; gate: string; scarBias: string[]; sky: string; ground: string; text: string }
export const REALMS: Realm[] = [
  { id: 'ash', name: 'Ashen Hells', foe: 'Cinder Penitent', gate: 'The Ash Warden', scarBias: ['burned', 'tendon'], sky: '#3a1f17', ground: '#2a1a14', text: 'Fire that never finishes.' },
  { id: 'sea', name: 'Hollow Sea', foe: 'Drowned Chorister', gate: 'The Lantern Eel', scarBias: ['lungs', 'memory'], sky: '#142530', ground: '#10202a', text: 'Black water full of voices.' },
  { id: 'winter', name: 'Winter Sepulchre', foe: 'Frost Reliquary', gate: 'The Sepulchre Keeper', scarBias: ['frostbite', 'tendon'], sky: '#26303a', ground: '#2a3138', text: 'Cold that keeps what it takes.' },
  { id: 'court', name: 'Bleeding Court', foe: 'Blood Clerk', gate: 'The Magistrate in Red', scarBias: ['debt', 'faith'], sky: '#2e1420', ground: '#24121a', text: 'Every sin has a price.' },
  { id: 'astral', name: 'Astral Wastes', foe: 'Star-scoured Pilgrim', gate: 'The Unmoored', scarBias: ['memory', 'eye'], sky: '#1d1a33', ground: '#1a1828', text: 'Nothing holds you here.' },
];
export const ESCAPE_SECONDS = 300;
export const ESCAPE_FOES = 24; // then the gate boss
export const SPECIAL_CHANCE = 1 / 8;

// ---------------------------------------------------------------- scars (permanent, unlimited; healed only by special prize or Embers)
export interface ScarDef { id: string; name: string; stats: Stats; text: string }
export const SCARS: ScarDef[] = [
  { id: 'tendon', name: 'Torn Tendon', stats: { tapPct: -6 }, text: '-6% tap damage' },
  { id: 'burned', name: 'Burned Hands', stats: { critDmg: -15 }, text: '-15% crit damage' },
  { id: 'eye', name: 'Clouded Eye', stats: { critChance: -1.5 }, text: '-1.5% crit chance' },
  { id: 'lungs', name: 'Drowned Lungs', stats: { timerSec: -1 }, text: '-1 s boss time' },
  { id: 'memory', name: 'Lost Memory', stats: { skillPct: -8 }, text: '-8% skill power' },
  { id: 'frostbite', name: 'Frostbite', stats: { manaRegen: -0.1 }, text: '-0.1 mana per second' },
  { id: 'faith', name: 'Shaken Faith', stats: { allyPct: -6 }, text: '-6% Named damage' },
  { id: 'debt', name: 'Blood Debt', stats: { goldPct: -6 }, text: '-6% gold' },
];

// ---------------------------------------------------------------- Ember rites (permanent upgrades bought with Embers)
export interface Rite { id: string; name: string; stat: StatKey; perLevel: number; costBase: number; costGrowth: number; maxLevel?: number; compound?: boolean; text: string }
export const RITES: Rite[] = [
  { id: 'grip', name: 'Ashen Grip', stat: 'tapPct', perLevel: 20, costBase: 1, costGrowth: 1.25, compound: true, text: 'Tap damage (x1.2 per level)' },
  { id: 'names', name: 'Remembered Names', stat: 'allyPct', perLevel: 20, costBase: 1, costGrowth: 1.25, compound: true, text: 'Named damage (x1.2 per level)' },
  { id: 'coin', name: "Ferryman's Coin", stat: 'goldPct', perLevel: 15, costBase: 2, costGrowth: 1.25, text: 'Gold' },
  { id: 'night', name: 'The Long Night', stat: 'timerSec', perLevel: 1, costBase: 3, costGrowth: 1.6, maxLevel: 20, text: 'Boss time' },
  { id: 'mind', name: 'Kindled Mind', stat: 'skillPct', perLevel: 15, costBase: 2, costGrowth: 1.25, text: 'Skill power' },
  { id: 'luck', name: 'Grave Luck', stat: 'lootLuck', perLevel: 5, costBase: 4, costGrowth: 1.45, maxLevel: 30, text: 'Better loot' },
  { id: 'wick', name: 'Lantern Wick', stat: 'offlinePct', perLevel: 10, costBase: 3, costGrowth: 1.4, maxLevel: 25, text: 'Offline gold' },
  { id: 'hoard', name: 'Ember Hoard', stat: 'emberPct', perLevel: 8, costBase: 5, costGrowth: 1.5, text: 'Embers from each return' },
  { id: 'edge', name: 'Grave Edge', stat: 'critDmg', perLevel: 20, costBase: 2, costGrowth: 1.3, text: 'Crit damage' },
];

// ---------------------------------------------------------------- equipment [main game slots, WoW-style]
export type Slot =
  | 'head' | 'neck' | 'shoulders' | 'back' | 'chest' | 'wrists' | 'hands' | 'waist'
  | 'legs' | 'feet' | 'ring1' | 'ring2' | 'trinket1' | 'trinket2' | 'mainHand' | 'offHand';
export const SLOTS: Slot[] = ['head', 'neck', 'shoulders', 'back', 'chest', 'wrists', 'hands', 'waist', 'legs', 'feet', 'ring1', 'ring2', 'trinket1', 'trinket2', 'mainHand', 'offHand'];
export const SLOT_NAME: Record<Slot, string> = {
  head: 'Head', neck: 'Neck', shoulders: 'Shoulders', back: 'Back', chest: 'Chest', wrists: 'Wrists', hands: 'Hands',
  waist: 'Waist', legs: 'Legs', feet: 'Feet', ring1: 'Ring', ring2: 'Ring', trinket1: 'Trinket', trinket2: 'Trinket',
  mainHand: 'Main hand', offHand: 'Off hand',
};
/** Which slot kind an item fits (rings/trinkets fit either of their pair). */
export type ItemSlot = Exclude<Slot, 'ring2' | 'trinket2'>;
export const ITEM_SLOTS: ItemSlot[] = ['head', 'neck', 'shoulders', 'back', 'chest', 'wrists', 'hands', 'waist', 'legs', 'feet', 'ring1', 'trinket1', 'mainHand', 'offHand'];

export type Rarity = 'poor' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'artifact' | 'ancestry' | 'set';
export interface RarityDef { id: Rarity; name: string; color: string; mult: number; affixes: [number, number]; weight: number }
// [main game] rarity ladder and colours (section 44)
export const RARITIES: RarityDef[] = [
  { id: 'poor', name: 'Poor', color: '#9d9d9d', mult: 0.6, affixes: [0, 0], weight: 18 },
  { id: 'common', name: 'Common', color: '#e8e4dc', mult: 1, affixes: [0, 0], weight: 34 },
  { id: 'uncommon', name: 'Uncommon', color: '#3fbf4a', mult: 1.15, affixes: [1, 2], weight: 30 },
  { id: 'rare', name: 'Rare', color: '#3f8fe0', mult: 1.3, affixes: [3, 5], weight: 14 },
  { id: 'epic', name: 'Epic', color: '#a855d8', mult: 1.5, affixes: [4, 5], weight: 3.5 },
  { id: 'legendary', name: 'Legendary', color: '#f08a24', mult: 1.8, affixes: [5, 6], weight: 0.5 },
  { id: 'artifact', name: 'Artifact', color: '#d8243c', mult: 1.8, affixes: [3, 4], weight: 0 },
  { id: 'ancestry', name: 'Ancestry', color: '#e6d49a', mult: 1.4, affixes: [2, 3], weight: 0 },
  // v2: realm set pieces from dungeons (teal, so it does not clash with Uncommon green)
  { id: 'set', name: 'Set', color: '#2fc8a8', mult: 2.0, affixes: [0, 0], weight: 0 },
];
export const rarityDef = (r: Rarity) => RARITIES.find((x) => x.id === r)!;

/** Affixes that can roll on gear, with value per item level step. */
export const AFFIXES: { stat: StatKey; base: number; perLevel: number; weapon?: boolean }[] = [
  { stat: 'tapPct', base: 4, perLevel: 0.25 },
  { stat: 'allyPct', base: 4, perLevel: 0.25 },
  { stat: 'critChance', base: 0.6, perLevel: 0.01 },
  { stat: 'critDmg', base: 6, perLevel: 0.3 },
  { stat: 'bossPct', base: 5, perLevel: 0.3 },
  { stat: 'goldPct', base: 4, perLevel: 0.2 },
  { stat: 'timerSec', base: 0.4, perLevel: 0.005 },
  { stat: 'skillPct', base: 4, perLevel: 0.25 },
  { stat: 'manaRegen', base: 0.05, perLevel: 0.002 },
];

/** Base item names by slot, per weapon kind for hands. Original names. */
export const BASE_NAMES: Record<string, string[]> = {
  head: ['Hood', 'Cowl', 'Helm', 'Mask'], neck: ['Pendant', 'Choker', 'Amulet'], shoulders: ['Pauldrons', 'Mantle', 'Spaulders'],
  back: ['Cloak', 'Shroud', 'Cape'], chest: ['Jerkin', 'Hauberk', 'Robe', 'Brigandine'], wrists: ['Bracers', 'Wraps', 'Cuffs'],
  hands: ['Gloves', 'Gauntlets', 'Grips'], waist: ['Belt', 'Girdle', 'Sash'], legs: ['Leggings', 'Greaves', 'Breeches'],
  feet: ['Boots', 'Sabatons', 'Treads'], ring1: ['Ring', 'Band', 'Signet'], trinket1: ['Charm', 'Idol', 'Token', 'Fetish'],
  blade: ['Dagger', 'Short Blade', 'Stiletto'], axe: ['Axe', 'Cleaver', 'War Axe'], staff: ['Staff', 'Rod', 'Crook'],
  bow: ['Bow', 'Longbow', 'Recurve'], mace: ['Mace', 'Flail', 'Morningstar'],
  shield: ['Buckler', 'Kite Shield', 'Pavise'], tome: ['Tome', 'Grimoire', 'Codex'], quiver: ['Quiver'], relic: ['Reliquary', 'Censer', 'Holy Symbol'],
};
export const PREFIXES = ['Grave', 'Ashen', 'Hollow', 'Lantern', 'Blackroot', 'Nameless', 'Bell-Cast', 'Pale', 'Mourning', 'Sunken', 'Wicked', 'Thorned'];
export const SUFFIXES = ['of Embers', 'of the Ferry', 'of Silence', 'of the Last Witness', 'of Rot', 'of Names', 'of the Long Night', 'of Tolling', 'of Dust', 'of the Hunt'];

/** Crimson Artifacts: rule-benders, one equipped at a time [main game rule]. Effects are tap-game proposals. */
export interface ArtifactDef { id: string; name: string; slot: ItemSlot; rule: string; text: string }
export const ARTIFACTS: ArtifactDef[] = [
  { id: 'nail', name: "Pilgrim's Nail", slot: 'mainHand', rule: 'nail', text: 'Every tap also deals 25% of your Named damage per second. Taps deal 25% less.' },
  { id: 'bellclapper', name: 'Cracked Clapper', slot: 'trinket1', rule: 'clapper', text: 'Boss clock is 10 s longer, but normal foes have 25% more health.' },
  { id: 'ferrycoin', name: "Ferryman's Last Coin", slot: 'neck', rule: 'coin', text: 'Gold from bosses is doubled. Gold from normal foes is halved.' },
  { id: 'nameless', name: 'Mask of the Nameless', slot: 'head', rule: 'mask', text: 'Crits deal triple damage, but crit chance is capped at 30%.' },
];

/** Starting Ancestry heirloom (pale gold). Vaelis-style family heirloom; the tap-game rule is a proposal. */
export const HEIRLOOM = { name: 'Hearth-Locket', slot: 'trinket1' as ItemSlot, rule: 'locket', text: 'Remembers. When you return from death you keep 5% of the gold you had.' };

export const BAG_SIZE = 40;
