// Tier content (T1..T7) for classes and transformations. All PROPOSALS for the
// tap spin-off; only names marked mainGame come from The Unwritten design log.
//
// Classes: T1 = base class (foundation node). T2..T6 = a subclass (branch): its
// existing branch tiers 1, 2, 3 open at T2, T3, T4; the nodes below open at T5
// and T6; T7 is the subclass ultimate.
// Forms: T1..T3 open FORM_TREES rows 0..2; the nodes below open at T4..T6; T7 is
// the form ultimate (pure, single-form characters only; 'mastery' is Mortal Master).
//
// Weakness rule: form nodes never add the stat their weakness takes away
// (Vampire time, Werewolf weapon, Draconic gold, Undead mana regen, Elemental
// crit chance). The existing "Control" nodes already soften each by half.

import type { ActiveKind, StatKey } from './data';
import type { Effect, Rule, RuleKind } from './content-types';

export interface TierNode { id: string; name: string; tier: number; max: number; effect: Effect; text: string; mainGame?: boolean }
export interface Ultimate { id: string; name: string; active: ActiveKind; r: number; mana: number; cooldown: number; duration: number; icon: string; text: string }

import { neutralizeTree, neutralizeUltimate } from './neutral';
const st2 = (stat: StatKey, per: number, stat2: StatKey, per2: number): Effect => ({ stat, per, stat2, per2 });
const rl = (kind: RuleKind, a: number, more: Partial<Rule> = {}): Effect => ({ rule: { kind, a, ...more } });

const RANKS = 5;

type Extra = { nodes: TierNode[]; ultimate: Ultimate; titles: string[] };

type NodeSpec = [name: string, effect: Effect, text: string, mainGame?: boolean];
type UltSpec = [name: string, active: ActiveKind, r: number, mana: number, cooldown: number, duration: number, icon: string, text: string];

function sub(classId: string, branch: string, t5: NodeSpec, t6: NodeSpec, ult: UltSpec, titles: string[]): [string, Extra] {
  const base = `${classId}-${branch.toLowerCase()}`;
  const node = ([name, effect, text, mainGame]: NodeSpec, tier: number): TierNode =>
    ({ id: `${base}-t${tier}`, name, tier, max: RANKS, effect, text, ...(mainGame ? { mainGame } : {}) });
  const [name, active, r, mana, cooldown, duration, icon, text] = ult;
  return [`${classId}:${branch}`, {
    nodes: [node(t5, 5), node(t6, 6)],
    ultimate: { id: `${base}-t7`, name, active, r, mana, cooldown, duration, icon, text },
    titles,
  }];
}

function form(formId: string, t4: NodeSpec, t5: NodeSpec, t6: NodeSpec, ult: UltSpec, titles: string[]): [string, Extra] {
  const node = ([name, effect, text, mainGame]: NodeSpec, tier: number): TierNode =>
    ({ id: `${formId}-t${tier}`, name, tier, max: RANKS, effect, text, ...(mainGame ? { mainGame } : {}) });
  const [name, active, r, mana, cooldown, duration, icon, text] = ult;
  return [formId, {
    nodes: [node(t4, 4), node(t5, 5), node(t6, 6)],
    ultimate: { id: `${formId}-t7`, name, active, r, mana, cooldown, duration, icon, text },
    titles,
  }];
}

// ---------------------------------------------------------------- classes

export const BASE_TITLE: Record<string, string> = {
  warrior: 'Warrior Recruit',
  mage: 'Mage Acolyte',
  rogue: 'Rogue Initiate',
  ranger: 'Ranger Scout',
  cleric: 'Cleric Novice',
};

