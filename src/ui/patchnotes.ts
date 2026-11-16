// Patch notes, built from the game data so every number shown is the number in play.
// One structure, two renderers: HTML for the in-game Menu page, Markdown for PATCH_NOTES.md.

import { ALLIES, BELLROPE, ELEMENT_NAME, FORMS, RACES, REALMS, STAT_LABEL, ZONES, type StatKey } from '../rules/data';
import {
  ACHIEVEMENTS, CHEST, DAILY_TASKS, FAIRY_REWARDS, FORM_TREES, LOGIN, NAMED_ELEMENTS, NAMED_MILESTONES, PETS, QUESTS,
  RACE_TREES, RELICS, SETS, SPECIAL_FOES, SPELLS, WEEKLY_TASKS,
} from '../rules/content';
import * as G from '../rules/game';
import { FORM_EXTRA, SUBCLASS_EXTRA } from '../rules/tiers-content';

export const PATCH = '2.6';
export const PATCH_NAME = 'Heavier Steps';

type Block = { h: string; intro?: string; items?: string[]; table?: { head: string[]; rows: string[][] } };

const stat = (k: StatKey, v: number) => {
  const label = STAT_LABEL[k];
  const n = Math.abs(v) >= 10 ? Math.round(v) : Math.round(v * 100) / 100;
  return label.startsWith('%') || label.startsWith('s ') ? `+${n}${label}` : `+${n} ${label}`;
};
const reward = (r: { kind: string; n: number; pets?: string[] }) =>
  r.kind === 'pet' ? (r.pets && r.pets.length > 1 ? `pet (pick 1 of ${r.pets.length})` : `pet: ${PETS.find((p) => p.id === r.pets?.[0])?.name ?? '?'}`)
    : `${r.n} ${{ classPt: 'class pt', formPt: 'form pt', key: 'key', marks: 'Marks', embers: 'Embers', gold: 's of gold', egg: 'egg' }[r.kind] ?? r.kind}`;

