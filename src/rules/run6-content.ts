// Run 6 (12 Nov 2026, Clarence: "work on equipments"): class legendaries and artifacts, and the 26 chase items (2 per land).
// Class items only work for their own class (another class gets their stats). Chase items work for everyone.
import type { ItemSlot } from './data';
import type { Rule } from './content-types';

export interface ClassItemDef { id: string; cls: string; kind: 'legendary' | 'artifact'; name: string; slot: ItemSlot; fx: Rule; text: string }
export const CLASS_ITEMS: ClassItemDef[] = [
  // Warrior
  { id: 'ironvow', cls: 'warrior', kind: 'legendary', name: 'Ironvow Gauntlets', slot: 'hands', fx: { kind: 'strikeCrit', a: 1 }, text: 'Rage Strikes always carry your crit damage.' },
  { id: 'bellbreaker', cls: 'warrior', kind: 'legendary', name: 'Bell-Breaker Helm', slot: 'head', fx: { kind: 'strikePlus', a: 20 }, text: 'Rage Strikes hit 20% harder.' },
  { id: 'penitent-chain', cls: 'warrior', kind: 'artifact', name: "Penitent's Chain", slot: 'waist', fx: { kind: 'chainStrike', a: 40 }, text: 'Rage Strikes hit x40 instead of x25, but Rage fades twice as fast.' },
  // Mage
  { id: 'ashen-quill', cls: 'mage', kind: 'legendary', name: 'Ashen Quill', slot: 'trinket1', fx: { kind: 'manaRegenPlus', a: 2 }, text: '+2 mana a second.' },
  { id: 'tidebound', cls: 'mage', kind: 'legendary', name: 'Tidebound Circlet', slot: 'head', fx: { kind: 'manaMaxPct', a: 25 }, text: 'Mana max +25%.' },
  { id: 'burnt-grimoire', cls: 'mage', kind: 'artifact', name: 'Burnt Grimoire', slot: 'chest', fx: { kind: 'burntGrimoire', a: 50 }, text: 'Spells and skills +50%, but below a quarter mana your taps refill nothing.' },
  // Rogue
  { id: 'knot', cls: 'rogue', kind: 'legendary', name: 'Knot of Whispers', slot: 'neck', fx: { kind: 'comboStart', a: 3 }, text: 'Every boss starts with your combo at 3 or more.' },
  { id: 'thornstep', cls: 'rogue', kind: 'legendary', name: 'Thornstep Boots', slot: 'feet', fx: { kind: 'spotWait', a: 1 }, text: 'An open weak spot waits 1 s longer before your combo breaks.' },
  { id: 'glass-knife', cls: 'rogue', kind: 'artifact', name: 'Glass Knife', slot: 'ring1', fx: { kind: 'glassKnife', a: 7 }, text: 'Weak spots hit x7 instead of x5, but your combo starts from 0 at every boss.' },
  // Ranger
  { id: 'last-feather', cls: 'ranger', kind: 'legendary', name: "Fletcher's Last Feather", slot: 'trinket1', fx: { kind: 'arrowPlus', a: 0.5 }, text: '+0.5 arrows a second.' },
  { id: 'pack-leader', cls: 'ranger', kind: 'legendary', name: 'Pack-Leader Cloak', slot: 'back', fx: { kind: 'petHaste', a: 15 }, text: 'Pets +15%.' },
  { id: 'silent-string', cls: 'ranger', kind: 'artifact', name: 'Silent String', slot: 'shoulders', fx: { kind: 'silentString', a: 50 }, text: 'Arrows +50%, but your own taps do nothing.' },
  // Cleric
  { id: 'candle', cls: 'cleric', kind: 'legendary', name: 'Candle of Vigil', slot: 'trinket1', fx: { kind: 'vigilQuick', a: 5 }, text: 'Vigil starts after 5 minutes away, not 10.' },
  { id: 'litany', cls: 'cleric', kind: 'legendary', name: 'Litany Beads', slot: 'wrists', fx: { kind: 'prayerGain', a: 25 }, text: 'Each tap builds 25% more Prayer.' },
  { id: 'ash-censer', cls: 'cleric', kind: 'artifact', name: 'Ash Censer', slot: 'legs', fx: { kind: 'ashCenser', a: 100 }, text: 'Prayer max +100, but it fades twice as fast.' },
];