/** key `${classId}:${branchName}` e.g. 'rogue:Assassin' */
export const SUBCLASS_EXTRA: Record<string, { nodes: TierNode[]; ultimate: Ultimate; titles: string[] }> = Object.fromEntries([
  // ---- Warrior
  sub('warrior', 'Guardian',
    ['Iron Vigil', st2('timerSec', 1, 'bossPct', 10), '+1 s boss time and +10% to bosses.'],
    ['Unbowed', rl('bossRevive', 2, { perA: 1 }), 'Once per boss, when the clock runs out: +2 s, +1 s per rank.'],
    ['Wall of the Last Hour', 'freeze', 10, 70, 180, 0, 'shield', 'Plant your shield. The boss clock stops for 13 s.'],
    ['Shieldbearer', 'Gate Warden', 'Ironwall', 'Grave Bulwark', 'Unbowed Sentinel', 'The Wall That Stands']),
  sub('warrior', 'Berserker',
    ['Red Haze', st2('overkillPct', 5, 'tapPct', 20), '+5% overkill carried and +20% tap damage.'],
    ['Carnage Wake', st2('overkillPct', 6, 'critDmg', 25), '+6% overkill carried and +25% crit damage.'],
    ['Endless Red', 'burst', 12, 80, 200, 0, 'skull', 'Lose yourself. 82 blows at once, cleaving on.'],
    ['Bloodsworn', 'Ragebound', 'Red Reaver', 'Skullsplitter', 'Carnage Lord', 'The Unbroken']),
  sub('warrior', 'Duelist',
    ['Thousand Cuts', st2('critChance', 2, 'critDmg', 20), '+2% crit chance and +20% crit damage.'],
    ['Killing Line', rl('nthTap', 20, { b: 5, perB: 1, el: 'phys' }), 'Every 20th tap cuts for 5x tap damage (+1x per rank).'],
    ['Final Measure', 'critBuff', 12, 70, 150, 15, 'sword', 'Read every opening. +75% crit chance for 15 s.'],
    ['Gravefencer', 'Red Riposte', 'Edge of Ash', 'Blade Savant', 'Duel Master', 'The Last Cut']),

  // ---- Mage
  sub('mage', 'Elementalist',
    ['Cinder Heart', st2('firePct', 15, 'skillPct', 10), '+15% fire damage and +10% skill power.'],
    ['Wildfire', rl('critSplash', 15, { perA: 5, b: 2, el: 'fire' }), '15% of each crit (+5% per rank) burns the next 2 foes.'],
    ['Ashfall', 'dot', 12, 85, 180, 15, 'flame', 'The sky rains fire. 600% of a tap each second for 15 s.'],
    ['Spark-Caller', 'Flamewright', 'Stormbinder', 'Ashen Magus', 'Pyre Lord', 'The Burning Sky']),
  sub('mage', 'Chronomancer',
    ['Stolen Seconds', rl('clockSlow', 2, { perA: 2 }), 'The boss clock runs 2% slower per rank.'],
    ['Rewound Hour', st2('cooldownPct', 3, 'durationSec', 1), '3% shorter cooldowns and +1 s skill duration.'],
    ['The Hour Unstruck', 'freeze', 12, 90, 240, 0, 'clock', 'Time forgets to move. The boss clock stops for 15 s.'],
    ['Clockwatcher', 'Hourthief', 'Timebinder', 'Keeper of Moments', 'Lord of Hours', 'The Stopped Clock']),
  sub('mage', 'Battlemage',
    ['Arcane Sever', st2('magicPct', 10, 'tapPct', 15), '+10% magic damage and +15% tap damage.', true],
    ['Runeflood', rl('spellTwice', 2, { perA: 2 }), '2% chance per rank a spell or skill casts twice.'],
    ['Sundering Rune', 'tapBuff', 10, 80, 180, 20, 'bolt', 'Your staff splits the air. Taps x6 for 20 s.'],
    ['Runed Blade', 'Spellsword', 'Hexknight', 'War Magus', 'Rune Tyrant', 'The Living Rune']),

  // ---- Rogue
  sub('rogue', 'Assassin',
    ['Black Venom', st2('poisonPct', 15, 'bossPct', 10), '+15% poison damage and +10% to bosses.'],
    ['Death Mark', rl('execute', 2, { perA: 1, b: 10, perB: 5 }), 'Foes under 2% health (+1% per rank) die. Bosses there take +10% (+5% per rank).'],
    ['Thousand Wounds', 'burst', 14, 85, 200, 0, 'drop', 'Poisoned steel from every side. 94 cuts at once.'],
    ['Knife in the Dark', 'Venom Adept', 'Widowmaker', 'Nightblade', 'Deathmark', 'The Quiet End']),
  sub('rogue', 'Trickster',
    ['Smoke and Mirrors', st2('critDmg', 30, 'critChance', 1), '+30% crit damage and +1% crit chance.'],
    ['Shadow Double', st2('tapPct', 25, 'critChance', 1), '+25% tap damage and +1% crit chance.'],
    ['Hundred Faces', 'critBuff', 13, 75, 160, 15, 'hand', 'Strike from where they never look. +80% crit chance for 15 s.'],
    ['Hushblade Adept', 'False Friend', 'Shade Dancer', 'Masked One', 'Lord of Lies', 'The Unseen']),
  sub('rogue', 'Survivor',
    ["Scavenger's Eye", st2('goldPct', 15, 'lootLuck', 5), '+15% gold and +5% better loot.'],
    ['Nothing Wasted', rl('keepGold', 1, { perA: 1 }), 'Keep 1% of your gold per rank when you return from death.'],
    ['Last One Standing', 'goldBuff', 9, 70, 240, 20, 'coin', 'Everyone else fell. x10 gold from kills for 20 s.'],
    ['Ash-Walker', 'Grave Scrounger', 'Scarred One', 'Old Survivor', 'Deathdodger', 'The Last Standing']),

  // ---- Ranger
  sub('ranger', 'Marksman',
    ['Deadeye', st2('critDmg', 25, 'critChance', 1), '+25% crit damage and +1% crit chance.'],
    ['Piercing Shaft', st2('piercePhys', 2, 'bossPct', 10), '+2% physical piercing and +10% to bosses.'],
    ['Sky of Shafts', 'autoTap', 10, 80, 180, 20, 'bolt', 'Arrows blot out the sky. 24 strikes a second for 20 s.'],
    ['Bowman', 'Sharpshot', 'Longshot', 'Hawkeye', 'Sky Archer', 'The Unmissing']),
  sub('ranger', 'Beastmaster',
    ["Alpha's Call", st2('allyPct', 20, 'petPct', 10), '+20% Named damage and +10% pet power.'],
    ['Pack Hunt', rl('namedDouble', 2, { perA: 2 }), 'Named hits: 2% chance per rank to hit twice.'],
    ['The Great Hunt', 'allyBuff', 10, 80, 200, 20, 'echo', 'One howl, the whole pack. Named x7 damage for 20 s.'],
    ['Houndkeeper', 'Packrunner', 'Beastcaller', 'Wild Warden', 'Pack Lord', 'The Howl Itself']),
  sub('ranger', 'Thornwarden',
    ['Heartwood', st2('timerSec', 1, 'tapPct', 10), '+1 s boss time and +10% tap damage.'],
    ['Thornmail', st2('tapPct', 20, 'poisonPct', 10), '+20% tap damage and +10% poison damage.'],
    ['Bramble Wake', 'dot', 10, 75, 180, 20, 'drop', 'Thorns burst from the ground. 500% of a tap each second for 20 s.'],
    ['Briar Scout', 'Rootbound', 'Thornkeeper', 'Barkskin Warden', 'Old Growth', 'The Wood That Bites']),

  // ---- Cleric
  sub('cleric', 'Templar',
    ['Sworn Shield', st2('allyPct', 25, 'timerSec', 0.5), '+25% Named damage and +0.5 s boss time.'],
    ['Oath of the Dead', rl('namedAsTap', 2, { perA: 2 }), 'Named hits: 2% chance per rank to count as a tap.'],
    ['Host of the Named', 'allyBuff', 14, 90, 240, 20, 'banner', 'Every name you won back marches with you. Named x9.4 for 20 s.'],
    ['Oathsworn', 'Shield of the Dead', 'Banner of Names', 'Holy Warden', 'Lord Templar', 'Keeper of All Names']),
  sub('cleric', 'Oracle',
    ['Second Sight', st2('manaRegen', 0.2, 'skillPct', 10), '+0.2 mana per second and +10% skill power.'],
    ['Augury', st2('durationSec', 1, 'manaMax', 10), '+1 s skill duration and +10 max mana.'],
    ['All Futures Close', 'freeze', 10, 80, 200, 0, 'eye', 'You saw this moment years ago. The boss clock stops for 13 s.'],
    ['Seer', 'Bone-Reader', 'Far-Sighted', 'Voice of Omens', 'High Oracle', 'The One Who Saw']),
  sub('cleric', 'Inquisitor',
    ['Verdict', st2('critChance', 2, 'firePct', 10), '+2% crit chance and +10% fire damage.'],
    ['Purifying Brand', rl('bossRamp', 0.5, { perA: 0.5, b: 30 }), 'Bosses take +0.5% damage per rank each second they live (max +30%).'],
    ['Sentence of Ash', 'burst', 12, 80, 180, 0, 'bell', 'The bell tolls once. 82 holy blows at once.'],
    ['Questioner', 'Brand-Bearer', 'Witch-Finder', 'Grand Accuser', 'High Inquisitor', 'The Final Verdict']),
]);

