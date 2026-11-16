// Shapes of the v2 content tables (filled in content.ts). The rules engine
// (game.ts) knows how to apply every Effect and every RuleKind listed here;
// content may only use these, so nothing in the data is decorative.

import type { ActiveKind, Element, ItemSlot, StatKey } from './data';

/**
 * Rule-benders the engine implements. `a` and `b` are the parameters at
 * level/rank 1; `perA` / `perB` are added per extra level. Percent values are
 * written as percents (30 = 30%).
 */
export type RuleKind =
  | 'critSplash' // a% of each crit also hits the next b foes (as `el`, default fire)
  | 'tapCleave' // every tap also hits the next foe for a%
  | 'bossRamp' // bosses take +a% damage per second alive, max b%
  | 'execute' // normal foes under a% health die at once; bosses under a% take +b% damage
  | 'shatter' // a foe killed by a crit makes the next foe arrive with a% health gone
  | 'clockPauseSkill' // the boss clock stops while any skill or spell buff is active
  | 'bleed' // each tap on a boss adds a bleed of a% of that tap per second until it dies
  | 'bloodMoney' // a% of gold earned buys Named levels, cheapest first, at no cost
  | 'weakestElement' // taps take the element the foe is weakest to
  | 'cooldownCut' // spell and skill cooldowns a% shorter (sets and relics; total capped at 75%)
  | 'drift' // a% chance a cleared normal stage carries you one stage further (never past a boss)
  | 'emberDrip' // each boss kill pays a% of the Embers you would get by falling now
  | 'bossRevive' // once per boss, when its clock runs out you get a more seconds
  | 'namedAsTap' // each Named damage tick has a% chance to count as a tap (procs)
  | 'offlinePush' // up to a hours offline also push stages, at most b% of the gap to your best
  | 'nthTap' // every a-th tap deals b times tap damage (as `el`)
  | 'lifeStart' // a new life starts at a% of your best stage (capped at 20%)
  | 'skillExtendOnKill' // each kill during a buff adds a s to it, max b s a cast
  | 'fairyStrike' // each collected fairy also hits the foe for a s of Named damage
  | 'namedDouble' // Named damage ticks: a% chance to hit twice
  | 'freeSpellTaps' // every a taps cast a random learned shared spell for free
  | 'durationPlus' // +a s to every buff's duration
  | 'clockSlow' // the boss clock runs a% slower (capped at 50%)
  | 'goldInterest' // unspent gold grows a% a minute (online only)
  | 'critFreeze' // crits have a% chance to stop the boss clock for b s
  | 'respecDiscount' // respec costs a% fewer Embers (capped at 75%)
  | 'tapPerMilestone' // +a% tap damage per Named milestone reached this life
  | 'bossWeaken' // a boss that beats you comes back a% weaker, max b%
  | 'fallingStar' // every a s, hit the foe for b s of your total damage
  | 'spellTwice' // a% chance a spell or skill casts twice
  | 'plusOneDrop' // a% chance a set piece drops already at +1
  | 'keepGold' // keep a% of gold when you return from death
  | 'treasureSplit' // a% chance a killed treasure foe splits into a second one
  | 'namedInEscape' // the Named fight in escape runs at a% of their damage (base is 75%)
  // run 6: class-loop rules (class gear; only work for the gear's own class)
  | 'fury' // Warrior: each Rage Strike gives all damage +a% for b s
  | 'surge' // Mage: each spell or skill cast gives all damage +a% for b s
  | 'comboDeep' // Rogue: combo max +a; each combo point adds b% to all damage
  | 'volleyAuto' // Ranger: +a arrows a second; foes your arrows mark take b% more from everything
  | 'prayerDeep' // Cleric: Prayer max +a
  // run 6: class accessories and armour sets, class legendaries and artifacts (own class only)
  | 'rageGain' | 'rageKeep' | 'strikeCrit' | 'strikePlus' | 'chainStrike'
  | 'manaTap' | 'mageFocus' | 'manaRegenPlus' | 'manaMaxPct' | 'burntGrimoire'
  | 'spotGold' | 'spotFast' | 'comboStart' | 'spotWait' | 'glassKnife'
  | 'petHaste' | 'rangerGold' | 'arrowPlus' | 'silentString'
  | 'prayerHold' | 'vigilFast' | 'vigilQuick' | 'prayerGain' | 'ashCenser'
  | 'autoCast'; // every a s, cast buff `active` with magnitude b for `dur` s, free (tree "actives")

