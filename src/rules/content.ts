// v2 game content, built from samples/v2-content-draft.md with Clarence's changes
// (DESIGN_LOG.md, "Round after the content draft"). Numbers are first guesses,
// tuned during play. Every effect uses a StatKey or a RuleKind from
// content-types.ts; where the draft had an effect no key covers, the nearest
// real key is used and marked `// changed:`.
//
// Reward amounts: 'gold' n = seconds of kill gold (as for fairies); 'marks',
// 'key', 'classPt', 'formPt', 'egg' n = count.

import type {
  AchievementDef, ChestDef, Effect, FairyReward, Goal, GoalKind, LoginDay, NamedMilestone, PetDef,
  QuestDef, RelicDef, Reward, Rule, RuleKind, SetDef, SetType, SpecialFoe, SpellDef, TaskDef, TreeDef, TreeNode,
} from './content-types';
import type { Element, ItemSlot, StatKey } from './data';
import { BELLROPE, DEEP_SHOWN, FIRST_DEEP } from './data';
import { neutralizeTree } from './neutral';

// ---------------------------------------------------------------- helpers

const st = (stat: StatKey, per: number, more: Partial<Effect> = {}): Effect => ({ stat, per, ...more });
const rl = (kind: RuleKind, a: number, more: Partial<Rule> = {}): Effect => ({ rule: { kind, a, ...more } });

// Same order as SET_SLOTS in content-types.ts (kept local: this file imports types only).
const SLOTS_OF: Record<SetType, ItemSlot[]> = {
  weapons: ['mainHand', 'offHand'],
  accessories: ['neck', 'back', 'ring1', 'ring1', 'trinket1', 'trinket1'],
  armour: ['head', 'shoulders', 'chest', 'wrists', 'hands', 'waist', 'legs', 'feet'],
};

function set(realm: string, type: SetType, name: string, pieceNames: string[], stats: StatKey[], bonus: Effect, text: string): SetDef {
  const slots = SLOTS_OF[type];
  if (pieceNames.length !== slots.length) throw new Error(`set ${name}: ${pieceNames.length} pieces`);
  return { id: `${realm}-${type}`, realm, type, name, pieces: slots.map((slot, i) => ({ slot, name: pieceNames[i] })), stats, bonus, text };
}

/** Run 6: a class set (drops in any dungeon; its bonus works only for its own class). */
function classSet(cls: string, type: SetType, name: string, pieceNames: string[], stats: StatKey[], bonus: Effect, text: string): SetDef {
  return { ...set('class', type, name, pieceNames, stats, bonus, text), id: `${cls}-${type}`, cls };
}

// ---------------------------------------------------------------- 1. gear sets (15)

export const SETS: SetDef[] = [
  // run 6: class weapon sets (one per class; numbers tuned by the paired sim)
  classSet('warrior', 'weapons', 'Oathbreaker Pair', ['Oathbreaker', 'Grudge Shield'], ['weapon', 'tapPct', 'critDmg'],
    rl('fury', 25, { b: 6 }), 'Each Rage Strike fires you up: all your damage +25% for 6 s. Keep the Rage coming.'),
  classSet('mage', 'weapons', 'Twice-Read Pair', ['Twice-Read Staff', 'Margin Tome'], ['weapon', 'skillPct', 'manaMax'],
    rl('surge', 25, { b: 12 }), 'Each spell or skill you cast: all your damage +25% for 12 s. Keep casting.'),
  classSet('rogue', 'weapons', 'Needle and Thread', ['The Needle', 'The Thread'], ['weapon', 'critChance', 'critDmg'],
    rl('comboDeep', 4, { b: 2 }), 'Combo max +4 (up to 14), and each combo point adds 2% to all your damage.'),
  classSet('ranger', 'weapons', "Fletcher's Pair", ["Fletcher's Bow", 'Endless Quiver'], ['weapon', 'petPct', 'normalPct'],
    rl('volleyAuto', 1, { b: 22 }), 'Your arrows fly faster (+1 a second) and mark the foe: marked foes take 22% more from everything.'),
  // run 6: class accessories and armour (accessories need both rings and both trinkets)
  classSet('warrior', 'accessories', 'Grudgebearer Tokens', ['Torc of Grudges', 'Bloodied Cloak', 'Ring of the Oath', 'Ring of the Broken Oath', 'Grudge Idol', 'Ember of Spite'], ['str', 'tapPct', 'critChance'],
    rl('fury', 15, { b: 6 }), 'Each Rage Strike: all your damage +15% for 6 s (adds to the Oathbreaker Pair).'),
  classSet('warrior', 'armour', 'Unbowed Plate', ['Unbowed Helm', 'Spiked Pauldrons', 'Dented Breastplate', 'Iron Bracers', 'Mailed Fists', 'War Belt', 'Plated Greaves', 'Stomping Boots'], ['str', 'bossPct', 'timerSec'],
    rl('rageKeep', 1.5), 'Rage waits 3 s before it fades, not 1.5 s.'),
  classSet('mage', 'accessories', 'Margin Notes', ['Inked Torc', 'Scribe Cloak', 'Ring of Footnotes', 'Ring of Errata', 'Folded Page', 'Dry Quill'], ['int', 'skillPct', 'manaRegen'],
    rl('surge', 15, { b: 12 }), 'Each spell or skill you cast: all your damage +15% for 12 s (adds to the Twice-Read Pair).'),
  classSet('mage', 'armour', 'Archivist Robes', ['Archive Hood', 'Ink Mantle', 'Archivist Robe', 'Sleeve Guards', 'Ink-Black Gloves', 'Sash of Indexes', 'Long Skirts', 'Quiet Slippers'], ['int', 'manaMax', 'cooldownPct'],
    rl('mageFocus', 15), 'Spells and skills +15%.'),
  classSet('rogue', 'accessories', 'Pickpocket Trinkets', ['Lifted Locket', 'Shadow Cloak', 'Ring of Quick Fingers', 'Ring of Loose Purses', 'Weighted Die', 'Stolen Bell'], ['agi', 'goldPct', 'critChance'],
    rl('comboDeep', 0, { b: 1.2 }), 'Each combo point adds 1.2% to all your damage (adds to Needle and Thread).'),
  classSet('rogue', 'armour', 'Nightstep Leathers', ['Nightstep Hood', 'Soft Pauldrons', 'Nightstep Jerkin', 'Knife Bracers', 'Silk Gloves', 'Belt of Pockets', 'Quiet Trousers', 'Nightstep Boots'], ['agi', 'critDmg', 'bossPct'],
    rl('spotFast', 0.3), 'Weak spots open 0.3 s sooner.'),
  classSet('ranger', 'accessories', 'Houndmaster Charms', ['Whistle Torc', 'Hound-Hide Cloak', 'Ring of the Pack', 'Ring of the Leash', 'Bone Whistle', 'Tooth Charm'], ['agi', 'petPct', 'allyPct'],
    rl('volleyAuto', 0, { b: 15 }), 'Your arrows mark the foe: marked foes take 15% more from everything (adds to the Fletcher\'s Pair).'),
  classSet('ranger', 'armour', 'Long-Road Leathers', ['Wide Hat', 'Road Mantle', 'Long-Road Coat', 'Archer Bracers', 'Fletching Gloves', 'Quiver Belt', 'Road Breeches', 'Long-Road Boots'], ['agi', 'goldPct', 'offlinePct'],
    rl('rangerGold', 20), 'Gold +20% (a Ranger lives off the road).'),
  classSet('cleric', 'accessories', 'Rosary of Vigils', ['Vigil Torc', 'Pilgrim Shawl', 'Ring of Matins', 'Ring of Compline', 'Prayer Bead', 'Holy Water Vial'], ['spi', 'allyPct', 'manaRegen'],
    rl('prayerDeep', 45), 'Prayer goes 45 higher (adds to the Vespers Pair).'),
  classSet('cleric', 'armour', 'Night Watch Vestments', ['Watch Cowl', 'Stole of Hours', 'Night Vestment', 'Cuffs of Waking', 'Lantern Gloves', 'Cord of Hours', 'Kneeling Robes', 'Watch Sandals'], ['spi', 'offlinePct', 'goldPct'],
    rl('vigilFast', 2), 'A full Vigil climb takes 6 hours, not 8.'),
  classSet('cleric', 'weapons', 'Vespers Pair', ['Vespers Mace', 'Lamp of Vespers'], ['weapon', 'allyPct', 'spi'],
    rl('prayerDeep', 80), 'Prayer goes 80 higher: up to +280% for your Named.'),
  // Ashen Hells
  set('ash', 'weapons', "Penitent's Brands", ['Brand of the Last Pyre', 'Cinder Ward'], ['weapon', 'firePct', 'tapPct'],
    rl('critSplash', 50, { b: 2, el: 'fire' }), 'Every crit explodes: the next 2 foes take 50% of it as fire.'),
  set('ash', 'accessories', 'Brimstone Regalia', ['Brimstone Torc', 'Smoke Mantle', 'Ring of Embers', 'Ring of Ash', 'Coal Idol', 'Pyre Token'],
    ['firePct', 'critChance', 'emberPct'],
    rl('emberDrip', 0.5), 'Each boss kill pays 0.5% of the Embers you would get by falling now.'),
  set('ash', 'armour', "Cinder Penitent's Harness",
    ['Hood of Cinders', 'Scorched Spaulders', "Penitent's Hauberk", 'Chain Cuffs', 'Coal Grips', 'Rope of Ash', 'Charred Greaves', 'Firewalk Treads'],
    ['tapPct', 'bossPct', 'timerSec'],
    rl('bossRevive', 10), 'Once per boss, when the clock runs out, you get 10 s more.'),
  // Hollow Sea
  set('sea', 'weapons', 'Undertow Pair', ['Undertow', 'Tidewrack'], ['weapon', 'lightPct', 'allyPct'],
    rl('tapCleave', 30), 'Every tap also hits the next foe for 30%.'),
  set('sea', 'accessories', "Chorister's Hymnal", ['Pearl Choker', 'Kelp Shroud', 'Ring of the Ferry', 'Barnacle Band', 'Lantern-Eel Lure', 'Bottled Voice'],
    ['allyPct', 'manaRegen', 'fairyRate'],
    rl('bossRamp', 1, { b: 60 }), 'Bosses take +1% damage for every second they live (max +60%).'),
  set('sea', 'armour', 'Deepwater Raiment',
    ['Drowned Cowl', 'Coral Mantle', 'Waterlogged Coat', 'Brine Wraps', 'Webbed Gloves', 'Anchor Belt', 'Sodden Breeches', 'Leaden Boots'],
    ['goldPct', 'offlinePct', 'poisonPct'],
    rl('namedAsTap', 10), 'Each Named hit has a 10% chance to count as a tap.'),
  // Winter Sepulchre
  set('winter', 'weapons', 'Rime-Bound Pair', ['Reliquary Edge', 'Frost Ward'], ['weapon', 'coldPct', 'critChance'],
    rl('shatter', 15), 'A foe killed by a crit leaves ice: the next foe arrives with 15% health gone.'),
  set('winter', 'accessories', 'Reliquary Keepsakes',
    ['Frost Locket', 'Sepulchre Shroud', 'Ring of Still Water', 'Band of the Keeper', 'Frozen Tear', "Saint's Knucklebone"],
    ['skillPct', 'manaMax', 'offlinePct'],
    // changed: Clarence capped it at 25% of the gap; "counts kills for quests" dropped (offlinePush has no such part).
    rl('offlinePush', 2, { b: 25 }), 'The first 2 h offline also push stages, up to 25% of the gap to your best.'),
  set('winter', 'armour', "Sepulchre Keeper's Plate",
    ['Frost Helm', 'Rime Pauldrons', 'Reliquary Breastplate', 'Ice Vambraces', "Keeper's Gauntlets", 'Tomb Girdle', 'Frozen Greaves', 'Glacier Sabatons'],
    ['timerSec', 'bossPct', 'sta'],
    rl('clockPauseSkill', 1), 'The boss clock runs at half speed while any skill or spell is active.'),
  // Bleeding Court
  set('court', 'weapons', "Magistrate's Verdict", ['Verdict', 'Writ of Seizure'], ['weapon', 'physPct', 'critDmg'],
    rl('bleed', 2), 'Each tap on a boss leaves a bleed of 2% of that tap per second until it dies.'),
  set('court', 'accessories', 'Seals of the Red Clerk', ['Red Seal Chain', "Clerk's Cape", "Debtor's Ring", 'Signet of Blood', 'Tally Bone', 'Blood Ledger'],
    ['goldPct', 'treasureRate', 'poisonPct'],
    rl('bloodMoney', 10), '10% of all gold earned buys Named levels for you, cheapest first.'),
  set('court', 'armour', 'Robes of Judgement',
    ['Hood of Judgement', 'Red Mantle', 'Robe of the Court', 'Shackle Cuffs', 'Bloodied Gloves', 'Sash of Sentence', 'Penitent Legwraps', 'Court Slippers'],
    ['bossPct', 'tapPct', 'critChance'],
    // changed: Clarence's ruling: bosses are never killed outright, they take +50% below 10% instead.
    rl('execute', 10, { b: 50 }), 'Normal foes under 10% health die at once. Bosses under 10% take +50% damage.'),
  // Astral Wastes
  set('astral', 'weapons', 'Starfall Pair', ['Starfall', 'Shard of the Unmoored'], ['weapon', 'magicPct', 'pierceAll'],
    rl('weakestElement', 1), 'Your taps take the element the foe is weakest to.'),
  set('astral', 'accessories', 'Unmoored Orrery', ['Orrery Pendant', 'Void Cloak', 'Ring of Far Light', 'Band of the Pilgrim', 'Star Compass', 'Hollow Moon'],
    ['skillPct', 'manaRegen', 'xpPct'],
    // changed: Clarence's ruling: cooldowns halved instead of "no cooldown, double mana".
    rl('cooldownCut', 50), 'Spell and skill cooldowns are 50% shorter.'),
  set('astral', 'armour', "Pilgrim's Starcloth",
    ['Star-scoured Hood', 'Comet Mantle', 'Starcloth Robe', 'Drift Bracers', 'Pilgrim Gloves', 'Orbit Belt', 'Starcloth Leggings', 'Weightless Boots'],
    ['xpPct', 'emberPct', 'fairyRate'],
    rl('drift', 15), 'Each cleared normal stage has a 15% chance to carry you one stage further.'),
];

