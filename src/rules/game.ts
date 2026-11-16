// Pure game rules for Unwritten Tapper. No DOM, no timers, no Math.random:
// every random roll uses the seeded generator stored in the state, and time
// only moves when the caller passes dt (seconds) or a wall-clock "now" (ms).

import { CHASE, CHASE_CHANCE, CHASE_DUP_CHANCE, CHASE_GEM_TIERS, CLASS_ITEMS } from './run6-content';
import * as B from './big';
import type { Big } from './big';
import {
  ALLIES, ARTIFACTS, ATTRS, AFFIXES, BAG_SIZE, BASE_NAMES, BISHOP_EVERY, CLASSES, ESCAPE_FOES, ESCAPE_SECONDS,
  FAITHS, FORMS, HEIRLOOM, ITEM_SLOTS, MAX_RANK, PREFIXES, RACES, RARITIES, REALMS, SCARS, SPECIAL_CHANCE,
  SUFFIXES, ACTIVE_HELP, ELEMENTS, ELEMENT_PCT, ELEMENT_PIERCE, ZONES, rarityDef, zoneFor,
  type ActiveKind, type Attr, type ClassDef, type Element, type ItemSlot, type Rarity, type Slot, type SkillNode, type StatKey, type Stats,
} from './data';
import {
  ACHIEVEMENTS, CHEST, DAILY_TASKS, FAIRY_REWARDS, FORM_TREES, LOGIN, NAMED_ELEMENTS, NAMED_MILESTONES, PETS, QUESTS,
  RACE_TREES, RELICS, SETS, SPECIAL_FOES, SPELLS, WEEKLY_TASKS, endlessQuest,
} from './content';
import type { Effect, Goal, GoalKind, QuestDef, Reward, Rule, RuleKind, SetDef, TaskDef, TreeDef, TreeNode } from './content-types';
import { BASE_TITLE, FORM_EXTRA, SUBCLASS_EXTRA, type TierNode, type Ultimate } from './tiers-content';

export const SAVE_VERSION = 4; // run 3: lands, gimmicks, events, Train branches, the Forge
// run 7 (Clarence: "trash mobs die in 1 hit, too fast to see what's going on"): normal foes have NORMAL_HP_MULT x health and a stage has
// half as many, so a stage takes about as long as before. Gold follows a foe's health, so each foe pays that much more.
export const KILLS_PER_STAGE = 4;
export const NORMAL_HP_MULT = 4;
// run 8: race levels come slower. Life 1 x0.75 (slower left a 4.2-min gap with nothing new), later lives x0.6; both now also slow boss and elite XP
export const RACE_XP_PACE = 0.75;
export const RACE_XP_PACE_LATER = 0.6;
export const KILL_WEIGHT = 8 / KILLS_PER_STAGE; // a stage had 8 foes before run 7
/** Eased in over the first stages, so a new hero (a Cleric's taps are weak) is not stuck on stage 1. */
export const normalHpMult = (stage: number) => Math.min(NORMAL_HP_MULT, 1 + (stage - 1) * 0.25);
export const MIN_DEATH_STAGE = 20;
export const OFFLINE_CAP_SECONDS = 24 * 3600;
export const OFFLINE_BASE_RATE = 0.5;
export const BOSS_HP_MULT = 6;
/** Realm foes take about this long each for a steady tapper; the gate boss about a minute. */
/** Special escapes: foes this much tougher (run 2: 1.5 became unwinnable once foes grew to 11 s). */
export const SPECIAL_ESCAPE_MULT = 1.25;
/** Tuning knob (the sim probe changes it to compare sizes on the same falls); the game never changes it. */
export const ESCAPE_SPARE = 4; // the gate aims here; with its 5 s caution the sim lands about 8-16 s spare
export const REALM_DMG_BUFF_CAP = 0.5;
export const GATE_HIT_CAP = 0.08;
export const ESCAPE_GATE_MIN = 60;
export const ESCAPE_GATE_MAX = 240; // 150 left 28-32 s when the foes went fast
export const ESCAPE_TUNE = { foe: 8.3 }; // run 5: steered by time per foe; 24 x 8.3 + the 90 s gate leaves about 10 s of 300 // run 5: escapes now follow your damage both ways, so the spread is small; 8 left 18-43 s // Clarence 11 Nov: about 10 s spare. 8.25 failed 2 of 12 sim escapes after auto-salvage; retune after run 5 class-aware sizing
export const ESCAPE_FOE_SECONDS = ESCAPE_TUNE.foe; // run 3, adaptive escapes (sim-tuned): first falls leave 12-16 s, later ones 14-43 s // run 4: 8 -> 7.5 (2 of 12 sim escapes ran out of time at the gate by a hair)
export const HEAL_RETURNS = 20;
export const ESCAPE_GATE_SECONDS = 90;
/** Adaptive sizing starts once this many seconds of the escape have been measured. */
export const ESCAPE_ADAPT_AFTER = 8;
// v2
export const OVERKILL_BASE = 0; // only Warrior Berserkers cleave for real [Clarence, 7 Nov]
export const OVERKILL_OTHER_CAP = 15; // pets, relics, sets and trees together give at most 15%
export const MAX_PIERCE = 50; // piercing never lets more than half through an immunity
export const WEAK_MULT = 1.5;
/** Immune foes still take this % from that element (run 2). */
export const IMMUNE_FLOOR = 20;
/** Dailies refresh at most once per this many ms of real time (run 2). */
export const DAILY_MIN_GAP = 8 * 3600 * 1000;
/** Seconds per damage window for the measured DPS that sizes realms (run 2). */
export const DPS_WINDOW = 30;
export const IMMUNE_FROM = 26; // immune foes start in the second land
export const TWO_IMMUNE_FROM = 101;
export const TREASURE_CHANCE = 1 / 40;
export const TREASURE_GOLD = 20;
export const WANDER_FROM = 30;
export const WANDER_CHANCE = 1 / 400;
export const WANDER_SECONDS = 30;
export const DUNGEON_MOBS = 9;
export const DUNGEON_SECONDS = 180;
export const DUNGEON_MOB_SECONDS = 6;
export const DUNGEON_BOSS_SECONDS = 40;
export const MAX_TIER = 7;
export const MAX_TIER_RANK = 10;
export const TIER_XP = 600; // XP per rank at T1: about 20 minutes to rank 10 in the pacing sim (MIB round 6); each tier doubles it
export const OFFER_QUEST = 15; // the transformation offer appears once the quest chain reaches this
export const KEY_CAP = 3; // the free daily key stops at 3; prize keys can go over
export const FAIRY_MIN = 60;
export const FAIRY_SPREAD = 60;
export const FAIRY_LIFE = 10;

// ------------------------------------------------------------------ types

export interface Hero { name: string; race: string; cls: string; faith: string; form: string }

export interface Item {
  id: number;
  name: string;
  slot: ItemSlot;
  rarity: Rarity;
  ilvl: number;
  stats: Stats;
  look?: string; // weapon/off-hand kind for the sprite
  rule?: string; // Artifact / Ancestry rule-bender
  ruleText?: string;
  el?: Element; // weapon element enchant: your taps deal this element
  set?: string; // SetDef id
  piece?: number; // index into the set's pieces
  plus?: number; // merge level 0..MAX_PLUS
  /** Run 3: Gold Forge level on non-set items (0..FORGE_MAX). Separate from plus, which stays for set merging. */
  forge?: number;
  /** Run 6: class gear. Another class gets its stats only. */
  cls?: string;
  /** Run 6: a fixed rule on a class item or chase item (sleeps for another class). */
  fx?: Rule;
  /** Run 6: chase item id (collection). */
  chase?: string;
}

export interface Buff { kind: ActiveKind; mag: number; left: number; from: string; ext?: number }

export interface Foe {
  name: string; hp: Big; max: Big; boss: boolean;
  cs?: number; // run 6: combo start applied for this boss
  immune?: Element[]; weak?: Element[];
  kind?: 'treasure' | 'wanderer';
  /** Run 3: a gimmick boss's special rule, and its running state. */
  gimmick?: 'shield' | 'tolling' | 'adds';
  gimT?: number; // seconds into the fight (tolling cadence)
  shieldLeft?: number; // seconds of shield left (0 = none, -1 = already used)
  tolled?: number; // seconds the Named are still stopped by a toll
  /** Run 4: elite affix and its state, the weak-spot clock, and an adds boss's two adds (health each). */
  elite?: EliteKind;
  armour?: number; // crits still needed before an armoured elite takes full tap damage
  fleeLeft?: number; // seconds before a swift elite flees
  weakT?: number; // seconds since the fight started or the weak spot was last hit (bosses and elites)
  weakN?: number; // weak-spot hits on this foe (the spot moves after each)
  addHp?: Big[];
}

export interface Life {
  stage: number;
  /** Run 2: measured damage, for sizing realms. */
  dmgAcc?: Big;
  dmgT?: number;
  peakDps?: Big; // average of the recent windows (name kept for saves)
  dpsHist?: Big[];
  kills: number; // normal kills this stage (0..KILLS_PER_STAGE)
  foe: Foe;
  bossLeft: number; // seconds left on the boss clock (only while foe.boss)
  autoBoss: boolean; // false after a failed boss until the player taps "Fight boss"
  gold: Big;
  heroLevel: number;
  allyLevels: number[];
  mana: number;
  cooldowns: Record<string, number>;
  buffs: Buff[];
  maxStage: number; // highest stage reached this life
  // v2
  wanderLeft: number; // seconds left on a wandering boss (it leaves at 0)
  bossAge: number; // seconds the current boss has lived
  bleed: Big; // bleed damage per second on the current boss
  revived: boolean; // bossRevive used on this boss
  bossFails: number; // fails on this stage's boss (bossWeaken)
  shatter: number; // % health the next foe arrives without
  tapN: number; // taps this life (nthTap, freeSpellTaps)
  starT: number; // seconds toward the next falling star
  autoT: Record<string, number>; // seconds toward each autoCast
  fairy: { x: number; y: number; left: number } | null;
  fairyIn: number;
  treasureNext: boolean;
  /** Run 3: the event running now, seconds to the next one, and treasure foes left in a Grave Rush. */
  event?: { id: EventId; left: number } | null;
  eventIn?: number;
  rushLeft?: number;
  interestT: number;
  /** Run 4: hunts (an offer, the hunt running, seconds to the next offer), the Toll Collector's open offer,
   *  the one change to the next world boss's clock (seconds, capped), and the lands whose shrine was used this life. */
  hunt?: Hunt | null;
  huntOffer?: Hunt | null;
  huntIn?: number;
  collector?: boolean;
  nextBossDelta?: number;
  offered?: number[];
  autoSold?: number; // run 4 fix: worse drops salvaged on pick-up this life
  /** Run 4, after the gate: sellswords hired this life, the tithe taken at the Fall (extra Embers share), Named specialisations. */
  mercs?: number;
  rage?: number; // run 5, Warrior: 0..100
  combo?: number; // run 5, Rogue: 0..10
  moments?: Record<string, number>; // run 6: how often your race and faith rules fired this life
  surgeT?: number; // run 6: seconds left on Fury (Warrior set) or Surge (Mage set)
  surgeMag?: number;
  prayer?: number; // run 5, Cleric: 0..200
  sinceTap?: number; // run 5: seconds since the last manual tap (rage and prayer fade after a pause)
  trollHp?: number; // run 5, Troll: the share of health a failed boss still had (it comes back with that)
  tithe?: number;
  spec?: Record<number, NamedSpec>;
}

export interface Dungeon {
  realm: string;
  killed: number; // 0..DUNGEON_MOBS, then the boss
  foe: Foe;
  timeLeft: number;
  unit: Big; // damage per second when the run began; foes are sized from it
  gold: Big; // gold earned in this run
  done: boolean;
  cleared: boolean;
  drop: number | null; // item id of the set piece won
}

export interface DayTask { id: string; base: number; claimed: boolean }
export interface Daily {
  day: number; // local day index of the last refresh
  week: number;
  tasks: DayTask[];
  weekly: DayTask[];
  loginDay: number; // 0..6, next login reward to give
  loginGiven: number; // day index the login reward was last given
  at?: number; // run 2: real time of the last refresh (ms)
}

export interface Escape {
  realm: string;
  special: boolean;
  stageAtDeath: number;
  killed: number; // 0..ESCAPE_FOES, then the gate
  foe: Foe;
  timeLeft: number;
  baseEmbers: Big;
  unit: Big; // estimated damage per second at the moment of death; realm foes are sized from it
  /** Run 3 (Clarence: every escape tight): damage dealt and seconds spent in this escape. Each new foe is sized from the
   *  better of the starting estimate and what you have really dealt here, so strong builds stay tight and slacking never helps. */
  dealt?: Big;
  spent?: number;
  /** Run 5: damage in the current 15 s window, and the rate of the last full window (adaptation uses it, so a burst fades). */
  winD?: Big;
  winT?: number;
  rate?: Big;
  start?: Big; // run 5: the first estimate (escape foes never drop below half of it)
  foeT?: number; // run 5: seconds spent on the current escape foe
  gateD?: Big; // run 5: damage to the gate in the current 5 s step
  gateT?: number;
  gateAll?: Big; // run 5: all damage to the gate so far, and its seconds
  gateAllT?: number;
  gateScale?: number; // run 5: how far the gate has been nudged (0.8..4)
  gateFloor?: Big; // run 8: the gate's size without the boss-damage guess; a one-time shrink never goes below it
  gateFixed?: boolean; // run 8: the one-time shrink has been checked
  done: boolean;
  cleared: boolean;
}

export interface Pending {
  kind: 'scar' | 'prize' | 'pet';
  choices: string[]; // scar ids for 'scar'; 'heal' | 'artifact:<id>' for 'prize'; pet ids for 'pet'
}

export interface State {
  v: number;
  seed: number;
  hero: Hero;
  life: Life;
  bestStage: number;
  ranks: Record<string, number>; // class tree
  embers: Big;
  relics: Record<string, number>; // owned relic id -> level (the 9 rites are always owned)
  scars: string[];
  equipped: Partial<Record<Slot, Item>>;
  bag: Item[];
  nextItemId: number;
  escape: Escape | null;
  pending: Pending[];
  lastSeen: number; // wall clock ms of the last tick/save
  returns: number;
  bestReturn: Big;
  totalTaps: number;
  log: string[];
  // v2
  xp: number; // permanent; never resets
  raceRanks: Record<string, number>;
  formRanks: Record<string, number>;
  spells: Record<string, number>; // shared spell levels (class points)
  points: { classPt: number; formPt: number }; // earned from quests
  quest: { num: number; base: number; cls?: string }; // cls: the class quest 2 was started for (run 6)
  counts: Partial<Record<GoalKind, number>>;
  marks: number;
  keys: number;
  eggs: number;
  pets: Record<string, number>; // owned pet id -> level
  petsOut: string[]; // up to PETS_OUT
  ach: Record<string, number>; // achievement id -> tiers claimed
  chest: number; // highest milestone stage whose chest was given
  daily: Daily;
  dungeon: Dungeon | null;
  events: string[]; // things the UI should toast (cleared by the UI)
  // v3: tiers (AdventureQuest-style class ranks; main-game transformation tiers)
  classPaths: Record<string, Track>; // 'base' and every subclass (branch name) you own
  classPath: string; // the equipped one: 'base' or a branch name
  forms: string[]; // transformations in the order acquired; [] = Mortal Master
  formTracks: Record<string, Track>; // form id, or 'mastery' while mortal
  formOffered: boolean; // the transformation offer has been earned
  trialBase: Record<string, number>; // trial id -> counter when it first appeared
  // v4 (run 3). Events and gimmicks draw from their own seeds, so the old seed (and every seeded result) is untouched.
  eventSeed: number;
  gimmickSeed: number;
  trainPerks: string[]; // Train branch perks chosen, in order (one per 100 Train levels)
  landsSeen: number[]; // lands whose arrival card has been shown
  eventLog: string[]; // recent event ids (newest last, at most 10); not the toast queue (that is events)
  gimmicksBeaten: string[]; // gimmicks beaten at least once (first-win reward)
  eventsOff?: boolean; // the player's Events setting (on unless turned off)
  gems?: number; // run 5: a rare currency, earned only for now (a shop may come later)
  gemsWelcome?: boolean; // run 5: the one-time 10 gems for saves from before the classes changed
  gearFocus?: GearFocus; // run 6 (Clarence): what "better" means for the bag arrows, Compare and auto-salvage
  autoSalvageOff?: boolean; // run 4 fix: drops worse than what you wear (Rare and below) are salvaged at once unless this is set
  gearSeed?: number; // run 6: class-gear drop rolls (own stream; realm drops keep the main stream)
  stash?: Item[]; // run 6: set pieces kept aside; complete sets here give a small bonus
  chaseSeed?: number; // run 6: chase drops (own stream)
  chaseFound?: string[]; // run 6: chase items found at least once
  r4Seed?: number; // run 4: elites, hunts and shrines draw from this stream (made from the seed on first use), never the main one
  landSplit?: boolean; // landsSeen uses the land numbers after The Bellrope Descent was added (fix round)
}

/** One tier ladder: tier 1..7, rank 1..10, XP into the current rank. */
export interface Track { tier: number; rank: number; xp: number }

// ------------------------------------------------------------------ rng