// ---------------------------------------------------------------- transformations

/** key = form id from FORMS ('vampire', ...) or 'mastery' (Mortal Master). Form T7: pure forms only. */
export const FORM_EXTRA: Record<string, { nodes: TierNode[]; ultimate: Ultimate; titles: string[] }> = Object.fromEntries([
  // Mortal Master: humanity plus extreme discipline. No weakness, no transformation.
  form('mastery',
    ['Daily Form', st2('tapPct', 8, 'critDmg', 10), '+8% tap damage and +10% crit damage.'],
    ['Perfect Repetition', rl('nthTap', 30, { b: 4, perB: 1, el: 'phys' }), 'Every 30th tap strikes for 4x tap damage (+1x per rank).'],
    ['Human Limit', st2('bossPct', 10, 'allyPct', 8), '+10% to bosses and +8% Named damage.'],
    ['Every Morning at Once', 'burst', 15, 100, 300, 0, 'fist',
      'Every strike you ever trained lands in one breath. 100 blows at once. Mortals only.'],
    ['Plain Student', 'Steady Hand', 'Hard Discipline', 'Iron Mortal', 'Grey Master', 'Peerless Mortal', 'The Unbent']),
  // Vampire: crit damage; weakness boss time (no time added here).
  form('vampire',
    ['Crimson Feast', st2('critDmg', 15, 'critChance', 0.5), '+15% crit damage and +0.5% crit chance.'],
    ['Opened Vein', rl('bleed', 1, { perA: 0.5 }), 'Each tap on a boss bleeds 1% of it per second (+0.5% per rank).'],
    ['Night Sovereign', st2('critDmg', 20, 'bossPct', 8), '+20% crit damage and +8% to bosses.'],
    ['Red Eclipse', 'critBuff', 12, 80, 200, 12, 'drop', 'The moon drinks the light. +75% crit chance for 12 s. Pure Vampires only.'],
    ['Thrall', 'Fledgling', 'Blood-Bound', 'Nightstalker', 'Crimson Lord', 'Elder of the Vein', 'Sire of Night']),
  // Werewolf: tap damage; weakness weapons (no weapon added here).
  form('werewolf',
    ['Moonblood', st2('tapPct', 10, 'bossPct', 5), '+10% tap damage and +5% to bosses.'],
    ['Mauling Rhythm', rl('nthTap', 25, { b: 3, perB: 1, el: 'phys' }), 'Every 25th tap mauls for 3x tap damage (+1x per rank).'],
    ['Apex Hunter', st2('tapPct', 15, 'critDmg', 15), '+15% tap damage and +15% crit damage.'],
    ['The Hungering Moon', 'tapBuff', 12, 75, 200, 20, 'fist', 'Full moon, full fury. Taps x7 for 20 s. Pure Werewolves only.'],
    ['Moonsick', 'Cub', 'Packblood', 'Ravager', 'Alpha', 'Moon-Eater', 'The Last Howl']),
  // Draconic: boss damage; weakness gold (no gold added here).
  form('draconic',
    ['Wyrmscale', st2('bossPct', 8, 'firePct', 8), '+8% to bosses and +8% fire damage.'],
    ['Smouldering Wrath', rl('bossRamp', 0.2, { perA: 0.2, b: 25 }), 'Bosses take +0.2% damage per rank each second they live (max +25%).'],
    ['Elder Wyrm', st2('bossPct', 10, 'pierceFire', 2), '+10% to bosses and +2% fire piercing.'],
    ['Skyburn', 'burst', 13, 85, 220, 0, 'flame', 'Wings open, the sky catches fire. 88 strikes at once. Pure Draconics only.'],
    ['Scaled', 'Ember-Blooded', 'Wyrmling', 'Drake', 'Wyrm', 'Ancient Wyrm', 'Ruin on Wings']),
  // Undead: Named damage; weakness mana regen (no mana regen added here).
  form('undead',
    ['Bone Legion', st2('allyPct', 10, 'poisonPct', 8), '+10% Named damage and +8% poison damage.'],
    ['Grave Echo', rl('namedDouble', 1, { perA: 1 }), 'Named hits: 1% chance per rank to hit twice.'],
    ['Deathlord', st2('allyPct', 15, 'bossPct', 5), '+15% Named damage and +5% to bosses.'],
    ['Rise, All of You', 'allyBuff', 12, 90, 240, 20, 'skull', 'Every grave opens. Named x8.2 for 20 s. Pure Undead only.'],
    ['Restless', 'Gravebound', 'Bone-Walker', 'Rotlord', 'Grave Captain', 'Lord of Bones', 'King Under the Hill']),
  // Elemental: skill power; weakness crit chance (no crit chance added here).
  form('elemental',
    ['Living Storm', st2('skillPct', 8, 'lightPct', 8), '+8% skill power and +8% lightning damage.'],
    ['Overcharge', rl('cooldownCut', 2, { perA: 2 }), 'Spell and skill cooldowns 2% shorter per rank.'],
    ['Primal Core', st2('skillPct', 10, 'coldPct', 8), '+10% skill power and +8% cold damage.'],
    ['Fourfold Ruin', 'dot', 13, 90, 220, 15, 'bolt', 'Fire, frost, storm and stone at once. 650% of a tap each second for 15 s. Pure Elementals only.'],
    ['Spark', 'Kindled', 'Stormtouched', 'Tempest', 'Living Element', 'Primal', 'The Unmade Storm']),
]);

// run 5 (Clarence): transformations help every class the same (neutral.ts)
for (const fx of Object.values(FORM_EXTRA)) { neutralizeTree({ id: 'x', name: 'x', kind: 'form', nodes: fx.nodes as never }); neutralizeUltimate(fx.ultimate); }