// ---------------------------------------------------------------- 2. relics (100)

type RelicRow = [name: string, effect: Effect, max: number, cost: number, growth: number, text: string];

function relicGroup(group: string, start: number, rows: RelicRow[]): RelicDef[] {
  return rows.map(([name, effect, max, cost, growth, text], i) => ({
    id: `r${start + i}`, num: start + i, name, group, effect, ...(max ? { max } : {}), cost, growth, text,
  }));
}

// The 9 rites keep their data.ts ids ('grip' ...) so old saves map over.
const RITE_IDS = ['grip', 'names', 'coin', 'night', 'mind', 'luck', 'wick', 'hoard', 'edge'];
const rites = relicGroup('Rites', 1, [
  ['Ashen Grip', st('tapPct', 20, { compound: true }), 0, 1, 1.25, 'Tap damage x1.2 per level.'],
  ['Remembered Names', st('allyPct', 20, { compound: true }), 0, 1, 1.25, 'Named damage x1.2 per level.'],
  ["Ferryman's Coin", st('goldPct', 15), 0, 2, 1.25, '+15% gold per level.'],
  ['The Long Night', st('timerSec', 1), 20, 3, 1.6, '+1 s boss time per level.'],
  ['Kindled Mind', st('skillPct', 15), 0, 2, 1.25, '+15% skill power per level.'],
  ['Grave Luck', st('lootLuck', 5), 30, 4, 1.45, '+5% better loot per level.'],
  ['Lantern Wick', st('offlinePct', 10), 25, 3, 1.4, '+10% offline gold per level.'],
  ['Ember Hoard', st('emberPct', 8), 0, 5, 1.5, '+8% Embers per level.'],
  ['Grave Edge', st('critDmg', 20), 0, 2, 1.3, '+20% crit damage per level.'],
]).map((r, i) => ({ ...r, id: RITE_IDS[i] }));