export function patchBlocks(): Block[] {
  return [
    {
      h: 'New in 2.6',
      items: [
        '**Foes stand longer.** Normal foes have 4x the health (eased in over the first 12 stages), so you see each fight instead of a blur of one-tap kills. A stage has 4 foes instead of 8, and each pays more gold and XP, so you climb about as fast as before. Bosses, escapes and dungeons are unchanged. Kill quests ask for half as many.',
        '**Race trees reworked.** Each race tree has one damage node; every other node now does its own job. Human: Marks, and a chance to skip ahead a stage. Elf: more treasure foes and fairies. Orc: Bloodcry finishes off normal foes at low health. Troll: more time in dungeons. Points you spent stay where they are.',
        '**A calmer start.** Tabs open one at a time: Quests at stage 5, Skills at 15 (a Mage gets them with its first class point), Gear at 25, Death at 40; Pets with your first egg. Bosses drop items less often (15%, every 10th for sure, from stage 25); normal foes now and then drop a Common item, elites, treasure foes and wanderers 5%. The first 30 quests give fewer class and transformation points, and race levels come about a third slower. Locked tabs show the stage they open at.',
        'Character creation scrolls on every phone, ends on the Faith step (type your name in the box at the top), and has no Begin now button.',
        'Holding a button for its details no longer selects the text. The tap counter on the fight now says streak.',
        'New class descriptions that name all three subclasses.',
        'Every item that reaches your bag is announced (worse drops are still salvaged for gold). The Cleric\'s Prayer quest says what "high" means: above 50%.',
        'Clearer labels: the Named portraits under the fight show "Lv", the button beside them says "Named ›" and how many more you can hire, and the Hero tab says XP level (your race points) apart from Training.',
        'Character creation ticks your current pick. The points hint says which kind of point is waiting (class, race or transformation), and the immunity hint says what still hurts the foe.',
        'Fixed: the stage dots under a foe kept growing while you farmed a stage. Fixed: an escape gate could be sized far beyond what you could finish; it now checks your real damage once and shrinks if it was clearly impossible (never enough to win without fighting).',
      ],
    },
    {
      h: 'New in 2.5',
      items: [
        '**Class gear.** Every class has 3 sets (weapons, accessories, armour), 2 legendaries and 1 Artifact that change how its loop plays: the Warrior\'s Rage Strikes fire up all your damage, the Mage\'s casts surge it, the Rogue\'s combo grows it, the Ranger\'s arrows mark the foe, the Cleric\'s Prayer goes higher. Dungeons drop them; gear made for another class gives its stats only until you Reshape.',
        '**The Stash** (Gear > Stash): keep set pieces aside. Every complete set in the Stash (up to 10) gives +2% of your worn gear\'s stats and a small form of its bonus.',
        '**Found** (Gear > Found): every land hides 2 named items that its bosses drop now and then. 26 to find; 5, 13 and 26 found give gems.',
        '**Vigil**: while you are away, a Cleric climbs toward 90% of their best stage (a full climb takes 8 hours) and comes back with full Prayer.',
        'Compare now tells you when a piece completes a set, so a set piece is never marked Worse for that reason. Live set bonuses show on your class meter.',
        'Quest 2 now practises your class (Rage Strikes, spells, weak spots, foes, Prayer) instead of 500 taps. When your race or faith rule works, a ⚑ note says so, and Hero > Stats counts it for this life. A boss that runs out your clock now says so clearly, and a finished quest is claimed from the quest bar in one tap.',
        '**Judge gear by** (Bag tab, or Settings): Balanced, Tap damage, Named damage, or Gold and boss time. The bag arrows, Compare and auto-salvage all follow it.',
      ],
    },
    {
      h: 'New in 2.4',
      items: [
        '**Every class plays its own way.** Warrior: taps build Rage for a 25x Rage Strike. Mage: taps refill mana, spells hit twice as hard. Rogue: weak spots hit 5x and build a crit combo. Ranger: arrows fly by themselves, pets hit 50% harder. Cleric: taps build Prayer that lifts your Named up to 3x.',
        '**Races and faiths are rules now**, and help every class the same. Each race has one rule (two shrine offerings, more elites, a longer boss clock, overkill, a retry that remembers). Each faith decides what you chase (wanderers, elites, Marks, loot, Embers, events).',
        '**Transformations help every class the same** too: each has one strength (bosses, normal foes, gold, Embers, piercing) and one weakness. Race and transformation trees now raise damage from every source.',
        `**Gems**: a rare currency from great chests, first special-boss wins, achievements and weekly tasks. **Reshape** your class, race or faith for ${G.RESHAPE_COST} gems. Saves from before this update get ${G.RESHAPE_COST} gems once.`,
        '**Harder escapes**: escape foes are bigger again; expect to reach the gate with seconds to spare.',
        'Worse drops (Rare and below) are salvaged for gold at once (a setting turns this off), and the "cast spells" quest lights up the buttons to tap.',
      ],
    },
    {
      h: 'New in 2.3',
      items: [
        `**Elite foes** from stage ${G.ELITE_FROM}: about 1 foe in 8 is Armoured, Swift or Warded, and pays ${G.ELITE_GOLD}x gold.`,
        `**Weak spots**: on bosses and elites a glowing ✸ appears and waits for you. Tap it for x${G.WEAK_SPOT_MULT} damage; it comes back ${G.WEAK_FIRST} s later somewhere else.`,
        '**Hunts**: every few minutes a short side goal is offered (kill elites, hit weak spots, beat a boss fast). Take it or ignore it.',
        '**The Toll Collector**: a new event that asks. Double gold for 60 s, but your next boss has 5 s less.',
        '**A third gimmick boss**: Adds. Two servants guard it; until they fall, the boss takes only 20% of your damage.',
        '**Shrines**: once in each land, every life, spend gold on lantern oil (+5 s on the next boss), a blessed hand or a votive for the Named.',
        `**Sellswords** (Named tab): gold buys +${Math.round(G.MERC_STEP * 100)}% damage for every Named, this life only, up to ${G.MERC_MAX} hires.`,
        `**The tithe** (Fall card): give all your gold to the Bell for up to +${Math.round(G.TITHE_MAX * 100)}% Embers from that fall.`,
        `**Named trades**: at level ${G.SPEC_LEVEL} each Named becomes a Bossbreaker or a Reaper for the rest of the life.`,
      ],
    },
    {
      h: 'New in 2.2',
      items: [
        `**Seven new lands below the Bell** (stages 151 to 500), each with its own backdrop, foes, three bosses who take turns, a treasure foe and a wanderer: ${ZONES.slice(-7).map((z) => z.name).join(', ')}. Past stage 500 they return as Deeper lands.`,
        `**${ZONES[BELLROPE].name}** (stages ${ZONES[BELLROPE].from} to 150): Beneath the Bell now ends at stage ${ZONES[BELLROPE].from - 1}, and a new land with its own rope-shaft backdrop, foes, bosses, treasure foe and wanderer takes the rest.`,
        `**Gimmick bosses** every ${G.GIMMICK_EVERY}th stage from ${G.GIMMICK_FROM}: the Shield (your Named and pets break through) and Tolling (tap the bell). Your first win against each pays a key and Marks.`,
        `**Events** every few minutes from stage ${G.EVENT_FROM}: ${Object.values(G.EVENT_DEFS).map((e) => e.name).join(', ')}. A setting turns them off. Each week one element deals +${Math.round(G.WEEKLY_BONUS * 100)}%.`,
        `**Train perks** every ${G.TRAIN_PERK_EVERY} Train levels (pick ${G.TRAIN_PERKS.tap.name} or ${G.TRAIN_PERKS.crit.name}), and **the Gold Forge**: gold raises a worn item up to +${G.FORGE_MAX}.`,
        '**Jumpscares.** Rarely, something from below comes to say hello. Menu has a switch if your heart prefers not.',
        '**Every escape is tight now**: escape foes grow with the damage you deal inside the escape, so you always cut it close.',
        'Every buy shows what it added, and Named milestones say what they gave. Health bar numbers no longer get cut off.',
      ],
    },
    {
      h: 'New in 2.1',
      items: [
        '**Your save is safe**: a damaged save is kept, never overwritten, and a crash shows your save code instead of a blank page. After an hour of play the game reminds you once to copy your save code.',
        '**Tabs cover half the screen**; the fight stays visible and tappable. Gear and Death have their own small tabs (Worn / Bag / Sets, Fall / Relics / Dungeon).',
        '**A guided start** in six short steps, a *Begin now* button, and tabs that open as they start to matter.',
        '**Every tap answers**: refused buys say what is missing; popups close on the first tap.',
        `**Balance**: immune foes still take ${G.IMMUNE_FLOOR}% from that element; the winter set halves the boss clock instead of stopping it; escapes are sized from the damage you really deal${G.LAND1_BOSS_BONUS ? `; the first land's bosses get ${G.LAND1_BOSS_BONUS} extra seconds` : ''}${G.BOUNTY_GOLD > 1 ? `; after your first fall, every ${G.BOUNTY_EVERY}th stage's boss (not the Hollow Bishop's) is a bounty paying ${G.BOUNTY_GOLD}x gold` : ''}.`,
        '**Welcome back** shows your next goal, the login reward, and which Named did the work.',
        `**New settings** (all off at first): Sound, Hit-stop, Big numbers as 1.23e45, Auto-cast at full mana (level ${G.AUTO_CAST_LEVEL}), Auto-buy (${G.AUTO_BUY_RELICS} relics).`,
        '**Words of Lanternfall**: a glossary in Menu. Hold any number at the top to see what it means.',
        '**Small things**: Merge all, a pets row, set progress before you wear a piece, the first wisp lasts longer, damage numbers grow with your combo, the candle drips in its last seconds.',
      ],
    },
    {
      h: 'New systems',
      items: [
        `**Elements** (Diablo II set): ${Object.values(ELEMENT_NAME).join(', ')}. From stage ${G.IMMUNE_FROM}, 30% of foes are immune to one element; from stage ${G.TWO_IMMUNE_FROM}, a 25% chance of a second. Immune = 0 damage; piercing lets up to ${G.MAX_PIERCE}% through. A weakness takes x${G.WEAK_MULT}. **Every boss keeps at least one weakness.**`,
        `**Cleave (overkill)**: Warrior Berserker only: leftover damage carries to the next foes (up to 100% at max ranks). Pets, relics and sets add a tiny amount for everyone, at most ${G.OVERKILL_OTHER_CAP}% together. It never touches a boss; on stages you have cleared before it sweeps the whole stage.`,
        `**Tiers (v3)**: AdventureQuest-style class ladder. T1 = base class; at rank 10 the 3 subclass trials appear; own every subclass you unlock and equip one (free switch, not mid-fight). Subclasses climb T2–T7; each tier has 10 ranks earned by fighting (T1 ≈ 20 min, each tier ×2), and the next tier's trial only shows at rank 10. Tiers open nodes; class points still rank them. T7 = a subclass ultimate.`,
        `**Transformations by quest (v3)**: you start mortal. After quest ${G.OFFER_QUEST} a trial offers the forms; taking one closes Mortal Master forever. Forms climb T1–T7 like classes. Hybrids follow The Unwritten: a 2nd or 3rd form only while every form is T1–T2; caps two forms T4/T3, three forms T2; every weakness applies; T7 is pure-only. Mortal Master climbs its own Mastery T1–T7 (T7: Every Morning at Once).`,
        `**Character creation**: step by step (Race → Class → Faith → Form → Name) with a big hero, lore, stat bars, skills and tree previews.`,
        `**Fewer words**: icons and numbers on every card; hold anything (or tap ?) for its explanation. Tabs are icons with one word.`,
        `**XP level**: never resets. Level L needs 30·(L−1)^1.7 XP. Each level = 1 race point.`,
        `**Quest chain**: ${QUESTS.length} hand-made quests, then endless ones. They give class points (class tree + shared spells) and transformation points.`,
        `**Shared spells**: 6 for every class, levelled with class points. The skill bar is now 2 rows of 5 icons; hold one for details.`,
        `**Dungeons**: a key opens a random death realm: ${G.DUNGEON_MOBS} foes + boss in ${G.DUNGEON_SECONDS / 60} min, sized to your damage. The boss always drops a set piece of that realm. 1 free key a day (up to ${G.KEY_CAP}).`,
        `**Realm sets**: 15 sets (5 realms × weapons / accessories / armour). Wear every piece of a set type for its ★ rule-bender. Two copies at the same + merge to +1 (max +${G.MAX_PLUS}, +${G.PLUS_STEP * 100}% stats each).`,
        `**Relics**: ${RELICS.length} in all. The 9 rites are the first 9. Find a random new one for Embers (dearer for each one owned); level any of them.`,
        `**Pets**: ${PETS.length}, one for every stat. Up to ${G.PETS_OUT} out; the rest give ${G.PET_BENCH * 100}%. Level with Marks.`,
        `**Marks** ✦: from tasks, achievements, fairies and quests.`,
        `**Wisps (fairies)**: every ${G.FAIRY_MIN}–${G.FAIRY_MIN + G.FAIRY_SPREAD} s; tap one within ${G.FAIRY_LIFE} s.`,
        `**Treasure foes**: 1 in ${Math.round(1 / G.TREASURE_CHANCE)} normal foes from stage 5, x${G.TREASURE_GOLD} gold.`,
        `**Wandering bosses**: from stage ${G.WANDER_FROM}, 1 in ${Math.round(1 / G.WANDER_CHANCE)} foes. ${G.WANDER_SECONDS} s before they leave; always drop a Legendary (25% an egg).`,
        `**Milestone chest** every ${CHEST.every} stages (first clear): ${CHEST.rewards.map(reward).join(', ')}; every 100th adds ${CHEST.big.map(reward).join(', ')}.`,
        `**Daily**: 3 daily + 3 weekly tasks, a 7-day login cycle (a missed day pauses it). **Achievements**: ${ACHIEVEMENTS.length}, 5 tiers each, permanent bonuses.`,
        `**Respec** now costs Embers (a quarter of your best return) and resets class, spell, race and transformation points.`,
        `**Named**: each has an element and level milestones.`,
      ],
    },
    {
      h: 'Realm sets',
      table: {
        head: ['Set', 'Realm', 'Type', 'Pieces roll', '★ Full set'],
        rows: SETS.map((x) => [x.name, REALMS.find((r) => r.id === x.realm)?.name ?? x.realm, x.type, x.stats.map((k) => STAT_LABEL[k].replace(/^% /, '')).join(', '), x.text]),
      },
    },
    {
      h: 'Relics',
      table: {
        head: ['#', 'Relic', 'Group', 'Effect', 'Max', 'Cost'],
        rows: RELICS.map((r) => [String(r.num), `${r.effect.rule ? '★ ' : ''}${r.name}`, r.group, r.text, r.max ? String(r.max) : '–', `${r.cost} ×${r.growth}`]),
      },
    },
    {
      h: 'Subclass tiers T5–T7 (proposal)',
      table: {
        head: ['Subclass', 'T5', 'T6', 'T7 ultimate', 'Titles T2→T7'],
        rows: Object.entries(SUBCLASS_EXTRA).map(([k, v]) => [k.replace(':', ' · '), `${v.nodes[0]?.name}: ${v.nodes[0]?.text}`, `${v.nodes[1]?.name}: ${v.nodes[1]?.text}`, `${v.ultimate.name}: ${v.ultimate.text}`, v.titles.join(' → ')]),
      },
    },
    {
      h: 'Transformation tiers T4–T7 (proposal)',
      table: {
        head: ['Form', 'T4', 'T5', 'T6', 'T7 ultimate'],
        rows: Object.entries(FORM_EXTRA).map(([k, v]) => [k === 'mastery' ? 'Mortal Master' : k, ...v.nodes.map((n) => `${n.name}: ${n.text}`), `${v.ultimate.name}: ${v.ultimate.text}`]),
      },
    },
    {
      h: 'Shared spells',
      table: { head: ['Spell', 'Effect', 'Mana', 'Cooldown', 'Max', 'Unlock'], rows: SPELLS.map((x) => [x.name, x.text, String(x.mana), `${x.cooldown} s`, String(x.max), `level ${x.unlock}`]) },
    },
    {
      h: 'Race trees (proposal)',
      table: { head: ['Race', 'Node', 'Row', 'Max', 'Effect per rank'], rows: RACE_TREES.flatMap((t) => t.nodes.map((n) => [RACES.find((r) => r.id === t.id)?.name ?? t.name, n.name, String(n.tier + 1), String(n.max), n.text])) },
    },
    {
      h: 'Transformation and Mastery trees (proposal)',
      table: { head: ['Form', 'Node', 'Row', 'Max', 'Effect per rank'], rows: FORM_TREES.flatMap((t) => t.nodes.map((n) => [FORMS.find((f) => f.id === t.id)?.name ?? t.name, n.name, String(n.tier + 1), String(n.max), n.text])) },
    },
    {
      h: 'Pets',
      table: { head: ['Pet', 'Element', 'Per level', 'Attack'], rows: PETS.map((p) => [`${p.starter ? '◆ ' : ''}${p.name}`, ELEMENT_NAME[p.element], stat(p.stat, p.per), `${p.atk}% tap/s`]) },
    },
    {
      h: 'Named elements and milestones',
      table: {
        head: ['Named', 'Element', 'Milestones'],
        rows: ALLIES.map((a, i) => [a.name, ELEMENT_NAME[NAMED_ELEMENTS[i] ?? 'phys'], (NAMED_MILESTONES[i] ?? []).map((m) => `${m.level}: ${m.scope} x${(1 + m.pct / 100).toFixed(2)}`).join(' · ')]),
      },
    },
    {
      h: 'Quest chain (first 100)',
      table: { head: ['#', 'Quest', 'Reward'], rows: QUESTS.map((q) => [String(q.num), q.text, q.rewards.map(reward).join(', ')]) },
    },
    {
      h: 'Achievements',
      table: { head: ['Achievement', 'Tiers', 'Bonus per tier', 'Marks'], rows: ACHIEVEMENTS.map((a) => [a.name, a.tiers.join(' / '), stat(a.stat, a.per), String(a.marks)]) },
    },
    {
      h: 'Tasks and login',
      items: [
        `Daily pool: ${DAILY_TASKS.map((t) => `${t.text} (${t.rewards.map(reward).join(', ')})`).join('; ')}.`,
        `Weekly pool: ${WEEKLY_TASKS.map((t) => `${t.text} (${t.rewards.map(reward).join(', ')})`).join('; ')}.`,
        `Login: ${LOGIN.map((l) => `day ${l.day}: ${l.rewards.map(reward).join(', ')}`).join('; ')}.`,
        `Wisp rewards: ${FAIRY_REWARDS.map((f) => `${f.kind} (weight ${f.weight})`).join(', ')}.`,
        `Treasure foes: ${SPECIAL_FOES.filter((f) => f.kind === 'treasure').map((f) => f.name).join(', ')}. Wandering bosses: ${SPECIAL_FOES.filter((f) => f.kind === 'wanderer').map((f) => f.name).join(', ')}.`,
      ],
    },
    {
      h: 'Fixes from v1.1',
      items: [
        'Named list no longer overlaps.',
        'Items show one Power number; "Salvage worse" uses it; salvage-all by rarity.',
        'Coming up card shows the next goals.',
      ],
    },
  ];
}

const escH = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const md2html = (t: string) => escH(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

export function patchNotesHtml(): string {
  return `<div class="notes"><h2>Patch ${PATCH}: ${PATCH_NAME}</h2><p class="note">Every number below is read from the game itself. Proposal content is marked; tell Claude what feels off.</p>` +
    patchBlocks().map((b) => `<details ${b.items ? 'open' : ''}><summary>${escH(b.h)}</summary>${b.intro ? `<p>${md2html(b.intro)}</p>` : ''}
      ${b.items ? `<ul>${b.items.map((i) => `<li>${md2html(i)}</li>`).join('')}</ul>` : ''}
      ${b.table ? `<div class="tw"><table><tr>${b.table.head.map((h) => `<th>${escH(h)}</th>`).join('')}</tr>${b.table.rows.map((r) => `<tr>${r.map((c) => `<td>${md2html(c)}</td>`).join('')}</tr>`).join('')}</table></div>` : ''}
    </details>`).join('') + '</div>';
}

export function patchNotesMarkdown(): string {
  const cell = (t: string) => t.replace(/\|/g, '/');
  return `# The Unwritten: Lanternfall, patch ${PATCH}: ${PATCH_NAME}\n\nEvery number below is generated from the game data. ★ = rule-bender, ◆ = starter pet. Trees are proposals.\n\n` +
    patchBlocks().map((b) => `## ${b.h}\n\n${b.intro ? `${b.intro}\n\n` : ''}${b.items ? b.items.map((i) => `- ${i}`).join('\n') + '\n\n' : ''}${b.table ? `| ${b.table.head.join(' | ')} |\n|${b.table.head.map(() => '---').join('|')}|\n${b.table.rows.map((r) => `| ${r.map(cell).join(' | ')} |`).join('\n')}\n\n` : ''}`).join('');
}