/** mulberry32 on the state's seed. */
export function rand(s: State): number {
  let t = (s.seed = (s.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(s: State, xs: T[]): T => xs[Math.floor(rand(s) * xs.length) % xs.length];
const between = (s: State, a: number, b: number) => a + (b - a) * rand(s);

function say(s: State, msg: string) {
  s.log.unshift(msg);
  if (s.log.length > 30) s.log.length = 30;
}

// ------------------------------------------------------------------ lookups

export const classOf = (s: State): ClassDef => CLASSES.find((c) => c.id === s.hero.cls) ?? CLASSES[0];
export const nodeById = (s: State, id: string): SkillNode | undefined => classOf(s).tree.find((n) => n.id === id);

// ------------------------------------------------------------------ curves

export function foeHp(stage: number): Big {
  // 12 * 1.16^(stage-1), with a gentle early ramp
  return B.times(B.powN(1.16, stage - 1), 12);
}
export function bossHp(stage: number): Big {
  const bishop = stage % BISHOP_EVERY === 0 ? 2 : 1;
  return B.times(foeHp(stage), BOSS_HP_MULT * bishop);
}
export const GOLD_PER_HP = 0.09;

export const heroCostBase = B.big(6);
export const HERO_GROWTH = 1.07;
export function heroBase(level: number): number {
  return level * Math.pow(2, Math.floor(level / 25));
}
export function heroBaseBig(level: number): Big {
  return B.mul(B.big(level), B.powN(2, Math.floor(level / 25)));
}

export const ALLY_GROWTH = 1.075;
export function allyBaseDps(i: number, level: number): Big {
  if (level <= 0) return B.ZERO;
  return B.mul(B.times(B.big(ALLIES[i].dpsBase), level), B.powN(2, Math.floor(level / 25)));
}
export const allyCostBase = (i: number): Big => B.big(ALLIES[i].costBase);

export function embersFor(stage: number, emberPct: number): Big {
  if (stage < MIN_DEATH_STAGE) return B.ZERO;
  // 2 at stage 20, ~66 at 50, ~10K at 100, ~100M at 200: deeper deaths are worth far more
  return B.times(B.powN(1.09, stage - MIN_DEATH_STAGE), 2 * (stage / MIN_DEATH_STAGE) * (1 + emberPct / 100));
}

// ------------------------------------------------------------------ stats

export function addStats(into: Stats, add: Stats, k = 1) {
  for (const key of Object.keys(add) as StatKey[]) into[key] = (into[key] ?? 0) + (add[key] ?? 0) * k;
}

export function activeRules(s: State): Set<string> {
  const r = new Set<string>();
  for (const it of Object.values(s.equipped)) if (it?.rule && itemRuleActive(s, it)) r.add(it.rule);
  return r;
}

// ------------------------------------------------------------------ v2 effects: relics, trees, sets, pets, achievements

export const PETS_OUT = 3;
export const PET_BENCH = 0.1; // owned pets that are not out give 10% of their passive
export const MAX_PLUS = 5;
export const PLUS_STEP = 0.2; // each merge level: +20% to the item's stats

export interface RuleVal { a: number; b: number; el?: Element; active?: ActiveKind; dur?: number; src: string }
export type Rules = Map<RuleKind, RuleVal[]>;

function addEffect(st: Stats, rules: Rules, e: Effect, lv: number, src: string, scale = 1) {
  if (!(lv > 0)) return;
  if (e.stat && e.per) st[e.stat] = (st[e.stat] ?? 0) + (e.compound ? (Math.pow(1 + e.per / 100, lv) - 1) * 100 : e.per * lv) * scale;
  if (e.stat2 && e.per2) st[e.stat2] = (st[e.stat2] ?? 0) + e.per2 * lv * scale;
  if (e.rule) {
    const r = e.rule;
    const v: RuleVal = { a: r.a + (r.perA ?? 0) * (lv - 1), b: (r.b ?? 0) + (r.perB ?? 0) * (lv - 1), el: r.el, active: r.active, dur: r.dur, src };
    const list = rules.get(r.kind) ?? [];
    list.push(v);
    rules.set(r.kind, list);
  }
}

/** All sources of one rule added up (`a` summed, `b` the largest), or null when none is active. */
export function ruleSum(rules: Rules, kind: RuleKind): RuleVal | null {
  const l = rules.get(kind);
  if (!l?.length) return null;
  return l.reduce((acc, v) => ({ ...acc, a: acc.a + v.a, b: Math.max(acc.b, v.b) }), { ...l[0], a: 0, b: 0 });
}

export const raceTree = (s: State): TreeDef | undefined => RACE_TREES.find((x) => x.id === s.hero.race);
export const formTree = (s: State): TreeDef | undefined => FORM_TREES.find((x) => x.id === (s.hero.form === 'mortal' ? 'mastery' : s.hero.form));

// ------------------------------------------------------------------ v3 tiers

export const rankXp = (tier: number) => TIER_XP * Math.pow(2, tier - 1);
export const subclassKey = (s: State, branch: string) => `${s.hero.cls}:${branch}`;

/** Highest tier a form may reach: pure T7; dual T4 then T3; triple T2 each; Mastery T7 [main game]. */
export function formCap(s: State, id: string): number {
  if (id === 'mastery') return MAX_TIER;
  const n = s.forms.length;
  if (n <= 1) return MAX_TIER;
  if (n === 2) return s.forms[0] === id ? 4 : 3;
  return 2;
}
/** Hybridising closes once any form reaches T3 [main game]. */
export const canAddForm = (s: State) => s.forms.length > 0 && s.forms.length < 3 && s.forms.every((f) => (s.formTracks[f]?.tier ?? 1) <= 2);

/** A class tree node counts when it is the foundation, or in the equipped subclass at a tier you have reached. */
export function classNodeActive(s: State, n: SkillNode): boolean {
  if (n.tier === 0) return true;
  return n.branch === s.classPath && classNodeUnlocked(s, n);
}
/** Branch tier 1/2/3 nodes open at subclass T2/T3/T4. */
export function classNodeUnlocked(s: State, n: SkillNode): boolean {
  if (n.tier === 0) return true;
  const tr = s.classPaths[n.branch];
  return !!tr && tr.tier >= n.tier + 1;
}
/** The T5/T6 nodes of the equipped subclass. */
export function subclassExtraNodes(s: State, branch = s.classPath): TierNode[] {
  return branch === 'base' ? [] : SUBCLASS_EXTRA[subclassKey(s, branch)]?.nodes ?? [];
}
export function tierNodeOpen(s: State, n: TierNode, branch = s.classPath): boolean {
  const tr = s.classPaths[branch];
  return !!tr && tr.tier >= n.tier;
}

/** The trees of every form you carry (or Mastery while mortal): tree rows open at T1/T2/T3, extra nodes at T4–T6, all up to the form's cap. */
export function formNodes(s: State): (TreeNode & { form: string; need: number })[] {
  const out: (TreeNode & { form: string; need: number })[] = [];
  for (const fid of s.forms.length ? s.forms : ['mastery']) {
    const tree = FORM_TREES.find((x) => x.id === fid);
    for (const n of tree?.nodes ?? []) out.push({ ...n, form: fid, need: n.tier + 1 });
    for (const n of FORM_EXTRA[fid]?.nodes ?? []) out.push({ ...n, form: fid, need: n.tier });
  }
  return out;
}
export function formNodeOpen(s: State, n: { form: string; need: number }): boolean {
  const tr = s.formTracks[n.form];
  return !!tr && tr.tier >= n.need && n.need <= formCap(s, n.form);
}

export function classTitle(s: State): string {
  if (s.classPath === 'base') return BASE_TITLE[s.hero.cls] ?? classOf(s).name;
  const tr = s.classPaths[s.classPath];
  return SUBCLASS_EXTRA[subclassKey(s, s.classPath)]?.titles[(tr?.tier ?? 2) - 2] ?? s.classPath;
}
export function formTitle(s: State, id: string): string {
  const tr = s.formTracks[id];
  return FORM_EXTRA[id]?.titles[(tr?.tier ?? 1) - 1] ?? id;
}

function trackXp(tr: Track | undefined, xp: number, cap = MAX_TIER): boolean {
  if (!tr || tr.tier > cap) return false;
  if (tr.rank >= MAX_TIER_RANK) return false;
  tr.xp += xp;
  let up = false;
  while (tr.rank < MAX_TIER_RANK && tr.xp >= rankXp(tr.tier)) {
    tr.xp -= rankXp(tr.tier);
    tr.rank++;
    up = true;
  }
  if (tr.rank >= MAX_TIER_RANK) tr.xp = 0;
  return up;
}

/** Kills feed the equipped class path and your forms (shared between hybrid forms) or Mastery. */
function gainTierXp(s: State, big: boolean, normal = 1) {
  const g = big ? 5 : normal;
  const cp = s.classPaths[s.classPath];
  if (trackXp(cp, g) && cp.rank === MAX_TIER_RANK) s.events.push(`${classTitle(s)}: rank 10. A trial awaits in Quests.`);
  const forms = s.forms.length ? s.forms : ['mastery'];
  for (const f of forms) {
    const tr = s.formTracks[f];
    if (trackXp(tr, g / forms.length, formCap(s, f)) && tr.rank === MAX_TIER_RANK && tr.tier < formCap(s, f)) s.events.push(`${formTitle(s, f)}: rank 10. A trial awaits in Quests.`);
  }
}

export interface Trial { id: string; kind: 'subclass' | 'class' | 'form' | 'offer'; target: string; tier: number; text: string; goal: Goal }

const TRIAL_GOALS: Record<number, [Goal, string]> = {
  2: [{ kind: 'bosses', n: 10 }, 'Beat 10 bosses'],
  3: [{ kind: 'dungeons', n: 1 }, 'Clear a dungeon'],
  4: [{ kind: 'stage', n: 150, reach: true }, 'Reach stage 150'],
  5: [{ kind: 'dungeons', n: 5 }, 'Clear 5 dungeons'],
  6: [{ kind: 'bishops', n: 3 }, 'Beat the Hollow Bishop 3 times'],
  7: [{ kind: 'bishops', n: 10 }, 'Beat the Hollow Bishop 10 times'],
};

/** Trials (tier quests) you can see now. A tier's next trial only shows at rank 10 [Clarence, AdventureQuest-style]. */
export function availableTrials(s: State): Trial[] {
  const out: Trial[] = [];
  const cls = classOf(s);
  const base = s.classPaths.base;
  if (base && base.rank >= MAX_TIER_RANK) {
    for (const b of cls.branches) if (!s.classPaths[b]) {
      const [goal, txt] = TRIAL_GOALS[2];
      out.push({ id: `sub:${b}`, kind: 'subclass', target: b, tier: 2, text: `${b} trial: ${txt}`, goal });
    }
  }
  for (const b of cls.branches) {
    const tr = s.classPaths[b];
    if (tr && tr.rank >= MAX_TIER_RANK && tr.tier < MAX_TIER) {
      const [goal, txt] = TRIAL_GOALS[tr.tier + 1];
      out.push({ id: `up:${b}:${tr.tier + 1}`, kind: 'class', target: b, tier: tr.tier + 1, text: `${b} T${tr.tier + 1}: ${txt}`, goal });
    }
  }
  if (!s.forms.length && !s.formOffered && s.quest.num >= OFFER_QUEST) {
    out.push({ id: 'offer', kind: 'offer', target: '', tier: 1, text: 'First blood: reach stage 60', goal: { kind: 'stage', n: 60, reach: true } });
  }
  for (const f of s.forms.length ? s.forms : ['mastery']) {
    const tr = s.formTracks[f];
    if (tr && tr.rank >= MAX_TIER_RANK && tr.tier < formCap(s, f)) {
      const [goal, txt] = TRIAL_GOALS[tr.tier + 1];
      const name = f === 'mastery' ? 'Mastery' : FORMS.find((x) => x.id === f)?.name ?? f;
      out.push({ id: `form:${f}:${tr.tier + 1}`, kind: 'form', target: f, tier: tr.tier + 1, text: `${name} T${tr.tier + 1}: ${txt}`, goal });
    }
  }
  return out;
}

/** Remember the counter when a trial first shows, so progress counts from then. */
export function refreshTrials(s: State) {
  for (const tr of availableTrials(s)) if (!(tr.id in s.trialBase)) s.trialBase[tr.id] = tr.goal.reach ? 0 : goalValue(s, tr.goal.kind);
}
export function trialProgress(s: State, tr: Trial): [number, number] {
  const base = tr.goal.reach ? 0 : s.trialBase[tr.id] ?? goalValue(s, tr.goal.kind);
  return [Math.max(0, Math.min(tr.goal.n, goalValue(s, tr.goal.kind) - base)), tr.goal.n];
}
export function claimTrial(s: State, id: string): boolean {
  const tr = availableTrials(s).find((x) => x.id === id);
  if (!tr) return false;
  const [h, n] = trialProgress(s, tr);
  if (h < n) return false;
  delete s.trialBase[id];
  if (tr.kind === 'subclass') {
    s.classPaths[tr.target] = { tier: 2, rank: 1, xp: 0 };
    s.events.push(`Subclass unlocked: ${tr.target}. Equip it in Skills.`);
  } else if (tr.kind === 'class') {
    s.classPaths[tr.target] = { tier: tr.tier, rank: 1, xp: 0 };
    s.events.push(`${tr.target} reaches T${tr.tier}.`);
  } else if (tr.kind === 'form') {
    s.formTracks[tr.target] = { tier: tr.tier, rank: 1, xp: 0 };
    s.events.push(`${tr.target === 'mastery' ? 'Mastery' : FORMS.find((x) => x.id === tr.target)?.name} reaches T${tr.tier}.`);
  } else {
    s.formOffered = true;
    s.events.push('A transformation is offered. Choose in Skills → Form.');
  }
  say(s, tr.text + ' — done.');
  return true;
}

/** Equip a subclass you own (or the base class). Not during a boss, dungeon or escape. */
export const canSwitchPath = (s: State) => !s.life.foe.boss && !s.dungeon && !s.escape && !s.pending.length;
export function equipPath(s: State, path: string): boolean {
  if (!s.classPaths[path] || !canSwitchPath(s)) return false;
  s.classPath = path;
  s.life.buffs = [];
  return true;
}

/** Take a transformation: the first closes Mortal Master for good; a 2nd/3rd only while every form is T1–T2. */
export function acceptForm(s: State, id: string): boolean {
  if (id === 'mortal' || !FORMS.some((f) => f.id === id) || s.forms.includes(id)) return false;
  if (s.forms.length === 0 ? !s.formOffered : !canAddForm(s)) return false;
  if (s.forms.length === 0) {
    delete s.formTracks.mastery;
    for (const k of Object.keys(s.formRanks)) if (k.startsWith('mastery')) delete s.formRanks[k];
  }
  s.forms.push(id);
  s.formTracks[id] = { tier: 1, rank: 1, xp: 0 };
  s.hero.form = s.forms[0];
  say(s, `You take the ${FORMS.find((f) => f.id === id)?.name} path.${s.forms.length > 1 ? ' A hybrid now.' : ' Mortal Master is closed.'}`);
  return true;
}

/** Class and form ultimates (T7). */
export function ultimates(s: State): Ultimate[] {
  const out: Ultimate[] = [];
  const cp = s.classPaths[s.classPath];
  if (s.classPath !== 'base' && cp && cp.tier >= 7) {
    const u = SUBCLASS_EXTRA[subclassKey(s, s.classPath)]?.ultimate;
    if (u) out.push(u);
  }
  for (const f of s.forms.length ? s.forms : ['mastery']) {
    const tr = s.formTracks[f];
    if (tr && tr.tier >= 7 && formCap(s, f) >= 7) {
      const u = FORM_EXTRA[f]?.ultimate;
      if (u) out.push(u);
    }
  }
  return out;
}

/** Set types whose every piece is worn. */
export const setRuleActive = (s: State, def: SetDef) => !def.cls || def.cls === s.hero.cls;
export const itemRuleActive = (s: State, it: Item) => !it.cls || it.cls === s.hero.cls;
export function setsComplete(s: State): SetDef[] {
  return SETS.filter((def) => {
    if (!setRuleActive(s, def)) return false;
    const have = new Set<number>();
    for (const it of Object.values(s.equipped)) if (it?.set === def.id && it.piece !== undefined && itemRuleActive(s, it)) have.add(it.piece);
    return have.size === def.pieces.length;
  });
}

/** Cleave from the Warrior's Berserker branch (% of leftover damage carried). */
export function classCleave(s: State): number {
  return classOf(s).tree.reduce((a, n) => a + (classNodeActive(s, n) ? (n.cleave ?? 0) * (s.ranks[n.id] ?? 0) : 0), 0);
}

export const namedElement = (i: number): Element => NAMED_ELEMENTS[i] ?? 'phys';

/** Named level milestones reached this life: per-Named multipliers, a tap multiplier and how many were reached. */
export function milestones(s: State): { per: number[]; tap: number; reached: number } {
  const per = ALLIES.map(() => 1);
  let all = 1;
  let tapM = 1;
  let reached = 0;
  s.life.allyLevels.forEach((lv, i) => {
    for (const m of NAMED_MILESTONES[i] ?? []) {
      if (lv < m.level) continue;
      reached++;
      const f = 1 + m.pct / 100;
      if (m.scope === 'self') per[i] *= f;
      else if (m.scope === 'element') per.forEach((_, j) => { if (namedElement(j) === namedElement(i)) per[j] *= f; });
      else if (m.scope === 'all') all *= f;
      else tapM *= f;
    }
  });
  return { per: per.map((x) => x * all), tap: tapM, reached };
}

/** The next milestone level for a Named (or null when all are reached). */
export function nextMilestone(s: State, i: number): number | null {
  const lv = s.life.allyLevels[i];
  const m = (NAMED_MILESTONES[i] ?? []).find((x) => x.level > lv);
  return m ? m.level : null;
}

const SLOT_PCT: Record<ItemSlot, StatKey> = {
  head: 'headPct', neck: 'neckPct', shoulders: 'shouldersPct', back: 'backPct', chest: 'chestPct', wrists: 'wristsPct',
  hands: 'handsPct', waist: 'waistPct', legs: 'legsPct', feet: 'feetPct', ring1: 'ringPct', trinket1: 'trinketPct',
  mainHand: 'mainHandPct', offHand: 'offHandPct',
};

/** Everything except scars, added together, plus every active rule-bender. */
export function fullStats(s: State): { st: Stats; rules: Rules } {
  const st: Stats = {};
  const rules: Rules = new Map();
  const race = RACES.find((r) => r.id === s.hero.race) ?? RACES[0];
  addStats(st, race.attrs);
  for (const n of classOf(s).tree) {
    const r = s.ranks[n.id] ?? 0;
    if (r > 0 && n.kind === 'passive' && n.stat && classNodeActive(s, n)) addStats(st, { [n.stat]: (n.perRank ?? 0) * r });
  }
  for (const n of subclassExtraNodes(s)) if (tierNodeOpen(s, n)) addEffect(st, rules, n.effect, s.ranks[n.id] ?? 0, n.id);
  const faith = FAITHS.find((f) => f.id === s.hero.faith);
  if (faith) addStats(st, faith.stats);
  // run 5: the stat half of the race rules (the rest is in the code that each rule touches)
  if (s.hero.race === 'human') addStats(st, { goldPct: 10 });
  if (s.hero.race === 'dwarf') addStats(st, { timerSec: 3 });
  if (s.hero.race === 'orc') addStats(st, { normalPct: 10 });
  for (const fid of s.forms.length ? s.forms : ['mortal']) {
    const form = FORMS.find((f) => f.id === fid);
    if (form) addStats(st, form.stats); // a hybrid keeps every weakness [main game]
  }
  for (const r of RELICS) addEffect(st, rules, r.effect, s.relics[r.id] ?? 0, r.id);
  const rt = raceTree(s);
  if (rt) for (const n of rt.nodes) addEffect(st, rules, n.effect, s.raceRanks[n.id] ?? 0, n.id);
  for (const n of formNodes(s)) if (formNodeOpen(s, n)) addEffect(st, rules, n.effect, s.formRanks[n.id] ?? 0, n.id);
  for (const def of setsComplete(s)) addEffect(st, rules, def.bonus, 1, def.id);
  for (const a of ACHIEVEMENTS) {
    const k = s.ach[a.id] ?? 0;
    if (k > 0) st[a.stat] = (st[a.stat] ?? 0) + a.per * k;
  }
  const petMult = 1 + (st.petPct ?? 0) / 100;
  for (const p of PETS) {
    const lv = s.pets[p.id] ?? 0;
    if (lv > 0) st[p.stat] = (st[p.stat] ?? 0) + p.per * lv * (s.petsOut.includes(p.id) ? 1 : PET_BENCH) * petMult;
  }
  // gear last: slot bonuses (pets, relics...) and merge levels scale each item's stats
  const gear: Stats = {};
  for (const [slot, it] of Object.entries(s.equipped) as [Slot, Item][]) {
    if (!it) continue;
    const key = SLOT_PCT[it.slot] ?? SLOT_PCT[slot as ItemSlot];
    addStats(gear, it.stats, (1 + (key ? st[key] ?? 0 : 0) / 100) * (1 + PLUS_STEP * (it.plus ?? 0)) * (1 + FORGE_STEP * (it.forge ?? 0)));
    if (it.fx && itemRuleActive(s, it)) addEffect(st, rules, { rule: it.fx }, 1, it.chase ?? it.name);
  }
  addStats(st, gear);
  // run 6: the Stash. Each complete stashed set (max 10) adds 1% of the worn gear's stats once, plus a small form of its rule
  const stashed = stashSets(s);
  if (stashed.length) {
    addStats(st, gear, STASH_STAT * stashed.length);
    for (const def of stashed) {
      if (!setRuleActive(s, def)) continue;
      const small = stashRule(def);
      if (small) addEffect(st, rules, small, 1, `stash:${def.id}`);
      else st.dmgPct = (st.dmgPct ?? 0) + STASH_FLAT_DMG;
    }
  }
  if (activeRules(s).has('clapper')) addStats(st, { timerSec: 10 });
  return { st, rules };
}

export const totalStats = (s: State): Stats => fullStats(s).st;

/** Scars are multiplicative (for % stats) so unlimited scars never go below zero. */
export function scarEffects(s: State): { mult: Partial<Record<StatKey, number>>; flat: Stats } {
  const mult: Partial<Record<StatKey, number>> = {};
  const flat: Stats = {};
  for (const id of s.scars) {
    const def = SCARS.find((x) => x.id === id);
    if (!def) continue;
    for (const [k, v] of Object.entries(def.stats) as [StatKey, number][]) {
      if (k.endsWith('Pct') || k === 'critDmg') mult[k] = (mult[k] ?? 1) * (1 + v / 100);
      else flat[k] = (flat[k] ?? 0) + v;
    }
  }
  return { mult, flat };
}

export interface Derived {
  attrs: Record<Attr, number>;
  stats: Stats;
  rules: Rules;
  tapMult: number; // multiplier on hero base
  tap: Big; // damage of one normal tap (no crit, no buffs, no element)
  tapEl: Element;
  critChance: number;
  critMult: number;
  bossMult: number;
  normalMult: number;
  allyMult: number;
  namedDps: Big[]; // each Named, before the foe's immunities
  allyDps: Big; // all Named, without buffs
  goldMult: number;
  timer: number;
  manaMax: number;
  manaRegen: number;
  skillPower: number;
  emberPct: number;
  lootLuck: number;
  offlineRate: number;
  cooldownCut: number; // 0..0.75
  durationPlus: number; // seconds
  autoTap: number; // free taps per second
  overkill: number; // 0..1 of leftover damage carried
  xpMult: number;
  markMult: number;
  petMult: number;
}

export function derive(s: State): Derived {
  const { st, rules } = fullStats(s);
  const { mult: sm, flat: sf } = scarEffects(s);
  addStats(st, sf);
  const legacy = activeRules(s);
  const attrs = Object.fromEntries(ATTRS.map((a) => [a, Math.max(0, st[a] ?? 0)])) as Record<Attr, number>;
  const main = attrs[classOf(s).main];
  const weapon = Math.max(0, st.weapon ?? 0);
  const m = (k: StatKey) => sm[k] ?? 1;
  const ms = milestones(s);
  const tpm = ruleSum(rules, 'tapPerMilestone');

  let tapMult = (1 + weapon / 25) * (1 + main * 0.04) * Math.max(0.05, 1 + (st.tapPct ?? 0) / 100) * m('tapPct') * ms.tap
    * (1 + TRAIN_PERKS.tap.per * (s.trainPerks ?? []).filter((x) => x === 'tap').length);
  if (tpm) tapMult *= 1 + (tpm.a * ms.reached) / 100;
  if (legacy.has('nail')) tapMult *= 0.75;
  let critChance = 0.05 + attrs.agi * 0.001 + (st.critChance ?? 0) / 100 + TRAIN_PERKS.crit.per * (s.trainPerks ?? []).filter((x) => x === 'crit').length;
  critChance = Math.min(legacy.has('mask') ? 0.3 : 0.75, Math.max(0, critChance));
  let critMult = (2 + attrs.agi * 0.005 + (st.critDmg ?? 0) / 100) * m('critDmg');
  if (legacy.has('mask')) critMult *= 1.5;
  critMult = Math.max(1, critMult);
  const bossMult = Math.max(0.1, 1 + (st.bossPct ?? 0) / 100) * m('bossPct');
  const normalMult = Math.max(0.1, 1 + (st.normalPct ?? 0) / 100);
  const allyMult = (1 + attrs.spi * 0.03) * Math.max(0.05, 1 + (st.allyPct ?? 0) / 100) * m('allyPct') * (1 + MERC_STEP * (s.life.mercs ?? 0));
  const klass = s.hero.cls;
  const rv = (k: RuleKind) => ruleSum(rules, k)?.a ?? 0; // run 6 class gear (these rules exist only for their own class)
  const goldMult = Math.max(0.05, 1 + (st.goldPct ?? 0) / 100) * m('goldPct') * (1 + rv('rangerGold') / 100);
  const timer = Math.min(90, Math.max(10, 30 + attrs.sta * 0.04 + (st.timerSec ?? 0) + (klass === 'rogue' ? ROGUE_TIMER : 0)));
  const manaMax = Math.max(20, 40 + attrs.int * 0.5 + (st.manaMax ?? 0)) * (1 + rv('manaMaxPct') / 100);
  const manaRegen = Math.max(0.1, 0.6 + attrs.spi * 0.01 + (st.manaRegen ?? 0)) + rv('manaRegenPlus');
  const skillPower = Math.max(0.1, (1 + attrs.int * 0.01 + (st.skillPct ?? 0) / 100) * m('skillPct')) * (klass === 'mage' ? MAGE_SKILL : 1)
    * (1 + rv('mageFocus') / 100) * (1 + rv('burntGrimoire') / 100);

  const namedDps = s.life.allyLevels.map((lv, i) =>
    B.times(allyBaseDps(i, lv), allyMult * ms.per[i] * Math.max(0.05, 1 + (st[ELEMENT_PCT[namedElement(i)]] ?? 0) / 100) * (klass === 'warrior' ? WARRIOR_NAMED : 1)));
  let allyDps: Big = B.ZERO;
  for (const x of namedDps) allyDps = B.add(allyDps, x);
  const cut = (ruleSum(rules, 'cooldownCut')?.a ?? 0) + (st.cooldownPct ?? 0);

  return {
    attrs, stats: st, rules, tapMult, tap: B.times(heroBaseBig(s.life.heroLevel), tapMult), tapEl: s.equipped.mainHand?.el ?? 'phys',
    critChance, critMult, bossMult, normalMult, allyMult, namedDps, allyDps, goldMult, timer, manaMax, manaRegen, skillPower,
    emberPct: st.emberPct ?? 0, lootLuck: st.lootLuck ?? 0,
    offlineRate: OFFLINE_BASE_RATE * (1 + (st.offlinePct ?? 0) / 100),
    cooldownCut: Math.min(0.5, Math.max(0, cut / 100)), // run 2: 0.75 let buffs run back to back
    durationPlus: Math.min(8, (ruleSum(rules, 'durationPlus')?.a ?? 0) + (st.durationSec ?? 0)),
    autoTap: Math.max(0, st.autoTap ?? 0) + (klass === 'ranger' ? (RANGER_AUTO + rv('volleyAuto') + rv('arrowPlus')) * (1 + rv('silentString') / 100) : 0),
    overkill: Math.min(1, Math.max(0, OVERKILL_BASE + (classCleave(s) + Math.min(OVERKILL_OTHER_CAP, st.overkillPct ?? 0)) / 100) * (s.hero.race === 'orc' ? 2 : 1)),
    xpMult: Math.max(0.1, 1 + (st.xpPct ?? 0) / 100),
    markMult: Math.max(0.1, 1 + (st.markPct ?? 0) / 100),
    petMult: Math.max(0.1, 1 + (st.petPct ?? 0) / 100) * (klass === 'ranger' ? RANGER_PETS : 1) * (1 + rv('petHaste') / 100),
  };
}

/** How much of `el` damage this foe takes: 0 if immune (piercing lets up to 50% through), x1.5 on a weakness. */
export function elementFactor(d: Derived, foe: Foe, el: Element): number {
  const pct = Math.max(0.05, 1 + (d.stats[ELEMENT_PCT[el]] ?? 0) / 100);
  if (foe.immune?.includes(el)) {
    const pierce = Math.min(MAX_PIERCE, (d.stats[ELEMENT_PIERCE[el]] ?? 0) + (d.stats.pierceAll ?? 0));
    return (pct * Math.max(IMMUNE_FLOOR, pierce)) / 100; // run 2: was 0, a random wall
  }
  return foe.weak?.includes(el) ? pct * WEAK_MULT : pct;
}

/** The element your taps deal right now (weapon enchant, or the foe's weakness with the Starfall set). */
export function tapElement(s: State, d: Derived, foe: Foe): Element {
  if (d.rules.has('weakestElement') && foe.weak?.length) return foe.weak[0];
  if (d.rules.has('weakestElement') && foe.immune?.includes(d.tapEl)) return ELEMENTS.find((e) => !foe.immune!.includes(e)) ?? d.tapEl;
  return d.tapEl;
}

const buffMag = (s: State, kind: ActiveKind): number => s.life.buffs.filter((b) => b.kind === kind).reduce((a, b) => a + b.mag, 0);

// ------------------------------------------------------------------ creation

export function newLife(): Life {
  return {
    stage: 1, kills: 0, foe: plainFoe(1, false, 0), bossLeft: 0, autoBoss: true, gold: B.ZERO,
    heroLevel: 1, allyLevels: ALLIES.map(() => 0), mana: 40, cooldowns: {}, buffs: [], maxStage: 1,
    wanderLeft: 0, bossAge: 0, bleed: B.ZERO, revived: false, bossFails: 0, shatter: 0, tapN: 0, starT: 0, autoT: {},
    fairy: null, fairyIn: FAIRY_MIN, treasureNext: false, interestT: 0,
  };
}

function plainFoe(stage: number, boss: boolean, idx: number, hpMult = 1): Foe {
  const z = zoneFor(stage);
  // run 3: a land's bosses take turns by stage, so a land is not one boss 50 times
  const landBoss = z.bosses?.length ? z.bosses[stage % z.bosses.length] : z.boss;
  const name = boss ? (stage % BISHOP_EVERY === 0 ? 'The Hollow Bishop' : landBoss) : z.foes[idx % z.foes.length];
  const hp = B.times(boss ? bossHp(stage) : foeHp(stage), hpMult);
  return { name, hp, max: hp, boss };
}

/** Immunities from stage 26 (two from 101), like Diablo II. A boss always keeps at least one weakness. */
function rollElements(s: State, stage: number, big: boolean, foe: Foe) {
  if (stage < IMMUNE_FROM) return;
  const n = (rand(s) < 0.3 ? 1 : 0) + (stage >= TWO_IMMUNE_FROM && rand(s) < 0.25 ? 1 : 0);
  const pool = [...ELEMENTS];
  const immune: Element[] = [];
  // run 3: deep lands favour their own immunity for the first one (same number of draws, so the main seed sequence is unchanged)
  const theme = s.escape || s.dungeon ? undefined : zoneFor(stage).immune; // realms are their own places: no land theme there
  for (let i = 0; i < n; i++) {
    const at = Math.floor(rand(s) * pool.length) % pool.length;
    const ti = i === 0 && theme ? pool.indexOf(theme) : -1;
    immune.push(pool.splice(ti >= 0 ? ti : at, 1)[0]);
  }
  if (immune.length) foe.immune = immune;
  if (big || immune.length || rand(s) < 0.3) foe.weak = [pool.splice(Math.floor(rand(s) * pool.length) % pool.length, 1)[0]];
}

export const landIndex = (stage: number) => { const z = zoneFor(stage); return z.base ?? Math.max(0, ZONES.indexOf(z)); };

function specialName(s: State, kind: 'treasure' | 'wanderer', stage: number): string {
  const land = landIndex(stage);
  const list = SPECIAL_FOES.filter((f) => f.kind === kind && f.lands.includes(land));
  const all = list.length ? list : SPECIAL_FOES.filter((f) => f.kind === kind);
  return all.length ? pick(s, all).name : kind === 'treasure' ? 'Grave Robber' : 'Wandering Horror';
}

function makeFoe(s: State, stage: number, boss: boolean, idx: number): Foe {
  const L = s.life;
  const d = derive(s);
  let hpMult = !boss && activeRules(s).has('clapper') ? 1.25 : 1;
  if (!boss && !s.escape && !s.dungeon) hpMult *= normalHpMult(stage); // run 7: escapes and dungeons keep their own tuning
  if (boss && L.bossFails > 0) {
    const w = ruleSum(d.rules, 'bossWeaken');
    if (w) hpMult *= 1 - Math.min(w.b || 30, w.a * L.bossFails) / 100;
  }
  const foe = plainFoe(stage, boss, idx, hpMult);
  if (!boss && !s.escape && !s.dungeon) {
    const tr = TREASURE_CHANCE * (1 + (d.stats.treasureRate ?? 0) / 100);
    const wr = WANDER_CHANCE * (1 + (d.stats.wanderRate ?? 0) / 100);
    const rush = (L.rushLeft ?? 0) > 0;
    if (rush) L.rushLeft! -= 1;
    if (rush || L.treasureNext || (stage >= 5 && rand(s) < tr)) {
      if (!rush) L.treasureNext = false;
      foe.kind = 'treasure';
      foe.name = specialName(s, 'treasure', stage);
      foe.hp = foe.max = B.times(foe.hp, 2);
    } else if (stage >= WANDER_FROM && rand(s) < wr) {
      foe.kind = 'wanderer';
      foe.name = specialName(s, 'wanderer', stage);
      foe.hp = foe.max = B.times(bossHp(stage), 3);
      L.wanderLeft = WANDER_SECONDS * (s.hero.faith === 'lantern' ? 2 : 1);
      if (s.hero.faith === 'lantern') moment(s, 'lantern', 'Lantern Covenant: this wanderer stays twice as long.');
    }
  }
  // run 4: about 1 ordinary world foe in 8 is an elite (own random stream, so the main seed sequence is unchanged)
  if (!boss && !foe.kind && !s.escape && !s.dungeon && stage >= ELITE_FROM && randR4(s) < ELITE_CHANCE * eliteRate(s)) {
    foe.elite = ELITE_KINDS[Math.floor(randR4(s) * ELITE_KINDS.length) % ELITE_KINDS.length];
    foe.hp = foe.max = B.times(foe.hp, ELITE_HP);
    if (foe.elite === 'armoured') foe.armour = ARMOUR_CRITS;
    if (foe.elite === 'swift') foe.fleeLeft = s.hero.race === 'elf' ? 12 : SWIFT_SECONDS;
    if (s.hero.race === 'elf') moment(s, 'elf', 'Elf: your keen eyes find elites 50% more often.');
    if (foe.elite === 'warded') foe.fleeLeft = WARDED_SECONDS;
    foe.weakT = 0;
  }
  rollElements(s, stage, boss || foe.kind === 'wanderer', foe);
  if (foe.elite === 'warded' && !foe.immune?.length) {
    const pool = ELEMENTS.filter((e) => !foe.weak?.includes(e));
    foe.immune = [pool[Math.floor(randR4(s) * pool.length) % pool.length]];
  }
  if (L.shatter > 0) {
    foe.hp = B.times(foe.hp, 1 - Math.min(90, L.shatter) / 100);
    L.shatter = 0;
  }
  return foe;
}

export function newGame(hero: Hero, seed: number, now: number): State {
  const s: State = {
    v: SAVE_VERSION, seed: seed | 0, hero, life: newLife(), bestStage: 1, ranks: {}, embers: B.ZERO, relics: {}, scars: [],
    equipped: {}, bag: [], nextItemId: 1, escape: null, pending: [], lastSeen: now, returns: 0, bestReturn: B.ZERO,
    totalTaps: 0, log: [],
    xp: 0, raceRanks: {}, formRanks: {}, spells: {}, points: { classPt: 0, formPt: 0 }, quest: { num: 1, base: 0 },
    counts: {}, marks: 0, keys: 1, eggs: 0, pets: {}, petsOut: [], ach: {}, chest: 0,
    daily: { day: -1, week: -1, tasks: [], weekly: [], loginDay: 0, loginGiven: -1 }, dungeon: null, events: [],
    classPaths: { base: { tier: 1, rank: 1, xp: 0 } }, classPath: 'base', forms: [], formTracks: { mastery: { tier: 1, rank: 1, xp: 0 } },
    formOffered: false, trialBase: {},
    eventSeed: ((seed | 0) * 31 + 7) | 0, gimmickSeed: ((seed | 0) * 17 + 3) | 0, trainPerks: [], landsSeen: [], landSplit: true, gems: 0, gemsWelcome: true, eventLog: [], gimmicksBeaten: [],
  };
  s.hero.form = 'mortal'; // transformations are earned through quests now
  // starting kit: a plain weapon for the class and the family heirloom
  const cls = classOf(s);
  s.equipped.mainHand = {
    id: s.nextItemId++, name: `Worn ${BASE_NAMES[cls.weapon][0]}`, slot: 'mainHand', rarity: 'common', ilvl: 1,
    stats: { weapon: 3 }, look: cls.weapon,
  };
  s.equipped.trinket1 = {
    id: s.nextItemId++, name: HEIRLOOM.name, slot: 'trinket1', rarity: 'ancestry', ilvl: 1,
    stats: { [cls.main]: 3, goldPct: 5 }, rule: HEIRLOOM.rule, ruleText: HEIRLOOM.text,
  };
  if (s.hero.cls === 'mage') s.spells['lantern-strike'] = 1; // run 5 gate: Spellweave needs a spell from the first minute
  s.life.mana = derive(s).manaMax;
  s.life.foe = makeFoe(s, 1, false, 0);
  s.quest.base = questProgressBase(s, 1);
  say(s, `${hero.name} wakes in the Lanternfall graves.`);
  return s;
}

// ------------------------------------------------------------------ counters and XP

export function count(s: State, k: GoalKind, n = 1) {
  s.counts[k] = (s.counts[k] ?? 0) + n;
}

/** Permanent XP level: level L needs 30 * (L-1)^XP_EXP XP in total. Run 2: tuned with the sim so the 90-point race tree fills in lives 3 to 4. */
export const XP_EXP = 1.88; // run 2 sim: 1.7 filled the race tree in life 2, 2.0 left it for life 8; run 3 (deeper lives): 1.82 -> 1.88
export const xpForLevel = (level: number) => 30 * Math.pow(Math.max(0, level - 1), XP_EXP);
export const xpLevel = (xp: number) => 1 + Math.floor(Math.pow(Math.max(0, xp) / 30, 1 / XP_EXP) + 1e-9);

// run 8: the race pace now slows boss and elite XP too (it only touched normal foes, so a Cleric still filled its tree in life 2)
export const racePace = (s: State) => (s.returns > 0 ? RACE_XP_PACE_LATER : RACE_XP_PACE);
function gainXp(s: State, d: Derived, stage: number, big: boolean, normal = 1) {
  const before = xpLevel(s.xp);
  s.xp += (1 + stage * 0.03) * (big ? 6 * racePace(s) : normal) * d.xpMult; // MIB round 6: slower, so the race tree lasts several lives
  const after = xpLevel(s.xp);
  if (after > before) s.events.push(`Level ${after}: +${after - before} race point${after - before > 1 ? 's' : ''}.`);
}

function addGold(s: State, gold: Big) {
  s.life.gold = B.add(s.life.gold, gold);
  const prev = s.counts.gold;
  s.counts.gold = B.log10(B.add(prev === undefined ? B.ZERO : B.fromLog(prev), gold));
}

// ------------------------------------------------------------------ fighting

function currentFoe(s: State): Foe {
  if (s.dungeon && !s.dungeon.done) return s.dungeon.foe;
  return s.escape && !s.escape.done ? s.escape.foe : s.life.foe;
}
export const foeNow = currentFoe;

const isBig = (f: Foe) => f.boss || f.kind === 'wanderer';

/** Raw damage of one strike, crit rolled (no element, no foe modifiers). */
function strike(s: State, d: Derived, scale = 1): { dmg: Big; crit: boolean } {
  const tapBuff = 1 + buffMag(s, 'tapBuff');
  const critBonus = buffMag(s, 'critBuff') / 100;
  const crit = rand(s) < Math.min(0.95, d.critChance + critBonus);
  let dmg = B.times(d.tap, tapBuff * scale * (crit ? d.critMult : 1));
  if (activeRules(s).has('nail')) dmg = B.add(dmg, B.times(d.allyDps, 0.25 * scale));
  return { dmg, crit };
}

/** Everything about the foe that changes damage of one element: immunity, weakness, boss and normal bonuses, rule-benders. */
function foeMods(s: State, d: Derived, foe: Foe, el: Element): number {
  let f = elementFactor(d, foe, el) * (isBig(foe) ? d.bossMult : d.normalMult);
  // run 5: every source alike; inside realms the all-damage buffs (ultimates) cap at +50%, or one ultimate skips the gate
  const db = buffMag(s, 'dmgBuff');
  f *= Math.max(0.1, 1 + (d.stats.dmgPct ?? 0) / 100) * (1 + (s.escape || s.dungeon ? Math.min(REALM_DMG_BUFF_CAP, db) : db));
  if (el === weeklyElement(s)) f *= 1 + WEEKLY_BONUS;
  // run 6: class weapons sets that lift every source (their rules only exist for their own class)
  if ((s.life.surgeT ?? 0) > 0) f *= 1 + (s.life.surgeMag ?? 0); // Fury (Warrior) and Surge (Mage): their own multiplier, not the shared buff pool
  const cd = ruleSum(d.rules, 'comboDeep');
  if (cd?.b) f *= 1 + (cd.b * (s.life.combo ?? 0)) / 100;
  const va = ruleSum(d.rules, 'volleyAuto');
  if (va?.b && d.autoTap > 0) f *= 1 + va.b / 100;
  const realm = !!s.escape || !!s.dungeon; // run 5: boss-only bonuses stay out of realms (the gate is sized to end near 10 s)
  if (foe.boss && !realm) {
    const ramp = ruleSum(d.rules, 'bossRamp');
    if (ramp) f *= 1 + Math.min(ramp.b || 60, ramp.a * s.life.bossAge) / 100;
  }
  if (isBig(foe) && !realm) {
    const ex = ruleSum(d.rules, 'execute');
    if (ex && B.ratio(foe.hp, foe.max) < ex.a / 100) f *= 1 + ex.b / 100;
  }
  return f;
}

function hit(s: State, d: Derived, raw: Big, el: Element): boolean {
  const foe = currentFoe(s);
  return damage(s, B.times(raw, foeMods(s, d, foe, el) * shieldFactor(foe)), d);
}

export interface TapResult { dmg: Big; crit: boolean; killed: boolean; el: Element; weak?: boolean }

/** `weak`: the UI says this tap landed on the weak spot; the rules check that the spot is open. */
export function tap(s: State, opts?: { weak?: boolean }): TapResult {
  const none: TapResult = { dmg: B.ZERO, crit: false, killed: false, el: 'phys' };
  if (s.pending.length || s.escape?.done || s.dungeon?.done) return none;
  const d = derive(s);
  const foe = currentFoe(s);
  const el = tapElement(s, d, foe);
  const { dmg: raw0, crit } = strike(s, d);
  s.totalTaps++;
  count(s, 'taps');
  if (crit) count(s, 'crits');
  const weak = !!opts?.weak && weakOpen(s);
  const L0 = s.life;
  const k = s.hero.cls;
  if (weak) {
    count(s, 'weakHits'); foe.weakT = 0; foe.weakN = (foe.weakN ?? 0) + 1;
    if (k === 'rogue') { L0.combo = Math.min(comboMax(d), (L0.combo ?? 0) + 1); if ((s.counts.comboMax ?? 0) < L0.combo) s.counts.comboMax = L0.combo; }
  }
  let armour = 1;
  if (foe.elite === 'armoured' && (foe.armour ?? 0) > 0) { armour = ARMOUR_TAP; if (crit) foe.armour = foe.armour! - 1; }
  // run 5: each class's manual tap
  let classMult = k === 'mage' ? MAGE_TAP : k === 'ranger' ? (ruleSum(d.rules, 'silentString') ? 0 : RANGER_TAP) : k === 'cleric' ? CLERIC_TAP : 1;
  if (k === 'rogue' && crit) classMult *= 1 + COMBO_CRIT * (L0.combo ?? 0);
  let strikeMult = 1;
  if (k === 'warrior') {
    if ((L0.rage ?? 0) >= RAGE_MAX) {
      strikeMult = (ruleSum(d.rules, 'chainStrike')?.a || RAGE_STRIKE) * (1 + (ruleSum(d.rules, 'strikePlus')?.a ?? 0) / 100) * (!crit && ruleSum(d.rules, 'strikeCrit') ? d.critMult : 1);
      L0.rage = 0; count(s, 'rageStrikes');
      const fury = ruleSum(d.rules, 'fury'); // run 6: Oathbreaker Pair
      if (fury) { L0.surgeT = fury.b || 6; L0.surgeMag = fury.a / 100; }
    }
    else L0.rage = Math.min(RAGE_MAX, (L0.rage ?? 0) + RAGE_PER_TAP + (ruleSum(d.rules, 'rageGain')?.a ?? 0));
  }
  if (k === 'mage' && !(ruleSum(d.rules, 'burntGrimoire') && L0.mana < d.manaMax * 0.25)) { const before = L0.mana; L0.mana = Math.min(d.manaMax, L0.mana + MAGE_MANA_PER_TAP + (ruleSum(d.rules, 'manaTap')?.a ?? 0)); if (L0.mana > before) count(s, 'manaFromTaps', L0.mana - before); }
  if (k === 'cleric') L0.prayer = Math.min(prayerMax(d), (L0.prayer ?? 0) + PRAYER_PER_TAP * (1 + buffMag(s, 'tapBuff')) * (1 + (ruleSum(d.rules, 'prayerGain')?.a ?? 0) / 100));
  L0.sinceTap = 0;
  const weakMult = weak ? (k === 'rogue' ? ruleSum(d.rules, 'glassKnife')?.a || ROGUE_WEAK_MULT : WEAK_SPOT_MULT) : 1;
  if (weak) { const sg = ruleSum(d.rules, 'spotGold'); if (sg) addGold(s, B.times(d.allyDps, sg.a * GOLD_PER_HP * d.goldMult)); }
  const raw = B.times(raw0, weakMult * armour * classMult); // cleave and splash use this (no Rage Strike x25)
  const dmg = B.times(raw, foeMods(s, d, foe, el) * shieldFactor(foe) * strikeMult);
  if (foe.boss && !s.escape && !s.dungeon) {
    const bl = ruleSum(d.rules, 'bleed');
    if (bl) s.life.bleed = B.add(s.life.bleed, B.times(dmg, bl.a / 100));
  }
  if (crit && isBig(foe)) {
    const cf = ruleSum(d.rules, 'critFreeze');
    if (cf && rand(s) < cf.a / 100) s.life.buffs.push({ kind: 'freeze', mag: 1, left: cf.b || 2, from: 'critFreeze' });
  }
  const killed = damage(s, dmg, d, crit);
  if (killed) {
    const cleave = ruleSum(d.rules, 'tapCleave');
    if (cleave) hit(s, d, B.times(raw, cleave.a / 100), el);
    const splash = crit ? ruleSum(d.rules, 'critSplash') : null;
    if (splash) for (let i = 0; i < Math.max(1, splash.b); i++) if (!hit(s, d, B.times(raw, splash.a / 100), splash.el ?? 'fire')) break;
  }
  tapCounter(s, d, 1);
  return { dmg, crit, killed, el, weak };
}

/** Taps (and Named hits that count as taps) move the nth-tap and free-spell counters. */
function tapCounter(s: State, d: Derived, inc: number) {
  const L = s.life;
  const before = L.tapN;
  L.tapN += inc;
  const crossed = (n: number) => n >= 1 && Math.floor(L.tapN / n) > Math.floor(before / n);
  const nth = ruleSum(d.rules, 'nthTap');
  if (nth && crossed(nth.a)) hit(s, d, B.times(d.tap, nth.b || 20), nth.el ?? 'fire');
  const fs = ruleSum(d.rules, 'freeSpellTaps');
  if (fs && crossed(Math.max(20, fs.a))) castRandomSpell(s);
}

/** Apply damage to the current foe; returns true if it died. Leftover damage on a normal foe carries on (overkill). */
/** Run 6 sim: adds up all damage dealt while `on` (the paired gear check). Off in play. */
export const dmgMeter = { on: false, v: B.ZERO as Big };
function damage(s: State, dmg: Big, d: Derived = derive(s), crit = false): boolean {
  const foe = currentFoe(s);
  if (B.isZero(dmg)) return false;
  if (dmgMeter.on) dmgMeter.v = B.add(dmgMeter.v, dmg);
  // run 5: no single hit takes more than 8% of an escape gate (a burst skill could skip the fight)
  if (s.escape && !s.escape.done && foe.boss) dmg = B.min(dmg, B.times(foe.max, GATE_HIT_CAP));
  if (foe.boss && foe.addHp?.length) {
    // run 4, adds: the front add takes the hit; the boss takes only a share until both adds are dead
    const i = foe.addHp.findIndex((h) => !B.isZero(h));
    if (i >= 0) {
      foe.addHp[i] = B.sub(foe.addHp[i], dmg);
      if (B.isZero(foe.addHp[i]) && foe.addHp.every((h) => B.isZero(h))) say(s, 'The adds fall. The boss takes full damage again.');
      dmg = B.times(dmg, ADDS_BOSS_SHARE);
    }
  }
  const before = foe.hp;
  if (s.escape && !s.escape.done) { const got = B.lt(dmg, before) ? dmg : before; s.escape.dealt = B.add(s.escape.dealt ?? B.ZERO, got); s.escape.winD = B.add(s.escape.winD ?? B.ZERO, got); if (foe.boss) s.escape.gateD = B.add(s.escape.gateD ?? B.ZERO, got); }
  // only ordinary foes count: boss damage bonuses would size escapes (whose foes are not bosses) too big
  // run 3: time inside an event is not measured either, so a 30 s Eclipse cannot inflate the next escape
  if (!s.escape && !s.dungeon && !s.life.event && !foe.boss && !foe.kind && !foe.elite && !foe.immune?.length && !isBig(foe)) { const L = s.life; L.dmgAcc = B.add(L.dmgAcc ?? B.ZERO, B.lt(dmg, before) ? dmg : before); }
  foe.hp = B.sub(foe.hp, dmg);
  let dead = B.isZero(foe.hp) || B.ratio(foe.hp, foe.max) <= 1e-9;
  if (!dead && !isBig(foe)) {
    const ex = ruleSum(d.rules, 'execute');
    if (ex && B.ratio(foe.hp, foe.max) < ex.a / 100) dead = true;
  }
  if (!dead) return false;
  const leftover = B.sub(dmg, before);
  foe.hp = B.ZERO;
  if (s.dungeon && !s.dungeon.done) dungeonKill(s, d);
  else if (s.escape && !s.escape.done) escapeKill(s);
  else {
    worldKill(s, d, crit);
    if (!isBig(foe) && !foe.kind) carry(s, d, leftover);
  }
  return true;
}

/** Overkill: part of the leftover damage hits the next foes. It never touches a boss or a special foe. */
function carry(s: State, d: Derived, left: Big) {
  let amt = B.times(left, d.overkill);
  if (s.hero.race === 'orc' && !B.lt(amt, B.big(1)) && !isBig(s.life.foe) && !s.escape && !s.dungeon) moment(s, 'orc', 'Orc: your overkill carries twice as far.');
  for (let n = 0; n < 60; n++) {
    if (B.lt(amt, B.big(1))) return;
    const f = s.life.foe;
    if (isBig(f) || f.kind || f.elite || s.escape || s.dungeon) return;
    if (B.lt(amt, f.hp)) {
      f.hp = B.sub(f.hp, amt);
      return;
    }
    amt = B.times(B.sub(amt, f.hp), d.overkill);
    f.hp = B.ZERO;
    worldKill(s, d, false, true);
  }
}

function worldKill(s: State, d: Derived, crit = false, viaOverkill = false) {
  const L = s.life;
  const legacy = activeRules(s);
  const foe = L.foe;
  let gold = B.times(foe.max, GOLD_PER_HP * d.goldMult * (1 + buffMag(s, 'goldBuff')));
  // run 7: while the extra health eases in (stages 1-8), a normal foe still pays for the foes a stage no longer has
  if (!foe.boss && !foe.kind && !s.escape && !s.dungeon) gold = B.times(gold, Math.max(1, KILL_WEIGHT / normalHpMult(L.stage)));
  if (legacy.has('coin')) gold = B.times(gold, foe.boss ? 2 : 0.5);
  if (legacy.has('clapper') && !foe.boss) gold = B.times(gold, 1 / 1.25); // clapper's extra health gives no extra gold
  if (foe.boss) gold = B.times(gold, 1 + (d.stats.bossGoldPct ?? 0) / 100);
  // bounties start after the first fall: they help past later walls, and life 1's first fall stays as tuned
  if (foe.boss && !s.escape && !s.dungeon && s.returns > 0 && isBountyStage(L.stage)) gold = B.times(gold, BOUNTY_GOLD);
  if (foe.elite) {
    gold = B.times(gold, (s.hero.faith === 'redhunt' ? 8 : ELITE_GOLD) / ELITE_HP); // its health already pays ELITE_HP times
    if (s.hero.faith === 'redhunt') moment(s, 'redhunt', 'Red Hunt: elites pay 8x gold, not 5x.');
    count(s, 'elites');
    if (foe.elite === 'swift') { s.marks += SWIFT_MARKS; say(s, `Caught the swift ${foe.name}: +${SWIFT_MARKS} Marks.`); }
  }
  if (foe.kind === 'treasure') {
    gold = B.times(gold, (TREASURE_GOLD / 2) * (1 + (d.stats.treasureGoldPct ?? 0) / 100));
    count(s, 'treasure');
    const split = ruleSum(d.rules, 'treasureSplit');
    if (split && rand(s) < split.a / 100) L.treasureNext = true;
  }
  addGold(s, gold);
  const bm = ruleSum(d.rules, 'bloodMoney');
  if (bm) freeNamedLevels(s, B.times(gold, bm.a / 100));
  // run 7: a world stage has KILL_WEIGHT times fewer (tougher) foes, and each pays that much more XP
  const kw = s.escape || s.dungeon ? 1 : KILL_WEIGHT;
  gainXp(s, d, L.stage, isBig(foe), kw * 0.9 * racePace(s)); // race XP a little under, so the race tree still lasts past life 2
  gainTierXp(s, isBig(foe), kw);
  count(s, 'kills');
  if (!s.escape && !s.dungeon && !foe.boss && L.stage >= TAB_STAGE.gear) {
    // run 8 (own stream, so the main sequence is unchanged): normal foes drop only Common; elites, treasure and wanderers 5%
    const special = !!foe.elite || !!foe.kind;
    if (randR4(s) < (special ? ELITE_DROP : TRASH_DROP)) dropItem(s, L.stage, 'boss', undefined, special ? undefined : 'common');
  }
  if (foe.immune?.length) count(s, 'immuneKills');
  if (crit) {
    const sh = ruleSum(d.rules, 'shatter');
    if (sh) L.shatter = sh.a;
  }
  const ext = ruleSum(d.rules, 'skillExtendOnKill');
  if (ext) for (const b of L.buffs) if (b.kind !== 'freeze' && (b.ext ?? 0) < (ext.b || 5)) {
    const add = Math.min(ext.a, (ext.b || 5) - (b.ext ?? 0));
    b.left += add;
    b.ext = (b.ext ?? 0) + add;
  }
  if (foe.kind === 'wanderer') {
    count(s, 'wanderers');
    L.wanderLeft = 0;
    dropItem(s, L.stage, 'boss', 'legendary');
    if (rand(s) < 0.25) giveEgg(s, 1);
    s.events.push(`${foe.name} falls. A Legendary drops.`);
    L.foe = makeFoe(s, L.stage, false, L.kills + L.stage);
    return;
  }
  if (foe.boss) {
    count(s, 'bosses');
    if (foe.gimmick && !s.gimmicksBeaten.includes(foe.gimmick)) {
      s.gimmicksBeaten.push(foe.gimmick);
      s.keys += 1;
      s.marks += 20;
      s.gems = (s.gems ?? 0) + 1;
      say(s, `First ${foe.gimmick === 'shield' ? 'warded' : foe.gimmick === 'adds' ? 'summoning' : 'tolling'} boss beaten: +1 key, +20 Marks.`);
    }
    if (!s.escape && !s.dungeon && L.bossLeft >= FAST_BOSS_LEFT) count(s, 'fastBosses');
    if (L.stage % BISHOP_EVERY === 0) count(s, 'bishops');
    const drip = ruleSum(d.rules, 'emberDrip');
    if (drip) s.embers = B.add(s.embers, B.times(previewEmbers(s), drip.a / 100));
    advanceStage(s, d, true);
    return;
  }
  L.kills++;
  if (L.kills >= KILLS_PER_STAGE) {
    if (viaOverkill && L.stage < s.bestStage) {
      // overkill sweeps through stages you have cleared before; it always stops at a new boss
      count(s, 'overkillStages');
      advanceStage(s, d, false);
      return;
    }
    if (L.autoBoss) {
      startBoss(s, d);
      return;
    }
  }
  L.foe = makeFoe(s, L.stage, false, L.kills + L.stage);
}

function advanceStage(s: State, d: Derived, bossKilled: boolean) {
  const L = s.life;
  const cleared = L.stage;
  L.stage++;
  L.kills = 0;
  L.trollHp = 1;
  L.bossFails = 0;
  L.revived = false;
  L.bleed = B.ZERO;
  L.bossAge = 0;
  L.maxStage = Math.max(L.maxStage, L.stage);
  if (L.stage > s.bestStage) {
    s.bestStage = L.stage;
    if (cleared % CHEST.every === 0 && cleared > s.chest) {
      s.chest = cleared;
      grant(s, CHEST.rewards, `Milestone chest (stage ${cleared})`);
      if (cleared % 100 === 0) { grant(s, CHEST.big, `Great chest (stage ${cleared})`); s.gems = (s.gems ?? 0) + GEMS_GREAT_CHEST; say(s, `+${GEMS_GREAT_CHEST} gems.`); }
    }
  }
  if (bossKilled && s.hero.race === 'dwarf' && L.bossLeft > 0 && L.bossLeft < 3) moment(s, 'dwarf', 'Dwarf: your extra 3 s on the clock won that fight.');
  const ironRoll = bossKilled ? rand(s) : 1;
  // run 8 (Clarence, 14 Nov: "too many things going on at once... item drops and points earned too fast"): bosses drop 15% (Iron 35%), every 10th for sure, and only from stage 25,
  // where the Gear tab opens; the first boss there always drops, so the tab never opens empty
  const gearOn = s.escape || s.dungeon || cleared >= TAB_STAGE.gear;
  const firstGear = !s.bag.length && !Object.values(s.equipped).some((x) => !!x);
  if (bossKilled && gearOn && (ironRoll < (s.hero.faith === 'iron' ? IRON_DROP : BOSS_DROP) || cleared % 10 === 0 || firstGear)) {
    dropItem(s, cleared, 'boss');
    if (s.hero.faith === 'iron' && ironRoll >= BOSS_DROP && cleared % 10 !== 0 && !firstGear) moment(s, 'iron', 'Iron Testament: that boss dropped gear only because of your faith.');
  }
  if (bossKilled) chaseDrop(s, cleared);
  const dr = ruleSum(d.rules, 'drift');
  if (dr && rand(s) < dr.a / 100) L.kills = KILLS_PER_STAGE - 1; // the stage drifts by: only its last foe remains
  L.foe = makeFoe(s, L.stage, false, 0);
}

/** Run 2, idea 46: the first land's bosses get 2 extra seconds, so a new player's first walls are gentler. */
export const LAND1_BOSS_BONUS = 5;
export const bossTime = (s: State, d = derive(s)) => d.timer + (!s.escape && !s.dungeon && landIndex(s.life.stage) === 0 ? LAND1_BOSS_BONUS : 0);
/** Run 2, idea 45: every 25th stage's boss is a bounty (not the Hollow Bishop's stages) and pays this many times the gold. */
export const BOUNTY_EVERY = 25;
export const BOUNTY_GOLD = 1.5;
export const bountyOn = (s: State) => BOUNTY_GOLD > 1 && s.returns > 0;
export const isBountyStage = (stage: number) => stage % BOUNTY_EVERY === 0 && stage % BISHOP_EVERY !== 0;

/** Run 3, round 2: gimmick bosses. Every 10th stage from 110, never on the Hollow Bishop's stages, never in escapes or dungeons. */
export const GIMMICK_FROM = 110;
export const GIMMICK_EVERY = 10;
export const SHIELD_SECONDS = 10;
export const TOLL_EVERY = 8;
export const TOLL_SECONDS = 2;
export const GIMMICK_TEXT: Record<'shield' | 'tolling' | 'adds', string> = {
  shield: 'Shield: at half health it raises a ward for 10 s. Your taps barely scratch it; your Named and pets still hit.',
  tolling: 'Tolling: every 8 s it tolls and your Named stop for 2 s. Tap the bell to stop the toll.',
  adds: 'Adds: it calls two servants. Until both fall, the boss takes only 20% of your damage.',
};
export const isGimmickStage = (stage: number) => stage >= GIMMICK_FROM && stage % GIMMICK_EVERY === 0 && stage % BISHOP_EVERY !== 0;
/** Taps (and tap-like hits) against a warded boss do only the immune floor. */
const shieldFactor = (foe: Foe) => ((foe.shieldLeft ?? 0) > 0 ? IMMUNE_FLOOR / 100 : 1);
/** The player taps the bell: a toll in progress stops at once. */
export function cancelToll(s: State): boolean {
  const foe = currentFoe(s);
  if (!foe.boss || !((foe.tolled ?? 0) > 0)) return false;
  foe.tolled = 0;
  return true;
}

function startBoss(s: State, d = derive(s)) {
  s.life.foe = makeFoe(s, s.life.stage, true, 0);
  if (!s.escape && !s.dungeon && isGimmickStage(s.life.stage)) {
    const f = s.life.foe;
    const g = randGimmick(s);
    f.gimmick = g < 1 / 3 ? 'shield' : g < 2 / 3 ? 'tolling' : 'adds';
    f.gimT = 0; f.shieldLeft = 0; f.tolled = 0;
    if (f.gimmick === 'adds') f.addHp = [B.times(f.max, ADDS_HP), B.times(f.max, ADDS_HP)];
  }
  if (!s.escape && !s.dungeon) s.life.foe.weakT = 0;
  if (!s.escape && !s.dungeon && s.hero.race === 'troll' && (s.life.trollHp ?? 1) < 1) { const f = s.life.foe; f.hp = B.times(f.max, Math.max(0.01, s.life.trollHp!)); moment(s, 'troll', 'Troll: the boss kept the wounds you gave it last time.'); }
  s.life.bossLeft = bossTime(s, d);
  // run 4: one change to the next world boss's clock (Toll Collector -5 s, shrine oil +5 s), used once
  if (!s.escape && !s.dungeon && s.life.nextBossDelta) {
    s.life.bossLeft = Math.max(5, s.life.bossLeft + Math.max(-BOSS_DELTA_CAP, Math.min(BOSS_DELTA_CAP, s.life.nextBossDelta)));
    s.life.nextBossDelta = 0;
  }
  s.life.bossAge = 0;
  s.life.bleed = B.ZERO;
  s.life.revived = false;
}

/** Player taps "Fight boss" after a failed boss. */
export function fightBoss(s: State): boolean {
  if (s.escape || s.dungeon || s.life.foe.boss || s.life.kills < KILLS_PER_STAGE) return false;
  s.life.autoBoss = true;
  startBoss(s);
  return true;
}

/** Spend a free budget on the cheapest Named levels (Blood money). */
function freeNamedLevels(s: State, budget: Big) {
  for (let n = 0; n < 20; n++) {
    let best = -1;
    let cost: Big = B.ZERO;
    for (let i = 0; i < ALLIES.length; i++) {
      if (!allyUnlocked(s, i) || s.life.allyLevels[i] === 0) continue;
      const c = allyCost(s, i, 1);
      if (best < 0 || B.lt(c, cost)) { best = i; cost = c; }
    }
    if (best < 0 || B.lt(budget, cost)) return;
    budget = B.sub(budget, cost);
    s.life.allyLevels[best]++;
    count(s, 'namedLevels');
  }
}

// ------------------------------------------------------------------ points

/** Class points come from the quest chain; they buy the class tree and the shared spells. */
export const skillPointsEarned = (s: State) => s.points.classPt;
const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
export const skillPointsSpent = (s: State) => sum(s.ranks) + sum(s.spells);

/** Players who have fallen once or gone deep skip the guided start and see every tab. */
const veteran = (s: State) => s.returns > 0 || s.bestStage >= TAB_STAGE.death;
// run 8 (Clarence, 14 Nov: "too many things going on at once... item drops and points earned too fast"): tabs open one at a time.
export const TAB_STAGE = { quests: 5, skills: 15, gear: 25, death: 40 } as const;
/** Run 2, item 13: the guided start. Returns the step to show (0..5), or 6 when it is done. */
export const FIRST_RUN_STEPS = 6;
export function firstRunStep(s: State): number {
  if (veteran(s)) return FIRST_RUN_STEPS;
  if (s.totalTaps < 8) return 0;
  if (s.life.heroLevel < 2) return 1;
  if (s.life.allyLevels[0] < 1) return 2;
  if (s.bestStage < 2) return 3;
  if (s.quest.num < 2) return 4;
  if (skillPointsSpent(s) < 1) return 5;
  return FIRST_RUN_STEPS;
}
/** Run 2, item 14: tabs stay visible but dimmed until they first matter. */
export function tabReady(s: State, tab: string): boolean {
  if (veteran(s)) return true;
  if (tab === 'pets') return s.eggs > 0 || Object.keys(s.pets).length > 0;
  if (tab === 'quests') return s.bestStage >= TAB_STAGE.quests || s.quest.num > 1;
  // a Mage lives on spells (and its Quest 2 is casting them), so its Skills open with its first class point
  if (tab === 'skills') return s.bestStage >= TAB_STAGE.skills || (s.hero.cls === 'mage' && s.points.classPt > 0);
  if (tab === 'gear') return s.bestStage >= TAB_STAGE.gear;
  if (tab === 'death') return s.bestStage >= TAB_STAGE.death;
  return true;
}
export const TAB_LOCK_TEXT: Record<string, string> = {
  pets: 'Pets open with your first pet or egg (quests and every 100th chest).',
  quests: `Quests open at stage ${TAB_STAGE.quests}. Claim a finished quest from the bar under the fight.`,
  skills: `Skills open at stage ${TAB_STAGE.skills}. Your class points wait for you.`,
  gear: `Gear opens at stage ${TAB_STAGE.gear}, when bosses start to drop items.`,
  death: `Death opens at stage ${TAB_STAGE.death}: dungeons, and falling to return stronger.`,
};
export const skillPointsFree = (s: State) => skillPointsEarned(s) - skillPointsSpent(s);
/** Race points: one per permanent XP level after the first. */
export const racePointsFree = (s: State) => xpLevel(s.xp) - 1 - sum(s.raceRanks);
/** Transformation (or Mastery) points come from the quest chain. */
export const formPointsFree = (s: State) => s.points.formPt - sum(s.formRanks);

// ------------------------------------------------------------------ time

export interface TickEvents { bossFailed: boolean; kills: number; escapeEnded: boolean; dungeonEnded: boolean; wandererLeft: boolean; fairy: boolean }

/** Advance the game by dt seconds (call often with small dt). */
export function tick(s: State, dt: number): TickEvents {
  const ev: TickEvents = { bossFailed: false, kills: 0, escapeEnded: false, dungeonEnded: false, wandererLeft: false, fairy: false };
  if (!(dt > 0) || s.pending.length) return ev;
  dt = Math.min(dt, 1); // big gaps go through applyOffline, never through tick
  const L = s.life;
  const d = derive(s);
  L.mana = Math.min(d.manaMax, L.mana + d.manaRegen * dt);
  for (const k of Object.keys(L.cooldowns)) L.cooldowns[k] = Math.max(0, L.cooldowns[k] - dt);
  checkAchievements(s);
  refreshTrials(s);

  if (s.escape?.done || s.dungeon?.done) return ev;
  const foe = currentFoe(s);
  tickEvents(s, dt);
  if (!s.escape && !s.dungeon) tickRun4(s, dt);
  const realmWeak = s.hero.cls === 'rogue' || (!s.escape && !s.dungeon); // run 5: the Rogue finds weak spots in realms too
  if ((foe.boss || foe.elite) && realmWeak) {
    const before = foe.weakT ?? 0;
    foe.weakT = before + dt;
    const miss = weakFirst(s, d) + ROGUE_COMBO_MISS + (ruleSum(d.rules, 'spotWait')?.a ?? 0);
    if (s.hero.cls === 'rogue' && before < miss && foe.weakT >= miss) L.combo = 0; // left the spot unhit: the combo breaks
  }
  // run 5: Rage and Prayer fade after a pause in manual tapping
  L.sinceTap = (L.sinceTap ?? 99) + dt;
  if ((L.surgeT ?? 0) > 0) L.surgeT = Math.max(0, L.surgeT! - dt);
  if (s.hero.cls === 'warrior' && L.sinceTap > RAGE_GRACE + (ruleSum(d.rules, 'rageKeep')?.a ?? 0)) L.rage = Math.max(0, (L.rage ?? 0) - RAGE_DRAIN * dt * (ruleSum(d.rules, 'chainStrike') ? 2 : 1));
  if (s.hero.cls === 'rogue' && foe.boss && !foe.cs) { // run 6: Knot of Whispers / Glass Knife
    foe.cs = 1;
    if (ruleSum(d.rules, 'glassKnife')) L.combo = 0;
    const st0 = ruleSum(d.rules, 'comboStart');
    if (st0) L.combo = Math.max(L.combo ?? 0, Math.min(comboMax(d), st0.a));
  }
  if (s.hero.cls === 'cleric') {
    if (L.sinceTap > PRAYER_GRACE) L.prayer = Math.max(0, (L.prayer ?? 0) - PRAYER_DECAY * dt * (1 - (ruleSum(d.rules, 'prayerHold')?.a ?? 0) / 100) * (ruleSum(d.rules, 'ashCenser') ? 2 : 1));
    if ((L.prayer ?? 0) > 50) count(s, 'prayerSec', dt);
  }
  count(s, 'fightSec', dt);
  if (foe.boss && foe.gimmick) {
    const before = foe.gimT ?? 0;
    foe.gimT = before + dt;
    if (foe.gimmick === 'shield') {
      if ((foe.shieldLeft ?? 0) > 0) { foe.shieldLeft = foe.shieldLeft! - dt; if (foe.shieldLeft <= 0) foe.shieldLeft = -1; }
      else if (foe.shieldLeft === 0 && B.ratio(foe.hp, foe.max) <= 0.5) foe.shieldLeft = SHIELD_SECONDS;
    } else {
      if ((foe.tolled ?? 0) > 0) foe.tolled = Math.max(0, foe.tolled! - dt);
      if (Math.floor(foe.gimT / TOLL_EVERY) > Math.floor(before / TOLL_EVERY)) foe.tolled = TOLL_SECONDS;
    }
  }

  // Named (each by its element), pets, damage over time, bleed
  const esc = s.escape ? 0.75 + (ruleSum(d.rules, 'namedInEscape')?.a ?? 0) / 100 : 1;
  const dbl = 1 + (ruleSum(d.rules, 'namedDouble')?.a ?? 0) / 100;
  const scale = (1 + buffMag(s, 'allyBuff')) * dt * esc * dbl * (s.hero.cls === 'cleric' ? 1 + (L.prayer ?? 0) / 100 : 1); // run 5: Prayer lifts the whole Named term
  let dmg: Big = B.ZERO;
  if (!((foe.tolled ?? 0) > 0)) d.namedDps.forEach((x, i) => {
    if (!B.isZero(x)) dmg = B.add(dmg, B.times(x, scale * foeMods(s, d, foe, namedElement(i)) * specMult(s, i, foe)));
  });
  for (const id of s.petsOut) {
    const p = PETS.find((x) => x.id === id);
    const lv = s.pets[id] ?? 0;
    if (p && lv > 0) dmg = B.add(dmg, B.times(d.tap, (p.atk / 100) * (1 + 0.1 * (lv - 1)) * d.petMult * dt * foeMods(s, d, foe, p.element)));
  }
  const dot = buffMag(s, 'dot');
  if (dot > 0) dmg = B.add(dmg, B.times(d.tap, dot * dt * foeMods(s, d, foe, tapElement(s, d, foe))));
  if (foe.boss && !B.isZero(L.bleed)) dmg = B.add(dmg, B.times(L.bleed, dt));
  if (!B.isZero(dmg) && damage(s, dmg, d)) ev.kills++;
  const nat = ruleSum(d.rules, 'namedAsTap');
  if (nat) tapCounter(s, d, L.allyLevels.filter((x) => x > 0).length * (nat.a / 100) * dt);
  const auto = buffMag(s, 'autoTap') + d.autoTap;
  if (auto > 0) {
    const { dmg: ad } = strike(s, d, auto * dt);
    if (hit(s, d, ad, tapElement(s, d, currentFoe(s)))) ev.kills++;
  }
  const star = ruleSum(d.rules, 'fallingStar');
  if (star) {
    L.starT += dt;
    if (L.starT >= Math.max(5, star.a)) {
      L.starT = 0;
      // run 5: inside an escape the star uses the escape's measured damage (the estimate could one-shot a gate sized from the real one)
      const starBase = s.escape && !s.escape.done ? s.escape.unit : estimateDps(s);
      if (hit(s, d, B.times(starBase, star.b || 10), 'magic')) ev.kills++;
    }
  }
  const interest = ruleSum(d.rules, 'goldInterest');
  if (interest && !s.escape && !s.dungeon) L.gold = B.add(L.gold, B.times(L.gold, (Math.min(1, interest.a) / 100) * (dt / 60)));
  for (const r of d.rules.get('autoCast') ?? []) {
    L.autoT[r.src] = (L.autoT[r.src] ?? 0) + dt;
    if (L.autoT[r.src] >= Math.max(5, r.a)) {
      L.autoT[r.src] = 0;
      if (r.active) {
        L.buffs = L.buffs.filter((b) => b.from !== r.src);
        L.buffs.push({ kind: r.active, mag: r.b, left: (r.dur ?? 10) + d.durationPlus, from: r.src });
      }
    }
  }

  // fairies drift by in the world only
  if (!s.escape && !s.dungeon) {
    if (L.fairy) {
      L.fairy.left -= dt;
      if (L.fairy.left <= 0) L.fairy = null;
    } else {
      L.fairyIn -= dt;
      if (L.fairyIn <= 0) {
        // run 2, idea 44: the very first wisp stays twice as long, and the fight shows an arrow to it
        L.fairy = { x: between(s, 0.3, 0.75), y: between(s, 0.25, 0.55), left: (s.counts.fairies ?? 0) === 0 && s.returns === 0 ? FAIRY_LIFE * 2 : FAIRY_LIFE };
        L.fairyIn = (FAIRY_MIN + rand(s) * FAIRY_SPREAD) / (1 + (d.stats.fairyRate ?? 0) / 100);
        ev.fairy = true;
      }
    }
  }

  // measured damage per second, in 30 s windows; the best window this life sizes escapes and dungeons.
  // Run 3: time on an ordinary foe that is immune or special is not measured either (its damage is not), because the deep lands'
  // immunities made the measure far too low and the escapes (which have no immunities) far too easy.
  const mf = currentFoe(s);
  const unmeasured = !mf.boss && (!!mf.kind || !!mf.elite || !!mf.immune?.length);
  if (!s.escape && !s.dungeon && !L.event && !unmeasured) {
    L.dmgT = (L.dmgT ?? 0) + dt;
    if (L.dmgT >= DPS_WINDOW) {
      const seen = B.times(L.dmgAcc ?? B.ZERO, 1 / L.dmgT);
      // the average of the last 4 windows (2 minutes): steady, so a spell burst does not make the realm impossible
      L.dpsHist = [...(L.dpsHist ?? []), seen].slice(-4);
      L.peakDps = B.times(L.dpsHist.reduce((a, b) => B.add(a, b), B.ZERO), 1 / L.dpsHist.length);
      L.dmgT = 0;
      L.dmgAcc = B.ZERO;
    }
  }
  // clocks
  const buffing = L.buffs.some((b) => b.kind !== 'freeze' && b.from !== 'offering');
  const frozen = L.buffs.some((b) => b.kind === 'freeze');
  const halfClock = buffing && d.rules.has('clockPauseSkill') ? 0.5 : 1; // run 2: was a full stop, which could last forever
  const slow = (1 - Math.min(50, ruleSum(d.rules, 'clockSlow')?.a ?? 0) / 100) * halfClock;
  if (s.dungeon && !s.dungeon.done) {
    if (!frozen) s.dungeon.timeLeft -= dt * halfClock;
    if (s.dungeon.timeLeft <= 0) {
      s.dungeon.timeLeft = 0;
      endDungeon(s, false);
      ev.dungeonEnded = true;
    }
  } else if (s.escape && !s.escape.done) {
    if (!frozen) s.escape.timeLeft -= dt * halfClock;
    s.escape.spent = (s.escape.spent ?? 0) + dt;
    s.escape.winT = (s.escape.winT ?? 0) + dt;
    s.escape.foeT = (s.escape.foeT ?? 0) + dt;
    const ge = s.escape;
    if (ge.foe.boss && !ge.done) {
      // run 5: the gate keeps the finish near 10 s: every 5 s it nudges its remaining health toward your recent damage x the time left
      // (up to 15% a step, never down, up to 1.5x in all: slacking still loses, a burst cannot skip the fight)
      ge.gateT = (ge.gateT ?? 0) + dt;
      ge.gateAllT = (ge.gateAllT ?? 0) + dt;
      if (ge.gateT >= 5) {
        ge.gateAll = B.add(ge.gateAll ?? B.ZERO, ge.gateD ?? B.ZERO);
        const rate = B.times(ge.gateAll, 1 / ge.gateAllT); // the average over the whole gate fight: steady against bursts
        const want = B.times(rate, Math.max(3, ge.timeLeft - ESCAPE_SPARE - 5)); // aim a little early: buffs fade
        // run 8 (pacing sim, Rogue life 2): the boss-damage guess can be far too high (the gate needed 1051 s of damage with 100 s
        // left). At the first check only, if your real damage cannot finish it, it shrinks once to what you can finish,
        // never below its size without the guess, so a player who stops tapping still loses
        if (!ge.gateFixed && !B.isZero(rate)) {
          ge.gateFixed = true;
          if (B.ratio(want, ge.foe.hp) < 0.7) {
            const to = B.max(B.times(want, 1.1), ge.gateFloor ?? want);
            if (B.ratio(to, ge.foe.hp) < 1) { const f = B.ratio(to, ge.foe.hp); ge.foe.hp = to; ge.foe.max = B.times(ge.foe.max, f); }
          }
        } else if (!B.isZero(ge.foe.hp) && !B.isZero(rate)) {
          const sc = ge.gateScale ?? 1;
          const f = Math.min(1.15, Math.max(1, B.ratio(want, ge.foe.hp))); // grow only: an early lull must not shrink it before a burst
          const nf = Math.min(1.5, sc * f) / sc;
          ge.gateScale = sc * nf;
          ge.foe.hp = B.times(ge.foe.hp, nf); ge.foe.max = B.times(ge.foe.max, nf);
        }
        ge.gateD = B.ZERO; ge.gateT = 0;
      }
    }
    if (s.escape.winT >= ESCAPE_WINDOW) { s.escape.rate = B.times(s.escape.winD ?? B.ZERO, 1 / s.escape.winT); s.escape.winD = B.ZERO; s.escape.winT = 0; }
    if (s.escape.timeLeft <= 0) {
      s.escape.timeLeft = 0;
      endEscape(s, false);
      ev.escapeEnded = true;
    }
  } else if (L.foe.boss) {
    L.bossAge += dt;
    if (!frozen) L.bossLeft -= dt * slow;
    if (L.bossLeft <= 0) {
      const rv = ruleSum(d.rules, 'bossRevive');
      if (rv && !L.revived) {
        L.revived = true;
        L.bossLeft = rv.a;
        s.events.push(`Rise from cinders: +${rv.a} s.`);
      } else {
        L.bossLeft = 0;
        L.autoBoss = false;
        L.bossFails++;
        if (s.hero.race === 'troll') L.trollHp = B.ratio(L.foe.hp, L.foe.max); // run 5: Regrowth
        L.bleed = B.ZERO;
        L.foe = makeFoe(s, L.stage, false, 0);
        ev.bossFailed = true;
        say(s, 'The boss outlasted you. Grow stronger, then tap Fight boss.');
      }
    }
  } else if ((L.foe.elite === 'swift' || L.foe.elite === 'warded') && (L.foe.fleeLeft ?? 0) > 0) {
    L.foe.fleeLeft = L.foe.fleeLeft! - dt;
    if (L.foe.fleeLeft <= 0) {
      say(s, L.foe.elite === 'warded' ? `The warded ${L.foe.name} steps back into the dark.` : `The swift ${L.foe.name} got away.`);
      L.foe = makeFoe(s, L.stage, false, L.kills + L.stage);
    }
  } else if (L.foe.kind === 'wanderer') {
    L.wanderLeft -= dt;
    if (L.wanderLeft <= 0) {
      L.wanderLeft = 0;
      say(s, `${L.foe.name} wanders off.`);
      L.foe = makeFoe(s, L.stage, false, L.kills + L.stage);
      ev.wandererLeft = true;
    }
  }
  for (const b of L.buffs) b.left -= dt;
  L.buffs = L.buffs.filter((b) => b.left > 0);
  return ev;
}

// ------------------------------------------------------------------ buying

export function heroCost(s: State, n = 1): Big {
  return B.seriesCost(heroCostBase, HERO_GROWTH, s.life.heroLevel - 1, n);
}
export function buyHero(s: State, n = 1): number {
  const can = Math.min(n, B.maxAffordable(s.life.gold, heroCostBase, HERO_GROWTH, s.life.heroLevel - 1));
  if (can <= 0) return 0;
  s.life.gold = B.sub(s.life.gold, heroCost(s, can));
  s.life.heroLevel += can;
  count(s, 'heroLevels', can);
  return can;
}

export const allyUnlocked = (s: State, i: number) => s.bestStage >= ALLIES[i].unlockStage;
export function allyCost(s: State, i: number, n = 1): Big {
  return B.seriesCost(allyCostBase(i), ALLY_GROWTH, s.life.allyLevels[i], n);
}
export function buyAlly(s: State, i: number, n = 1): number {
  if (!allyUnlocked(s, i)) return 0;
  const can = Math.min(n, B.maxAffordable(s.life.gold, allyCostBase(i), ALLY_GROWTH, s.life.allyLevels[i]));
  if (can <= 0) return 0;
  const first = s.life.allyLevels[i] === 0;
  s.life.gold = B.sub(s.life.gold, allyCost(s, i, can));
  s.life.allyLevels[i] += can;
  count(s, 'namedLevels', can);
  if (first) say(s, `${ALLIES[i].name} remembers their name and fights for you.`);
  return can;
}

/** How many levels "max" would buy right now. */
export const maxHeroBuy = (s: State) => B.maxAffordable(s.life.gold, heroCostBase, HERO_GROWTH, s.life.heroLevel - 1);
export const maxAllyBuy = (s: State, i: number) => (allyUnlocked(s, i) ? B.maxAffordable(s.life.gold, allyCostBase(i), ALLY_GROWTH, s.life.allyLevels[i]) : 0);

// ------------------------------------------------------------------ skills

export function rankUp(s: State, id: string): boolean {
  if (skillPointsFree(s) <= 0) return false;
  const n = nodeById(s, id);
  const r = s.ranks[id] ?? 0;
  if (n) {
    if (r >= MAX_RANK || !nodeOpen(s, n)) return false;
  } else {
    // T5/T6 subclass nodes of any subclass you own
    let ok = false;
    for (const b of Object.keys(s.classPaths)) {
      const x = subclassExtraNodes(s, b).find((y) => y.id === id);
      if (x && tierNodeOpen(s, x, b) && r < x.max) ok = true;
    }
    if (!ok) return false;
  }
  s.ranks[id] = r + 1;
  return true;
}

/** A node can be ranked once its subclass has reached its tier. */
export function nodeOpen(s: State, n: SkillNode): boolean {
  return classNodeUnlocked(s, n);
}

/** Embers to take skill points back: a quarter of your best single return, at least 5. */
export const RESPEC_SHARE = 0.25;
export function respecCost(s: State): Big {
  const disc = 1 - Math.min(75, ruleSum(derive(s).rules, 'respecDiscount')?.a ?? 0) / 100;
  return B.times(B.max(B.big(5), B.times(s.bestReturn, RESPEC_SHARE)), disc);
}

export function resetSkills(s: State): boolean {
  if (inRealm(s)) return false; // run 2: no swapping gear, pets or skills inside an escape or dungeon
  if (!skillPointsSpent(s) && !sum(s.raceRanks) && !sum(s.formRanks)) return false;
  const cost = respecCost(s);
  if (B.lt(s.embers, cost)) return false;
  s.embers = B.sub(s.embers, cost);
  s.ranks = {};
  s.spells = {};
  s.raceRanks = {};
  s.formRanks = {};
  s.life.buffs = [];
  return true;
}

export type SkillCheck = 'ok' | 'locked' | 'cooldown' | 'mana' | 'busy';

interface SkillSpec { kind: ActiveKind; r: number; duration?: number; mana: number; cooldown: number }
/** A class active (rank r) or a shared spell (r = its magnitude at the current level). */
function skillSpec(s: State, id: string): SkillSpec | null {
  const n = nodeById(s, id);
  if (n) {
    const r = s.ranks[id] ?? 0;
    return n.kind === 'active' && r > 0 && classNodeActive(s, n) ? { kind: n.active!, r, duration: n.duration, mana: n.mana ?? 0, cooldown: n.cooldown ?? 30 } : null;
  }
  const u = ultimates(s).find((x) => x.id === id);
  if (u) return { kind: u.active, r: u.r, duration: u.duration || undefined, mana: u.mana, cooldown: u.cooldown };
  const sp = SPELLS.find((x) => x.id === id);
  const lv = s.spells[id] ?? 0;
  if (!sp || lv <= 0) return null;
  return { kind: sp.active, r: sp.base + sp.per * (lv - 1), duration: sp.duration || undefined, mana: sp.mana, cooldown: sp.cooldown };
}

export function canUse(s: State, id: string): SkillCheck {
  const spec = skillSpec(s, id);
  if (!spec) return 'locked';
  if (s.pending.length || s.escape?.done || s.dungeon?.done) return 'busy';
  if ((s.life.cooldowns[id] ?? 0) > 0) return 'cooldown';
  if (s.life.mana < spec.mana) return 'mana';
  return 'ok';
}

/** Cast a class skill or shared spell. `free` (fairies, rule-benders) skips mana, cooldown and the busy check. */
export function useSkill(s: State, id: string, free = false): boolean {
  if (!free && canUse(s, id) !== 'ok') return false;
  const spec = skillSpec(s, id);
  if (!spec) return false;
  const d = derive(s);
  const sp = d.skillPower;
  if (!free) {
    s.life.mana -= spec.mana;
    s.life.cooldowns[id] = spec.cooldown * Math.max(0.25, (1 - d.cooldownCut) * (s.hero.cls === 'mage' ? MAGE_CD : 1));
  }
  const surge = ruleSum(d.rules, 'surge'); // run 6: Twice-Read Pair
  if (surge) { s.life.surgeT = surge.b || 12; s.life.surgeMag = surge.a / 100; }
  const twice = ruleSum(d.rules, 'spellTwice');
  const times = twice && rand(s) < twice.a / 100 ? 2 : 1;
  const r = spec.r;
  const dur = (fallback: number) => (spec.duration ?? fallback) + d.durationPlus;
  const add = (kind: ActiveKind, mag: number, left: number) => {
    s.life.buffs = s.life.buffs.filter((b) => b.from !== id);
    s.life.buffs.push({ kind, mag: mag * (kind === 'freeze' ? 1 : times), left: kind === 'freeze' ? left * times : left, from: id });
  };
  switch (spec.kind) {
    case 'tapBuff': add('tapBuff', 0.5 * r * sp, dur(20)); break;
    case 'allyBuff': add('allyBuff', 0.6 * r * sp, dur(20)); break;
    case 'critBuff': add('critBuff', (15 + 5 * r) * Math.min(2, sp), dur(15)); break;
    case 'autoTap': add('autoTap', (4 + 2 * r) * sp, dur(15)); break;
    case 'freeze': add('freeze', 1, (3 + r) * Math.min(2, sp) + d.durationPlus); break;
    case 'goldBuff': add('goldBuff', r * sp, dur(20)); break;
    case 'dmgBuff': add('dmgBuff', 0.4 * r * sp, dur(15)); break;
    case 'dot': add('dot', 0.5 * r * sp, dur(15)); break;
    case 'burst': {
      const hits = Math.round((10 + 6 * r) * sp * times);
      // one combined strike so a single crit roll does not decide the whole burst
      const crits = Math.round(hits * Math.min(0.95, d.critChance + buffMag(s, 'critBuff') / 100));
      const base = (hits - crits) + crits * d.critMult;
      const one = strike(s, d, 1); // keeps rng use consistent and adds nail damage share
      const scale = base / (one.crit ? d.critMult : 1);
      hit(s, d, B.times(one.dmg, scale), tapElement(s, d, currentFoe(s)));
      break;
    }
  }
  count(s, 'spells');
  return true;
}

/** A free cast of a random shared spell you have learned (fairies, Voice in the Water). */
export function castRandomSpell(s: State): string | null {
  const known = SPELLS.filter((x) => (s.spells[x.id] ?? 0) > 0);
  if (!known.length) return null;
  const sp = pick(s, known);
  useSkill(s, sp.id, true);
  return sp.name;
}

// ------------------------------------------------------------------ race, transformation and Mastery trees; shared spells

export function treeNodeOpen(tree: TreeDef, ranks: Record<string, number>, id: string): boolean {
  const n = tree.nodes.find((x) => x.id === id);
  if (!n) return false;
  if (n.tier === 0) return true;
  return tree.nodes.some((x) => x.tier === n.tier - 1 && (ranks[x.id] ?? 0) > 0);
}

/** Spend a race point (kind 'race') or a transformation point (kind 'form'). */
export function rankTree(s: State, kind: 'race' | 'form', id: string): boolean {
  if (kind === 'form') {
    const n = formNodes(s).find((x) => x.id === id);
    const r = s.formRanks[id] ?? 0;
    if (!n || formPointsFree(s) <= 0 || r >= n.max || !formNodeOpen(s, n)) return false;
    s.formRanks[id] = r + 1;
    return true;
  }
  const tree = raceTree(s);
  const ranks = s.raceRanks;
  const n = tree?.nodes.find((x) => x.id === id);
  if (!tree || !n || racePointsFree(s) <= 0) return false;
  const r = ranks[id] ?? 0;
  if (r >= n.max || !treeNodeOpen(tree, ranks, id)) return false;
  ranks[id] = r + 1;
  return true;
}

/** Learn or level a shared spell with a class point. */
export function learnSpell(s: State, id: string): boolean {
  const sp = SPELLS.find((x) => x.id === id);
  if (!sp || skillPointsFree(s) <= 0) return false;
  const lv = s.spells[id] ?? 0;
  if (lv >= sp.max || xpLevel(s.xp) < sp.unlock) return false;
  s.spells[id] = lv + 1;
  return true;
}

export const skillText = (n: SkillNode, rank: number) => (n.kind === 'active' ? ACTIVE_HELP[n.active!](Math.max(1, rank)) : `+${(n.perRank ?? 0) * Math.max(1, rank)} ${n.stat}`);

// ------------------------------------------------------------------ loot

function rollRarity(s: State, luck: number, floor: Rarity = 'poor'): Rarity {
  const order = RARITIES.filter((r) => r.weight > 0);
  const startIdx = order.findIndex((r) => r.id === floor);
  const pool = order.slice(Math.max(0, startIdx));
  const w = pool.map((r, i) => r.weight * (i + startIdx >= 2 ? 1 + luck / 100 : 1));
  let roll = rand(s) * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    roll -= w[i];
    if (roll <= 0) return pool[i].id;
  }
  return pool[pool.length - 1].id;
}

function round(v: number): number {
  const a = Math.abs(v);
  return a >= 10 ? Math.round(v) : a >= 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
}

export function makeItem(s: State, ilvl: number, rarity: Rarity, slot?: ItemSlot): Item {
  const cls = classOf(s);
  slot = slot ?? pick(s, ITEM_SLOTS);
  const rd = rarityDef(rarity);
  const stats: Stats = {};
  let look: string | undefined;
  let baseName: string;
  let el: Element | undefined;
  const attrRoll = () => round((2 + ilvl * 0.35) * rd.mult * between(s, 0.85, 1.15));
  const mainOr = (): Attr => (rand(s) < 0.5 ? cls.main : pick(s, ATTRS));
  if (slot === 'mainHand') {
    look = rand(s) < 0.7 ? cls.weapon : pick(s, ['blade', 'axe', 'staff', 'bow', 'mace']);
    baseName = pick(s, BASE_NAMES[look]);
    stats.weapon = round((3 + ilvl * 0.6) * rd.mult * between(s, 0.85, 1.15));
    // element enchant: rarer on plain gear, common on Rare and up
    if (rand(s) < (['rare', 'epic', 'legendary', 'artifact'].includes(rarity) ? 0.4 : 0.12)) el = pick(s, ELEMENTS.filter((e) => e !== 'phys'));
    const a = mainOr();
    stats[a] = (stats[a] ?? 0) + attrRoll();
  } else if (slot === 'offHand') {
    look = rand(s) < 0.7 ? cls.offHand : pick(s, ['blade', 'shield', 'tome', 'quiver', 'relic']);
    baseName = pick(s, BASE_NAMES[look]);
    stats.weapon = round((1.5 + ilvl * 0.3) * rd.mult * between(s, 0.85, 1.15));
    const a = mainOr();
    stats[a] = (stats[a] ?? 0) + attrRoll();
  } else {
    baseName = pick(s, BASE_NAMES[slot]);
    const a1 = mainOr();
    let a2 = pick(s, ATTRS);
    if (a2 === a1) a2 = ATTRS[(ATTRS.indexOf(a1) + 1) % ATTRS.length];
    stats[a1] = attrRoll();
    stats[a2] = round(attrRoll() * 0.6);
  }
  const [lo, hi] = rd.affixes;
  const count = lo + Math.floor(rand(s) * (hi - lo + 1));
  const pool = [...AFFIXES];
  for (let i = 0; i < count && pool.length; i++) {
    const af = pool.splice(Math.floor(rand(s) * pool.length), 1)[0];
    stats[af.stat] = round((stats[af.stat] ?? 0) + (af.base + af.perLevel * ilvl) * rd.mult * between(s, 0.7, 1.3));
  }
  let name = baseName;
  if (rarity === 'poor') name = `Cracked ${baseName}`;
  else if (rarity === 'uncommon') name = rand(s) < 0.5 ? `${pick(s, PREFIXES)} ${baseName}` : `${baseName} ${pick(s, SUFFIXES)}`;
  else if (rarity !== 'common') name = `${pick(s, PREFIXES)} ${baseName} ${pick(s, SUFFIXES)}`;
  const item: Item = { id: s.nextItemId++, name, slot, rarity, ilvl, stats, look };
  if (el) item.el = el;
  return item;
}

export function makeArtifact(s: State, id: string, ilvl: number): Item {
  const def = ARTIFACTS.find((a) => a.id === id) ?? ARTIFACTS[0];
  const it = makeItem(s, ilvl, 'artifact', def.slot);
  it.name = def.name;
  it.rule = def.rule;
  it.ruleText = def.text;
  return it;
}

export const BOSS_DROP = 0.15;
export const IRON_DROP = 0.35;
export const TRASH_DROP = 0.02; // run 8: a normal foe now and then drops a Common item
export const ELITE_DROP = 0.05; // run 8: elites, treasure foes and wanderers
export function dropItem(s: State, ilvl: number, source: 'boss' | 'gate', floor?: Rarity, exact?: Rarity): Item | null {
  const d = derive(s);
  const rarity = exact ?? rollRarity(s, d.lootLuck, floor ?? (source === 'gate' ? 'rare' : 'poor'));
  const it = makeItem(s, ilvl, rarity);
  // run 4 fix (testers: "a bag full of NEW gear that is mostly worse"): a drop of Rare or lower that is worse than what you wear
  // is salvaged for gold at once, quietly; Epic and up, sets, Artifacts and heirlooms always reach the bag
  if (!s.autoSalvageOff && AUTO_SALVAGE.includes(rarity) && isWorse(s, it)) {
    s.bag.push(it);
    if (salvage(s, it.id)) { s.life.autoSold = (s.life.autoSold ?? 0) + 1; return null; }
  }
  if (s.bag.length >= BAG_SIZE) {
    say(s, `Bag full: ${it.name} left behind.`);
    return null;
  }
  s.bag.push(it);
  say(s, `Loot: ${it.name} (${rarityDef(rarity).name}).`); // run 8: drops are rarer now, so every one that reaches the bag is announced (worse ones were salvaged above)
  return it;
}

export const fitsSlots = (it: Item): Slot[] => (it.slot === 'ring1' ? ['ring1', 'ring2'] : it.slot === 'trinket1' ? ['trinket1', 'trinket2'] : [it.slot]);

/** Equip from the bag. Only one rule-bending Artifact may be worn [main game rule]. */
export function equip(s: State, itemId: number, slot?: Slot): boolean {
  if (inRealm(s)) return false; // run 2: no swapping gear, pets or skills inside an escape or dungeon
  const idx = s.bag.findIndex((x) => x.id === itemId);
  if (idx < 0) return false;
  const it = s.bag[idx];
  const options = fitsSlots(it);
  const target = slot && options.includes(slot) ? slot : options.find((o) => !s.equipped[o]) ?? options[0];
  s.bag.splice(idx, 1);
  if (it.rarity === 'artifact') {
    for (const k of Object.keys(s.equipped) as Slot[]) {
      if (k !== target && s.equipped[k]?.rarity === 'artifact') {
        s.bag.push(s.equipped[k]!);
        delete s.equipped[k];
      }
    }
  }
  const old = s.equipped[target];
  if (old) s.bag.push(old);
  s.equipped[target] = it;
  s.life.mana = Math.min(s.life.mana, derive(s).manaMax);
  return true;
}

export function unequip(s: State, slot: Slot): boolean {
  if (inRealm(s)) return false; // run 2: no swapping gear, pets or skills inside an escape or dungeon
  const it = s.equipped[slot];
  if (!it || s.bag.length >= BAG_SIZE) return false;
  delete s.equipped[slot];
  s.bag.push(it);
  return true;
}

export const AUTO_SALVAGE: Rarity[] = ['poor', 'common', 'uncommon', 'rare'];
/** Salvage for gold this life. Ancestry heirlooms cannot be salvaged. */
export function salvage(s: State, itemId: number): boolean {
  const idx = s.bag.findIndex((x) => x.id === itemId);
  if (idx < 0 || s.bag[idx].rarity === 'ancestry' || s.bag[idx].set) return false;
  const it = s.bag.splice(idx, 1)[0];
  const value = B.times(foeHp(Math.max(1, s.life.stage)), GOLD_PER_HP * 3 * rarityDef(it.rarity).mult * (s.hero.faith === 'iron' ? 3 : 1));
  s.life.gold = B.add(s.life.gold, value);
  count(s, 'salvaged');
  return true;
}

/** Change in tap damage, Named damage and boss time (as fractions) if this bag item replaced what is worn. */
export function compare(s: State, it: Item, slot?: Slot): { tap: number; ally: number; timer: number; gold: number; slot: Slot } {
  const options = fitsSlots(it);
  const target = slot && options.includes(slot) ? slot : replaceTarget(s, it);
  const before = derive(s);
  const saved = s.equipped[target];
  const savedArtifacts: [Slot, Item][] = [];
  if (it.rarity === 'artifact') {
    for (const k of Object.keys(s.equipped) as Slot[]) if (k !== target && s.equipped[k]?.rarity === 'artifact') { savedArtifacts.push([k, s.equipped[k]!]); delete s.equipped[k]; }
  }
  s.equipped[target] = it;
  const after = derive(s);
  if (saved) s.equipped[target] = saved; else delete s.equipped[target];
  for (const [k, v] of savedArtifacts) s.equipped[k] = v;
  const eff = (d: Derived) => d.tapMult * (1 + d.critChance * (d.critMult - 1));
  return {
    tap: eff(after) / eff(before) - 1,
    ally: before.allyMult > 0 ? after.allyMult / before.allyMult - 1 : 0,
    timer: after.timer - before.timer,
    gold: after.goldMult / before.goldMult - 1,
    slot: target,
  };
}

// ------------------------------------------------------------------ death, escape and return

export const canDie = (s: State) => !s.escape && !s.dungeon && !s.pending.length && s.life.maxStage >= MIN_DEATH_STAGE;

export function previewEmbers(s: State): Big {
  return B.times(embersFor(s.life.maxStage, derive(s).emberPct), 1 + (s.life.tithe ?? 0));
}

function escapeFoe(s: State, e: Escape): Foe {
  const realm = REALMS.find((r) => r.id === e.realm)!;
  const gate = e.killed >= ESCAPE_FOES;
  // run 5 (Clarence: every escape about 10 s spare): the gate is sized from the time you really have left, so it ends near 10 s;
  // never shorter than 60 s of fighting, so a slow run can still fail
  const secs = gate ? Math.min(ESCAPE_GATE_MAX, Math.max(ESCAPE_GATE_MIN, e.timeLeft - ESCAPE_SPARE)) : ESCAPE_TUNE.foe * (e.special ? SPECIAL_ESCAPE_MULT : 1);
  // run 3: the gate is a boss, so your boss-damage bonus hits it; size it for that, or it falls in a quarter of its time
  const d = derive(s);
  const bossAdj = gate ? Math.max(1, d.bossMult / Math.max(0.01, d.normalMult)) : 1;
  const hp = B.times(e.unit, secs * bossAdj);
  if (gate) e.gateFloor = B.times(e.unit, secs);
  return { name: gate ? realm.gate : realm.foe, hp, max: hp, boss: gate };
}

/** Vaelis falls on purpose (or not): the escape level starts in a random death realm. */
export function die(s: State): boolean {
  if (!canDie(s)) return false;
  const realm = pick(s, REALMS);
  const special = rand(s) < SPECIAL_CHANCE;
  const e: Escape = {
    realm: realm.id, special, stageAtDeath: s.life.maxStage, killed: 0, foe: { name: '', hp: B.ZERO, max: B.ZERO, boss: false },
    timeLeft: ESCAPE_SECONDS * (special ? SPECIAL_ESCAPE_MULT : 1), baseEmbers: previewEmbers(s), unit: realmUnit(s), done: false, cleared: false,
  };
  e.foe = escapeFoe(s, e);
  s.escape = e;
  s.life.buffs = [];
  say(s, `You fall, and wake in the ${realm.name}.${special ? ' Something here is different.' : ''}`);
  return true;
}

function escapeKill(s: State) {
  const e = s.escape!;
  if (e.foe.boss) {
    e.killed = ESCAPE_FOES + 1;
    endEscape(s, true);
    return;
  }
  e.killed++;
  // run 3: adapt to the damage really dealt in this escape, never below the starting size
  // run 5 (Clarence: every escape about 10 s spare): steer by time. A foe that fell faster than its target makes the next one bigger,
  // a slower one makes it smaller, so first and later falls, and every class, end near the same finish. Never below half the start.
  if (!e.start) e.start = e.unit;
  // aim each next foe at the time really left: (time left - the gate's share - the spare) over the foes still to come
  const base = ESCAPE_TUNE.foe * (e.special ? SPECIAL_ESCAPE_MULT : 1);
  const foesLeft = Math.max(1, ESCAPE_FOES - e.killed);
  const target = Math.min(base * 1.3, Math.max(base * 0.6, (e.timeLeft - ESCAPE_SPARE - ESCAPE_GATE_SECONDS * (e.special ? SPECIAL_ESCAPE_MULT : 1)) / foesLeft));
  const took = Math.max(0.5, e.foeT ?? target);
  e.unit = B.max(B.times(e.start, 0.5), B.times(e.unit, Math.min(2.5, Math.max(0.4, Math.pow(target / took, 0.85)))));
  e.foeT = 0;
  e.foe = escapeFoe(s, e);
}

/** Damage per second of a steady tapper (5 taps a second) plus the Named, no skills. */
/** Run 5: the escape's 15 s measuring window. */
export const ESCAPE_WINDOW = 15;
export function estimateDps(s: State, tapsPerSec = 5): Big {
  const d = derive(s);
  const critAvg = 1 + d.critChance * (d.critMult - 1);
  let tapAvg = B.times(d.tap, tapsPerSec * critAvg);
  let named = B.times(d.allyDps, 0.75);
  // run 5: each class's loop, at the given tap rate (see RUN5-PLAN.md, Codex round 2)
  const k = s.hero.cls;
  if (k === 'warrior' && tapsPerSec >= 1) tapAvg = B.times(tapAvg, (RAGE_MAX / RAGE_PER_TAP - 1 + RAGE_STRIKE) / (RAGE_MAX / RAGE_PER_TAP));
  if (k === 'mage') tapAvg = B.times(tapAvg, MAGE_TAP + 0.5); // half taps, spells about as much again (the escape adapts after 8 s)
  if (k === 'rogue') tapAvg = B.times(tapAvg, 1.4); // weak spots in realms
  if (k === 'ranger') tapAvg = B.add(B.times(tapAvg, RANGER_TAP), B.times(d.tap, RANGER_AUTO * critAvg));
  if (k === 'cleric') { tapAvg = B.times(tapAvg, CLERIC_TAP); named = B.times(named, PRAYER_PER_TAP * tapsPerSec > PRAYER_DECAY ? 1 + PRAYER_MAX / 100 : 1); }
  // run 3: escape foes are ordinary foes, so the bonus against them counts (it was missing, and stalled lives in the deep lands
  // measure almost nothing, so the estimate alone sized escapes and made them far too easy)
  return B.max(B.big(1), B.times(B.add(tapAvg, named), d.normalMult));
}

/** Inside an escape or a dungeon (gear, pets and skills are locked there). */
export const inRealm = (s: State) => !!(s.escape && !s.escape.done) || !!(s.dungeon && !s.dungeon.done);

/** The damage per second a realm is sized for: the estimate, or the best this life actually dealt, whichever is higher. */
export const realmUnit = (s: State): Big => B.max(estimateDps(s), B.times(s.life.peakDps ?? B.ZERO, 0.8)); // 80 %: measured damage still overshoots now and then

/** 0..1, how far through the realm you got. */
export const escapeProgress = (e: Escape) => Math.min(1, e.killed / (ESCAPE_FOES + 1));

export function escapeReward(e: Escape): Big {
  const p = escapeProgress(e);
  let mult = 0.4 + 0.6 * p;
  if (e.cleared) mult += 0.5;
  if (e.special && e.cleared) mult += 0.5;
  return B.times(e.baseEmbers, mult);
}

function endEscape(s: State, cleared: boolean) {
  const e = s.escape!;
  e.done = true;
  e.cleared = cleared;
  const realm = REALMS.find((r) => r.id === e.realm)!;
  if (cleared) {
    say(s, `You broke through the gate of the ${realm.name}.`);
    dropItem(s, e.stageAtDeath, 'gate');
    if (e.special) s.pending.push({ kind: 'prize', choices: prizeChoices(s) });
  } else {
    if (s.hero.race === 'troll') { say(s, `${theName(realm.name)} tries to keep a piece of you. It grows back.`); moment(s, 'troll', 'Troll: no scar from that escape.'); }
    else {
      say(s, `${theName(realm.name)} keeps a piece of you.`);
      s.pending.push({ kind: 'scar', choices: scarChoices(s, realm.scarBias) });
    }
  }
}

function scarChoices(s: State, bias: string[]): string[] {
  const out = new Set<string>(bias.slice(0, 2));
  while (out.size < 3) out.add(pick(s, SCARS).id);
  return [...out].slice(0, 3);
}

function prizeChoices(s: State): string[] {
  const owned = new Set([...Object.values(s.equipped), ...s.bag].filter((i) => i?.rarity === 'artifact').map((i) => i!.rule));
  const fresh = ARTIFACTS.filter((a) => !owned.has(a.rule));
  const art = (fresh.length ? pick(s, fresh) : pick(s, ARTIFACTS)).id;
  return s.scars.length ? ['heal', `artifact:${art}`] : [`artifact:${art}`];
}

/** Resolve the first pending choice. For scars, choice is the scar id; for prizes, 'heal' or 'artifact:<id>'. */
export function choose(s: State, choice: string, healIndex = 0): boolean {
  const p = s.pending[0];
  if (!p || !p.choices.includes(choice)) return false;
  if (p.kind === 'pet') {
    s.pets[choice] = 1;
    autoOut(s, choice);
    say(s, `${PETS.find((x) => x.id === choice)?.name ?? 'A pet'} joins you.`);
  } else if (p.kind === 'scar') {
    s.scars.push(choice);
    say(s, `Scar taken: ${SCARS.find((x) => x.id === choice)?.name}.`);
  } else if (choice === 'heal') {
    if (!s.scars.length) return false;
    const [gone] = s.scars.splice(Math.min(healIndex, s.scars.length - 1), 1);
    say(s, `The realm gives back what it took: ${SCARS.find((x) => x.id === gone)?.name} healed.`);
  } else {
    const it = makeArtifact(s, choice.split(':')[1], s.escape?.stageAtDeath ?? s.bestStage);
    s.bag.push(it);
    say(s, `Artifact found: ${it.name}.`);
  }
  s.pending.shift();
  return true;
}

/** Finish the escape: bank Embers and start a new life at stage 1. */
export function returnToLife(s: State): Big | null {
  const e = s.escape;
  if (!e || !e.done || s.pending.length) return null;
  const gained = escapeReward(e);
  s.embers = B.add(s.embers, gained);
  s.bestReturn = B.max(s.bestReturn, gained);
  s.returns++;
  const d = derive(s);
  const keepPct = (activeRules(s).has('locket') ? 5 : 0) + (ruleSum(d.rules, 'keepGold')?.a ?? 0);
  const keep = B.times(s.life.gold, Math.min(50, keepPct) / 100);
  const ls = ruleSum(d.rules, 'lifeStart');
  count(s, 'returns');
  if (e.cleared) count(s, 'escapesCleared');
  if (e.cleared && e.special) count(s, 'specialEscapes');
  s.life = newLife();
  s.life.gold = keep;
  if (ls) {
    s.life.stage = Math.max(1, Math.floor((s.bestStage * Math.min(20, ls.a)) / 100));
    s.life.maxStage = s.life.stage;
  }
  s.life.foe = makeFoe(s, s.life.stage, false, 0);
  s.life.mana = derive(s).manaMax;
  s.escape = null;
  say(s, `You return to Lanternfall with ${B.format(gained)} Embers.`);
  return gained;
}

/** How much one point of each stat is worth next to one point of an attribute (a typical roll at the same item level scores the same). */
const POWER_WEIGHT: Partial<Record<StatKey, number>> = { weapon: 0.35 / 0.6 };
for (const af of AFFIXES) POWER_WEIGHT[af.stat] = 0.35 / af.perLevel;

/** One number for how good an item is for this hero. Main attribute counts 1.5x. */
export function itemPower(s: State, it: Item): number {
  const main = classOf(s).main;
  let p = 0;
  for (const [k, v] of Object.entries(it.stats) as [StatKey, number][]) {
    const w = (ATTRS as readonly string[]).includes(k) ? (k === main ? 1.5 : 1) : POWER_WEIGHT[k] ?? 1;
    p += v * w;
  }
  return Math.round(p);
}

/** The worn item this one would replace: an empty slot first, else the weaker of a ring or trinket pair. */
export function replaceTarget(s: State, it: Item): Slot {
  const options = fitsSlots(it);
  const empty = options.find((o) => !s.equipped[o]);
  if (empty) return empty;
  return options.reduce((a, b) => (itemPower(s, s.equipped[b]!) < itemPower(s, s.equipped[a]!) ? b : a));
}

/** Worse = the slot is filled and this item has no more power than the weakest worn item it could replace. */
/**
 * Run 3 play-test: the bag arrow and the item popup disagreed (Power said better, damage said worse). One rule now: what wearing it
 * does to your tap and Named damage, against what it would replace.
 */
export type Verdict = 'better' | 'worse' | 'mixed' | 'same';
/** Run 6 testers: "Compare called my class set piece Worse". True when wearing this piece finishes a set whose bonus works for you. */
export function completesSet(s: State, it: Item): SetDef | null {
  const def = it.set ? setById(it.set) : undefined;
  if (!def || it.piece === undefined || !setRuleActive(s, def) || !itemRuleActive(s, it)) return null;
  const sl = replaceTarget(s, it);
  const have = new Set<number>();
  for (const [slot, x] of Object.entries(s.equipped) as [Slot, Item | undefined][]) if (slot !== sl && x?.set === def.id && x.piece !== undefined) have.add(x.piece);
  if (have.has(it.piece)) return null;
  have.add(it.piece);
  const done = have.size === def.pieces.length;
  return done && !setsComplete(s).some((d) => d.id === def.id) ? def : null;
}
export type GearFocus = 'balanced' | 'tap' | 'named' | 'utility';
export const GEAR_FOCUS: { id: GearFocus; name: string; text: string }[] = [
  { id: 'balanced', name: 'Balanced', text: 'Tap and Named damage both count.' },
  { id: 'tap', name: 'Tap damage', text: 'Only your own hits count.' },
  { id: 'named', name: 'Named damage', text: 'Only your Named count.' },
  { id: 'utility', name: 'Gold and boss time', text: 'Gold first; each second of boss time counts as 2% gold.' },
];
/** The verdict for one comparison, by the player's focus. */
export function judge(s: State, c: { tap: number; ally: number; timer: number; gold: number }): Verdict {
  const e = 0.0005;
  const f = s.gearFocus ?? 'balanced';
  if (f !== 'balanced') {
    const v = f === 'tap' ? c.tap : f === 'named' ? c.ally : c.gold + 0.02 * c.timer;
    return v > e ? 'better' : v < -e ? 'worse' : 'same';
  }
  if (Math.abs(c.tap) < e && Math.abs(c.ally) < e) return 'same';
  if (c.tap >= -e && c.ally >= -e) return 'better';
  if (c.tap <= e && c.ally <= e) return 'worse';
  return 'mixed';
}
export function verdict(s: State, it: Item): Verdict {
  const sl = replaceTarget(s, it);
  if (!s.equipped[sl]) return 'better';
  if (completesSet(s, it)) return 'better';
  const c = compare(s, it, sl);
  if ((s.gearFocus ?? 'balanced') !== 'balanced') return judge(s, c);
  const e = 0.0005;
  if (Math.abs(c.tap) < e && Math.abs(c.ally) < e) return 'same';
  if (c.tap >= -e && c.ally >= -e) return 'better';
  if (c.tap <= e && c.ally <= e) return 'worse';
  return 'mixed';
}
export function isWorse(s: State, it: Item): boolean {
  if (it.rarity === 'artifact' || it.rarity === 'ancestry' || it.set) return false;
  const v = verdict(s, it);
  return v === 'worse' || v === 'same';
}

/** Salvage every bag item that is worse than what you wear (never Epic and up, Artifacts or heirlooms). */
export function salvageWorse(s: State): number {
  const keep = new Set<Rarity>(['epic', 'legendary', 'artifact', 'ancestry', 'set']);
  let n = 0;
  for (const it of [...s.bag]) if (!keep.has(it.rarity) && isWorse(s, it)) n += salvage(s, it.id) ? 1 : 0;
  return n;
}

/** Salvage every bag item of one rarity. Artifacts and heirlooms are never sold this way. */
export function salvageRarity(s: State, rarity: Rarity): number {
  if (rarity === 'artifact' || rarity === 'ancestry' || rarity === 'set') return 0;
  let n = 0;
  for (const it of [...s.bag]) if (it.rarity === rarity) n += salvage(s, it.id) ? 1 : 0;
  return n;
}

// ------------------------------------------------------------------ Ember spending

// ------------------------------------------------------------------ relics (Embers)

/** The 9 rites are always owned (level 0); other relics are found at random. */
export const relicOwned = (s: State, id: string) => id in s.relics || RELICS.findIndex((r) => r.id === id) < 9;
export const relicsOwnedCount = (s: State) => RELICS.filter((r) => relicOwned(s, r.id)).length;

/** Price of a random new relic: dearer for each one you own. */
export function newRelicCost(s: State): Big {
  return B.big(Math.ceil(3 * Math.pow(1.35, relicsOwnedCount(s) - 9)));
}
export function findRelic(s: State): string | null {
  const pool = RELICS.filter((r) => !relicOwned(s, r.id));
  const cost = newRelicCost(s);
  if (!pool.length || B.lt(s.embers, cost)) return null;
  s.embers = B.sub(s.embers, cost);
  const r = pick(s, pool);
  s.relics[r.id] = 1;
  count(s, 'relicLevels');
  say(s, `Relic found: ${r.name}.`);
  return r.id;
}
export function relicCost(s: State, id: string): Big {
  const r = RELICS.find((x) => x.id === id)!;
  return B.big(Math.ceil(r.cost * Math.pow(r.growth, s.relics[id] ?? 0)));
}
export function levelRelic(s: State, id: string): boolean {
  const r = RELICS.find((x) => x.id === id);
  if (!r || !relicOwned(s, id)) return false;
  const lv = s.relics[id] ?? 0;
  if (r.max !== undefined && lv >= r.max) return false;
  const cost = relicCost(s, id);
  if (B.lt(s.embers, cost)) return false;
  s.embers = B.sub(s.embers, cost);
  s.relics[id] = lv + 1;
  count(s, 'relicLevels');
  return true;
}
/** Old names kept for the rites. */
export const riteCost = relicCost;
export const buyRite = levelRelic;

// ------------------------------------------------------------------ rewards, quests, tasks, login, achievements

/** Give a list of rewards; `why` goes to the log and the UI toast. */
export function grant(s: State, rewards: Reward[], why: string) {
  const d = derive(s);
  const parts: string[] = [];
  for (const r of rewards) {
    switch (r.kind) {
      case 'classPt': s.points.classPt += r.n; parts.push(`${r.n} class point${r.n > 1 ? 's' : ''}`); break;
      case 'formPt': s.points.formPt += r.n; parts.push(`${r.n} transformation point${r.n > 1 ? 's' : ''}`); break;
      case 'key': s.keys += r.n; parts.push(`${r.n} key${r.n > 1 ? 's' : ''}`); break;
      case 'marks': { const n = Math.round(r.n * d.markMult); s.marks += n; parts.push(`${n} Marks`); break; }
      case 'embers': { const e = B.max(B.big(r.n), B.times(s.bestReturn, r.n / 100)); s.embers = B.add(s.embers, e); parts.push(`${B.format(e)} Embers`); break; }
      case 'gold': { const g = B.times(estimateDps(s), GOLD_PER_HP * d.goldMult * r.n); addGold(s, g); parts.push(`${B.format(g)} gold`); break; } // n seconds of kill gold
      case 'egg': giveEgg(s, r.n); parts.push(`${r.n} pet egg${r.n > 1 ? 's' : ''}`); break;
      case 'pet': {
        const choices = (r.pets ?? []).filter((id) => !(id in s.pets));
        if (choices.length > 1) { s.pending.push({ kind: 'pet', choices }); parts.push('a pet (choose one)'); }
        else if (choices.length === 1) { s.pets[choices[0]] = 1; autoOut(s, choices[0]); parts.push(PETS.find((p) => p.id === choices[0])?.name ?? 'a pet'); }
        else { giveEgg(s, 1); parts.push('a pet egg'); }
        break;
      }
    }
  }
  const msg = `${why}: ${parts.join(', ')}.`;
  say(s, msg);
  s.events.push(msg);
}

function autoOut(s: State, id: string) {
  if (s.petsOut.length < PETS_OUT && !s.petsOut.includes(id)) s.petsOut.push(id);
}

/** Live value of a goal kind (for "reach" goals) or the lifetime counter. */
export function goalValue(s: State, kind: GoalKind): number {
  switch (kind) {
    case 'stage': return s.bestStage;
    case 'xpLevel': return xpLevel(s.xp);
    case 'relics': return relicsOwnedCount(s);
    case 'setsDone': return setsComplete(s).length;
    case 'pets': return Object.keys(s.pets).length;
    default: return s.counts[kind] ?? 0;
  }
}
const isLive = (k: GoalKind) => k === 'stage' || k === 'xpLevel' || k === 'relics' || k === 'setsDone' || k === 'pets' || k === 'gold';

/** Run 6 (Elliot testers): quest 2 was "Tap 500 times", a wall that fights the Ranger and Cleric. Now each class practises its own loop. */
export const CLASS_QUEST2: Record<string, { text: string; kind: GoalKind; n: number }> = {
  warrior: { text: 'Land 10 Rage Strikes', kind: 'rageStrikes', n: 10 },
  mage: { text: 'Cast 10 spells or skills', kind: 'spells', n: 10 },
  rogue: { text: 'Hit 15 weak spots', kind: 'weakHits', n: 15 },
  ranger: { text: 'Defeat 30 foes', kind: 'kills', n: 30 },
  cleric: { text: 'Keep Prayer above 50% for 60 s', kind: 'prayerSec', n: 60 },
};
export const questDef = (num: number, cls?: string): QuestDef => {
  const q = num <= QUESTS.length ? QUESTS[num - 1] : endlessQuest(num);
  const c = num === 2 && cls ? CLASS_QUEST2[cls] : undefined;
  return c ? { ...q, text: c.text, goal: { ...q.goal, kind: c.kind, n: c.n } } : q;
};
/** Quest 2 depends on the class: when it was started for another class (old save, Reshape), it starts again for this one. */
function syncQuest(s: State) {
  if (s.quest.num === 2 && s.quest.cls !== s.hero.cls) { s.quest.cls = s.hero.cls; s.quest.base = questProgressBase(s, 2); }
}
function questProgressBase(s: State, num: number): number {
  const q = questDef(num, s.hero.cls);
  return q.goal.reach || isLive(q.goal.kind) ? 0 : goalValue(s, q.goal.kind);
}
/** Progress of the current quest: [done so far, needed]. */
export function questProgress(s: State): [number, number] {
  syncQuest(s);
  const q = questDef(s.quest.num, s.hero.cls);
  const v = goalValue(s, q.goal.kind) - s.quest.base;
  return [Math.max(0, Math.min(q.goal.n, v)), q.goal.n];
}
export function claimQuest(s: State): boolean {
  const [have, need] = questProgress(s);
  if (have < need) return false;
  const q = questDef(s.quest.num, s.hero.cls);
  s.quest.num++;
  s.quest.base = questProgressBase(s, s.quest.num);
  if (s.quest.num === 2) s.quest.cls = s.hero.cls;
  grant(s, q.rewards, `Quest done: ${q.text}`);
  return true;
}

/** Local calendar day number (midnight on the player's clock). */
export const dayIndex = (now: number) => Math.floor((now - new Date(now).getTimezoneOffset() * 60000) / 86400000);
/** Weeks start on Monday. */
export const weekIndex = (day: number) => Math.floor((day + 3) / 7);

function pickTasks(s: State, pool: TaskDef[], n: number): { id: string; base: number; claimed: boolean }[] {
  const left = [...pool];
  const out: { id: string; base: number; claimed: boolean }[] = [];
  while (out.length < n && left.length) {
    const t = left.splice(Math.floor(rand(s) * left.length) % left.length, 1)[0];
    out.push({ id: t.id, base: t.goal.reach || isLive(t.goal.kind) ? 0 : goalValue(s, t.goal.kind), claimed: false });
  }
  return out;
}

/** New day: daily tasks, the free key (up to 3) and the login reward. New week: weekly tasks. */
export function refreshDaily(s: State, now: number): boolean {
  const day = dayIndex(now);
  const D = s.daily;
  if (day <= D.day) return false;
  if (D.at !== undefined && now - D.at < DAILY_MIN_GAP) return false; // run 2
  D.at = now;
  D.day = day;
  D.tasks = pickTasks(s, DAILY_TASKS, 3);
  if (s.keys < KEY_CAP) s.keys++;
  const wk = weekIndex(day);
  if (wk !== D.week) {
    D.week = wk;
    D.weekly = pickTasks(s, WEEKLY_TASKS, 3);
  }
  if (D.loginGiven !== day) {
    D.loginGiven = day;
    const reward = LOGIN[D.loginDay % LOGIN.length];
    if (reward) grant(s, reward.rewards, `Day ${D.loginDay + 1} login`);
    D.loginDay = (D.loginDay + 1) % LOGIN.length; // a missed day just pauses the cycle
  }
  return true;
}

export function taskDef(id: string): TaskDef | undefined {
  return DAILY_TASKS.find((x) => x.id === id) ?? WEEKLY_TASKS.find((x) => x.id === id);
}
export function taskProgress(s: State, t: { id: string; base: number }): [number, number] {
  const def = taskDef(t.id);
  if (!def) return [0, 1];
  return [Math.max(0, Math.min(def.goal.n, goalValue(s, def.goal.kind) - t.base)), def.goal.n];
}
export function claimTask(s: State, id: string): boolean {
  const t = [...s.daily.tasks, ...s.daily.weekly].find((x) => x.id === id);
  const def = taskDef(id);
  if (!t || !def || t.claimed) return false;
  const [have, need] = taskProgress(s, t);
  if (have < need) return false;
  t.claimed = true;
  grant(s, def.rewards, `${def.weekly ? 'Weekly' : 'Daily'} task: ${def.text}`);
  if (def.weekly) s.gems = (s.gems ?? 0) + GEMS_WEEKLY;
  return true;
}

/** Tiers reached for an achievement. */
export const achTier = (s: State, a: { kind: GoalKind; tiers: number[] }) => a.tiers.filter((n) => goalValue(s, a.kind) >= n).length;
/** Grant newly reached achievement tiers (their bonus is permanent). */
export function checkAchievements(s: State): number {
  let n = 0;
  for (const a of ACHIEVEMENTS) {
    const have = s.ach[a.id] ?? 0;
    const tier = achTier(s, a);
    if (tier > have) {
      s.ach[a.id] = tier;
      const marks = a.marks * (tier - have);
      s.marks += marks;
      s.gems = (s.gems ?? 0) + GEMS_PER_ACH_TIER * (tier - have);
      const msg = `Achievement: ${a.name} ${'★'.repeat(tier)} (+${marks} Marks)`;
      say(s, msg);
      s.events.push(msg);
      n++;
    }
  }
  return n;
}

// ------------------------------------------------------------------ pets (Marks)

export function giveEgg(s: State, n: number) {
  s.eggs += n;
}
/** Hatch an egg into a pet you do not have yet. */
export function hatchEgg(s: State): string | null {
  const pool = PETS.filter((p) => !(p.id in s.pets));
  if (s.eggs <= 0 || !pool.length) return null;
  s.eggs--;
  const p = pick(s, pool);
  s.pets[p.id] = 1;
  autoOut(s, p.id);
  say(s, `An egg hatches: ${p.name}.`);
  return p.id;
}
export const petLevelCost = (s: State, id: string) => Math.ceil(5 * Math.pow(1.3, (s.pets[id] ?? 1) - 1));
export function levelPet(s: State, id: string): boolean {
  if (!(id in s.pets)) return false;
  const c = petLevelCost(s, id);
  if (s.marks < c) return false;
  s.marks -= c;
  s.pets[id]++;
  return true;
}
/** Send a pet out (up to 3) or call it back. */
export function togglePet(s: State, id: string): boolean {
  if (inRealm(s)) return false; // run 2: no swapping gear, pets or skills inside an escape or dungeon
  if (!(id in s.pets)) return false;
  const i = s.petsOut.indexOf(id);
  if (i >= 0) { s.petsOut.splice(i, 1); return true; }
  if (s.petsOut.length >= PETS_OUT) return false;
  s.petsOut.push(id);
  return true;
}

// ------------------------------------------------------------------ fairies

export function collectFairy(s: State): string | null {
  const L = s.life;
  if (!L.fairy) return null;
  L.fairy = null;
  count(s, 'fairies');
  if (s.hero.faith === 'archive') moment(s, 'archive', 'Silent Archive: fairies come twice as often, and Marks +50%.');
  const d = derive(s);
  const strikeR = ruleSum(d.rules, 'fairyStrike');
  if (strikeR) hit(s, d, B.times(d.allyDps, strikeR.a), 'magic');
  const total = FAIRY_REWARDS.reduce((a, r) => a + r.weight, 0);
  let roll = rand(s) * total;
  let rw = FAIRY_REWARDS[0];
  for (const r of FAIRY_REWARDS) { roll -= r.weight; if (roll <= 0) { rw = r; break; } }
  switch (rw?.kind) {
    case 'gold': {
      const g = B.times(estimateDps(s), rw.n * GOLD_PER_HP * d.goldMult);
      addGold(s, g);
      return `+${B.format(g)} gold`;
    }
    case 'mana': L.mana = Math.min(d.manaMax, L.mana + (d.manaMax * rw.n) / 100); return `+${rw.n}% mana`;
    case 'spell': { const n = castRandomSpell(s); if (n) return `Free cast: ${n}`; L.mana = d.manaMax; return 'Mana filled'; }
    case 'marks': { const n = Math.round(rw.n * d.markMult); s.marks += n; return `+${n} Marks`; }
  }
  return null;
}

// ------------------------------------------------------------------ dungeons and set pieces

export const setById = (id: string) => SETS.find((x) => x.id === id);

/** Use a key: a random death realm, 9 mobs and its boss in 3 minutes. Sized to your damage, like escapes. */
export function startDungeon(s: State): boolean {
  if (s.keys <= 0 || s.dungeon || s.escape || s.pending.length) return false;
  s.keys--;
  count(s, 'dungeonRuns');
  const d = derive(s);
  const realm = pick(s, REALMS);
  s.dungeon = {
    realm: realm.id, killed: 0, foe: { name: '', hp: B.ZERO, max: B.ZERO, boss: false }, unit: realmUnit(s),
    timeLeft: DUNGEON_SECONDS + (d.stats.dungeonSec ?? 0), gold: B.ZERO, done: false, cleared: false, drop: null,
  };
  s.dungeon.foe = dungeonFoe(s);
  s.life.buffs = s.life.buffs.filter((b) => b.kind !== 'freeze');
  say(s, `A key turns. The way into the ${realm.name} opens.`);
  return true;
}

function dungeonFoe(s: State): Foe {
  const g = s.dungeon!;
  const realm = REALMS.find((r) => r.id === g.realm)!;
  const boss = g.killed >= DUNGEON_MOBS;
  const hp = B.times(g.unit, boss ? DUNGEON_BOSS_SECONDS : DUNGEON_MOB_SECONDS);
  const foe: Foe = { name: boss ? realm.gate : realm.foe, hp, max: hp, boss };
  rollElements(s, Math.max(IMMUNE_FROM, s.bestStage), boss, foe);
  return foe;
}

function dungeonKill(s: State, d: Derived) {
  const g = s.dungeon!;
  // run 2: was foeHp(bestStage), which paid a fresh life whole lives' worth of gold
  const gold = B.times(g.foe.max, GOLD_PER_HP * d.goldMult * (g.foe.boss ? 4 : 2));
  g.gold = B.add(g.gold, gold);
  addGold(s, gold);
  gainXp(s, d, s.life.stage, g.foe.boss, racePace(s));
  gainTierXp(s, g.foe.boss);
  count(s, 'kills');
  if (g.foe.immune?.length) count(s, 'immuneKills');
  if (g.foe.boss) {
    g.killed = DUNGEON_MOBS + 1;
    count(s, 'dungeons');
    endDungeon(s, true);
    return;
  }
  g.killed++;
  g.foe = dungeonFoe(s);
}

function endDungeon(s: State, cleared: boolean) {
  const g = s.dungeon!;
  g.done = true;
  g.cleared = cleared;
  const realm = REALMS.find((r) => r.id === g.realm)!;
  const classPiece = cleared ? classDrop(s) : null;
  if (classPiece) {
    s.bag.push(classPiece);
    g.drop = classPiece.id;
    say(s, `${theName(realm.gate)} falls. Class set piece: ${classPiece.name}.`);
  } else if (cleared) {
    const sets = SETS.filter((x) => x.realm === g.realm);
    const def = pick(s, sets);
    const piece = Math.floor(rand(s) * def.pieces.length) % def.pieces.length;
    const plus1 = ruleSum(derive(s).rules, 'plusOneDrop');
    const it = makeSetPiece(s, def.id, piece, s.bestStage, plus1 && rand(s) < plus1.a / 100 ? 1 : 0);
    if (s.bag.length >= BAG_SIZE + 10) say(s, `Bag full: ${it.name} is kept anyway.`);
    s.bag.push(it);
    g.drop = it.id;
    say(s, `${theName(realm.gate)} falls. Set piece: ${it.name}.`);
  } else {
    const marks = Math.round(g.killed / 3);
    if (marks) s.marks += marks;
    say(s, `The way out of the ${realm.name} closes. You keep what you earned.`);
  }
}

/** Leave a finished dungeon run. */
export function leaveDungeon(s: State): boolean {
  if (!s.dungeon?.done) return false;
  s.dungeon = null;
  return true;
}

/** How big one stat roll is at an item level, for set pieces. */
function statRoll(key: StatKey, ilvl: number, slot: ItemSlot): number {
  const af = AFFIXES.find((a) => a.stat === key);
  if (af) return af.base + af.perLevel * ilvl;
  if ((ATTRS as string[]).includes(key)) return 2 + ilvl * 0.35;
  if (key === 'weapon') return slot === 'mainHand' ? 3 + ilvl * 0.6 : 1.5 + ilvl * 0.3;
  if (key.startsWith('pierce')) return Math.min(10, 1 + ilvl * 0.02);
  const table: Partial<Record<StatKey, [number, number]>> = {
    overkillPct: [0.5, 0], fairyRate: [3, 0.05], treasureRate: [3, 0.05], wanderRate: [3, 0.05], dungeonSec: [1, 0.02],
    xpPct: [3, 0.1], markPct: [2, 0.05], autoTap: [0.2, 0.005], durationSec: [0.3, 0.005], cooldownPct: [1, 0.02],
    manaMax: [3, 0.1], lootLuck: [2, 0.05], emberPct: [2, 0.05], offlinePct: [4, 0.2],
  };
  const [b, per] = table[key] ?? [4, 0.25];
  return b + per * ilvl;
}

export const SET_MULT = 2.0; // set pieces roll stronger than Legendary (1.8)

export function makeSetPiece(s: State, setId: string, piece: number, ilvl: number, plus = 0, r: (s: State) => number = rand): Item {
  const def = setById(setId)!;
  const p = def.pieces[piece];
  const cls = (def.cls && CLASSES.find((c) => c.id === def.cls)) || classOf(s); // run 6: class gear rolls for its own class
  const stats: Stats = {};
  for (const k of def.stats) stats[k] = round(statRoll(k, ilvl, p.slot) * SET_MULT * (0.9 + 0.2 * r(s))); // run 6: class pieces roll on the gear stream
  if (!def.stats.includes(cls.main)) stats[cls.main] = round(statRoll(cls.main, ilvl, p.slot) * SET_MULT * 0.6);
  if ((p.slot === 'mainHand' || p.slot === 'offHand') && !stats.weapon) stats.weapon = round(statRoll('weapon', ilvl, p.slot) * SET_MULT);
  const look = p.slot === 'mainHand' ? cls.weapon : p.slot === 'offHand' ? cls.offHand : undefined;
  const it: Item = { id: s.nextItemId++, name: p.name, slot: p.slot, rarity: 'set', ilvl, stats, look, set: setId, piece, plus };
  if (def.cls) it.cls = def.cls;
  return it;
}

/** Two copies of the same set piece at the same + level become one at +1 (max +5). The kept one is the worn one if any. */
export function mergeTarget(s: State, it: Item): Item | null {
  if (!it.set || (it.plus ?? 0) >= MAX_PLUS) return null;
  const same = (x: Item | undefined) => !!x && x !== it && x.set === it.set && x.piece === it.piece && (x.plus ?? 0) === (it.plus ?? 0);
  return Object.values(s.equipped).find(same) ?? s.bag.find(same) ?? (s.stash ?? []).find(same) ?? null;
}
export function merge(s: State, itemId: number): boolean {
  const it = s.bag.find((x) => x.id === itemId);
  if (!it) return false;
  const into = mergeTarget(s, it);
  if (!into) return false;
  s.bag.splice(s.bag.indexOf(it), 1);
  into.plus = (into.plus ?? 0) + 1;
  count(s, 'merges');
  say(s, `${into.name} is now +${into.plus}.`);
  return true;
}

/** Run 2, idea 37: merge every bag item that has a match, until none is left. Returns how many merges were done. */
export function mergeAll(s: State): number {
  let n = 0;
  for (let guard = 0; guard < 500; guard++) {
    const it = s.bag.find((x) => mergeTarget(s, x));
    if (!it || !merge(s, it.id)) break;
    n++;
  }
  return n;
}

/** Healing a scar with Embers is deliberately expensive: 20x your best single return (min 50), about a couple of days of play. */
export function healCost(s: State): Big {
  return B.max(B.big(50), B.times(s.bestReturn, HEAL_RETURNS));
}
export function healScar(s: State, index: number): boolean {
  if (index < 0 || index >= s.scars.length) return false;
  const cost = healCost(s);
  if (B.lt(s.embers, cost)) return false;
  s.embers = B.sub(s.embers, cost);
  const [gone] = s.scars.splice(index, 1);
  say(s, `Healed: ${SCARS.find((x) => x.id === gone)?.name}.`);
  return true;
}

// ------------------------------------------------------------------ offline

export interface OfflineResult { seconds: number; gold: Big; capped: boolean; stages?: number; top?: { i: number; share: number }[] }

/**
 * Gold earned while the game was closed: the Named keep fighting at a reduced rate,
 * for at most 24 hours. Gold only: no stages, bosses, loot or skill points.
 * Clock going backwards counts as zero time. During an escape nothing is earned.
 */
export function applyOffline(s: State, now: number): OfflineResult {
  const raw = (now - s.lastSeen) / 1000;
  s.lastSeen = Math.max(s.lastSeen, now);
  const seconds = Math.max(0, Math.min(OFFLINE_CAP_SECONDS, Number.isFinite(raw) ? raw : 0));
  const capped = raw > OFFLINE_CAP_SECONDS;
  if (seconds >= 5) { s.life.rage = 0; s.life.combo = 0; s.life.prayer = 0; } // run 5: meters do not run while you are away
  if (seconds < 1 || s.escape || s.pending.length) return { seconds, gold: B.ZERO, capped };
  if (s.dungeon) return { seconds, gold: B.ZERO, capped };
  const d = derive(s);
  const gold = B.times(d.allyDps, seconds * GOLD_PER_HP * d.goldMult * d.offlineRate);
  s.life.gold = B.add(s.life.gold, gold);
  // run 2, idea 47: who did the work, as each Named's share of the damage (and so of the gold)
  const top = B.isZero(d.allyDps) ? [] : d.namedDps.map((x, i) => ({ i, share: Math.pow(10, x - d.allyDps) }))
    .filter((x) => x.share >= 0.01).sort((a, b) => b.share - a.share).slice(0, 3);
  let stages = 0;
  const push = ruleSum(d.rules, 'offlinePush');
  let n = 0;
  if (push && seconds >= 600 && s.life.stage < s.bestStage) {
    const share = Math.min(1, seconds / (Math.max(0.5, push.a) * 3600)) * Math.min(25, push.b || 25) / 100;
    n = Math.floor((s.bestStage - s.life.stage) * share);
  }
  const vigil = vigilStages(s, seconds); // the Cleric's Vigil; a relic push and Vigil do not stack, the bigger one wins
  if (seconds >= vigilMin(s) && s.hero.cls === 'cleric') s.life.prayer = prayerMax(d);
  n = Math.max(n, vigil);
  {
    if (n > 0) {
      s.life.stage += n;
      s.life.kills = 0;
      s.life.maxStage = Math.max(s.life.maxStage, s.life.stage);
      s.life.foe = makeFoe(s, s.life.stage, false, 0);
      s.events.push(n === vigil && vigil > 0 ? `Your Vigil carried you ${n} stages deeper while you were away.` : `While you were away you pushed ${n} stages.`);
      stages = n;
    }
  }
  return { seconds, gold, capped, stages, top };
}

// ------------------------------------------------------------------ saves

const PREFIX = 'UT1:';

function checksum(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

function toB64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function fromB64(b64: string): string {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** "The" before a name, unless it already starts with it. */
export const theName = (name: string) => (/^the /i.test(name) ? name : `The ${name}`);

export function serialize(s: State): string {
  return JSON.stringify(s);
}

export function deserialize(json: string): State {
  const raw = JSON.parse(json);
  return migrate(raw);
}

/** What is in the save slot: nothing, a good save, or something that must be kept and never written over. */
export type SaveRead = { kind: 'none' } | { kind: 'ok'; state: State } | { kind: 'bad'; reason: string };
export function readSave(raw: string | null | undefined): SaveRead {
  if (raw === null || raw === undefined || raw === '') return { kind: 'none' };
  try {
    return { kind: 'ok', state: deserialize(raw) };
  } catch (e) {
    return { kind: 'bad', reason: e instanceof SyntaxError ? 'The save is damaged.' : (e as Error).message };
  }
}

/** Copy-paste code to move a save between devices. */
export function exportCode(s: State): string {
  const json = serialize(s);
  return PREFIX + checksum(json) + ':' + toB64(json);
}

export function importCode(code: string): State {
  const clean = code.trim().replace(/\s+/g, '');
  if (!clean.startsWith(PREFIX)) throw new Error('This is not an Unwritten Tapper save code.');
  const rest = clean.slice(PREFIX.length);
  const sep = rest.indexOf(':');
  if (sep < 0) throw new Error('The save code is cut short.');
  const sum = rest.slice(0, sep);
  let json: string;
  try {
    json = fromB64(rest.slice(sep + 1));
  } catch {
    throw new Error('The save code is damaged.');
  }
  if (checksum(json) !== sum) throw new Error('The save code is damaged or incomplete.');
  return deserialize(json);
}

function migrate(raw: any): State {
  if (!raw || typeof raw !== 'object' || !raw.hero || !raw.life) throw new Error('Not a save.');
  if (typeof raw.v !== 'number') throw new Error('This save has no version number.');
  if (raw.v > SAVE_VERSION) throw new Error('This save is from a newer version of the game.');
  const s = raw as State;
  // fill anything a later version adds, so old saves keep loading
  s.ranks ??= {};
  if (raw.rites && !raw.relics) s.relics = raw.rites; // v1 rites are the first 9 relics (same ids)
  delete raw.rites;
  s.relics ??= {};
  s.xp ??= 0;
  s.raceRanks ??= {};
  s.formRanks ??= {};
  s.spells ??= {};
  // v1 earned class points from every 10th boss; keep them so no tree is left overspent
  s.points ??= { classPt: Math.floor(Math.max(0, (s.bestStage ?? 1) - 1) / 10), formPt: 0 };
  s.quest ??= { num: 1, base: 0 };
  s.counts ??= {};
  s.marks ??= 0;
  s.keys ??= 1;
  s.eggs ??= 0;
  s.pets ??= {};
  s.petsOut ??= [];
  s.ach ??= {};
  s.chest ??= Math.floor(Math.max(0, (s.bestStage ?? 1) - 1) / 25) * 25;
  s.daily ??= { day: -1, week: -1, tasks: [], weekly: [], loginDay: 0, loginGiven: -1 };
  s.dungeon ??= null;
  s.events ??= [];
  if (!raw.classPaths) {
    // v3: tiers. Everyone restarts the class ladder at T1 (foundation ranks kept) and is reset to mortal [Clarence, 7 Nov].
    s.classPaths = { base: { tier: 1, rank: 1, xp: 0 } };
    s.classPath = 'base';
    const found = new Set(classOf(s).tree.filter((n) => n.tier === 0).map((n) => n.id));
    for (const k of Object.keys(s.ranks)) if (!found.has(k)) delete s.ranks[k];
    s.forms = [];
    s.formTracks = { mastery: { tier: 1, rank: 1, xp: 0 } };
    s.formRanks = {};
    s.formOffered = false;
    s.trialBase = {};
    s.hero.form = 'mortal';
  }
  // v4 (run 3): new seeds come from the save's own seed without drawing from it, so a v3 save plays on exactly as before
  s.eventSeed ??= ((s.seed | 0) * 31 + 7) | 0;
  s.gimmickSeed ??= ((s.seed | 0) * 17 + 3) | 0;
  s.trainPerks ??= [];
  s.landsSeen ??= [];
  // run 5: classes, races and faiths changed meaning, so an older save gets 10 gems once (one free Reshape)
  if (!s.gemsWelcome) { s.gems = (s.gems ?? 0) + RESHAPE_COST; s.gemsWelcome = true; }
  // fix round: The Bellrope Descent became land 6, so every deep land seen before moves up one
  if (!s.landSplit) { s.landsSeen = s.landsSeen.map((l) => (l >= 5 ? l + 1 : l)); s.landSplit = true; }
  s.eventLog ??= [];
  s.gimmicksBeaten ??= [];
  const L = s.life;
  L.wanderLeft ??= 0;
  L.bossAge ??= 0;
  L.bleed ??= B.ZERO;
  L.revived ??= false;
  L.bossFails ??= 0;
  L.shatter ??= 0;
  L.tapN ??= 0;
  L.starT ??= 0;
  L.autoT ??= {};
  L.fairy ??= null;
  L.fairyIn ??= FAIRY_MIN;
  L.treasureNext ??= false;
  L.interestT ??= 0;
  s.scars ??= [];
  s.bag ??= [];
  s.equipped ??= {};
  s.pending ??= [];
  s.log ??= [];
  s.escape ??= null;
  s.life.buffs ??= [];
  s.life.cooldowns ??= {};
  while (s.life.allyLevels.length < ALLIES.length) s.life.allyLevels.push(0);
  s.v = SAVE_VERSION;
  return s;
}

// ------------------------------------------------------------------ run 2, item 17: what is coming up
export type GoalKindNext = 'named' | 'chest' | 'drop' | 'zone' | 'bishop' | 'fall' | 'immune' | 'best';
export type NextGoal = { stage: number; kind: GoalKindNext; what: string };
/** The next things the player is working towards, nearest stage first. */
export function upcomingGoals(s: State): NextGoal[] {
  const at = s.life.stage;
  const goals: NextGoal[] = [];
  const ai = ALLIES.findIndex((_, i) => !allyUnlocked(s, i));
  if (ai >= 0) goals.push({ stage: ALLIES[ai].unlockStage, kind: 'named', what: ALLIES[ai].name });
  const chest = Math.ceil((Math.max(at, s.chest) + 1) / 25) * 25;
  const fresh = chest > s.chest && chest >= s.bestStage;
  goals.push({ stage: chest, kind: fresh ? 'chest' : 'drop', what: fresh ? 'Chest' : 'Sure drop' });
  const z = ZONES.find((zz) => zz.from > at);
  if (z) goals.push({ stage: z.from, kind: 'zone', what: z.name });
  goals.push({ stage: Math.ceil((at + 1) / BISHOP_EVERY) * BISHOP_EVERY, kind: 'bishop', what: 'Hollow Bishop' });
  if (s.life.maxStage < MIN_DEATH_STAGE) goals.push({ stage: MIN_DEATH_STAGE, kind: 'fall', what: 'Fall unlocks' });
  if (at < IMMUNE_FROM) goals.push({ stage: IMMUNE_FROM, kind: 'immune', what: 'Immune foes' });
  if (at < s.bestStage) goals.push({ stage: s.bestStage, kind: 'best', what: 'Best stage' });
  return goals.filter((g) => g.stage > at).sort((a, b) => a.stage - b.stage);
}

// ------------------------------------------------------------------ run 2, ideas 28 and 30: comfort toggles (off by default)
/** Auto-cast unlocks at this permanent XP level. */
export const AUTO_CAST_LEVEL = 25;
/** Auto-buy unlocks once this many relics are owned. */
export const AUTO_BUY_RELICS = 10;
export const autoCastUnlocked = (s: State) => xpLevel(s.xp) >= AUTO_CAST_LEVEL;
export const autoBuyUnlocked = (s: State) => relicsOwnedCount(s) >= AUTO_BUY_RELICS;

/** Every skill on the bar: class actives, ultimates, then the shared spells. */
export function barSkillIds(s: State): string[] {
  return [
    ...classOf(s).tree.filter((n) => n.kind === 'active' && classNodeActive(s, n)).map((n) => n.id),
    ...ultimates(s).map((u) => u.id),
    ...SPELLS.map((x) => x.id),
  ].filter((id) => canUse(s, id) !== 'locked');
}

/** With full mana, cast the first ready skill whose effect is not already running. Returns its id, or null. */
export function autoCast(s: State): string | null {
  if (s.life.mana < derive(s).manaMax - 0.5) return null;
  for (const id of barSkillIds(s)) {
    if (s.life.buffs.some((b) => b.from === id)) continue;
    if (canUse(s, id) === 'ok' && useSkill(s, id)) return id;
  }
  return null;
}

/** Buy the cheapest single levels (Train or a Named) until the gold runs out. During a boss, 10 % of the gold is kept back. */
export function autoBuy(s: State): number {
  const boss = currentFoe(s).boss;
  const floor = boss ? B.times(s.life.gold, 0.1) : B.ZERO;
  let bought = 0;
  for (let n = 0; n < 200; n++) {
    let best = -1;
    let bestCost = heroCost(s);
    ALLIES.forEach((_, i) => {
      if (!allyUnlocked(s, i)) return;
      const c = allyCost(s, i);
      if (B.lt(c, bestCost)) { bestCost = c; best = i; }
    });
    if (B.lt(B.sub(s.life.gold, bestCost), floor)) break;
    const got = best < 0 ? buyHero(s, 1) : buyAlly(s, best, 1);
    if (!got) break;
    bought++;
  }
  return bought;
}

// ------------------------------------------------------------------ run 3: separate random streams
/** Same generator as rand(), on the event seed. Events never move the main seed. */
export function randEvent(s: State): number {
  s.eventSeed = (s.eventSeed + 0x6d2b79f5) | 0;
  let t = s.eventSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/** Same generator as rand(), on the gimmick seed. */
export function randGimmick(s: State): number {
  s.gimmickSeed = (s.gimmickSeed + 0x6d2b79f5) | 0;
  let t = s.gimmickSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ------------------------------------------------------------------ run 3, round 3: events and the weekly modifier
export type EventId = 'eclipse' | 'belltoll' | 'gravrush' | 'collector';
export const EVENT_DEFS: Record<EventId, { name: string; text: string; secs: number }> = {
  eclipse: { name: 'Eclipse', text: 'The sky goes dark: +25% crit chance for 30 s.', secs: 30 },
  belltoll: { name: 'Bell Toll', text: 'The great bell tolls: 1.5x gold for 30 s.', secs: 30 },
  gravrush: { name: 'Grave Rush', text: 'The graves spill their hoards: the next 3 foes are treasure foes.', secs: 15 },
  collector: { name: 'The Toll Collector', text: 'Double gold for 60 s, but your next boss has 5 s less. Accept?', secs: 20 },
};
/** Events start once you reach this stage, in ordinary fighting only (never in escapes or dungeons). */
export const EVENT_FROM = 26;
export const EVENT_GAP_MIN = 150; // sim-tuned (run 3): 2.5 to 4 minutes keeps 'something new' within 4 minutes after stage 100
export const EVENT_GAP_SPREAD = 60;
const nextEventGap = (s: State) => (EVENT_GAP_MIN + randEvent(s) * EVENT_GAP_SPREAD) / (s.hero.faith === 'unbound' ? 2 : 1);

export function startEvent(s: State, id?: EventId): EventId {
  const L = s.life;
  const ids = Object.keys(EVENT_DEFS) as EventId[];
  const pickId = id ?? ids[Math.floor(randEvent(s) * ids.length) % ids.length];
  const def = EVENT_DEFS[pickId];
  const secs = def.secs * (s.hero.faith === 'unbound' && pickId !== 'collector' ? 1.5 : 1);
  if (s.hero.faith === 'unbound') moment(s, 'unbound', 'Unbound: events come twice as often and last 1.5x longer.');
  L.event = { id: pickId, left: secs };
  // run 5: Eclipse lifts every source (it was crit chance, which only taps use)
  if (pickId === 'eclipse') L.buffs.push({ kind: 'dmgBuff', mag: 0.25, left: secs, from: 'event' });
  if (pickId === 'belltoll') L.buffs.push({ kind: 'goldBuff', mag: 0.5, left: secs, from: 'event' });
  if (pickId === 'gravrush') L.rushLeft = 3;
  if (pickId === 'collector') L.collector = true;
  s.eventLog.push(pickId);
  if (s.eventLog.length > 10) s.eventLog.splice(0, s.eventLog.length - 10);
  say(s, `${def.name}! ${def.text}`);
  return pickId;
}

function tickEvents(s: State, dt: number) {
  const L = s.life;
  // an event never follows you into an escape or a dungeon: its buffs end there (they made some escapes far too easy)
  if ((s.escape || s.dungeon) && (L.event || L.buffs.some((b) => b.from === 'event' || b.from === 'offering'))) { L.buffs = L.buffs.filter((b) => b.from !== 'event' && b.from !== 'offering'); L.event = null; L.rushLeft = 0; L.collector = false; }
  if (L.event) { L.event.left -= dt; if (L.event.left <= 0) { L.event = null; L.collector = false; } }
  if (s.escape || s.dungeon || s.eventsOff || L.stage < EVENT_FROM || L.event) return;
  L.eventIn ??= nextEventGap(s);
  L.eventIn -= dt;
  if (L.eventIn <= 0) { startEvent(s); L.eventIn = nextEventGap(s); }
}

// ------------------------------------------------------------------ run 5: gems and Reshape
export const RESHAPE_COST = 10;
export const GEMS_GREAT_CHEST = 5;
export const GEMS_PER_ACH_TIER = 2;
export const GEMS_WEEKLY = 1;
export type ReshapeKind = 'cls' | 'race' | 'faith';
/** Why a Reshape cannot happen now, or null if it can. */
export function reshapeBlock(s: State, kind: ReshapeKind, id: string): string | null {
  if (inRealm(s) || s.escape) return 'Not inside an escape or a dungeon.';
  if (s.pending.length) return 'Finish the choice in front of you first.';
  if ((s.gems ?? 0) < RESHAPE_COST) return `A Reshape costs ${RESHAPE_COST} gems. You have ${s.gems ?? 0}.`;
  const list = kind === 'cls' ? CLASSES : kind === 'race' ? RACES : FAITHS;
  if (!list.some((x) => x.id === id)) return 'Unknown choice.';
  const cur = kind === 'cls' ? s.hero.cls : kind === 'race' ? s.hero.race : s.hero.faith;
  if (cur === id) return 'That is what you are already.';
  return null;
}
/** One step, all or nothing: checks first, then changes the hero and charges the gems. */
export function reshape(s: State, kind: ReshapeKind, id: string): boolean {
  if (reshapeBlock(s, kind, id)) return false;
  if (kind === 'cls') {
    const old = classOf(s);
    const next = CLASSES.find((c) => c.id === id)!;
    const starter = `Worn ${BASE_NAMES[old.weapon][0]}`;
    const mh = s.equipped.mainHand;
    if (mh && mh.name === starter && mh.rarity === 'common' && mh.ilvl === 1 && !mh.plus && !mh.forge) { mh.name = `Worn ${BASE_NAMES[next.weapon][0]}`; mh.look = next.weapon; }
    const lk = s.equipped.trinket1;
    if (lk && lk.rarity === 'ancestry' && lk.name === HEIRLOOM.name && lk.stats[old.main] === 3 && !lk.plus) { const st2: Stats = { ...lk.stats }; delete st2[old.main]; st2[next.main] = 3; lk.stats = st2; }
    s.hero.cls = id;
    s.ranks = {}; // class points come back
    s.classPaths = { base: { tier: 1, rank: 1, xp: 0 } };
    s.classPath = 'base';
    s.life.cooldowns = {};
    s.life.buffs = s.life.buffs.filter((b) => b.from === 'event' || b.from === 'offering');
    s.life.rage = 0; s.life.combo = 0; s.life.prayer = 0;
  } else if (kind === 'race') s.hero.race = id;
  else s.hero.faith = id;
  s.gems = (s.gems ?? 0) - RESHAPE_COST;
  say(s, `Reshaped: ${kind === 'cls' ? 'class' : kind} is now ${(kind === 'cls' ? CLASSES : kind === 'race' ? RACES : FAITHS).find((x) => x.id === id)!.name}.`);
  return true;
}

// ------------------------------------------------------------------ run 5: five classes, five ways to play
export const RAGE_MAX = 100;
export const RAGE_PER_TAP = 4;
export const RAGE_DRAIN = 12; // a second, after RAGE_GRACE s without a manual tap
export const RAGE_GRACE = 1.5;
export const RAGE_STRIKE = 25;
export const WARRIOR_NAMED = 0.7;
export const MAGE_TAP = 0.5;
export const MAGE_MANA_PER_TAP = 1;
export const MAGE_SKILL = 2;
export const MAGE_CD = 0.6;
export const ROGUE_WEAK_MULT = 5;
export const COMBO_MAX = 10;
export const COMBO_CRIT = 0.1;
export const ROGUE_COMBO_MISS = 2;
export const ROGUE_TIMER = -5;
export const RANGER_AUTO = 3; // sim: 4 filled the race tree in life 2
export const RANGER_TAP = 0.5;
export const RANGER_PETS = 1.5; // sim: x2 filled the race tree in life 2
export const CLERIC_TAP = 0.25;
export const PRAYER_PER_TAP = 2;
export const PRAYER_MAX = 200;
export const PRAYER_DECAY = 4;
export const PRAYER_GRACE = 1;
// Vigil (12 Nov, Clarence: "offline could be the cleric gamestyle"): while away, a Cleric climbs toward 90% of their best stage.
export const VIGIL_CAP = 0.9; // his pick: up to 90% of the best stage
export const VIGIL_HOURS = 8; // a full night away gives the whole climb
export const VIGIL_MIN_SECONDS = 600; // under 10 minutes away is not a vigil
export const vigilMin = (s: State) => { const q = ruleSum(derive(s).rules, 'vigilQuick'); return q ? q.a * 60 : VIGIL_MIN_SECONDS; };
/** Stages a Cleric climbs while away (0 for other classes). */
export function vigilStages(s: State, seconds: number): number {
  if (s.hero.cls !== 'cleric' || seconds < vigilMin(s)) return 0;
  const target = Math.floor(s.bestStage * VIGIL_CAP);
  if (s.life.stage >= target) return 0;
  const hours = Math.max(1, VIGIL_HOURS - (ruleSum(derive(s).rules, 'vigilFast')?.a ?? 0));
  return Math.floor((target - s.life.stage) * Math.min(1, seconds / (hours * 3600)));
}
/** Run 6 (Elliot testers: "my race and faith made no difference I noticed"): count each time a race or faith rule fires,
 * and say so (with a flag) the first time in each life. */
export function moment(s: State, key: string, text: string) {
  const m = (s.life.moments ??= {});
  m[key] = (m[key] ?? 0) + 1;
  if (m[key] === 1) { say(s, `⚑ ${text}`); s.events.push(`⚑ ${text}`); }
}

// ------------------------------------------------------------------ run 6: class gear and the Stash
export const prayerMax = (d: Derived) => PRAYER_MAX + (ruleSum(d.rules, 'prayerDeep')?.a ?? 0) + (ruleSum(d.rules, 'ashCenser')?.a ?? 0);
export const comboMax = (d: Derived) => COMBO_MAX + (ruleSum(d.rules, 'comboDeep')?.a ?? 0);
export const CLASS_DROP = 0.5; // a dungeon clear gives a class set piece half the time
export const OWN_CLASS = 0.7; // and 70% of those are for your own class
export const STASH_MAX = 60;
export const STASH_SETS_MAX = 10; // Clarence: only complete sets count, with a cap
export const STASH_STAT = 0.02; // each complete stashed set: +2% of your worn gear's stats (Clarence 12 Nov: testers called 1% small)
export const STASH_FLAT_DMG = 2; // a set whose rule cannot be made small gives +2% damage instead
/** Same generator as rand(), on the run-6 gear stream (made from the seed on first use). */
export function randGear(s: State): number {
  s.gearSeed ??= ((s.seed | 0) * 29 + 11) | 0;
  s.gearSeed = (s.gearSeed + 0x6d2b79f5) | 0;
  let t = s.gearSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
/** A class set piece from a dungeon clear, or null (then the realm piece drops exactly as before). */
export const CLASS_ITEM_CHANCE = 1 / 12; // a dungeon clear: a class legendary or artifact instead of a set piece
/** Run things that roll items (makeItem uses rand) on another stream: swap the main seed out and back. */
function onStream<T>(s: State, key: 'gearSeed' | 'chaseSeed', mix: number, fn: () => T): T {
  const main = s.seed;
  s.seed = s[key] ?? (((main | 0) * mix + 7) | 0);
  try { return fn(); } finally { s[key] = s.seed; s.seed = main; }
}
export function makeClassItem(s: State, id: string, ilvl: number): Item {
  const def = CLASS_ITEMS.find((x) => x.id === id)!;
  const it = makeItem(s, ilvl, def.kind, def.slot);
  it.name = def.name; it.cls = def.cls; it.fx = def.fx; it.ruleText = def.text;
  if (def.kind === 'artifact') it.rule = `class:${def.id}`; // one Artifact worn at a time, like the others
  return it;
}
export function classDrop(s: State): Item | null {
  if (randGear(s) < CLASS_ITEM_CHANCE) {
    const own = CLASS_ITEMS.filter((x) => x.cls === s.hero.cls);
    const other = CLASS_ITEMS.filter((x) => x.cls !== s.hero.cls);
    const pool = own.length && randGear(s) < OWN_CLASS ? own : other;
    const def = pool[Math.floor(randGear(s) * pool.length) % pool.length];
    return onStream(s, 'gearSeed', 29, () => makeClassItem(s, def.id, s.bestStage));
  }
  const classSets = SETS.filter((x) => x.cls);
  if (!classSets.length || randGear(s) >= CLASS_DROP) return null;
  const own = classSets.filter((x) => x.cls === s.hero.cls);
  const other = classSets.filter((x) => x.cls !== s.hero.cls);
  const pool = own.length && (!other.length || randGear(s) < OWN_CLASS) ? own : other;
  const def = pool[Math.floor(randGear(s) * pool.length) % pool.length];
  const piece = Math.floor(randGear(s) * def.pieces.length) % def.pieces.length;
  const plus1 = ruleSum(derive(s).rules, 'plusOneDrop');
  return makeSetPiece(s, def.id, piece, s.bestStage, plus1 && randGear(s) < plus1.a / 100 ? 1 : 0, randGear);
}
/** Chase items: one roll per boss of a land; 1 in 40 for one you are missing there (picked evenly), then 1 in 200 for a copy. */
export function chaseDrop(s: State, stage: number): Item | null {
  const land = landIndex(stage);
  const here = CHASE.filter((x) => x.land === land);
  if (!here.length) return null;
  const found = s.chaseFound ?? [];
  const missing = here.filter((x) => !found.includes(x.id));
  return onStream(s, 'chaseSeed', 31, () => {
    if (rand(s) >= (missing.length ? CHASE_CHANCE : CHASE_DUP_CHANCE)) return null;
    const pool = missing.length ? missing : here;
    const def = pool[Math.floor(rand(s) * pool.length) % pool.length];
    const it = makeItem(s, stage, 'legendary', def.slot);
    it.name = def.name; it.fx = def.fx; it.ruleText = def.text; it.chase = def.id;
    if (!found.includes(def.id)) {
      (s.chaseFound ??= []).push(def.id);
      const n = s.chaseFound.length;
      for (const [at, gems] of CHASE_GEM_TIERS) if (n === at) { s.gems = (s.gems ?? 0) + gems; say(s, `${n} chase items found: +${gems} gems.`); }
    }
    if (s.bag.length >= BAG_SIZE + 10) say(s, `Bag full: ${it.name} is kept anyway.`);
    s.bag.push(it);
    say(s, `Chase item: ${it.name}!`);
    return it;
  });
}

/** Complete sets in the Stash (every piece present at least once), in SETS order, at most 10. */
export function stashSets(s: State): SetDef[] {
  const st = s.stash ?? [];
  if (!st.length) return [];
  const out: SetDef[] = [];
  for (const def of SETS) {
    const have = new Set(st.filter((x) => x.set === def.id && x.piece !== undefined).map((x) => x.piece!));
    if (have.size === def.pieces.length) out.push(def);
    if (out.length >= STASH_SETS_MAX) break;
  }
  return out;
}
/** How each rule shrinks in the Stash: a scaled copy, or null (+2% damage instead). Counts like "every 3rd cast" never shrink. */
const STASH_SCALE: Partial<Record<RuleKind, [number, number]>> = {
  critSplash: [0.2, 1], tapCleave: [0.2, 1], bossRamp: [0.2, 0.2], execute: [0.2, 0.2], shatter: [0.2, 1], bleed: [0.2, 1],
  bloodMoney: [0.2, 1], cooldownCut: [0.2, 1], drift: [0.2, 1], emberDrip: [0.2, 1], bossRevive: [0.2, 1], namedAsTap: [0.2, 1],
  offlinePush: [1, 0.2], lifeStart: [0.2, 1], fairyStrike: [0.2, 1], namedDouble: [0.2, 1], skillExtendOnKill: [0.2, 0.2],
  fury: [0.2, 1], surge: [0.2, 1], comboDeep: [0, 0.2], volleyAuto: [0.2, 0.2], prayerDeep: [0.2, 1],
  rageKeep: [0.2, 1], mageFocus: [0.2, 1], spotFast: [0.2, 1], petHaste: [0.2, 1], rangerGold: [0.2, 1], prayerHold: [0.2, 1], vigilFast: [0.2, 1],
};
export function stashRule(def: SetDef): Effect | null {
  const r = def.bonus.rule;
  const k = r ? STASH_SCALE[r.kind] : undefined;
  if (!r || !k) return null;
  return { rule: { ...r, a: r.a * k[0], b: r.b === undefined ? undefined : r.b * k[1] } };
}
const lockedGear = (s: State) => !!(s.escape || s.dungeon);
/** Move a set piece from the bag to the Stash (not in a dungeon or escape). */
export function stashPut(s: State, itemId: number): boolean {
  const it = s.bag.find((x) => x.id === itemId);
  if (!it?.set || lockedGear(s) || (s.stash?.length ?? 0) >= STASH_MAX) return false;
  s.bag.splice(s.bag.indexOf(it), 1);
  (s.stash ??= []).push(it);
  return true;
}
/** Move a piece from the Stash back to the bag. */
export function stashTake(s: State, itemId: number): boolean {
  const st = s.stash ?? [];
  const it = st.find((x) => x.id === itemId);
  if (!it || lockedGear(s) || s.bag.length >= BAG_SIZE) return false;
  st.splice(st.indexOf(it), 1);
  s.bag.push(it);
  return true;
}

export const CLASS_LOOP: Record<string, { name: string; text: string }> = {
  warrior: { name: 'Rage', text: 'Every tap builds Rage. At 100 your next tap is a Rage Strike for 25x. Rage fades if you stop. Your Named deal 30% less.' },
  mage: { name: 'Spellweave', text: 'Taps do half damage but refill mana. Spells and skills hit twice as hard and come back faster. Tap to charge, then cast.' },
  rogue: { name: 'Precision', text: 'Weak spots open after 1 s, hit for 5x and build a combo (+10% crit damage each, up to 10). Leave a spot for 2 s and the combo breaks. Bosses give you 5 s less.' },
  ranger: { name: 'Quiver', text: 'Your arrows fly by themselves, 3 a second, and your pets hit 50% harder. Your own taps do half.' },
  cleric: { name: 'Prayer and Vigil', text: 'Taps barely hurt, but each one builds Prayer: up to +200% damage for all your Named. Prayer fades if you stop. Vigil: while you are away you climb toward 90% of your best stage (a full climb takes 8 hours), and you come back with full Prayer.' },
};

// ------------------------------------------------------------------ run 4: more to do between bosses
/** Same generator as rand(), on the run-4 stream (made from the seed on first use, so older saves need no new field). */
export function randR4(s: State): number {
  s.r4Seed ??= ((s.seed | 0) * 13 + 5) | 0;
  s.r4Seed = (s.r4Seed + 0x6d2b79f5) | 0;
  let t = s.r4Seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Elites: from stage 26, about 1 ordinary world foe in 8. Never in escapes or dungeons, never a treasure foe or wanderer. */
export type EliteKind = 'armoured' | 'swift' | 'warded';
export const ELITE_KINDS: EliteKind[] = ['armoured', 'swift', 'warded'];
export const ELITE_FROM = 26;
export const ELITE_CHANCE = 1 / 8;
/** Run 5: Elf finds elites 50% more often, Red Hunt twice as often (both: x3). */
export const eliteRate = (s: State) => (s.hero.race === 'elf' ? 1.5 : 1) * (s.hero.faith === 'redhunt' ? 2 : 1);
export const ELITE_HP = 3;
export const ELITE_GOLD = 5; // in all (its health pays ELITE_HP of it)
export const ARMOUR_CRITS = 3;
export const ARMOUR_TAP = 0.5;
export const SWIFT_SECONDS = 8;
export const SWIFT_MARKS = 5;
export const WARDED_SECONDS = 20; // run 5 gate: a warded elite immune to your only element was a wall, so it steps back after 20 s
export const ELITE_TEXT: Record<EliteKind, string> = {
  armoured: 'Armoured: your taps do half until you land 3 crits.',
  swift: 'Swift: it flees after 8 s. Catch it for 5 Marks.',
  warded: 'Warded: immune to one element. Named of another element help, and it steps back after 20 s if you cannot break it.',
};

/** Weak spot: on bosses and elites a glowing spot opens WEAK_FIRST s after the fight starts or after your last hit on it, and stays
 *  in one place until you hit it. Taps on it do x3. Fix rounds (gate, re-test): timed windows closed or moved before testers'
 *  taps landed, so it now waits for you. */
export const WEAK_FIRST = 2;
export const WEAK_EVERY = WEAK_FIRST; // kept for the patch notes
export const WEAK_SPOT_MULT = 3;
/** Run 5: the Rogue's spots open after 1 s, everyone else's after 2 s; an Elf's open twice as fast. */
export const weakFirst = (s: State, d?: Derived) => Math.max(0.3, (s.hero.cls === 'rogue' ? 1 - (ruleSum((d ?? derive(s)).rules, 'spotFast')?.a ?? 0) : WEAK_FIRST) * (s.hero.race === 'elf' ? 0.5 : 1));
export function weakOpen(s: State): boolean {
  if ((s.escape || s.dungeon) && s.hero.cls !== 'rogue') return false;
  const f = currentFoe(s);
  if (!(f.boss || f.elite)) return false;
  return (f.weakT ?? 0) >= weakFirst(s);
}
/** Which opening this is (the UI moves the spot each time). */
export const weakIndex = (s: State) => currentFoe(s).weakN ?? 0;

/** Adds gimmick: two adds, each this share of the boss's health (ordinary-foe health died in under a second to deep Named);
 *  the boss takes ADDS_BOSS_SHARE of the damage while any add stands. */
export const ADDS_HP = 0.15;
export const ADDS_BOSS_SHARE = 0.2;
/** A world boss beaten with at least this many seconds left counts for the "fast boss" hunt. */
export const FAST_BOSS_LEFT = 5;
/** The next world boss's clock can change by at most this much (Toll Collector, shrine oil). */
export const BOSS_DELTA_CAP = 5;

/** Hunts: short side goals offered every few minutes in ordinary fighting. Accept or ignore. They pause outside the world. */
export type HuntKind = 'elites' | 'weak' | 'boss5';
export interface Hunt { kind: HuntKind; base: number; left: number }
export const HUNT_FROM = 26;
export const HUNT_GAP_MIN = 150;
export const HUNT_GAP_SPREAD = 90;
export const HUNT_OFFER_SECONDS = 25;
export const HUNT_DEFS: Record<HuntKind, { text: string; counter: GoalKind; need: number; secs: number; rewards: Reward[] }> = {
  elites: { text: 'Kill 3 elites', counter: 'elites', need: 3, secs: 150, rewards: [{ kind: 'key', n: 1 }] },
  weak: { text: 'Tap the glowing ✸ weak spot 10 times', counter: 'weakHits', need: 10, secs: 150, rewards: [{ kind: 'marks', n: 15 }] },
  boss5: { text: 'Beat a boss with 5 s left', counter: 'fastBosses', need: 1, secs: 240, rewards: [{ kind: 'marks', n: 15 }] },
};
const huntGap = (s: State) => HUNT_GAP_MIN + randR4(s) * HUNT_GAP_SPREAD;
export function huntProgress(s: State, h = s.life.hunt): [number, number] {
  if (!h) return [0, 0];
  const def = HUNT_DEFS[h.kind];
  return [Math.min(def.need, Math.max(0, (s.counts[def.counter] ?? 0) - h.base)), def.need];
}
export function acceptHunt(s: State): boolean {
  const L = s.life;
  if (!L.huntOffer || L.hunt || s.escape || s.dungeon) return false;
  const def = HUNT_DEFS[L.huntOffer.kind];
  L.hunt = { kind: L.huntOffer.kind, base: s.counts[def.counter] ?? 0, left: def.secs };
  L.huntOffer = null;
  return true;
}
export function declineHunt(s: State): boolean {
  if (!s.life.huntOffer) return false;
  s.life.huntOffer = null;
  return true;
}

/** The Toll Collector (an event that asks): double gold for 60 s, and the next world boss has 5 s less. */
export const COLLECTOR_SECONDS = 60;
export const COLLECTOR_GOLD = 1; // +100%
export function answerCollector(s: State, yes: boolean): boolean {
  const L = s.life;
  if (!L.collector || L.event?.id !== 'collector') return false;
  L.collector = false;
  if (!yes) { L.event = null; return true; }
  L.event = { id: 'collector', left: COLLECTOR_SECONDS };
  L.buffs.push({ kind: 'goldBuff', mag: COLLECTOR_GOLD, left: COLLECTOR_SECONDS, from: 'event' });
  L.nextBossDelta = Math.max(-BOSS_DELTA_CAP, (L.nextBossDelta ?? 0) - BOSS_DELTA_CAP);
  say(s, 'The Toll Collector takes his due: double gold for 60 s. Your next boss has 5 s less.');
  return true;
}

/** Shrine offering: once per land in each life, spend gold on one of three. Oil is not offered while a toll is owed. */
export type OfferKind = 'oil' | 'tap' | 'named';
export const OFFER_FROM = 26;
export const OFFER_COST = 10; // x the health of an ordinary foe at this stage; sim-tuned
export const OFFER_SECONDS = 300;
export const OFFER_MAG = 0.5;
export const OFFER_DEFS: Record<OfferKind, { name: string; text: string }> = {
  oil: { name: 'Lantern oil', text: '+5 s on your next boss.' },
  tap: { name: 'Blessed hand', text: '+50% tap damage for 5 minutes.' },
  named: { name: 'Votive for the Named', text: '+50% Named damage for 5 minutes.' },
};
export function offeringReady(s: State): boolean {
  const L = s.life;
  const used = (L.offered ?? []).filter((x) => x === landIndex(L.stage)).length;
  return !s.escape && !s.dungeon && L.stage >= OFFER_FROM && used < (s.hero.race === 'human' ? 2 : 1);
}
export const offeringCost = (s: State): Big => B.times(foeHp(s.life.stage), OFFER_COST);
export function offerKinds(s: State): OfferKind[] {
  return (s.life.nextBossDelta ?? 0) < 0 ? ['tap', 'named'] : ['oil', 'tap', 'named'];
}
export function makeOffering(s: State, kind: OfferKind): boolean {
  const L = s.life;
  if (!offeringReady(s) || !offerKinds(s).includes(kind)) return false;
  const cost = offeringCost(s);
  if (B.lt(L.gold, cost)) return false;
  L.gold = B.sub(L.gold, cost);
  if (s.hero.race === 'human' && (L.offered ?? []).includes(landIndex(L.stage))) moment(s, 'human', 'Human: a second offering in this land.');
  (L.offered ??= []).push(landIndex(L.stage));
  if (kind === 'oil') L.nextBossDelta = Math.min(BOSS_DELTA_CAP, (L.nextBossDelta ?? 0) + BOSS_DELTA_CAP);
  else L.buffs.push({ kind: kind === 'tap' ? 'tapBuff' : 'allyBuff', mag: OFFER_MAG, left: OFFER_SECONDS, from: 'offering' });
  say(s, `${OFFER_DEFS[kind].name}: ${OFFER_DEFS[kind].text}`);
  return true;
}

/** Sellswords: gold buys +10% damage for every Named, for this life only (up to 5 hires; each costs twice the last). */
export const MERC_MAX = 5;
export const MERC_STEP = 0.1;
export const MERC_COST = 40; // x the health of an ordinary foe at your deepest stage this life
export const mercCost = (s: State): Big => B.times(foeHp(Math.max(1, s.life.maxStage)), MERC_COST * Math.pow(2, s.life.mercs ?? 0));
export function hireMerc(s: State): boolean {
  const L = s.life;
  if (inRealm(s) || (L.mercs ?? 0) >= MERC_MAX) return false;
  const cost = mercCost(s);
  if (B.lt(L.gold, cost)) return false;
  L.gold = B.sub(L.gold, cost);
  L.mercs = (L.mercs ?? 0) + 1;
  say(s, `Sellswords hired (${L.mercs}/${MERC_MAX}): your Named deal +${Math.round(MERC_STEP * 100 * L.mercs)}% this life.`);
  return true;
}

/** The tithe: before you fall, give all your gold to the Bell for up to +20% Embers from this fall. Once per life. */
export const TITHE_MAX = 0.2;
export const TITHE_REF = 200; // gold worth this many ordinary foes' health at your deepest stage gives the full +20%
export const titheBonus = (s: State): number => (s.hero.faith === 'veiled' ? 0.4 : TITHE_MAX) * Math.min(1, B.ratio(s.life.gold, B.times(foeHp(Math.max(1, s.life.maxStage)), TITHE_REF)));
export function tithe(s: State): boolean {
  const L = s.life;
  if (L.tithe || inRealm(s) || !canDie(s) || B.isZero(L.gold)) return false;
  const bonus = titheBonus(s);
  if (bonus < 0.005) return false;
  L.tithe = bonus;
  if (s.hero.faith === 'veiled') moment(s, 'veiled', 'Veiled Balance: your Tithe counts double.');
  L.gold = B.ZERO;
  say(s, `The Bell takes your gold: +${Math.round(bonus * 100)}% Embers when you fall.`);
  return true;
}

/** Named specialisation: at level 100 each Named takes one of two trades, kept for the life (not used inside escapes and dungeons). */
export type NamedSpec = 'boss' | 'horde';
export const SPEC_LEVEL = 100;
export const SPEC_DEFS: Record<NamedSpec, { name: string; text: string; mult: number }> = {
  boss: { name: 'Bossbreaker', text: '+50% against bosses and wanderers.', mult: 1.5 },
  horde: { name: 'Reaper', text: '+40% against every other foe.', mult: 1.4 },
};
export function specMult(s: State, i: number, foe: Foe): number {
  const sp = s.life.spec?.[i];
  if (!sp || inRealm(s)) return 1; // like gear and pets, trades stay out of escapes and dungeons (the gate is a boss)
  return (sp === 'boss') === isBig(foe) ? SPEC_DEFS[sp].mult : 1;
}
export const specWaiting = (s: State, i: number) => (s.life.allyLevels[i] ?? 0) >= SPEC_LEVEL && !s.life.spec?.[i];
export function chooseSpec(s: State, i: number, sp: NamedSpec): boolean {
  if (!specWaiting(s, i) || !(sp in SPEC_DEFS)) return false;
  (s.life.spec ??= {})[i] = sp;
  say(s, `${ALLIES[i].name} becomes a ${SPEC_DEFS[sp].name}: ${SPEC_DEFS[sp].text}`);
  return true;
}

/** Hunts tick only in ordinary fighting (never in escapes, dungeons or offline time). */
function tickRun4(s: State, dt: number) {
  const L = s.life;
  if (L.hunt) {
    const [have, need] = huntProgress(s);
    if (have >= need) {
      const def = HUNT_DEFS[L.hunt.kind];
      L.hunt = null;
      count(s, 'hunts');
      grant(s, s.hero.faith === 'redhunt' ? def.rewards.map((r) => ({ ...r, n: r.n * 2 })) : def.rewards, `Hunt done: ${def.text}`);
      if (s.hero.faith === 'redhunt') moment(s, 'redhunt', 'Red Hunt: that hunt paid double.');
    } else {
      L.hunt.left -= dt;
      if (L.hunt.left <= 0) { say(s, `The hunt ran out: ${HUNT_DEFS[L.hunt.kind].text}.`); L.hunt = null; }
    }
    return;
  }
  if (L.huntOffer) { L.huntOffer.left -= dt; if (L.huntOffer.left <= 0) L.huntOffer = null; return; }
  if (L.stage < HUNT_FROM) return;
  L.huntIn ??= huntGap(s);
  L.huntIn -= dt;
  if (L.huntIn <= 0) {
    const kinds = Object.keys(HUNT_DEFS) as HuntKind[];
    L.huntOffer = { kind: kinds[Math.floor(randR4(s) * kinds.length) % kinds.length], base: 0, left: HUNT_OFFER_SECONDS };
    L.huntIn = huntGap(s);
  }
}

/** One element gets +15% damage each week, worked out from the week number (never saved, never the raw device clock). */
export const WEEKLY_ELEMENTS: Element[] = ['fire', 'cold', 'light', 'poison'];
export const WEEKLY_BONUS = 0.15;
export const weeklyElement = (s: State): Element | null => (s.daily && s.daily.week >= 0 ? WEEKLY_ELEMENTS[s.daily.week % WEEKLY_ELEMENTS.length] : null);

// ------------------------------------------------------------------ run 3, round 4: real upgrade choices
/**
 * Train branches. Every 100 Train levels reached in a life offers one permanent perk, up to TRAIN_PERK_MAX. Perks stay through
 * falls, so later lives must train past 100 x (perks + 1) to earn the next one. The offer is a flag, never a blocking choice.
 */
export const TRAIN_PERKS = {
  tap: { name: 'Heavy Hand', text: '+5% tap damage, forever.', per: 0.05 },
  crit: { name: 'Keen Eye', text: '+1% crit chance, forever.', per: 0.01 },
} as const;
export type TrainPerk = keyof typeof TRAIN_PERKS;
export const TRAIN_PERK_EVERY = 100;
export const TRAIN_PERK_MAX = 10;
/** How many Train perks are waiting to be chosen right now. */
export const trainPerksWaiting = (s: State) =>
  Math.max(0, Math.min(TRAIN_PERK_MAX, Math.floor(s.life.heroLevel / TRAIN_PERK_EVERY)) - (s.trainPerks ?? []).length);
export function chooseTrainPerk(s: State, perk: TrainPerk): boolean {
  if (trainPerksWaiting(s) <= 0 || !(perk in TRAIN_PERKS)) return false;
  s.trainPerks.push(perk);
  say(s, `${TRAIN_PERKS[perk].name}: ${TRAIN_PERKS[perk].text}`);
  return true;
}

/**
 * The Gold Forge. Gold raises a worn non-set item's forge level (sets keep merging with plus). Each level adds FORGE_STEP to the
 * item's stats. The cost follows foe health at your deepest stage this life (x1.16 a stage), so it stays a gold sink as gold grows.
 */
export const FORGE_MAX = 10;
export const FORGE_STEP = 0.04;
export const canForge = (it: Item | undefined): it is Item => !!it && !it.set && (it.forge ?? 0) < FORGE_MAX;
export function forgeCost(s: State, it: Item): Big {
  return B.times(foeHp(Math.max(1, s.life.maxStage)), 40 * Math.pow(1.6, it.forge ?? 0) * (s.hero.race === 'dwarf' ? 0.5 : 1));
}
export function forge(s: State, slot: Slot): boolean {
  const it = s.equipped[slot];
  if (!canForge(it) || inRealm(s)) return false;
  const cost = forgeCost(s, it);
  if (B.lt(s.life.gold, cost)) return false;
  s.life.gold = B.sub(s.life.gold, cost);
  it.forge = (it.forge ?? 0) + 1;
  if (s.hero.race === 'dwarf') moment(s, 'dwarf', 'Dwarf: the Forge cost you half.');
  return true;
}