export const RELICS: RelicDef[] = [
  ...rites,
  ...relicGroup('Ashen Hells', 10, [
    ['Cinder Heart', st('firePct', 12), 0, 2, 1.3, '+12% fire damage.'],
    ["Ash Warden's Horn", st('pierceFire', 1), 20, 5, 1.4, '+1% fire piercing.'],
    ['Hellforged Whetstone', st('weapon', 4), 0, 2, 1.3, '+4 weapon damage.'],
    // changed (7 Nov): overkill is tiny outside the Berserker tree
    ['Pyre Salt', st('overkillPct', 0.5), 20, 3, 1.4, '+0.5% overkill carried.'],
    ['Brimstone Lens', st('critChance', 0.5), 20, 4, 1.4, '+0.5% crit chance.'],
    ['Scorched Ledger', st('bossGoldPct', 12), 0, 2, 1.3, '+12% gold from bosses.'],
    ['Smouldering Nail', st('bossPct', 10), 0, 2, 1.3, '+10% damage to bosses.'],
    ['Hellmouth Bell', st('normalPct', 12), 0, 1, 1.3, '+12% damage to normal foes.'],
    ['Firewalk Sandals', st('dungeonSec', 2), 15, 4, 1.4, '+2 s dungeon clock.'],
    // changed: "+10% Embers from Ashen Hells escapes" -> +4% Embers from every return.
    ['Kiln of Ages', st('emberPct', 4), 20, 3, 1.4, '+4% Embers.'],
    // changed: "+15% tap damage while a skill is active" -> +10% tap damage, always.
    ["Penitent's Chain", st('tapPct', 10), 0, 2, 1.3, '+10% tap damage.'],
    ['Coal Tongue', rl('nthTap', 50, { b: 20, perB: 2, el: 'fire' }), 25, 6, 1.5, 'Every 50th tap is a fire blast for 20x tap damage (+2x per level).'],
    // changed: capped by Clarence: 1% per level, max level 20, so never past 20% of best.
    ['Embered Bones', rl('lifeStart', 1, { perA: 1 }), 20, 8, 1.5, 'A new life starts at 1% of your best stage per level (max 20%).'],
    ['Cinder Pact', rl('skillExtendOnKill', 0.05, { b: 5 }), 10, 5, 1.5, 'Each kill during a buff adds 0.05 s to it (max +5 s a cast).'],
    ["Demon's Tithe", st('treasureGoldPct', 10), 0, 2, 1.3, '+10% treasure-foe gold.'],
  ]),
  ...relicGroup('Hollow Sea', 25, [
    ['Stormglass', st('lightPct', 12), 0, 2, 1.3, '+12% lightning damage.'],
    ['Brine Vial', st('poisonPct', 12), 0, 2, 1.3, '+12% poison damage.'],
    ['Lantern Eel Scale', st('pierceLight', 1), 20, 5, 1.4, '+1% lightning piercing.'],
    ["Chorister's Shell", st('allyPct', 15), 0, 1, 1.3, '+15% Named damage.'],
    ['Undertow Weight', st('overkillPct', 0.5), 20, 3, 1.4, '+0.5% overkill carried.'],
    ['Ferry Lantern', st('fairyRate', 6), 20, 3, 1.4, '+6% fairy rate.'],
    ['Sunken Purse', st('offlinePct', 15), 25, 3, 1.4, '+15% offline gold.'],
    ['Barnacle Crown', st('manaRegen', 0.1), 25, 3, 1.4, '+0.1 mana per second.'],
    ['Deepwell Flask', st('manaMax', 5), 30, 3, 1.4, '+5 max mana.'],
    ['Wreck Salvage', st('lootLuck', 4), 25, 4, 1.4, '+4% better loot.'],
    ['Silt Map', st('treasureRate', 4), 20, 4, 1.4, '+4% treasure-foe rate.'],
    ["Captain's Log", st('xpPct', 6), 0, 2, 1.3, '+6% XP.'],
    ["Tidecaller's Hook", rl('fairyStrike', 30, { perA: 10 }), 20, 5, 1.5, 'Each fairy also hits the foe for 30 s of Named damage (+10 s per level).'],
    ['Drowned Bell', rl('namedDouble', 2, { perA: 2 }), 20, 5, 1.5, 'Named hits: 2% chance per level to hit twice.'],
    ['Voice in the Water', rl('freeSpellTaps', 300, { perA: -10 }), 20, 6, 1.5, 'Every 300 taps casts a random spell free (10 fewer taps per level).'],
  ]),
  ...relicGroup('Winter Sepulchre', 40, [
    ['Frost Reliquary Shard', st('coldPct', 12), 0, 2, 1.3, '+12% cold damage.'],
    ['Sepulchre Key', st('pierceCold', 1), 20, 5, 1.4, '+1% cold piercing.'],
    ['Rime Hourglass', st('timerSec', 0.5), 20, 4, 1.4, '+0.5 s boss time.'],
    ['Pale Candle', st('skillPct', 10), 0, 2, 1.3, '+10% skill power.'],
    ['Ice-Locked Name', st('bossPct', 10), 0, 2, 1.3, '+10% damage to bosses.'],
    ['Glacier Plate', st('dungeonSec', 3), 15, 4, 1.4, '+3 s dungeon clock.'],
    ['Cold Iron Ring', st('critDmg', 15), 0, 2, 1.3, '+15% crit damage.'],
    // changed: "+15 min offline limit" -> +5% offline gold.
    ['Hoarfrost Seal', st('offlinePct', 5), 24, 5, 1.4, '+5% offline gold.'],
    // changed: "+5% Marks from tasks" -> +3% Marks from everything.
    ["Keeper's Ledger", st('markPct', 3), 20, 5, 1.4, '+3% Marks.'],
    // changed: "+10% damage once a boss has lived 10 s" -> +6% damage to bosses.
    ["Winter's Patience", st('bossPct', 6), 0, 2, 1.3, '+6% damage to bosses.'],
    // changed: "+10% gold from milestone chests" -> +5% gold.
    ['Snow Lantern', st('goldPct', 5), 0, 2, 1.3, '+5% gold.'],
    ['Frozen Tear', rl('durationPlus', 0.5, { perA: 0.5 }), 20, 4, 1.5, '+0.5 s to every buff per level.'],
    ['Still Heart', rl('clockSlow', 1, { perA: 1 }), 25, 6, 1.5, 'The boss clock runs 1% slower per level.'],
    ['Winter Hoard', rl('goldInterest', 0.02, { perA: 0.02 }), 20, 6, 1.5, 'Unspent gold grows 0.02% a minute per level.'],
    ['Grave Frost', rl('critFreeze', 0.2, { perA: 0.2, b: 2 }), 25, 5, 1.5, 'Crits: 0.2% chance per level to stop the boss clock for 2 s.'],
  ]),
  ...relicGroup('Bleeding Court', 55, [
    ['Red Seal', st('physPct', 12), 0, 2, 1.3, '+12% physical damage.'],
    ["Bloodletter's Fang", st('piercePhys', 1), 20, 5, 1.4, '+1% physical piercing.'],
    ["Magistrate's Gavel", st('bossPct', 12), 0, 2, 1.3, '+12% damage to bosses.'],
    ["Sinner's Coin", st('goldPct', 12), 0, 1, 1.3, '+12% gold.'],
    ['Crimson Writ', st('critChance', 0.5), 20, 4, 1.4, '+0.5% crit chance.'],
    ['Court Ledger', st('emberPct', 5), 25, 4, 1.4, '+5% Embers.'],
    // changed: "+10% gold from chests and treasure foes" -> +10% treasure-foe gold.
    ['Tithe Box', st('treasureGoldPct', 10), 0, 2, 1.3, '+10% treasure-foe gold.'],
    // changed: "+20% damage from bleeds and burns" -> +10% physical and +10% fire damage.
    ['Clotted Chalice', st('physPct', 10, { stat2: 'firePct', per2: 10 }), 0, 3, 1.3, '+10% physical and fire damage.'],
    // changed: "Named level-ups cost 1% less gold" -> +4% Named damage.
    ["Clerk's Abacus", st('allyPct', 4), 30, 4, 1.4, '+4% Named damage.'],
    // changed: "+15% damage when you hit a weakness" -> +10% tap damage.
    ['Red Thread', st('tapPct', 10), 0, 3, 1.3, '+10% tap damage.'],
    // changed: "+20% crit damage on bosses" -> +10% crit damage.
    ['Sentence Scroll', st('critDmg', 10), 0, 2, 1.3, '+10% crit damage.'],
    ["Debtor's Ring", rl('respecDiscount', 5, { perA: 5 }), 10, 3, 1.5, 'Respec costs 5% fewer Embers per level.'],
    // Normal foes only (b = 0: no boss part).
    ['Verdict Bell', rl('execute', 3, { perA: 0.2, b: 0 }), 15, 6, 1.5, 'Normal foes under 3% health die at once (+0.2% per level).'],
    ['Blood Oath', rl('tapPerMilestone', 0.5, { perA: 0.5 }), 0, 4, 1.5, '+0.5% tap damage per level for each Named milestone this life.'],
    ['Price of Mercy', rl('bossWeaken', 2, { perA: 0.5, b: 30 }), 15, 6, 1.5, 'A boss that beats you comes back 2% weaker (max 30%).'],
  ]),
  ...relicGroup('Astral Wastes', 70, [
    ['Fallen Star', st('magicPct', 12), 0, 2, 1.3, '+12% magic damage.'],
    ['Unmoored Compass', st('pierceMagic', 1), 20, 5, 1.4, '+1% magic piercing.'],
    ['Star Chart', st('skillPct', 8), 0, 2, 1.3, '+8% skill power.'],
    ['Comet Dust', st('manaRegen', 0.15), 25, 3, 1.4, '+0.15 mana per second.'],
    ['Orrery Gear', st('xpPct', 6), 0, 2, 1.3, '+6% XP.'],
    ["Pilgrim's Staff", st('pierceAll', 0.5), 10, 8, 1.4, '+0.5% piercing, all elements.'],
    ['Void Pearl', st('manaMax', 10), 20, 3, 1.4, '+10 max mana.'],
    ['Weightless Feather', st('wanderRate', 4), 20, 5, 1.4, '+4% wandering-boss rate.'],
    // changed: "+10% damage per element among Named at 100+" -> +8% Named damage.
    ['Night Sky Lens', st('allyPct', 8), 0, 4, 1.3, '+8% Named damage.'],
    ['Far Light', st('lootLuck', 5), 20, 4, 1.4, '+5% better loot.'],
    // changed: "+5% chance of a 2nd set piece from dungeon bosses" -> +3% better loot.
    ['Star-scoured Sole', st('lootLuck', 3), 10, 8, 1.4, '+3% better loot.'],
    ["The Unmoored's Eye", rl('cooldownCut', 2, { perA: 2 }), 25, 5, 1.5, 'Spell and skill cooldowns 2% shorter per level.'],
    ['Falling Sky', rl('fallingStar', 60, { b: 10, perB: 1 }), 25, 5, 1.5, 'Every 60 s a star hits for 10 s of your damage (+1 s per level).'],
    ['Twin Stars', rl('spellTwice', 1, { perA: 1 }), 20, 6, 1.5, '1% chance per level a spell casts twice.'],
    ['Empty Orbit', rl('plusOneDrop', 1, { perA: 1 }), 20, 6, 1.5, '1% chance per level a set piece drops at +1.'],
  ]),
  ...relicGroup('Lanternfall', 85, [
    // changed: "+10% gold from normal foes" -> +8% gold.
    ["Gravedigger's Spade", st('goldPct', 8), 0, 1, 1.3, '+8% gold.'],
    // changed: "+8% fairy gold" -> +3% fairy rate.
    ["Lampwright's Oil", st('fairyRate', 3), 0, 2, 1.3, '+3% fairy rate.'],
    ['Bell Rope', st('autoTap', 0.5), 20, 4, 1.4, '+0.5 free taps per second.'],
    ['Funeral Candle', st('petPct', 5), 0, 2, 1.3, '+5% pet power.'],
    // changed: "+2% pet tap-proc chance" -> +3% pet power.
    ['Crow Feather', st('petPct', 3), 10, 5, 1.4, '+3% pet power.'],
    // changed: "Named milestone bonuses 5% stronger" -> +5% Named damage.
    ['Name Stone', st('allyPct', 5), 20, 5, 1.4, '+5% Named damage.'],
    // changed: "+5% Marks from quests and achievements" -> +3% Marks from everything.
    ['Quest Ledger', st('markPct', 3), 20, 4, 1.4, '+3% Marks.'],
    // changed: "+10% Embers from special escapes" -> +3% Embers.
    ['Lantern of Return', st('emberPct', 3), 20, 4, 1.4, '+3% Embers.'],
    // changed: "+15% damage to the Hollow Bishop" -> +8% damage to all bosses.
    ["Bishop's Broken Ring", st('bossPct', 8), 0, 3, 1.3, '+8% damage to bosses.'],
    // changed: "+3% chance of a key from a milestone chest" -> +3% better loot.
    ['Grave Marker', st('lootLuck', 3), 10, 6, 1.4, '+3% better loot.'],
    // changed: "+2 s wandering-boss timer" -> +3% wandering-boss rate.
    ["Wenna's Oar", st('wanderRate', 3), 10, 4, 1.4, '+3% wandering-boss rate.'],
    // changed: "Faith bonus 5% stronger" -> +3% tap and +3% Named damage.
    ['Shrine Incense', st('tapPct', 3, { stat2: 'allyPct', per2: 3 }), 20, 5, 1.4, '+3% tap and Named damage.'],
    // changed: "Each scar's penalty 2% weaker" -> +3% tap and +3% Named damage.
    ["Healer's Salve", st('tapPct', 3, { stat2: 'allyPct', per2: 3 }), 25, 6, 1.4, '+3% tap and Named damage.'],
    ['Hearth Ember', rl('keepGold', 1, { perA: 1 }), 20, 6, 1.5, 'Keep 1% of your gold per level when you return from death.'],
    ["Halfmark's Luck", rl('treasureSplit', 1, { perA: 1 }), 20, 5, 1.5, '1% chance per level a killed treasure foe splits in two.'],
    ['The Last Lantern', rl('namedInEscape', 5, { perA: 5 }), 10, 10, 1.5, 'The Named fight beside you in escapes at 5% of their damage per level.'],
  ]),
];

// ---------------------------------------------------------------- 3. race, transformation and Mastery trees

type NodeRow = [name: string, max: number, effect: Effect, text: string];
const TIERS = [0, 0, 1, 1, 2, 2];

function treeOf(id: string, name: string, kind: 'race' | 'form', rows: NodeRow[]): TreeDef {
  const nodes: TreeNode[] = rows.map(([n, max, effect, text], i) => ({ id: `${id}-${i}`, name: n, tier: TIERS[i], max, effect, text }));
  return { id, name, kind, nodes };
}