export interface Rule {
  kind: RuleKind;
  a: number;
  b?: number;
  perA?: number;
  perB?: number;
  el?: Element;
  active?: ActiveKind; // for autoCast
  dur?: number; // for autoCast
}

/** One effect: a stat (value per level/rank) and/or a rule-bender. */
export interface Effect {
  stat?: StatKey;
  per?: number;
  /** Optional second stat, for "+x tap and +y crit" style lines. */
  stat2?: StatKey;
  per2?: number;
  /** Stat effects that multiply per level instead of adding (like Ashen Grip x1.2). */
  compound?: boolean;
  rule?: Rule;
}

// ---------------------------------------------------------------- gear sets

export type SetType = 'weapons' | 'accessories' | 'armour';
export const SET_SLOTS: Record<SetType, ItemSlot[]> = {
  weapons: ['mainHand', 'offHand'],
  // rings and trinkets are pairs: a set needs both worn (ring1 + ring2, trinket1 + trinket2)
  accessories: ['neck', 'back', 'ring1', 'ring1', 'trinket1', 'trinket1'],
  armour: ['head', 'shoulders', 'chest', 'wrists', 'hands', 'waist', 'legs', 'feet'],
};

export interface SetPiece { slot: ItemSlot; name: string }
export interface SetDef {
  id: string; // e.g. 'ashen-weapons'
  realm: string; // REALMS id in data.ts ('class' for class sets)
  /** Run 6: class sets. Worn or stashed by another class they give stats only (no bonus). */
  cls?: string;
  type: SetType;
  name: string;
  /** In SET_SLOTS order (accessories: neck, back, ring, ring, trinket, trinket). */
  pieces: SetPiece[];
  /** The stats each piece rolls (2 to 3 keys). */
  stats: StatKey[];
  bonus: Effect; // full-set rule-bender (level 1; no per-level growth)
  text: string;
}

// ---------------------------------------------------------------- relics (Embers)

export interface RelicDef {
  id: string;
  num: number; // 1..100
  name: string;
  group: string; // 'Rites' | realm name | 'Lanternfall'
  effect: Effect; // value per level
  max?: number;
  cost: number; // base level-up cost in Embers
  growth: number; // cost multiplier per level (1.25 to 1.6)
  text: string;
}

// ---------------------------------------------------------------- trees

/** Race trees (points from the permanent XP level), transformation trees and Mastery (points from quests). */
export interface TreeNode {
  id: string;
  name: string;
  tier: number; // 0..2; a node needs one rank in any node of the tier above
  max: number; // max rank
  effect: Effect; // per rank
  text: string;
  mainGame?: boolean;
}
export interface TreeDef {
  id: string; // race id, form id, or 'mastery'
  name: string;
  kind: 'race' | 'form';
  nodes: TreeNode[];
}

// ---------------------------------------------------------------- shared spells (class points)

export interface SpellDef {
  id: string;
  name: string;
  icon: string; // short hint for the pixel icon, e.g. 'falling-sword'
  active: ActiveKind;
  base: number; // magnitude at level 1 (same meaning as class skills' ACTIVE_HELP)
  per: number; // magnitude added per level
  duration: number; // seconds; 0 for instant
  mana: number;
  cooldown: number;
  max: number;
  unlock: number; // XP level needed to learn
  text: string;
}