/** Chase items: 2 per land (13 lands), from that land's bosses. Small, class-neutral rules from the existing kinds. */
export interface ChaseDef { id: string; land: number; name: string; slot: ItemSlot; fx: Rule; text: string }
const c = (id: string, land: number, name: string, slot: ItemSlot, fx: Rule, text: string): ChaseDef => ({ id, land, name, slot, fx, text });
export const CHASE: ChaseDef[] = [
  c('sexton-spade', 0, "Sexton's Spade", 'mainHand', { kind: 'keepGold', a: 5 }, 'Keep 5% of your gold when you return from death.'),
  c('grave-lantern', 0, 'First Grave-Lantern', 'trinket1', { kind: 'fairyStrike', a: 3 }, 'Each fairy you catch also hits the foe for 3 s of Named damage.'),
  c('root-mothers-ring', 1, "Root-Mother's Ring", 'ring1', { kind: 'drift', a: 4 }, '4% chance a cleared stage carries you one further.'),
  c('crow-mantle', 1, 'Crow-Feather Mantle', 'back', { kind: 'treasureSplit', a: 10 }, '10% chance a treasure foe splits in two.'),
  c('causeway-stone', 2, 'Causeway Keystone', 'trinket1', { kind: 'bossRevive', a: 3 }, 'Once per boss, when the clock runs out, 3 s more.'),
  c('tollkeeper-chain', 2, "Tollkeeper's Chain", 'neck', { kind: 'goldInterest', a: 0.5 }, 'Unspent gold grows 0.5% a minute while you play.'),
  c('antechamber-key', 3, 'Antechamber Key', 'waist', { kind: 'plusOneDrop', a: 10 }, '10% chance a set piece drops already at +1.'),
  c('shrine-veil', 3, 'Shrine-Keeper Veil', 'head', { kind: 'durationPlus', a: 1 }, 'Every buff lasts 1 s longer.'),
  c('bell-shard', 4, 'Shard of the Bell', 'offHand', { kind: 'critFreeze', a: 5, b: 1 }, 'Crits have a 5% chance to stop the boss clock for 1 s.'),
  c('underbell-boots', 4, 'Underbell Boots', 'feet', { kind: 'clockSlow', a: 5 }, 'The boss clock runs 5% slower.'),
  c('bellrope-gloves', 5, 'Bellrope Gloves', 'hands', { kind: 'namedAsTap', a: 3 }, 'Each Named hit has a 3% chance to count as a tap.'),
  c('descent-cord', 5, 'Cord of the Descent', 'waist', { kind: 'lifeStart', a: 3 }, 'A new life starts at 3% of your best stage.'),
  c('belfry-bell', 6, 'Drowned Belfry Bell', 'trinket1', { kind: 'namedDouble', a: 3 }, 'Named hits have a 3% chance to hit twice.'),
  c('kelp-wraps', 6, 'Belfry Kelp Wraps', 'wrists', { kind: 'offlinePush', a: 8, b: 10 }, 'Up to 8 h away also pushes stages, at most 10% of the gap to your best.'),
  c('cathedral-thorn', 7, 'Cathedral Thorn', 'ring1', { kind: 'bloodMoney', a: 2 }, '2% of gold earned buys Named levels for free.'),
  c('root-crown', 7, 'Crown of Roots', 'head', { kind: 'skillExtendOnKill', a: 0.2, b: 3 }, 'Each kill during a buff adds 0.2 s to it (up to 3 s a cast).'),
  c('ossuary-name', 8, 'A Name from the Ossuary', 'neck', { kind: 'emberDrip', a: 0.1 }, 'Each boss kill pays 0.1% of the Embers you would get by falling now.'),
  c('bone-ledger', 8, 'Bone Ledger', 'offHand', { kind: 'respecDiscount', a: 20 }, 'Respecs cost 20% fewer Embers.'),
  c('ash-stair-step', 9, 'Ash Stair Treads', 'feet', { kind: 'shatter', a: 4 }, 'A foe killed by a crit makes the next arrive with 4% health gone.'),
  c('cinder-heart', 9, 'Cinder Heart', 'chest', { kind: 'critSplash', a: 6, b: 1 }, 'Crits splash 6% into the next foe as fire.'),
  c('silent-clapper', 10, 'Silent Clapper', 'trinket1', { kind: 'cooldownCut', a: 4 }, 'Spell and skill cooldowns 4% shorter.'),
  c('hall-shroud', 10, 'Shroud of the Silent Hall', 'shoulders', { kind: 'spellTwice', a: 3 }, 'Spells and skills have a 3% chance to cast twice.'),
  c('red-gavel', 11, 'The Red Gavel', 'mainHand', { kind: 'tapCleave', a: 5 }, 'Every tap also hits the next foe for 5%.'),
  c('assize-seal', 11, 'Seal of the Assizes', 'ring1', { kind: 'bossWeaken', a: 3, b: 15 }, 'A boss that beats you comes back 3% weaker (up to 15%).'),
  c('deep-lamp', 12, 'Lamp of the Last Land', 'offHand', { kind: 'tapPerMilestone', a: 0.5 }, '+0.5% tap damage for each Named milestone this life.'),
  c('last-rope', 12, 'The Last Rope', 'legs', { kind: 'keepGold', a: 5 }, 'Keep 5% of your gold when you return from death.'),
];
export const CHASE_CHANCE = 1 / 40;
export const CHASE_DUP_CHANCE = 1 / 200;
export const CHASE_GEM_TIERS: [number, number][] = [[5, 2], [13, 2], [26, 2]];