export const RACE_TREES: TreeDef[] = [
  treeOf('human', 'Human', 'race', [
    // changed: "+2% all damage" -> +2% tap and +2% Named damage.
// run 7 (Clarence: "Brute Strength and Bloodcry are the same thing, just different values"): one damage node per race tree, holding the
    // whole tree's old all-damage worth; every other node does its own job.
    ['Adaptable', 25, st('dmgPct', 4.4), '+4.4% damage from every source.'],
    ['Quick Study', 10, st('xpPct', 3), '+3% XP.'],
    ['Trade Sense', 20, st('goldPct', 4), '+4% gold.'],
    ['Shrine-Keeper', 20, st('markPct', 4), '+4% Marks.'],
    ['Ambition', 10, rl('drift', 1, { perA: 1 }), '1% chance per rank that a cleared stage carries you one stage further.'],
    // changed: "at 5 s left, +1 s once per boss" -> when the clock runs out, +1 s per rank once per boss.
    ['Second Wind', 5, rl('bossRevive', 1, { perA: 1 }), 'Once per boss, when the clock runs out: +1 s per rank.'],
  ]),
  treeOf('elf', 'Elf', 'race', [
// run 7 (Clarence: "Brute Strength and Bloodcry are the same thing, just different values"): one damage node per race tree, holding the
    // whole tree's old all-damage worth; every other node does its own job.
    ['Keen Eye', 20, st('treasureRate', 3), 'Treasure foes come 3% more often.'],
    ['Old Songs', 20, st('dmgPct', 3), '+3% damage from every source.'],
    ['Starlit Mind', 10, st('fairyRate', 5), 'Fairies come 5% more often.'],
    ['Arcane Finesse', 10, st('pierceMagic', 1), '+1% magic piercing.'],
    ['Long Memory', 10, st('emberPct', 2), '+2% Embers.'],
    // changed: "every 30th crit: taps x2 for 2 s (+1 s per rank)" -> every 30 s: taps x2 for 3 s, stronger per rank.
    ['Moonstep', 5, rl('autoCast', 30, { active: 'tapBuff', b: 2, perB: 0.2, dur: 3 }), 'Every 30 s: taps x2 for 3 s. Stronger per rank.'],
  ]),
  treeOf('dwarf', 'Dwarf', 'race', [
    ['Stone Patience', 10, st('timerSec', 0.3), '+0.3 s boss time.'],
    ['Forge-Wise', 25, st('weapon', 2), '+2 weapon damage.'],
    ['Deep Pockets', 20, st('goldPct', 5), '+5% gold.'],
    ['Delver', 15, st('lootLuck', 2), '+2% better loot.'],
    ['Mountain Hold', 20, st('bossPct', 3), '+3% damage to bosses.'],
    // changed: "after a failed boss, next try +10%" -> a boss that beats you comes back 2% weaker per rank (max 10%).
    ['Rune of Return', 5, rl('bossWeaken', 2, { perA: 2, b: 10 }), 'A boss that beats you comes back 2% weaker per rank (max 10%).'],
  ]),
  treeOf('orc', 'Orc', 'race', [
// run 7 (Clarence: "Brute Strength and Bloodcry are the same thing, just different values"): one damage node per race tree, holding the
    // whole tree's old all-damage worth; every other node does its own job.
    ['Brute Strength', 25, st('dmgPct', 3), '+3% damage from every source.'],
    ['Bloodcry', 20, rl('execute', 1, { perA: 1 }), 'Normal foes under 1% health per rank (max 20%) die at once.'],
    ['Thick Hide', 10, st('timerSec', 0.2), '+0.2 s boss time.'],
    ['Overrun', 10, st('overkillPct', 0.5), '+0.5% overkill carried.'],
    ['Trophy Taker', 15, st('bossGoldPct', 4), '+4% gold from bosses.'],
    // changed: "every 100 taps: taps +50% for 5 s (+1 s per rank)" -> every 45 s: taps x1.5 for 5 s, stronger per rank.
    ['War Drums', 5, rl('autoCast', 45, { active: 'tapBuff', b: 1, perB: 0.2, dur: 5 }), 'Every 45 s: taps x1.5 for 5 s. Stronger per rank.'],
  ]),
  treeOf('troll', 'Troll', 'race', [
// run 7 (Clarence: "Brute Strength and Bloodcry are the same thing, just different values"): one damage node per race tree, holding the
    // whole tree's old all-damage worth; every other node does its own job.
    ['Spirit Talk', 25, st('dmgPct', 2.2), '+2.2% damage from every source.'],
    ['Hex Bones', 20, st('poisonPct', 4), '+4% poison damage.'],
    ['Old Blood', 10, st('dungeonSec', 0.5), '+0.5 s in dungeons.'],
    // changed: "each scar's penalty 3% weaker" -> +0.2 s boss time.
    ['Thick Skin', 10, st('timerSec', 0.2), '+0.2 s boss time.'],
    // changed: "a failed boss keeps 3% of the health it lost" -> it comes back 3% weaker per rank (max 15%).
    ['Regrowth', 5, rl('bossWeaken', 3, { perA: 3, b: 15 }), 'A boss that beats you comes back 3% weaker per rank (max 15%).'],
    // changed: "5 s of Named damage" -> 5 s of your total damage (fallingStar).
    ['Ancestor Call', 10, rl('fallingStar', 45, { b: 5, perB: 2 }), 'Every 45 s a spirit strikes for 5 s of your damage (+2 s per rank).'],
  ]),
];

// run 5: the race and transformation trees are converted to class-neutral effects at the end of this file (neutral.ts)
export const FORM_TREES: TreeDef[] = [
  treeOf('mastery', 'Mastery', 'form', [
    ['Discipline', 20, st('tapPct', 3), '+3% tap damage.'],
    ['Steady Hands', 10, st('critChance', 0.3), '+0.3% crit chance.'],
    ['Conviction', 20, st('allyPct', 3), '+3% Named damage.'],
    ['Thrift', 20, st('goldPct', 3), '+3% gold.'],
    ['Clear Mind', 20, st('skillPct', 3), '+3% skill power.'],
    // changed: "at 3 s left the clock stops 1 s" -> when the clock runs out, +1 s per rank once per boss.
    ['One Breath', 5, rl('bossRevive', 1, { perA: 1 }), 'Once per boss, when the clock runs out: +1 s per rank.'],
  ]),
  treeOf('vampire', 'Vampire', 'form', [
    ['Blood Hunger', 10, st('critDmg', 10), '+10% crit damage.'],
    ['Elder Blood', 10, st('critChance', 1), '+1% crit chance.'],
    // changed: "crits restore 0.5 mana" -> +0.1 mana per second.
    ['Sanguine Thirst', 5, st('manaRegen', 0.1), '+0.1 mana per second.'],
    // changed: "first crit on a boss stops its clock 0.5 s" -> crits: 2% chance per rank to stop the clock 1 s.
    ['Mesmer Gaze', 5, rl('critFreeze', 2, { perA: 2, b: 1 }), 'Crits: 2% chance per rank to stop the boss clock for 1 s.'],
    // changed: "every 20th crit: bat swarm hits 3 foes for 100%" -> 20% of each crit (+5% per rank) also hits the next 2 foes.
    ['Night Wings', 5, rl('critSplash', 20, { perA: 5, b: 2, el: 'phys' }), '20% of each crit (+5% per rank) also hits the next 2 foes.'],
    ['The Long Thirst', 5, st('timerSec', 0.3), 'Control: +0.3 s boss time (softens the weakness).'],
  ]),
  treeOf('werewolf', 'Werewolf', 'form', [
    ['Rending Claws', 20, st('tapPct', 6), '+6% tap damage.'],
    ['Moon-Hunt', 15, st('bossPct', 5), '+5% damage to bosses.'],
    ['Scent of Gold', 10, st('treasureRate', 3), '+3% treasure-foe rate.'],
    // changed: "fast taps stack tap damage" -> +4% tap damage.
    ['Frenzy', 5, st('tapPct', 4), '+4% tap damage.'],
    // changed: "+2 s per rank" -> stronger per rank (autoCast has fixed duration).
    ['Pack Howl', 5, rl('autoCast', 60, { active: 'allyBuff', b: 1, perB: 0.2, dur: 10 }), 'Every 60 s: Named x1.6 for 10 s. Stronger per rank.'],
    ['Leash the Beast', 5, st('weapon', 1), 'Control: +1 weapon damage (softens the weakness).'],
  ]),
  treeOf('draconic', 'Draconic', 'form', [
    ['Ancient Wrath', 20, st('bossPct', 4), '+4% damage to bosses.'],
    ['Dragonfire', 20, st('firePct', 6), '+6% fire damage.'],
    ['Heat Shimmer', 10, st('pierceFire', 1), '+1% fire piercing.'],
    ['Scaled Hide', 10, st('timerSec', 0.3), '+0.3 s boss time.'],
    // changed: "at each boss start" -> every 30 s.
    ['Wing Buffet', 10, rl('fallingStar', 30, { b: 3, perB: 1 }), 'Every 30 s, hit for 3 s of your damage (+1 s per rank).'],
    ['Hoard Sense', 5, st('goldPct', 2), 'Control: +2% gold (softens the weakness).'],
  ]),
  treeOf('undead', 'Undead', 'form', [
    ['Grave Pact', 20, st('allyPct', 5), '+5% Named damage.'],
    ['Rot Touch', 20, st('poisonPct', 5), '+5% poison damage.'],
    // changed: "+2% Named damage per Named at level 100+" -> +4% Named damage.
    ['Mass Grave', 5, st('allyPct', 4), '+4% Named damage.'],
    // changed: "Named keep hitting 1 s after the clock ends" -> +1 s per rank once per boss when the clock runs out.
    ['Deathless', 5, rl('bossRevive', 1, { perA: 1 }), 'Once per boss, when the clock runs out: +1 s per rank.'],
    // changed: "a skeleton fights for 2% of Named damage per second" -> +2% Named damage.
    ['Skeleton Host', 10, st('allyPct', 2), '+2% Named damage.'],
    ['Cold Blood', 3, st('manaRegen', 0.05), 'Control: +0.05 mana per second (softens the weakness).'],
  ]),
  treeOf('elemental', 'Elemental', 'form', [
    // changed: "pick 1 element, +8% of it" -> +8% magic damage (no pick).
    ['Attunement', 10, st('magicPct', 8), '+8% magic damage.'],
    ['Storm Body', 20, st('skillPct', 5), '+5% skill power.'],
    // changed: "spells refund 2% mana" -> +0.05 mana per second.
    ['Overflow', 10, st('manaRegen', 0.05), '+0.05 mana per second.'],
    // changed: "each rank adds an element" -> +4% fire and +4% lightning damage.
    ['Avatar', 5, st('firePct', 4, { stat2: 'lightPct', per2: 4 }), '+4% fire and lightning damage.'],
    // changed: "each spell fires 10 taps" -> every 30 s, a free burst, stronger per rank.
    ['Elemental Surge', 10, rl('autoCast', 30, { active: 'burst', b: 1, perB: 1, dur: 0 }), 'Every 30 s, a free burst of strikes. Stronger per rank.'],
    ['Steady Core', 5, st('critChance', 0.4), 'Control: +0.4% crit chance (softens the weakness).'],
  ]),
];