// ---------------------------------------------------------------- pets (Marks)

export interface PetDef {
  id: string;
  name: string;
  /** Body for the pixel sprite. */
  body: 'crow' | 'wisp' | 'hound' | 'rat' | 'moth' | 'cat' | 'toad' | 'skull' | 'snake' | 'owl' | 'bat' | 'spider';
  element: Element;
  stat: StatKey; // the one aspect it boosts
  per: number; // per pet level (out: full; owned but not out: 10%)
  atk: number; // its auto-attack: x% of your tap damage per second at level 1, +atk/10 per level
  starter?: boolean; // one of the 3 starters from quest 4
  text: string;
}

// ---------------------------------------------------------------- goals: quests, tasks, achievements

/** Lifetime counters (State.counts) plus a few read live from the state. */
export type GoalKind =
  | 'stage' // best stage reached (live)
  | 'xpLevel' // permanent XP level (live)
  | 'kills' | 'bosses' | 'taps' | 'crits' | 'spells' | 'fairies' | 'treasure' | 'wanderers'
  | 'dungeons' // dungeon bosses killed
  | 'dungeonRuns'
  | 'returns' | 'escapesCleared' | 'specialEscapes' | 'bishops'
  | 'immuneKills' // foes killed that were immune to at least one element
  | 'namedLevels' // Named levels bought (lifetime)
  | 'heroLevels' // Train levels bought (lifetime)
  | 'relics' // relics owned (live)
  | 'relicLevels' // relic levels bought (lifetime)
  | 'setsDone' // complete set types worn at once (live)
  | 'merges'
  | 'salvaged'
  | 'pets' // pets owned (live)
  | 'gold' // log10 of lifetime gold (counts as "reach 1e<n> gold")
  | 'overkillStages' // stages skipped by overkill
  | 'elites' | 'weakHits' | 'hunts' | 'fastBosses' // run 4 (lifetime)
  | 'rageStrikes' | 'manaFromTaps' | 'comboMax' | 'prayerSec' | 'fightSec'; // run 5 class loops (lifetime; for the sim and quests)

export interface Goal { kind: GoalKind; n: number; /** for 'stage'-like goals: true = reach n; false = do n more since the quest started */ reach?: boolean }

export type RewardKind = 'classPt' | 'formPt' | 'pet' | 'egg' | 'key' | 'marks' | 'embers' | 'gold';
export interface Reward { kind: RewardKind; n: number; /** 'pet': pick 1 of these pet ids (starter choice) or the given one */ pets?: string[] }

export interface QuestDef { id: string; num: number; text: string; goal: Goal; rewards: Reward[] }

export interface TaskDef { id: string; text: string; goal: Goal; rewards: Reward[]; weekly?: boolean }

export interface AchievementDef {
  id: string;
  name: string;
  kind: GoalKind;
  tiers: number[]; // 5 tiers
  stat: StatKey; // small permanent bonus per tier reached
  per: number;
  marks: number; // Marks per tier
  text: string;
}

export interface LoginDay { day: number; rewards: Reward[] }

// ---------------------------------------------------------------- Named, chests, fairies, special foes

export interface NamedMilestone {
  level: number;
  /** 'self' boosts this Named; 'element' boosts all Named of its element; 'all' all Named; 'tap' your tap damage. */
  scope: 'self' | 'element' | 'all' | 'tap';
  pct: number; // multiplier, as percent: 100 = x2
}

export interface ChestDef { every: number; rewards: Reward[]; /** extra rewards on every 100th stage */ big: Reward[] }

export interface FairyReward { kind: 'gold' | 'mana' | 'spell' | 'marks'; weight: number; /** gold: seconds of kill gold; mana: % of max; marks: amount */ n: number }

export interface SpecialFoe {
  id: string;
  name: string;
  lands: number[]; // ZONES indexes this name appears in
  kind: 'treasure' | 'wanderer';
  text: string;
}