// ---------------------------------------------------------------- 4. shared spells (class points)

export const SPELLS: SpellDef[] = [
  { id: 'lantern-strike', name: 'Lantern Strike', icon: 'lantern-burst', active: 'burst', base: 5, per: 1.33, duration: 0, mana: 30, cooldown: 20, max: 25, unlock: 1, text: 'One hit worth 40 taps (+8 per level).' },
  { id: 'ferrymans-toll', name: "Ferryman's Toll", icon: 'coin-skull', active: 'goldBuff', base: 1, per: 0.2, duration: 20, mana: 35, cooldown: 60, max: 25, unlock: 3, text: 'x2 gold from kills for 20 s.' },
  // changed: the crit-damage part dropped (critBuff is crit chance only); +20% at level 1, +1% per level.
  { id: 'grave-sight', name: 'Grave Sight', icon: 'eye-gravestone', active: 'critBuff', base: 1, per: 0.2, duration: 15, mana: 30, cooldown: 45, max: 25, unlock: 6, text: '+20% crit chance for 15 s.' },
  { id: 'call-the-named', name: 'Call the Named', icon: 'hand-ghosts', active: 'allyBuff', base: 1.67, per: 0.25, duration: 20, mana: 40, cooldown: 60, max: 25, unlock: 10, text: 'Named x2 damage for 20 s.' },
  { id: 'bell-frenzy', name: 'Bell Frenzy', icon: 'ringing-bell', active: 'tapBuff', base: 1, per: 0.2, duration: 20, mana: 25, cooldown: 45, max: 25, unlock: 15, text: 'Taps x1.5 for 20 s.' },
  // changed: "+1 s every 5 levels" dropped (duration is fixed).
  { id: 'echo-hands', name: 'Echo Hands', icon: 'ghost-hands', active: 'autoTap', base: 0.5, per: 0.25, duration: 20, mana: 35, cooldown: 50, max: 25, unlock: 20, text: '5 free taps a second for 20 s.' },
];

// ---------------------------------------------------------------- 5. pets (one per StatKey)

type PetRow = [id: string, name: string, body: PetDef['body'], element: Element, stat: StatKey, per: number, atk: number, text: string];
const petRows: PetRow[] = [
  // the 3 starters (quest 4)
  ['grave-crow', 'Grave Crow', 'crow', 'phys', 'goldPct', 1, 25, 'Pecks coin from the dead.'],
  ['lantern-wisp', 'Lantern Wisp', 'wisp', 'magic', 'skillPct', 1, 20, 'A small light that hums spells.'],
  ['bone-hound', 'Bone Hound', 'hound', 'poison', 'bossPct', 1, 30, 'Bites and does not let go.'],
  // attributes
  ['barrow-toad', 'Barrow Toad', 'toad', 'phys', 'str', 0.3, 15, 'Heavier than it looks.'],
  ['quickbone-rat', 'Quickbone Rat', 'rat', 'phys', 'agi', 0.3, 20, 'Never where you swing.'],
  ['crypt-owl', 'Crypt Owl', 'owl', 'cold', 'sta', 0.3, 15, 'Sits through anything.'],
  ['ink-moth', 'Ink Moth', 'moth', 'magic', 'int', 0.3, 15, 'Reads the epitaphs.'],
  ['candle-cat', 'Candle Cat', 'cat', 'fire', 'spi', 0.3, 15, 'Purrs at the dead.'],
  // core
  ['rust-spider', 'Rust Spider', 'spider', 'phys', 'weapon', 0.5, 20, 'Spins wire round your blade.'],
  ['knuckle-rat', 'Knuckle Rat', 'rat', 'phys', 'tapPct', 1, 25, 'Taps along with you.'],
  ['choir-bat', 'Choir Bat', 'bat', 'magic', 'allyPct', 1, 20, 'Sings the Named louder.'],
  ['needle-spider', 'Needle Spider', 'spider', 'poison', 'critChance', 0.05, 25, 'Finds the soft spot.'],
  ['gutter-cat', 'Gutter Cat', 'cat', 'phys', 'critDmg', 1.5, 25, 'Goes for the eyes.'],
  ['hourglass-toad', 'Hourglass Toad', 'toad', 'cold', 'timerSec', 0.03, 15, 'Croaks slowly. Time follows.'],
  ['dew-moth', 'Dew Moth', 'moth', 'cold', 'manaRegen', 0.01, 15, 'Drinks the night air.'],
  ['well-toad', 'Well Toad', 'toad', 'magic', 'manaMax', 0.5, 15, 'Full to the brim.'],
  ['grave-magpie', 'Grave Magpie', 'crow', 'phys', 'lootLuck', 0.3, 20, 'Picks the best of the pile.'],
  ['ember-moth', 'Ember Moth', 'moth', 'fire', 'emberPct', 0.3, 20, 'Flies toward every pyre.'],
  ['sleeper-cat', 'Sleeper Cat', 'cat', 'cold', 'offlinePct', 1, 15, 'Works while you rest.'],
  // elements
  ['ossuary-hound', 'Ossuary Hound', 'hound', 'phys', 'physPct', 1, 30, 'Chews old bones.'],
  ['hex-wisp', 'Hex Wisp', 'wisp', 'magic', 'magicPct', 1, 25, 'Glows the wrong colour.'],
  ['cinder-wisp', 'Cinder Wisp', 'wisp', 'fire', 'firePct', 1, 25, 'Never quite goes out.'],
  ['frost-owl', 'Frost Owl', 'owl', 'cold', 'coldPct', 1, 25, 'Its breath is frost.'],
  ['storm-crow', 'Storm Crow', 'crow', 'light', 'lightPct', 1, 25, 'Rides the thunder.'],
  ['bog-snake', 'Bog Snake', 'snake', 'poison', 'poisonPct', 1, 25, 'Bites green.'],
  // piercing
  ['chisel-rat', 'Chisel Rat', 'rat', 'phys', 'piercePhys', 0.1, 20, 'Gnaws through armour.'],
  ['null-moth', 'Null Moth', 'moth', 'magic', 'pierceMagic', 0.1, 20, 'Eats wards.'],
  ['ash-snake', 'Ash Snake', 'snake', 'fire', 'pierceFire', 0.1, 20, 'Swims through flame.'],
  ['thaw-toad', 'Thaw Toad', 'toad', 'fire', 'pierceCold', 0.1, 20, 'Melts any frost.'],
  ['lodestone-spider', 'Lodestone Spider', 'spider', 'light', 'pierceLight', 0.1, 20, 'Grounds the spark.'],
  ['bitter-cat', 'Bitter Cat', 'cat', 'poison', 'piercePoison', 0.1, 20, 'Spits out any poison.'],
  ['keyhole-bat', 'Keyhole Bat', 'bat', 'magic', 'pierceAll', 0.05, 20, 'Finds every way in.'],
  // systems
  ['avalanche-hound', 'Avalanche Hound', 'hound', 'cold', 'overkillPct', 0.25, 30, 'Keeps running after the kill.'],
  ['glimmer-wisp', 'Glimmer Wisp', 'wisp', 'light', 'fairyRate', 0.3, 15, 'Fairies follow it.'],
  ['coin-rat', 'Coin Rat', 'rat', 'poison', 'treasureRate', 0.3, 20, 'Smells hidden gold.'],
  ['wayward-owl', 'Wayward Owl', 'owl', 'magic', 'wanderRate', 0.2, 20, 'Calls the wanderers.'],
  ['tunnel-bat', 'Tunnel Bat', 'bat', 'phys', 'dungeonSec', 0.2, 20, 'Knows the way out.'],
  ['pack-hound', 'Pack Hound', 'hound', 'phys', 'petPct', 0.3, 30, 'Keeps the others in line.'],
  ['scholar-owl', 'Scholar Owl', 'owl', 'magic', 'xpPct', 0.5, 15, 'Remembers every fight.'],
  ['tally-crow', 'Tally Crow', 'crow', 'phys', 'markPct', 0.3, 20, 'Counts every Mark.'],
  ['drum-spider', 'Drum Spider', 'spider', 'light', 'autoTap', 0.05, 25, 'Taps with eight legs.'],
  ['scythe-snake', 'Scythe Snake', 'snake', 'phys', 'normalPct', 1, 25, 'Cuts the small ones down.'],
  ['hoard-snake', 'Hoard Snake', 'snake', 'fire', 'bossGoldPct', 1, 20, 'Sleeps on boss gold.'],
  ['pocket-bat', 'Pocket Bat', 'bat', 'poison', 'treasureGoldPct', 1, 20, 'Lines its wings with coin.'],
  ['lingering-wisp', 'Lingering Wisp', 'wisp', 'cold', 'durationSec', 0.05, 15, 'Makes good things last.'],
  ['bell-spider', 'Bell Spider', 'spider', 'magic', 'cooldownPct', 0.1, 20, 'Rings you ready sooner.'],
  // gear slots
  ['helm-skull', 'Helm Skull', 'skull', 'phys', 'headPct', 0.5, 20, 'Lives in your helmet.'],
  ['locket-snake', 'Locket Snake', 'snake', 'magic', 'neckPct', 0.5, 20, 'Coils round your neck.'],
  ['perch-crow', 'Perch Crow', 'crow', 'cold', 'shouldersPct', 0.5, 20, 'Rides your shoulder.'],
  ['cloak-bat', 'Cloak Bat', 'bat', 'cold', 'backPct', 0.5, 20, 'Hangs in your cloak.'],
  ['rib-skull', 'Rib Skull', 'skull', 'poison', 'chestPct', 0.5, 20, 'Rattles behind your breastplate.'],
  ['cuff-rat', 'Cuff Rat', 'rat', 'light', 'wristsPct', 0.5, 20, 'Sleeps in your sleeve.'],
  ['glove-spider', 'Glove Spider', 'spider', 'fire', 'handsPct', 0.5, 20, 'Crawls in your gauntlet.'],
  ['pouch-toad', 'Pouch Toad', 'toad', 'poison', 'waistPct', 0.5, 15, 'Rides in your belt pouch.'],
  ['heel-hound', 'Heel Hound', 'hound', 'light', 'legsPct', 0.5, 25, 'Never leaves your heel.'],
  ['boot-cat', 'Boot Cat', 'cat', 'light', 'feetPct', 0.5, 20, 'Sleeps in your boots.'],
  ['signet-moth', 'Signet Moth', 'moth', 'light', 'ringPct', 0.5, 15, 'Drawn to ring-shine.'],
  ['charm-skull', 'Charm Skull', 'skull', 'magic', 'trinketPct', 0.5, 20, 'A charm that grins back.'],
  ['edge-skull', 'Edge Skull', 'skull', 'light', 'mainHandPct', 0.5, 25, 'Sits on your sword hilt.'],
  ['shield-owl', 'Shield Owl', 'owl', 'fire', 'offHandPct', 0.5, 20, 'Perches on your shield.'],
];

export const STARTER_PETS = ['grave-crow', 'lantern-wisp', 'bone-hound'];

export const PETS: PetDef[] = petRows.map(([id, name, body, element, stat, per, atk, text]) => ({
  id, name, body, element, stat, per, atk, text, ...(STARTER_PETS.includes(id) ? { starter: true } : {}),
}));

// ---------------------------------------------------------------- 6. quest chain (100 + endless)

// Class and form points grow along the chain so the 100 quests pay for the
// class tree (10 nodes x MAX_RANK) plus all 6 spells at max, and the largest
// form tree (Mastery).
// run 8 (Clarence: "points earned too fast"): the first 30 quests give about 40% fewer class and transformation points
const classN = (num: number) => (num <= 30 ? Math.ceil(num / 15) : 1 + Math.ceil(num / 20));
const formN = (num: number) => (num <= 30 ? Math.ceil(num / 15) : 1 + Math.ceil(num / 25));

type Tok = 'C' | 'T' | 'K' | 'E' | Reward;
const M = (n: number): Reward => ({ kind: 'marks', n });
const P = (...pets: string[]): Reward => ({ kind: 'pet', n: 1, pets });
const g = (kind: GoalKind, n: number, reach?: boolean): Goal => (reach ? { kind, n, reach } : { kind, n });

type QuestRow = [text: string, goal: Goal, rewards: Tok[]];
const questRows: QuestRow[] = [
  /* 1 */ ['Reach stage 5', g('stage', 5, true), ['C']],
  /* 2 */ ['Tap 500 times', g('taps', 500), [M(20)]],
  /* 3 */ ['Beat 3 bosses', g('bosses', 3), ['C']],
  // changed: "Free 3 Named" -> buy 20 Named levels.
  /* 4 */ ['Buy 20 Named levels', g('namedLevels', 20), [P(...STARTER_PETS)]],
  // run 8: Skills open at stage 15, so quests 5 and 7 swapped places
  /* 5 */ ['Buy 25 Train levels', g('heroLevels', 25), [M(30)]],
  /* 6 */ ['Reach stage 15', g('stage', 15, true), ['T']],
  /* 7 */ ['Cast 5 spells or skills', g('spells', 5), ['C']],
  // changed: "Level Hed to 25" -> buy 50 Named levels.
  /* 8 */ ['Buy 50 Named levels', g('namedLevels', 50), ['C']],
  /* 9 */ ['Collect 3 fairies', g('fairies', 3), ['K']],
  /* 10 */ ['Reach stage 25', g('stage', 25, true), ['C']],
  // changed: "Open your first milestone chest" -> kill 250 foes.
  /* 11 */ ['Kill 125 foes', g('kills', 125), ['C']],
  /* 12 */ ['Land 200 crits', g('crits', 200), ['T', 'E']],
  /* 13 */ ['Kill a treasure foe', g('treasure', 1), [M(40)]],
  /* 14 */ ['Reach XP level 10', g('xpLevel', 10, true), ['C']],
  // changed: "Level 5 Named to 25" -> buy 150 Named levels.
  /* 15 */ ['Buy 150 Named levels', g('namedLevels', 150), ['T']],
  /* 16 */ ['Reach stage 40', g('stage', 40, true), ['C']],
  /* 17 */ ['Salvage 20 items', g('salvaged', 20), [M(40)]],
  // changed: "Level a shared spell to 3" -> cast 25 spells.
  /* 18 */ ['Cast 25 spells or skills', g('spells', 25), ['C']],
  /* 19 */ ['Clear a dungeon', g('dungeons', 1), ['T']],
  /* 20 */ ['Beat the Hollow Bishop', g('bishops', 1), ['C', 'K']],
  /* 21 */ ['Win your first escape', g('escapesCleared', 1), ['C']],
  // changed: "Earn 10 Embers" -> return from death twice.
  /* 22 */ ['Return from death 2 times', g('returns', 2), ['T', 'E']],
  /* 23 */ ['Get your first new relic', g('relics', 10, true), [M(50)]],
  // changed: "Level a relic to 5" -> buy 15 relic levels.
  /* 24 */ ['Buy 15 relic levels', g('relicLevels', 15), ['C']],
  // changed: "Hit a weakness 100 times" -> kill 2,000 foes.
  /* 25 */ ['Kill 1,000 foes', g('kills', 1000), ['T']],
  /* 26 */ ['Reach stage 60', g('stage', 60, true), ['C']],
  // changed: "Equip a set piece" -> clear 2 dungeons.
  /* 27 */ ['Clear 2 dungeons', g('dungeons', 2), ['K']],
  // changed: "Level any Named to 100" -> buy 500 Named levels.
  /* 28 */ ['Buy 500 Named levels', g('namedLevels', 500), ['C']],
  // changed (7 Nov): overkill is Berserker-only, so no quest needs it
  /* 29 */ ['Kill 3 treasure foes', g('treasure', 3), ['T', 'E']],
  /* 30 */ ['Reach stage 75', g('stage', 75, true), ['C']],
  /* 31 */ ['Win a special escape run', g('specialEscapes', 1), [M(60)]],
  // changed: "Complete 5 daily tasks" -> beat 100 bosses.
  /* 32 */ ['Beat 100 bosses', g('bosses', 100), ['C']],
  /* 33 */ ['Clear 3 dungeons', g('dungeons', 3), ['T']],
  /* 34 */ ['Collect 50 fairies', g('fairies', 50), ['C']],
  /* 35 */ ['Reach stage 90', g('stage', 90, true), [P('knuckle-rat', 'choir-bat')]],
  /* 36 */ ['Merge a set piece to +1', g('merges', 1), ['T']],
  /* 37 */ ['Beat a wandering boss', g('wanderers', 1), ['C']],
  // changed: "Free 8 Named" -> buy 1,000 Named levels.
  /* 38 */ ['Buy 1,000 Named levels', g('namedLevels', 1000), ['C']],
  /* 39 */ ['Reach XP level 30', g('xpLevel', 30, true), ['T']],
  /* 40 */ ['Reach stage 100', g('stage', 100, true), ['C', 'K']],
  /* 41 */ ['Own 15 relics', g('relics', 15, true), ['C']],
  /* 42 */ ['Kill 50 immune foes', g('immuneKills', 50), ['T', 'E']],
  // changed: "Level 3 Named to 100" -> buy 1,500 Named levels.
  /* 43 */ ['Buy 1,500 Named levels', g('namedLevels', 1500), ['C']],
  /* 44 */ ['Complete any set type', g('setsDone', 1, true), [M(100)]],
  /* 45 */ ['Reach stage 120', g('stage', 120, true), ['C']],
  /* 46 */ ['Return from death 5 times', g('returns', 5), ['T']],
  /* 47 */ ['Cast 500 spells or skills', g('spells', 500), ['C']],
  // changed: "Clear a dungeon in under 2 minutes" -> clear 5 dungeons.
  /* 48 */ ['Clear 5 dungeons', g('dungeons', 5), ['K']],
  // changed: "Level a pet to 20" -> own 5 pets.
  /* 49 */ ['Own 5 pets', g('pets', 5, true), ['C']],
  /* 50 */ ['Reach stage 150', g('stage', 150, true), ['C', 'T']],
  /* 51 */ ['Land 10,000 crits', g('crits', 10000), ['C']],
  // changed: "Earn 1,000 Embers in one return" -> buy 50 relic levels.
  /* 52 */ ['Buy 50 relic levels', g('relicLevels', 50), ['T', 'E']],
  // changed: "Level a spell to 10" -> cast 1,000 spells.
  /* 53 */ ['Cast 1,000 spells or skills', g('spells', 1000), ['C']],
  /* 54 */ ['Kill 100 treasure foes', g('treasure', 100), [M(80)]],
  // changed: "Free all 10 Named" -> reach stage 160 (where the 10th Named unlocks).
  /* 55 */ ['Reach stage 160', g('stage', 160, true), ['C']],
  /* 56 */ ['Reach XP level 50', g('xpLevel', 50, true), ['T']],
  // changed: "Own a Legendary item" -> beat 3 wandering bosses (each drops one).
  /* 57 */ ['Beat 3 wandering bosses', g('wanderers', 3), ['C', 'E']],
  // changed: "Clear a dungeon in each of the 5 realms" -> clear 10 dungeons.
  /* 58 */ ['Clear 10 dungeons', g('dungeons', 10), ['K']],
  // changed: "Level any Named to 200" -> buy 3,000 Named levels.
  /* 59 */ ['Buy 3,000 Named levels', g('namedLevels', 3000), ['C']],
  /* 60 */ ['Reach stage 200', g('stage', 200, true), ['C', 'T']],
  /* 61 */ ['Clear 25 dungeons', g('dungeons', 25), ['C']],
  // changed: "Merge a piece to +2" -> merge 3 times.
  /* 62 */ ['Merge 3 times', g('merges', 3), ['T']],
  /* 63 */ ['Beat 5 wandering bosses', g('wanderers', 5), ['C', 'E']],
  /* 64 */ ['Own 30 relics', g('relics', 30, true), [M(100)]],
  // changed: "Reach a 7-day login streak" -> beat 500 bosses.
  /* 65 */ ['Beat 500 bosses', g('bosses', 500), ['C']],
  /* 66 */ ['Win 3 special escapes', g('specialEscapes', 3), ['T']],
  // changed: "All 10 Named at level 100" -> buy 5,000 Named levels.
  /* 67 */ ['Buy 5,000 Named levels', g('namedLevels', 5000), ['C']],
  /* 68 */ ['Reach stage 250', g('stage', 250, true), ['C']],
  /* 69 */ ['Wear 2 complete set types', g('setsDone', 2, true), ['T']],
  /* 70 */ ['Reach stage 275', g('stage', 275, true), [P('frost-owl')]],
  // changed: "Level a pet to 40" -> own 8 pets.
  /* 71 */ ['Own 8 pets', g('pets', 8, true), ['C']],
  /* 72 */ ['Reach XP level 75', g('xpLevel', 75, true), ['T']],
  // changed: "Complete 10 weekly tasks" -> collect 300 fairies.
  /* 73 */ ['Collect 300 fairies', g('fairies', 300), ['C']],
  // changed: "Skip 5 stages with one overkill" -> skip 25 stages with overkill.
  /* 74 */ ['Kill 50 treasure foes', g('treasure', 50), ['K']],
  /* 75 */ ['Reach stage 300', g('stage', 300, true), ['C', 'T']],
  // changed: "Level a relic to 25" -> buy 150 relic levels.
  /* 76 */ ['Buy 150 relic levels', g('relicLevels', 150), ['C']],
  // changed: "Hit with all 6 elements in one boss fight" -> kill 500 immune foes.
  /* 77 */ ['Kill 500 immune foes', g('immuneKills', 500), ['T', 'E']],
  // changed: "Clear a dungeon without casting a skill" -> run 50 dungeons.
  /* 78 */ ['Run 50 dungeons', g('dungeonRuns', 50), ['C']],
  // changed: "Level any Named to 400" -> buy 10,000 Named levels.
  /* 79 */ ['Buy 10,000 Named levels', g('namedLevels', 10000), [M(150)]],
  /* 80 */ ['Reach stage 350', g('stage', 350, true), ['C']],
  /* 81 */ ['Return from death 25 times', g('returns', 25), ['T']],
  /* 82 */ ['Own 50 relics', g('relics', 50, true), ['C']],
  // changed: "Merge a piece to +3" -> merge 7 times.
  /* 83 */ ['Merge 7 times', g('merges', 7), ['K']],
  // changed: "Level all 6 spells to 10" -> cast 3,000 spells.
  /* 84 */ ['Cast 3,000 spells or skills', g('spells', 3000), ['C']],
  /* 85 */ ['Wear 3 complete set types', g('setsDone', 3, true), ['T']],
  /* 86 */ ['Reach stage 400', g('stage', 400, true), ['C']],
  /* 87 */ ['Beat 15 wandering bosses', g('wanderers', 15), ['C', 'E']],
  /* 88 */ ['Reach XP level 100', g('xpLevel', 100, true), ['T']],
  // changed: "Level all 3 pets to 40" -> own 12 pets.
  /* 89 */ ['Own 12 pets', g('pets', 12, true), [M(150)]],
  /* 90 */ ['Reach stage 450', g('stage', 450, true), ['C', 'K']],
  /* 91 */ ['Clear 100 dungeons', g('dungeons', 100), ['T']],
  // changed: "All 10 Named at level 200" -> buy 20,000 Named levels.
  /* 92 */ ['Buy 20,000 Named levels', g('namedLevels', 20000), ['C']],
  // changed: "Heal a scar" -> win 50 escapes.
  /* 93 */ ['Win 50 escapes', g('escapesCleared', 50), ['C', 'E']],
  /* 94 */ ['Own 70 relics', g('relics', 70, true), ['T']],
  // changed: "Complete all 3 set types of one realm" -> merge 15 times.
  /* 95 */ ['Merge 15 times', g('merges', 15), ['C']],
  /* 96 */ ['Reach stage 500', g('stage', 500, true), ['C']],
  // changed: "Level any Named to 800" -> buy 40,000 Named levels.
  /* 97 */ ['Buy 40,000 Named levels', g('namedLevels', 40000), ['T']],
  // changed: "Merge a piece to +5" -> merge 31 times (enough for a +5).
  /* 98 */ ['Merge 31 times', g('merges', 31), ['K']],
  // changed: "Reach 50 achievement tiers" -> earn 1e30 gold in all.
  /* 99 */ ['Earn 1e30 gold in all', g('gold', 30, true), [M(200)]],
  /* 100 */ ['Reach stage 600', g('stage', 600, true), ['C', 'C', 'T', 'T']],
];

function resolve(num: number, toks: Tok[]): Reward[] {
  const out: Reward[] = [];
  const add = (kind: Reward['kind'], n: number) => {
    const have = out.find((r) => r.kind === kind && !r.pets);
    if (have) have.n += n; else out.push({ kind, n });
  };
  for (const t of toks) {
    if (t === 'C') add('classPt', classN(num));
    else if (t === 'T') add('formPt', formN(num));
    else if (t === 'K') add('key', 1);
    else if (t === 'E') add('egg', 1);
    else out.push(t);
  }
  return out;
}

export const QUESTS: QuestDef[] = questRows.map(([text, goal, toks], i) => ({
  id: `q${i + 1}`, num: i + 1, text, goal, rewards: resolve(i + 1, toks),
}));

// Endless quests (num > 100): goals cycle through a fixed list and grow ~10%
// each lap; rewards cycle C, T, Marks, C, with a key every 10th quest.
type EndlessGoal = { kind: GoalKind; base: number; reach?: boolean; text: (n: number) => string };
const ENDLESS_GOALS: EndlessGoal[] = [
  { kind: 'stage', base: 0, reach: true, text: (n) => `Reach stage ${n}` },
  { kind: 'bosses', base: 500, text: (n) => `Beat ${n} bosses` },
  { kind: 'namedLevels', base: 5000, text: (n) => `Buy ${n} Named levels` },
  { kind: 'dungeons', base: 10, text: (n) => `Clear ${n} dungeons` },
  { kind: 'relicLevels', base: 100, text: (n) => `Buy ${n} relic levels` },
  { kind: 'fairies', base: 200, text: (n) => `Collect ${n} fairies` },
  { kind: 'crits', base: 20000, text: (n) => `Land ${n} crits` },
  { kind: 'treasure', base: 50, text: (n) => `Kill ${n} treasure foes` },
  { kind: 'wanderers', base: 5, text: (n) => `Beat ${n} wandering bosses` },
  { kind: 'returns', base: 5, text: (n) => `Return from death ${n} times` },
];

export function endlessQuest(num: number): QuestDef {
  const k = num - 101; // 0-based position past quest 100
  const tmpl = ENDLESS_GOALS[k % ENDLESS_GOALS.length];
  const lap = Math.floor(k / ENDLESS_GOALS.length);
  const n = tmpl.kind === 'stage' ? 600 + 25 * (num - 100) : Math.ceil(tmpl.base * Math.pow(1.1, lap));
  const goal = g(tmpl.kind, n, tmpl.reach);
  const cyc = k % 4;
  const rewards: Reward[] =
    cyc === 1 ? [{ kind: 'formPt', n: 3 }] : cyc === 2 ? [M(100 + 10 * (num - 100))] : [{ kind: 'classPt', n: 3 }];
  if (num % 10 === 0) rewards.push({ kind: 'key', n: 1 });
  return { id: `q${num}`, num, text: tmpl.text(n), goal, rewards };
}

// ---------------------------------------------------------------- 7. achievements (30)

type AchRow = [id: string, name: string, kind: GoalKind, tiers: number[], stat: StatKey, per: number, text: string];
// changed: the draft paid 20 / 40 / 80 / 150 / 300 Marks by tier; AchievementDef has one number, so a flat 50 per tier.
const ACH_MARKS = 50;
const achRows: AchRow[] = [
  ['tapper', 'Tapper', 'taps', [1e3, 1e4, 1e5, 1e6, 1e7], 'tapPct', 2, 'Taps made.'],
  ['sharp-eye', 'Sharp Eye', 'crits', [100, 1e3, 1e4, 1e5, 1e6], 'critDmg', 3, 'Crits landed.'],
  ['bossbreaker', 'Bossbreaker', 'bosses', [10, 100, 1000, 5000, 20000], 'bossPct', 2, 'Bosses beaten.'],
  // changed: "+1% all damage" -> +1% tap damage.
  ['deep-walker', 'Deep Walker', 'stage', [50, 100, 200, 400, 800], 'tapPct', 1, 'Best stage reached.'],
  ['name-keeper', 'Name-Keeper', 'namedLevels', [100, 500, 2000, 5000, 10000], 'allyPct', 2, 'Named levels bought.'],
  ['coin-counter', 'Coin Counter', 'gold', [6, 12, 18, 24, 30], 'goldPct', 2, 'Gold earned (1e6 to 1e30).'],
  ['returner', 'Returner', 'returns', [1, 10, 50, 200, 500], 'emberPct', 1, 'Returns from death.'],
  ['escape-artist', 'Escape Artist', 'escapesCleared', [1, 5, 25, 100, 250], 'timerSec', 0.1, 'Escapes won.'],
  ['special-guest', 'Special Guest', 'specialEscapes', [1, 3, 10, 25, 50], 'lootLuck', 1, 'Special escape runs won.'],
  ['fairy-friend', 'Fairy Friend', 'fairies', [10, 100, 500, 2000, 10000], 'fairyRate', 2, 'Fairies collected.'],
  ['gold-digger', 'Gold Digger', 'treasure', [5, 50, 250, 1000, 5000], 'treasureGoldPct', 2, 'Treasure foes killed.'],
  ['wanderers-bane', "Wanderer's Bane", 'wanderers', [1, 5, 25, 100, 250], 'wanderRate', 1, 'Wandering bosses beaten.'],
  ['delver', 'Delver', 'dungeons', [1, 10, 50, 200, 500], 'dungeonSec', 0.5, 'Dungeons cleared.'],
  // changed: "Set Collector" (set types complete; only 3 can be worn) -> Scrapper, items salvaged.
  ['scrapper', 'Scrapper', 'salvaged', [20, 200, 1000, 5000, 20000], 'lootLuck', 1, 'Items salvaged.'],
  ['smith', 'Smith', 'merges', [1, 10, 50, 200, 500], 'weapon', 1, 'Set pieces merged.'],
  ['relic-hunter', 'Relic Hunter', 'relics', [10, 25, 50, 75, 100], 'emberPct', 1, 'Relics owned.'],
  ['spellbound', 'Spellbound', 'spells', [50, 500, 5000, 20000, 100000], 'skillPct', 2, 'Spells and skills cast.'],
  // changed: "Deep Well" (mana spent) -> Drillmaster, Train levels bought.
  ['drillmaster', 'Drillmaster', 'heroLevels', [50, 500, 2500, 10000, 50000], 'manaMax', 2, 'Train levels bought.'],
  ['overkill', 'Overkill', 'overkillStages', [10, 100, 1000, 5000, 20000], 'overkillPct', 1, 'Stages skipped by overkill.'],
  // changed: "Weakness Finder" (weakness hits, +2% all elements) -> Grave Filler, kills, +2% damage to normal foes.
  ['grave-filler', 'Grave Filler', 'kills', [1e3, 1e4, 1e5, 1e6, 1e7], 'normalPct', 2, 'Foes killed.'],
  ['piercer', 'Piercer', 'immuneKills', [10, 100, 1000, 10000, 50000], 'pierceAll', 0.2, 'Immune foes killed.'],
  ['scholar', 'Scholar', 'xpLevel', [10, 25, 50, 100, 200], 'xpPct', 2, 'XP level reached.'],
  // changed: "Questor" (quests done) -> Relic Keeper, relic levels bought.
  ['relic-keeper', 'Relic Keeper', 'relicLevels', [10, 100, 500, 2000, 5000], 'markPct', 2, 'Relic levels bought.'],
  // changed: "Faithful" (login days) -> Key Turner, dungeon runs.
  ['key-turner', 'Key Turner', 'dungeonRuns', [5, 25, 100, 400, 1000], 'offlinePct', 2, 'Dungeon runs.'],
  // changed: "Taskmaster" (tasks done) -> Hard Worker, taps (higher tiers).
  ['hard-worker', 'Hard Worker', 'taps', [5e4, 5e5, 5e6, 2e7, 1e8], 'markPct', 2, 'Taps made.'],
  // changed: "Pet Keeper" counts pets owned, not pet levels.
  ['pet-keeper', 'Pet Keeper', 'pets', [3, 10, 20, 40, 60], 'petPct', 2, 'Pets owned.'],
  ['hollow-bane', 'Hollow Bane', 'bishops', [1, 5, 20, 50, 100], 'bossPct', 1, 'Hollow Bishop kills.'],
  // changed: "Healer" (scars healed) -> Survivor, escapes won (higher tiers).
  ['survivor', 'Survivor', 'escapesCleared', [3, 15, 60, 200, 500], 'goldPct', 1, 'Escapes won.'],
  // changed: "Idle Hands" (offline hours) -> Long Rest, returns (higher tiers).
  ['long-rest', 'Long Rest', 'returns', [5, 25, 100, 400, 1000], 'offlinePct', 2, 'Returns from death.'],
  // changed: "Spirit Caller" (auto-node triggers) -> Named levels bought (higher tiers).
  ['spirit-caller', 'Spirit Caller', 'namedLevels', [1000, 5000, 20000, 50000, 100000], 'allyPct', 1, 'Named levels bought.'],
];

export const ACHIEVEMENTS: AchievementDef[] = achRows.map(([id, name, kind, tiers, stat, per, text]) => ({
  id, name, kind, tiers, stat, per, marks: ACH_MARKS, text,
}));

// ---------------------------------------------------------------- 8. login and tasks

const K1: Reward = { kind: 'key', n: 1 };

export const DAILY_TASKS: TaskDef[] = [
  { id: 'd-taps', text: 'Tap 2,000 times', goal: g('taps', 2000), rewards: [M(20)] },
  { id: 'd-bosses', text: 'Beat 15 bosses', goal: g('bosses', 15), rewards: [M(25)] },
  { id: 'd-fairies', text: 'Collect 5 fairies', goal: g('fairies', 5), rewards: [M(20)] },
  { id: 'd-spells', text: 'Cast 20 spells or skills', goal: g('spells', 20), rewards: [M(25)] },
  { id: 'd-treasure', text: 'Kill 3 treasure foes', goal: g('treasure', 3), rewards: [M(30)] },
  { id: 'd-dungeon', text: 'Clear 1 dungeon', goal: g('dungeons', 1), rewards: [K1] },
  { id: 'd-named', text: 'Buy 25 Named levels', goal: g('namedLevels', 25), rewards: [M(20)] },
  { id: 'd-salvage', text: 'Salvage 15 items', goal: g('salvaged', 15), rewards: [M(20)] },
  { id: 'd-crits', text: 'Land 300 crits', goal: g('crits', 300), rewards: [M(25)] },
  { id: 'd-push', text: 'Push 10 stages past where you started', goal: g('stage', 10), rewards: [M(30)] },
];

export const WEEKLY_TASKS: TaskDef[] = [
  { id: 'w-dungeons', text: 'Clear 7 dungeons', goal: g('dungeons', 7), rewards: [K1, M(100)], weekly: true },
  { id: 'w-wanderers', text: 'Beat 2 wandering bosses', goal: g('wanderers', 2), rewards: [M(150)], weekly: true },
  { id: 'w-returns', text: 'Return from death 3 times', goal: g('returns', 3), rewards: [M(120)], weekly: true },
  { id: 'w-bosses', text: 'Beat 100 bosses', goal: g('bosses', 100), rewards: [M(100)], weekly: true },
  { id: 'w-fairies', text: 'Collect 50 fairies', goal: g('fairies', 50), rewards: [M(100)], weekly: true },
  { id: 'w-merges', text: 'Merge 5 items', goal: g('merges', 5), rewards: [K1, M(80)], weekly: true },
  // changed: "Complete 15 daily tasks" -> kill 5,000 foes.
  { id: 'w-kills', text: 'Kill 2,500 foes', goal: g('kills', 2500), rewards: [M(150)], weekly: true },
  { id: 'w-best', text: 'Set a new best stage', goal: g('stage', 1), rewards: [K1, M(120)], weekly: true },
];

export const LOGIN: LoginDay[] = [
  { day: 1, rewards: [M(30)] },
  { day: 2, rewards: [{ kind: 'gold', n: 600 }] },
  { day: 3, rewards: [K1] },
  { day: 4, rewards: [M(50)] },
  // changed: "3 fairies at once" -> 5 minutes of kill gold.
  { day: 5, rewards: [{ kind: 'gold', n: 300 }] },
  // changed: "1 free relic level" -> 60 Marks.
  { day: 6, rewards: [M(60)] },
  // changed: "Epic-or-better item" -> 15 minutes of kill gold (no item reward kind).
  { day: 7, rewards: [M(100), K1, { kind: 'gold', n: 900 }] },
];

// ---------------------------------------------------------------- 9. Named elements and milestones

/** In ALLIES order (n0..n9). */
export const NAMED_ELEMENTS: Element[] = ['phys', 'fire', 'phys', 'light', 'cold', 'magic', 'poison', 'cold', 'light', 'fire'];

// Level-200 perks: the draft's perks mostly have no milestone scope, so each
// becomes a 'tap', 'element' or 'all' boost.
const PERK_200: NamedMilestone[] = [
  { level: 200, scope: 'all', pct: 10 }, // changed: Hed "+10% treasure-foe gold" -> +10% all Named
  { level: 200, scope: 'element', pct: 15 }, // changed: Orla "+10% fairy rate" -> +15% her element
  { level: 200, scope: 'tap', pct: 10 }, // Tamsin +10% tap damage
  { level: 200, scope: 'tap', pct: 15 }, // changed: Mirela "+2% crit chance" -> +15% tap damage
  { level: 200, scope: 'all', pct: 10 }, // changed: Corvin "+2 s boss time" -> +10% all Named
  { level: 200, scope: 'element', pct: 20 }, // changed: Nell "+15% skill power" -> +20% her element
  { level: 200, scope: 'all', pct: 10 }, // changed: Jory "+10% gold" -> +10% all Named
  { level: 200, scope: 'element', pct: 15 }, // changed: Wenna "+10% offline gold" -> +15% her element
  { level: 200, scope: 'tap', pct: 10 }, // changed: Captain "+5% overkill" -> +10% tap damage
  { level: 200, scope: 'all', pct: 15 }, // changed: Rusk "+25% vs the Bishop" -> +15% all Named
];

// changed: the "+2% / +3% piercing" parts of the 100 and 800 milestones are dropped (no milestone scope for piercing).
export const NAMED_MILESTONES: NamedMilestone[][] = PERK_200.map((perk) => [
  { level: 10, scope: 'self', pct: 100 },
  { level: 25, scope: 'element', pct: 10 },
  { level: 50, scope: 'self', pct: 200 },
  { level: 100, scope: 'element', pct: 25 },
  perk,
  { level: 400, scope: 'self', pct: 400 },
  { level: 400, scope: 'element', pct: 50 },
  { level: 800, scope: 'self', pct: 900 },
]);

// ---------------------------------------------------------------- 10. chests, fairies, special foes

// changed: the chest item and the 10% / 25% chances have no reward kind; every
// chest gives gold and Marks, and every 100th adds a sure key and a pet egg.
export const CHEST: ChestDef = {
  every: 25,
  rewards: [{ kind: 'gold', n: 60 }, M(20)],
  big: [K1, { kind: 'egg', n: 1 }],
};

export const FAIRY_REWARDS: FairyReward[] = [
  { kind: 'gold', weight: 50, n: 30 },
  { kind: 'mana', weight: 25, n: 30 },
  { kind: 'spell', weight: 20, n: 1 },
  { kind: 'marks', weight: 5, n: 8 },
];

export const SPECIAL_FOES: SpecialFoe[] = [
  { id: 'coin-fat-ghoul', name: 'Coin-Fat Ghoul', lands: [0, 1], kind: 'treasure', text: 'Fat with stolen coin. x10 gold.' },
  { id: 'hoard-crab', name: 'Causeway Hoard-Crab', lands: [2], kind: 'treasure', text: 'Carries a hoard on its back. x15 gold.' },
  { id: 'bell-thief', name: 'The Bell-Thief', lands: [3, 4], kind: 'treasure', text: 'Stole from the shrine. x20 gold.' },
  { id: 'sexton-unburied', name: 'The Sexton Unburied', lands: [0, 1], kind: 'wanderer', text: 'Dug himself out. Drops a Legendary.' },
  { id: 'causeway-drowner', name: 'The Causeway Drowner', lands: [2], kind: 'wanderer', text: 'Pulls travellers under. Drops a Legendary.' },
  { id: 'bell-hollowed-knight', name: 'The Bell-Hollowed Knight', lands: [3, 4], kind: 'wanderer', text: 'Rings with every step. Drops a Legendary.' },
  { id: 'coin-swallower', name: 'The Coin-Swallower', lands: [BELLROPE], kind: 'treasure', text: 'Swallowed the offerings off the rope. x20 gold.' },
  { id: 'falling-monk', name: 'The Falling Monk', lands: [BELLROPE], kind: 'wanderer', text: 'Still falling down the rope. Drops a Legendary.' },
];
// run 3: one treasure foe and one wanderer for every land below the Bell (names follow the lore approval, see data.ts)
for (const [i, d] of DEEP_SHOWN.entries()) {
  SPECIAL_FOES.push(
    { id: `deep-treasure-${i}`, name: d.treasure, lands: [FIRST_DEEP + i], kind: 'treasure', text: 'Hoards what the deep took. x20 gold.' },
    { id: `deep-wanderer-${i}`, name: d.wanderer, lands: [FIRST_DEEP + i], kind: 'wanderer', text: 'Walks the deep lands. Drops a Legendary.' },
  );
}


// run 5 (Clarence): race and transformation must help every class the same
for (const tr of [...RACE_TREES, ...FORM_TREES]) neutralizeTree(tr);
