import { CHASE } from '../rules/run6-content';
import './style.css';
import * as B from '../rules/big';
import * as G from '../rules/game';
import type { Item, State } from '../rules/game';
import {
  ACTIVE_HELP, ALLIES, ARTIFACTS, ATTRS, ATTR_HELP, ATTR_NAME, BAG_SIZE, BISHOP_EVERY, CLASSES, ELEMENTS, ELEMENT_COLOR, ELEMENT_NAME,
  ELEMENT_PCT, ELEMENT_PIERCE, ESCAPE_FOES, ESCAPE_SECONDS, FAITHS, FORMS, MAX_RANK, RACES, RARITIES, REALMS, SCARS, SLOT_NAME, STAT_LABEL, ZONES,
  rarityDef, zoneFor, BELLROPE, type Element, type Slot, type StatKey,
} from '../rules/data';
import { ACHIEVEMENTS, FORM_TREES, LOGIN, NAMED_ELEMENTS, NAMED_MILESTONES, PETS, RACE_TREES, RELICS, SETS, SPELLS } from '../rules/content';
import { SET_SLOTS, type Effect, type TreeDef } from '../rules/content-types';
import { FORM_EXTRA, SUBCLASS_EXTRA, type TierNode } from '../rules/tiers-content';
import {
  PIXEL_CSS, createBattleView, heroPortrait, itemIcon, namedStripHtml, petIcon, spellIcon,
  type BattleView, type FoeLook, type HeroLook, type NamedLook, type Scene,
} from './pixel';
import { PATCH, patchNotesHtml } from './patchnotes';
import { sfx } from './sound';
import { jumpscare } from './scare';
import { icon32 } from './pixel/icons32';
import { ICON_GROUPS } from './pixel/icon-list';

const KEY = 'unwritten-tapper-save';
const app = document.getElementById('app')!;
let s: State | null = null;

const css = document.createElement('style');
css.textContent = PIXEL_CSS;
document.head.appendChild(css);

// ------------------------------------------------------------------ storage

/** While the save slot holds something unreadable, nothing may write to it (only a confirmed "Start new" or a good code lifts this). */
let saveBlocked = false;
function readStored(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
/** Keep an exact copy of an unreadable save beside it, never replacing an older different copy. */
function keepBadCopy(raw: string) {
  try {
    const old = localStorage.getItem(`${KEY}.bad`);
    if (old === null || old === raw) localStorage.setItem(`${KEY}.bad`, raw);
    else localStorage.setItem(`${KEY}.bad.${Date.now()}`, raw);
  } catch { /* the original key is untouched anyway */ }
}
function save() {
  if (!s || saveBlocked || (window as any).__demo) return;
  try {
    localStorage.setItem(KEY, G.serialize(s));
  } catch {
    /* storage full or blocked: the save code still works */
  }
}

/** Player settings, kept apart from the save. */
const PREFS_KEY = 'unwritten-tapper-prefs';
let firstWelcome = true;
/** The save code shown in Menu › Move your save. Kept here so the panel redraw after a tap does not wipe it (final play-test bug). */
let shownCode = '';
/**
 * Run 2, idea 42: a 20-second cold open before character creation, from The Unwritten's design log
 * (the funeral bell beneath the shrine, the names taken from the dead, the Hollow Bishop). Wording approved by Clarence, 10 Nov 2026.
 * New players only (no save); tap to skip. ?nocoldopen skips it for test scripts.
 */
const COLD_OPEN_ON = !new URLSearchParams(location.search).has('nocoldopen');
const COLD_OPEN = [
  "Beneath Lanternfall, the funeral bell is ringing.",
  'The dead are rising, and their names are gone from their stones.',
  'Somewhere below, the Hollow Bishop rings it.',
  'Go down. Give them back their names.',
];
function showColdOpen(next: () => void) {
  let i = 0;
  let timer = 0;
  const done = () => { window.clearTimeout(timer); app.onclick = null; next(); };
  const show = () => {
    if (i >= COLD_OPEN.length) { done(); return; }
    app.innerHTML = `<div class="coldopen"><p class="${i === COLD_OPEN.length - 1 ? 'last' : ''}">${esc(COLD_OPEN[i])}</p><small>Tap to skip</small></div>`;
    i++;
    timer = window.setTimeout(show, 4500);
  };
  app.onclick = done;
  show();
}
type Toggle = 'sci' | 'vibrate' | 'motion' | 'big' | 'sound' | 'hitstop' | 'autocast' | 'autobuy';
const prefs: { sci?: boolean; seenPatch?: string; vibrate: boolean; motion: boolean; big: boolean; seenItem: number; seenFall?: boolean; sound?: boolean; hitstop?: boolean; autocast?: boolean; autobuy?: boolean; holdTips?: number; heldOnce?: boolean; playSec?: number; saveNagAt?: number; scaresOff?: boolean; scareAt?: number; seenLoop?: string[] } = (() => {
  try { return { vibrate: true, motion: true, big: false, seenItem: 0, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch { return { vibrate: true, motion: true, big: false, seenItem: 0 }; }
})();
function applyPrefs() {
  B.setScientific(!!prefs.sci);
  document.documentElement.classList.toggle('bigtext', prefs.big);
  document.documentElement.classList.toggle('calm', !prefs.motion);
}
/** Jumpscares (Clarence, 11 Nov 2026): about one per 30 to 45 minutes of play, never in an escape or a dungeon, on unless switched off. */
let scaring = false;
const SCARE_GAP = () => 1800 + Math.random() * 900;
function maybeScare() {
  if (!s || prefs.scaresOff || scaring) return;
  const play = prefs.playSec ?? 0;
  prefs.scareAt ??= play + SCARE_GAP();
  if (play < prefs.scareAt) return;
  if (s.escape || s.dungeon) { prefs.scareAt = play + 60; return; } // try again in a minute
  prefs.scareAt = play + SCARE_GAP();
  savePrefs();
  startScare();
}
function startScare(face?: string, joke?: number) {
  scaring = true;
  modalOpen = 'scare'; // pauses the fight like any popup
  jumpscare({ sound: !!prefs.sound, motion: prefs.motion, buzz, face, joke, onDone: () => { scaring = false; modalOpen = null; } });
}
function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ } }
function buzz(ms: number) { if (prefs.vibrate && (navigator as any).userActivation?.hasBeenActive !== false) navigator.vibrate?.(ms); } // browsers block vibration before the first touch
function shake(strong: boolean) {
  if (!prefs.motion) return;
  const b = document.getElementById('battle');
  if (!b) return;
  b.classList.remove('shake', 'shake2');
  void b.offsetWidth;
  b.classList.add(strong ? 'shake2' : 'shake');
}
/** A big banner across the fight (boss arrives, stage cleared, tier up...). */
function banner(text: string, cls = '') {
  const host = document.getElementById('banner');
  if (!host) return;
  host.className = `banner ${cls}`;
  host.textContent = text;
  void host.offsetWidth;
  host.classList.add('show');
}

/** "The" before a name, unless the name already starts with it (fixes "The The Sepulchre Keeper"). */
const the = (name: string) => (/^the /i.test(name) ? name : `The ${name}`);
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const fmt = B.format;
const pct = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(x !== 0 && Math.abs(x) < 0.1 ? 1 : 0)}%`;
function dur(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h} h ${m} min` : m ? `${m} min` : `${Math.floor(sec)} s`;
}
function num(v: number) {
  return Math.abs(v) >= 10 ? String(Math.round(v)) : String(Math.round(v * 100) / 100);
}
function statLine(k: StatKey, v: number) {
  const label = STAT_LABEL[k];
  const n = num(v);
  const sign = v >= 0 ? '+' : '';
  if (label.startsWith('%') || label.startsWith('s ')) return `${sign}${n}${label}`;
  return `${sign}${n} ${label}`;
}
const RULE_TEXT: Record<string, string> = {}; // filled lazily from content texts
function effectLine(e: Effect, lv: number, text?: string): string {
  const parts: string[] = [];
  if (e.stat && e.per) parts.push(e.compound ? `${STAT_LABEL[e.stat].replace('% ', '')} x${Math.pow(1 + e.per / 100, Math.max(1, lv)).toFixed(2)}` : statLine(e.stat, e.per * Math.max(1, lv)));
  if (e.stat2 && e.per2) parts.push(statLine(e.stat2, e.per2 * Math.max(1, lv)));
  if (e.rule && text) parts.push(text);
  return parts.join(', ') || text || '';
}
void RULE_TEXT;
const KIND_ICON: Record<string, string> = { tapBuff: 'fist', allyBuff: 'banner', critBuff: 'eye', autoTap: 'echo', freeze: 'frost', goldBuff: 'coin', dot: 'drop', burst: 'sword' };
const kindIcon = (k: string) => KIND_ICON[k] ?? k;
/** A small pixel icon by kind (sword, coin, eye, banner, fist, echo, lantern, bell, flame, frost, bolt, drop, shield, clock, skull, book, heart, hand, star). */
const ic = (kind: string) => spellIcon(`ic-${kind}`, kind);
/** The new 32 px icon for a skill or spell, or today's 24 px one until it is drawn. */
const sIcon = (id: string, hint: string, size = 32) => icon32(id, size) || spellIcon(id, hint);
/** A stat's 32 px icon (shown smaller in tiles), or today's. */
const stIcon = (id: string, kind: string) => icon32(`stat:${id}`, 28) || ic(kind);
const HELP: Record<string, string> = {
  next: 'The next three things on your way down: the stage number and what waits there.',
  train: 'Train makes your taps stronger. Every 25 levels doubles it. Train levels reset when you fall.',
  level: 'Your level never resets. Kills give XP; each level is a race point for the Race tree.',
  quest: 'The quest chain gives class points (class tree and spells) and transformation points. It never ends.',
  coming: 'The next things on your path, nearest first.',
  elements: `From stage ${G.IMMUNE_FROM} some foes are immune to an element (⊘): that element does only ${G.IMMUNE_FLOOR}% to them, more with piercing (up to ${G.MAX_PIERCE}%). A weakness (▼) takes x${G.WEAK_MULT}. Every boss has at least one weakness.`,
  named: 'Each Named is a dead soul of Lanternfall with one element. Level milestones make them, their element or everyone stronger. In the strip: tap = level up, hold = details.',
  gear: `The number on each item is its Power. ▲ more than what it would replace, ▼ less, ⇪ can merge (two copies at the same + make +1, up to +${G.MAX_PLUS}). "Salvage worse" sells every ▼ below Epic. Set pieces, Artifacts and heirlooms are never sold.`,
  skills: 'Class points (from quests) buy the class tree and the 6 shared spells. Race points come from your level. Transformation points come from quests. A node needs a rank in the row above. ◆ = name from The Unwritten.',
  cleave: 'Cleave (overkill): leftover damage from a kill hits the next foes; it never touches a boss. Only the Warrior Berserker cleaves for real; pets, relics and sets add a little (at most 15% together).',
  pets: `Up to ${G.PETS_OUT} pets fight beside you; the rest give 10% of their bonus. Level them with Marks ✦. Eggs come from quests, chests, wandering bosses and dungeon bosses. There is one pet for every stat.`,
  dungeon: `A key opens a random death realm: ${G.DUNGEON_MOBS} foes and a boss in ${G.DUNGEON_SECONDS / 60} minutes. The boss always drops a piece of that realm's sets. 1 free key a day (up to ${G.KEY_CAP}); quests and tasks give more.`,
  fall: 'Fall at your deepest stage, wake in a random realm of death and reach its gate in 5 minutes. If the clock runs out the realm leaves a permanent scar. You keep Embers, relics, gear, points, pets, level and quests; you lose gold, Train and Named levels and the stage.',
  relics: 'Relics are kept forever. Find a random new one with Embers (dearer each time) and level any you own. ★ = rule-bender.',
  scars: 'Scars are permanent. Heal one for 20 times your best return in Embers, or win a rare escape.',
  tasks: '3 daily tasks (new each day) and 3 weekly tasks (new each Monday). The login cycle pauses on a missed day; it never resets.',
  ach: 'Achievements give Marks and a small permanent bonus for every tier.',
  trials: 'Tier trials. Your equipped class path and your form gain ranks from fighting; at rank 10 the next tier\'s trial appears here. Base class rank 10 shows the three subclass trials; you can own every subclass and equip one.',
};
/** Run 2, idea 22: one page of the game's own words, built from the in-game help so the facts stay in one place. */
const GLOSSARY: [string, string, string][] = [
  ['Train', 'sword', HELP.train],
  ['Level', 'star', HELP.level],
  ['Named', 'banner', HELP.named],
  ['Quests', 'star', HELP.quest],
  ['Class, race and transformation points', 'book', HELP.skills],
  ['Elements, immune and weak', 'shield', HELP.elements],
  ['Cleave', 'sword', HELP.cleave],
  ['Marks ✦', 'star', 'Marks level your pets. Login days, achievements and some rewards give them.'],
  ['Pets and eggs', 'eye', HELP.pets],
  ['Keys and dungeons', 'lantern', HELP.dungeon],
  ['Fall and escape', 'skull', HELP.fall],
  ['Embers', 'flame', 'Embers come from escaping a realm after a fall. Deeper falls pay more. They buy and level relics and heal scars.'],
  ['Relics', 'eye', HELP.relics],
  ['Scars', 'skull', HELP.scars],
  ['Trials and tiers', 'sword', HELP.trials],
  ['Daily and weekly tasks', 'clock', HELP.tasks],
];
/** Run 2, idea 32: what the always-visible numbers mean (hold them). */
const TOP_HELP = {
  stage: 'Your stage. Beat 8 foes and the boss to go one deeper. Every land has its own foes.',
  gold: 'Gold buys Train and Named levels. Foes drop it; Named earn it while you are away. It resets when you fall.',
  embers: 'Embers: earned by escaping after a fall. They buy relics, which last forever.',
  marks: 'Marks ✦ level your pets. Login days and achievements give them.',
  mana: 'Mana: spells and skills cost it. It refills as you fight.',
};
const helpBtn = (key: string) => `<button class="help" data-act="help:${key}" aria-label="Help">?</button>`;
const TAB_ICON: Record<string, string> = { named: 'banner', skills: 'book', quests: 'star', death: 'skull', menu: 'lantern' };

const elDot = (el: Element) => `<i class="eldot" style="--ec:${ELEMENT_COLOR[el]}" title="${ELEMENT_NAME[el]}"></i>`;

// ------------------------------------------------------------------ looks for the pixel view

function heroLook(st: State): HeroLook {
  const gear: HeroLook['gear'] = {};
  for (const [k, it] of Object.entries(st.equipped)) if (it) gear[k] = { rarity: it.rarity, look: it.look };
  return { race: st.hero.race, cls: st.hero.cls, form: st.hero.form, gear, scars: st.scars.length };
}

function foeLook(st: State, foe: G.Foe): FoeLook {
  const realm = st.dungeon && !st.dungeon.done ? st.dungeon.realm : st.escape && !st.escape.done ? st.escape.realm : undefined;
  return {
    name: foe.name, boss: foe.boss, land: realm ? -1 : G.landIndex(st.life.stage), realm,
    treasure: foe.kind === 'treasure', wanderer: foe.kind === 'wanderer', immune: foe.immune ?? [], weak: foe.weak ?? [],
  };
}

function namedLooks(st: State, d: G.Derived, foe: G.Foe): NamedLook[] {
  const total = B.isZero(d.allyDps) ? 0 : 1;
  return ALLIES.map((a, i) => {
    const lv = st.life.allyLevels[i];
    if (lv <= 0) return null;
    const el = NAMED_ELEMENTS[i] ?? 'phys';
    const next = G.nextMilestone(st, i);
    const prev = [0, ...((G.nextMilestone(st, i) === null ? [] : []))][0];
    void prev;
    return {
      i, look: a.look, element: el, level: lv,
      share: total ? Math.max(0, Math.min(1, B.ratio(d.namedDps[i], d.allyDps))) : 0,
      affordable: B.gte(st.life.gold, G.allyCost(st, i, 1)),
      immune: !!foe.immune?.includes(el),
      milestone: next ? Math.min(1, lv / next) : 1,
    } as NamedLook;
  }).filter((x): x is NamedLook => !!x);
}

// ------------------------------------------------------------------ character creation

// Lore lines for the creation screen (proposal flavour for this spin-off).
const RACE_LORE: Record<string, string> = {
  human: 'Lanternfall was built by human hands. They bend to any path.',
  elf: 'Old eyes from the far woods. Elves read the dead like books and move before the blow lands.',
  dwarf: 'Stone-folk of the deep vaults. They outlast bosses the way mountains outlast storms.',
  orc: 'Born to the war-drum. An orc swing ends most arguments before they start.',
  troll: 'They heal, they endure, and their old spirits still walk beside them.',
};
const CLASS_LORE: Record<string, { lore: string; role: string; icon: string }> = {
  // run 7 (Clarence: "a little corny"; "what about Duelist?"): short and grim, and every subclass is named
  warrior: { lore: 'The dead respect a blade that does not stop. Guardians hold the line, Berserkers break it, Duelists find the gap.', role: 'Melee · Tank · Cleave', icon: 'sword' },
  mage: { lore: 'Fire, time and the weave. Mages win with skills, not swings.', role: 'Caster · Skills · Mana', icon: 'flame' },
  rogue: { lore: 'Every foe has a soft place. Rogues remember where. Assassins end it, Tricksters unsettle it, Survivors outlast it.', role: 'Melee · Crits · Poison', icon: 'drop' },
  ranger: { lore: 'Past the last lantern, something is always hunting. Marksmen do not miss, Beastmasters do not walk alone, Thornwardens turn the ground to thorns.', role: 'Ranged · Beasts · Thorns', icon: 'eye' },
  cleric: { lore: 'Someone has to speak for the dead, so the dead fight for you. Templars carry the fire, Oracles see it coming, Inquisitors pass judgement.', role: 'Support · Named · Wards', icon: 'heart' },
};
const FAITH_ICON: Record<string, string> = { lantern: 'lantern', redhunt: 'sword', archive: 'book', iron: 'shield', veiled: 'coin', unbound: 'fist' };
const FORM_ICON: Record<string, string> = { mortal: 'star', vampire: 'drop', werewolf: 'fist', draconic: 'flame', undead: 'skull', elemental: 'bolt' };

function showCreate(start = 0) {
  const pick = { name: 'Vaelis', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' };
  const steps = ['race', 'cls', 'faith'] as const; // run 7 (Clarence): no Name step and no "Begin now"; the name box is on top
  const STEP_NAME: Record<string, string> = { race: 'Race', cls: 'Class', faith: 'Faith', form: 'Form', name: 'Name' };
  let step = start;
  const look = (over: Partial<typeof pick>) => heroLook(G.newGame({ ...pick, ...over }, 1, Date.now()));
  const bars = (attrs: Record<string, number>) => `<div class="bars">${ATTRS.map((a) => `<div class="barrow">${ic(ATTR_ICON[a])}<span>${ATTR_NAME[a]}</span><i><u style="width:${Math.min(100, (attrs[a] ?? 0) * 10)}%"></u></i><b>${attrs[a] ?? 0}</b></div>`).join('')}</div>`;
  const statChips = (st: Partial<Record<StatKey, number>>) => (Object.entries(st) as [StatKey, number][]).map(([k, v]) => `<span class="chip ${v < 0 ? 'bad' : 'good'}">${esc(statLine(k, v))}</span>`).join('');
  const detail = (): string => {
    const k = steps[step];
    if (k === 'race') {
      const r = RACES.find((x) => x.id === pick.race)!;
      const tree = RACE_TREES.find((x) => x.id === r.id);
      return `<h3>${r.name}</h3><p class="lore">${esc(RACE_LORE[r.id] ?? '')}</p><p class="rule">⚑ ${esc(r.text)}</p>
        ${tree ? `<h4>Race tree</h4><div class="chips">${tree.nodes.map((n) => `<span class="chip" data-long="text:${esc(n.text)}">${ic(n.effect.rule ? 'star' : 'shield')}${esc(n.name)}</span>`).join('')}</div>` : ''}`;
    }
    if (k === 'cls') {
      const c = CLASSES.find((x) => x.id === pick.cls)!;
      const lore = CLASS_LORE[c.id];
      const actives = c.tree.filter((n) => n.kind === 'active');
      const loop = G.CLASS_LOOP[c.id];
      return `<h3>${ic(lore?.icon ?? 'star')} ${c.name} <small class="note">T1 → subclass T2–T7</small></h3><p class="role">${lore?.role ?? ''}</p>
        ${loop ? `<p class="rule">⚑ <b>${esc(loop.name)}</b>: ${esc(loop.text)}</p>` : ''}<p class="lore">${esc(lore?.lore ?? c.text)}</p>
        <div class="chips"><span class="chip good">Main: ${ATTR_NAME[c.main]}</span>${c.branches.map((b) => `<span class="chip">${esc(b)}</span>`).join('')}</div>
        <h4>Skills</h4><div class="skillprev">${actives.map((n) => `<div data-long="text:${esc(ACTIVE_HELP[n.active!](1))}">${sIcon(n.id, kindIcon(n.active!))}<small>${esc(n.name)}</small></div>`).join('')}</div>`;
    }
    if (k === 'faith') {
      const f = FAITHS.find((x) => x.id === pick.faith)!;
      const [motto, ...rule] = f.text.split('. ');
      return `<h3>${ic(FAITH_ICON[f.id] ?? 'star')} ${f.name}</h3><p class="lore">${esc(motto)}.</p><p class="rule">⚑ ${esc(rule.join('. '))}</p>
        <p class="note">Type your name in the box at the top. Race, class and faith are kept for the whole save (gems can Reshape them later). You begin as a Mortal Master: subclasses and transformations are earned through quests.</p>`;
    }
    if ((k as string) === 'form') {
      const f = FORMS.find((x) => x.id === pick.form)!;
      const tree = FORM_TREES.find((x) => x.id === (f.id === 'mortal' ? 'mastery' : f.id));
      return `<h3>${ic(FORM_ICON[f.id] ?? 'star')} ${f.name}</h3><p class="lore">${esc(f.text)}</p><div class="chips">${statChips(f.stats)}</div>
        ${tree ? `<h4>${f.id === 'mortal' ? 'Mastery' : 'Transformation'} tree</h4><div class="chips">${tree.nodes.map((n) => `<span class="chip" data-long="text:${esc(n.text)}">${ic(n.effect.rule ? 'star' : 'flame')}${esc(n.name)}</span>`).join('')}</div>` : ''}`;
    }
    const r = RACES.find((x) => x.id === pick.race)!;
    const c = CLASSES.find((x) => x.id === pick.cls)!;
    const f = FAITHS.find((x) => x.id === pick.faith)!;
    const fm = FORMS.find((x) => x.id === pick.form)!;
    void fm;
    const rows: [string, string][] = [['race', r.name], ['cls', c.name], ['faith', f.name]];
    return `<h3>Your hero</h3>
      <div class="summary">${rows.map(([k2, v], i) => `<button class="chip" data-step="${i}">${STEP_NAME[k2]}: <b>${v}</b></button>`).join('')}</div>
      <p class="note">These choices are kept for the whole save. You begin mortal: subclasses and transformations are earned through quests and tiers.</p>`;
  };
  const options = (): string => {
    const k = steps[step];
    if (k === 'race') return RACES.map((r) => `<button class="opt ${pick.race === r.id ? 'on' : ''}" data-k="race" data-v="${r.id}">${heroPortrait(look({ race: r.id }), 56)}<b>${pick.race === r.id ? '✓ ' : ''}${r.name}</b></button>`).join('');
    if (k === 'cls') return CLASSES.map((c) => `<button class="opt ${pick.cls === c.id ? 'on' : ''}" data-k="cls" data-v="${c.id}">${heroPortrait(look({ cls: c.id }), 56)}<b>${pick.cls === c.id ? '✓ ' : ''}${c.name}</b></button>`).join('');
    if (k === 'faith') return FAITHS.map((f) => `<button class="opt crest ${pick.faith === f.id ? 'on' : ''}" data-k="faith" data-v="${f.id}">${ic(FAITH_ICON[f.id] ?? 'star')}<b>${pick.faith === f.id ? '✓ ' : ''}${f.name}</b></button>`).join('');
    if ((k as string) === 'form') return FORMS.map((f) => `<button class="opt ${pick.form === f.id ? 'on' : ''}" data-k="form" data-v="${f.id}">${heroPortrait(look({ form: f.id }), 56)}<b>${f.name}</b></button>`).join('');
    return '';
  };
  const draw = () => {
    const last = step === steps.length - 1;
    app.innerHTML = `
      <div class="create rpg">
        <h1 class="gtitle">The Unwritten<small>Lanternfall</small></h1>
        <div class="stepper">${steps.map((k, i) => `<button data-step="${i}" class="${i === step ? 'on' : i < step ? 'done' : ''}"><i>${i + 1}</i>${STEP_NAME[k]}</button>`).join('')}</div>
        <div class="stagebox"><div class="hero-big">${heroPortrait(look({}), 168)}</div><div class="plate"><input id="hname" class="nameinput" maxlength="18" value="${esc(pick.name)}" placeholder="Your name" aria-label="Hero name" autocomplete="off"><small>${RACES.find((r) => r.id === pick.race)!.name} ${CLASSES.find((c) => c.id === pick.cls)!.name}</small></div></div>
        <div class="opts">${options()}</div>
        ${step === 0 ? '<p class="note center">Hold any picture or chip to read more.</p>' : ''}
        <div class="card detail">${detail()}</div>
        <div class="navrow"><button data-nav="-1" ${step === 0 ? 'disabled' : ''}>← Back</button><button class="big go" data-nav="1">${last ? 'Begin' : 'Next →'}</button></div>
      </div><div id="modal" class="modal" hidden></div>`;
  };
  app.oninput = (ev) => {
    const el = ev.target as HTMLInputElement;
    if (el.id === 'hname') pick.name = el.value.trim().slice(0, 18) || 'Vaelis';
  };
  app.onclick = (ev) => {
    if (longFired) { longFired = false; return; }
    if ((ev.target as HTMLElement).closest('[data-act="close"]')) { closeModal(); return; }
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-k],[data-step],[data-nav]');
    if (!el || s) return;
    const nameEl = document.getElementById('hname') as HTMLInputElement | null;
    if (nameEl) pick.name = (nameEl.value || 'Vaelis').trim().slice(0, 18);
    if (el.dataset.k) (pick as Record<string, string>)[el.dataset.k] = el.dataset.v!;
    else if (el.dataset.step) step = Number(el.dataset.step);
    else if (el.dataset.nav) {
      if ((el.dataset.nav === '1' && step === steps.length - 1) || el.dataset.nav === 'quick') {
        const seed = (Date.now() ^ Math.floor(Math.random() * 2 ** 31)) | 0;
        s = G.newGame({ ...pick }, seed, Date.now());
        app.onclick = null;
        app.oninput = null;
        save();
        startGame(false);
        return;
      }
      step = Math.max(0, Math.min(steps.length - 1, step + Number(el.dataset.nav)));
      window.scrollTo(0, 0);
      app.querySelector('.create')?.scrollTo(0, 0);
    }
    draw();
  };
  draw();
}

// ------------------------------------------------------------------ main screen

type Tab = 'hero' | 'named' | 'gear' | 'skills' | 'pets' | 'quests' | 'death' | 'menu';
const TAB_NAME: Record<Tab, string> = { hero: 'Hero', named: 'Named', gear: 'Gear', skills: 'Skills', pets: 'Pets', quests: 'Quests', death: 'Death', menu: 'Menu' };
function tabIcon(t: Tab): string {
  const t32 = icon32(`tab:${t}`, 24);
  if (t32) return t32;
  if (t === 'hero') return s ? heroPortrait(heroLook(s), 22) : ic('fist');
  if (t === 'gear') return itemIcon('chest', 'rare');
  if (t === 'pets') return petIcon('crow', 'phys');
  return ic(TAB_ICON[t] ?? 'star');
}
type SkillTab = 'class' | 'spells' | 'race' | 'form';
let tab: Tab = 'hero';
/** Layout B: the fight screen, or one tab's page covering the fight. */
let tabOpen = false;
let skillTab: SkillTab = 'class';
let menuPage: 'main' | 'notes' | 'help' | 'save' | 'words' = 'main';
type HeroTab = 'train' | 'stats' | 'rewards';
type QuestTab = 'quest' | 'trials' | 'daily' | 'weekly';
type GearTab = 'worn' | 'bag' | 'sets' | 'stash' | 'found';
type DeathTab = 'fall' | 'relics' | 'dungeon';
let heroTab: HeroTab = 'train';
let questTab: QuestTab = 'quest';
let gearTab: GearTab = 'worn';
let deathTab: DeathTab = 'fall';
let lastBeat = -1;
let qty: 1 | 10 | 'max' = 1;
let pointerDown = false;
let lastPanel = '';
let modalOpen: string | null = null; // which modal is up, so it is not redrawn under the player's finger
let inspect: { id?: number; slot?: Slot } | null = null;
let view: BattleView | null = null;
let longFired = false;

function startGame(fromSave: boolean) {
  app.innerHTML = `
    <div class="game">
      <header id="top">
        <div data-long="text:${esc(TOP_HELP.stage)}"><div id="stage" class="stage"></div><div id="zone" class="zone"></div><div id="evchip" class="evchip" hidden></div></div>
        <div class="money">
          <div data-long="text:${esc(TOP_HELP.gold)}"><span class="gold-i"></span><b id="gold"></b></div>
          <div class="sub"><span data-long="text:${esc(TOP_HELP.embers)}"><span class="ember-i"></span><b id="embers"></b></span><span title="Marks" data-long="text:${esc(TOP_HELP.marks)}">✦<b id="marks"></b></span><button id="keys" class="keybtn" data-act="dungeon">🗝<b id="keyn"></b></button><button id="gemsbtn" class="keybtn" data-act="reshape" aria-label="Gems: Reshape">💎<b id="gemn"></b></button></div>
        </div>
      </header>
      <div id="mini" class="mini"><span id="mininame"></span><div class="mhp"><i id="minihp"></i></div></div>
      <section id="battle">
        <div id="view"></div>
        <div id="escbar" class="escbar"></div>
        <div class="foeinfo"><div id="foename"></div><div id="gimtell" class="gimtell" hidden></div><div class="bar hp"><i id="hpfill"></i><span id="hptext"></span></div>
          <div class="bar timer" id="timerbar"><i id="timerfill"></i><span id="timertext"></span></div>
          <div id="dots" class="dots"></div></div>
        <div id="dark" class="dark"></div>
        <div id="candle" class="candle" hidden><i class="stub"></i><i class="wax" id="wax"></i><i class="flame" id="flame"></i><b id="candlet"></b></div>
        <div id="bigcount" class="bigcount"></div>
        <div id="floats"></div>
        <div id="banner" class="banner"></div>
        <div id="combo" class="combo"></div>
        <div id="coach" class="coach" hidden>👆<b>TAP</b></div>
        <button id="fightboss" class="fightboss" hidden>Fight boss</button>
        <button id="bellbtn" class="bellbtn" hidden aria-label="Tap the bell to stop the toll">🔔<b>TAP</b></button>
        <button id="weakspot" class="weakspot" hidden aria-label="Weak spot: tap it for triple damage">✸</button>
        <div id="huntchip" class="huntchip" hidden></div>
        <button id="shrinebtn" class="shrinebtn" hidden data-act="shrine">⛩<b>Shrine</b></button>
        <div id="hint" class="hint"></div>
        <div id="classmeter" class="classmeter"></div>
      </section>
      <div id="strip"></div>
      <div id="skillbar" class="skillbar"></div>
      <div class="manabar" id="manabar" data-long="text:${esc(TOP_HELP.mana)}"><i id="manafill"></i></div>
      <button id="mainquest" class="mainquest" data-act="qtab:quest"></button>
      <button id="grab" class="grab" aria-label="Back to the fight"><i></i></button>
      <main id="panel"></main>
      <nav id="tabs">${(Object.keys(TAB_NAME) as Tab[]).map((t) => `<button data-tab="${t}">${tabIcon(t)}<span>${TAB_NAME[t]}</span><i class="badge"></i></button>`).join('')}</nav>
      <div id="modal" class="modal" hidden></div>
    </div>`;

  applyTabOpen();
  const battle = document.getElementById('battle')!;
  view = createBattleView(document.getElementById('view')!);
  battle.addEventListener('pointerdown', (ev) => {
    if ((ev.target as HTMLElement).closest('button')) return;
    ev.preventDefault();
    if (s && s.life.fairy && view?.fairyHitTest(ev.clientX, ev.clientY)) {
      const got = G.collectFairy(s);
      if (got) floatText(ev.clientX, ev.clientY, got, 'fairy');
      return;
    }
    doTap(ev.clientX, ev.clientY);
  });
  document.getElementById('fightboss')!.addEventListener('click', () => s && G.fightBoss(s));
  // run 4: the weak spot is its own target; a tap on it is a tap on the foe that the rules count as a weak-spot hit
  document.getElementById('weakspot')!.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); ev.preventDefault(); doTap(ev.clientX, ev.clientY, true); });
  document.getElementById('bellbtn')!.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); if (s && G.cancelToll(s)) { buzz(15); if (prefs.sound) sfx.chime(); } });
  document.getElementById('tabs')!.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
    if (b && s && !G.tabReady(s, b.dataset.tab!)) { nope(b, G.TAB_LOCK_TEXT[b.dataset.tab!] ?? 'Not open yet.'); return; }
    if (b) goTab(b.dataset.tab as Tab, true);
  });
  document.getElementById('skillbar')!.addEventListener('click', (ev) => {
    if (longFired) { longFired = false; return; }
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-use]');
    if (b && s) {
      if (G.useSkill(s, b.dataset.use!)) flash(b);
      else {
        const why = G.canUse(s, b.dataset.use!);
        if (why === 'locked') { skillTab = SPELLS.some((x) => x.id === b.dataset.use) ? 'spells' : 'class'; goTab('skills'); }
        else if (why === 'cooldown') nope(b, `Ready again in ${Math.ceil(s.life.cooldowns[b.dataset.use!] ?? 0)} s (the number on the button).`);
        else if (why === 'mana') nope(b, 'Not enough mana. The blue line under the spells refills as you fight.');
      }
    }
  });
  for (const id of ['panel', 'modal', 'strip', 'top', 'mainquest', 'battle']) document.getElementById(id)!.addEventListener('click', (ev) => act(ev));
  document.getElementById('modal')!.addEventListener('click', (ev) => {
    if (ev.target === ev.currentTarget && ['info', 'inspect', 'confirm', 'offline'].includes(modalOpen ?? '')) closeModal();
    // play-test gate: testers tapped just above Close and nothing happened. An info popup is text only, so any tap on it closes it.
    else if (modalOpen === 'info' && !longFired && !(ev.target as HTMLElement).closest('button, a, textarea, input, [data-act]')) closeModal();
  });
  // item 6: the grab bar on a half-cover tab page gives the fight the whole screen
  document.getElementById('grab')!.addEventListener('click', () => closeTab());
  document.addEventListener('pointerdown', () => (pointerDown = true));
  document.addEventListener('pointerup', () => setTimeout(() => (pointerDown = false), 60));
  document.addEventListener('pointercancel', () => (pointerDown = false));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) save();
    else catchUp();
  });
  window.addEventListener('pagehide', save);

  // run 3 play-test: messages saved with an old game showed up late (a stage-5 quest toast at stage 104); keep only the last two
  if (fromSave && s!.events.length > 2) s!.events.splice(0, s!.events.length - 2);
  if (fromSave) catchUp();
  firstWelcome = false;
  if (fromSave && prefs.seenPatch !== PATCH) {
    if (prefs.seenPatch !== undefined || s!.totalTaps > 50) setTimeout(() => toast(`Updated to ${PATCH}. See what's new: Menu › Patch notes.`), 1500);
    prefs.seenPatch = PATCH; savePrefs();
  }
  else if (s) G.refreshDaily(s, Date.now());
  renderPanel(true);
  requestAnimationFrame(frame);
  setInterval(save, 5000);
}

function markGearSeen() {
  if (tab === 'gear' && tabOpen && s) { prefs.seenItem = s.bag.reduce((m, it) => Math.max(m, it.id), prefs.seenItem); savePrefs(); }
}
function applyTabOpen() {
  document.querySelector('.game')?.classList.toggle('tabopen', tabOpen);
}
/** Back to the fight screen. */
function closeTab() {
  markGearSeen();
  tabOpen = false;
  applyTabOpen();
  if (s) renderBadges();
}
function goTab(t: Tab, toggle = false) {
  if (toggle && tabOpen && tab === t) { closeTab(); return; }
  if (t !== tab) markGearSeen();
  tab = t;
  tabOpen = true;
  applyTabOpen();
  if (t === 'menu') menuPage = 'main';
  for (let i = toastQueue.length - 1; i >= 0; i--) if (!BIG.test(toastQueue[i])) toastQueue.splice(i, 1);
  if (s && !prefs.heldOnce && (prefs.holdTips ?? 0) < 3 && G.firstRunStep(s) >= G.FIRST_RUN_STEPS) {
    prefs.holdTips = (prefs.holdTips ?? 0) + 1; savePrefs();
    toast('Tip: press and hold any row, number or icon to see what it does.');
  }
  lastPanel = '';
  renderPanel(true);
  document.getElementById('panel')!.scrollTop = 0;
  renderBadges();
}

/** The save could not be read. Keep it, show it, and let the player paste a code or deliberately start again. */
function showRecovery(raw: string, reason: string) {
  app.innerHTML = `<div class="recovery">
    <h1>${ic('lantern')} Your save could not be read</h1>
    <p>${esc(reason)} It has <b>not</b> been deleted: a copy is kept on this device, and nothing will be written over it.</p>
    <h3>If you copied a save code before</h3>
    <textarea id="rcode" placeholder="Paste a code that starts with UT1:"></textarea>
    <button class="big" data-r="load">Load this code</button>
    <p class="rerr" id="rerr"></p>
    <h3>The unreadable save (for help, or to keep)</h3>
    <textarea id="rraw" readonly>${esc(raw)}</textarea>
    <button data-r="copy">Copy it</button>
    <h3>Or start again</h3>
    <p class="note">Starts a new character. The unreadable save stays kept on this device.</p>
    <button class="danger" data-r="new">Start new</button>
    <div id="rconfirm" hidden><p class="warn">Sure? A new game will be saved from now on.</p><button class="big danger" data-r="new-yes">Yes, start new</button></div>
  </div>`;
  app.onclick = (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-r]');
    if (!el) return;
    const a = el.dataset.r;
    if (a === 'load') {
      try {
        s = G.importCode((document.getElementById('rcode') as HTMLTextAreaElement).value);
        saveBlocked = false;
        app.onclick = null;
        save();
        startGame(false);
      } catch (e) { setText('rerr', (e as Error).message); }
    } else if (a === 'copy') {
      const t = document.getElementById('rraw') as HTMLTextAreaElement;
      t.select();
      navigator.clipboard?.writeText(t.value).then(() => setText('rerr', 'Copied.'), () => setText('rerr', 'Select the text and copy it.'));
    } else if (a === 'new') {
      (document.getElementById('rconfirm') as HTMLElement).hidden = false;
    } else if (a === 'new-yes') {
      saveBlocked = false;
      app.onclick = null;
      showCreate();
    }
  };
}

/** Long-press (about half a second) on anything with data-long shows its details. */
function setupLongPress() {
  let timer = 0;
  let startX = 0;
  let startY = 0;
  document.addEventListener('pointerdown', (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-long]');
    if (!el) return;
    startX = ev.clientX;
    startY = ev.clientY;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      longFired = true;
      if (!prefs.heldOnce) { prefs.heldOnce = true; savePrefs(); }
      showInfo(el.dataset.long!);
    }, 450);
  });
  const cancel = () => window.clearTimeout(timer);
  document.addEventListener('pointerup', () => {
    cancel();
    // the click that ends this same hold is swallowed; after it, taps work again (testers needed 2-6 taps to close popups)
    if (longFired) setTimeout(() => { longFired = false; }, 0);
  });
  document.addEventListener('pointercancel', cancel);
  document.addEventListener('pointermove', (ev) => { if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 12) cancel(); });
  document.addEventListener('contextmenu', (ev) => { if ((ev.target as HTMLElement).closest('[data-long]')) ev.preventDefault(); });
}

/** Time away: under 5 s just runs on; longer counts as offline (Named gold, capped at 24 h). */
/** Run 3, item 8: the first time you reach a land below the Bell, a card says where you are. Deeper copies get a banner. */
function arriveLand(st: State, z: ReturnType<typeof zoneFor>) {
  const land = G.landIndex(z.from);
  banner(z.name, 'clear');
  if (land < BELLROPE || z.base !== undefined || st.landsSeen.includes(land)) return;
  st.landsSeen.push(land);
  const bishop = Math.ceil(z.from / BISHOP_EVERY) * BISHOP_EVERY;
  showModal('confirm', `<div class="arrive"><small>Land ${land + 1}</small><h2>${esc(z.name)}</h2>
    ${z.line ? `<p class="arrline">${esc(z.line)}</p>` : ''}
    <div class="arrfacts">
      ${z.immune ? `<p>${ic('shield')} <span>Foes here are often immune to <b style="color:${ELEMENT_COLOR[z.immune]}">${ELEMENT_NAME[z.immune]}</b>. Named of another element help.</span></p>` : ''}
      <p>${ic('skull')} <span>Its bosses take turns: ${(z.bosses ?? [z.boss]).map(esc).join(', ')}.</span></p>
      <p>${ic('skull')} <span>The Hollow Bishop waits at stage ${bishop}.</span></p>
    </div>
    <button class="big" data-act="close">Onward</button></div>`);
}

function catchUp() {
  if (!s) return;
  const now = Date.now();
  const gap = (now - s.lastSeen) / 1000;
  if (gap > 5) {
    const loginBefore = s.daily.loginGiven;
    const loginDay = s.daily.loginDay;
    const r = G.applyOffline(s, now);
    G.refreshDaily(s, now);
    const gotLogin = s.daily.loginGiven !== loginBefore ? LOGIN[loginDay % LOGIN.length] : undefined;
    if (r.seconds > 60) { // run 2, item 17: shown even when no gold came in
      const st = s;
      const waiting: string[] = [];
      const [qh, qn] = G.questProgress(st);
      if (qh >= qn) waiting.push(`${ic('star')} Quest ready`);
      const trials = G.availableTrials(st).filter((tr) => { const [h, n] = G.trialProgress(st, tr); return h >= n; }).length;
      if (trials) waiting.push(`${ic('sword')} ${trials} trial${trials > 1 ? 's' : ''}`);
      if (st.keys) waiting.push(`🗝 ${st.keys} key${st.keys > 1 ? 's' : ''}`);
      if (st.eggs) waiting.push(`${petIcon('wisp', 'magic')} ${st.eggs} egg${st.eggs > 1 ? 's' : ''}`);
      const tasks = st.daily.tasks.filter((x) => !x.claimed).length;
      if (tasks) waiting.push(`${ic('clock')} ${tasks} daily task${tasks > 1 ? 's' : ''}`);
      const title = firstWelcome ? `<div class="wbtitle"><b>The Unwritten</b><small>LANTERNFALL</small></div><p class="wbhero">${esc(st.hero.name)} · ${esc(G.classOf(st).name)} · stage ${st.life.stage}</p>` : '';
      firstWelcome = false;
      showModal('offline', `${title}<h2>Welcome back</h2>
        <p class="note">${esc(dur(r.seconds))} away${r.capped ? ' (24 h max)' : ''}</p>
        ${B.isZero(r.gold) ? '<p class="note">No gold while away. Hire Named: they fight while you are gone.</p>' : `<p class="big-gold"><span class="gold-i"></span> +${fmt(r.gold)}</p>`}
        ${r.top?.length || r.stages ? `<div class="wb-log">${(r.top ?? []).map((x) => `<p>${ic('banner')} <b>${esc(ALLIES[x.i].name)}</b> did ${Math.round(x.share * 100)}% of the work</p>`).join('')}${r.stages ? `<p>${ic('star')} ${st.hero.cls === 'cleric' ? 'Vigil: climbed' : 'Pushed'} ${r.stages} stages deeper, now stage ${st.life.stage}</p>` : ''}</div>` : ''}
        ${st.hero.cls === 'cleric' && r.seconds >= G.VIGIL_MIN_SECONDS ? `<p class="note">🕯 Prayer is full from your Vigil. Keep tapping to hold it.</p>` : ''}
        ${(() => { const we = G.weeklyElement(st); return we ? `<p class="wb-week">This week: <b style="color:${ELEMENT_COLOR[we]}">${ELEMENT_NAME[we]}</b> damage +${Math.round(G.WEEKLY_BONUS * 100)}%</p>` : ''; })()}
        ${gotLogin ? `<p class="wb-login">${ic('star')} Day ${loginDay % LOGIN.length + 1} login: ${rewardIcons(gotLogin.rewards)}</p>` : ''}
        ${(() => { const g = G.upcomingGoals(st)[0]; return g ? `<p class="wb-next">Next goal: ${goalHtml(g)}</p>` : ''; })()}
        ${waiting.length ? `<div class="chips">${waiting.map((w) => `<span class="chip">${w}</span>`).join('')}</div>` : ''}
        <button class="big" data-act="close">${title ? 'Continue' : 'Fight on'}</button>`);
    }
  }
  G.refreshDaily(s, now);
  s.lastSeen = now;
}

let lastFrame = performance.now();
let lastPanelTime = 0;
let namedFlashT = 0;
let lastFoe: G.Foe | null = null;
let seenFoe: G.Foe | null = null;
let lastKillFx = 0;
let seenStage = 0;
let wardTold = false;
let sellOpen = false;
let seenEvent: unknown = null;
const EVENT_ICON: Record<G.EventId, string> = { eclipse: '🌑', belltoll: '🔔', gravrush: '💰', collector: '⚖' };
let lastBagId = 0;
const crashTest = new URLSearchParams(location.search).get('crash') === '1';
let lastInput = performance.now();
let skipN = 0;
['pointerdown', 'keydown'].forEach((k) => document.addEventListener(k, () => { lastInput = performance.now(); }, { passive: true }));
function frame(t: number) {
  if (crashed) return;
  // run 2, idea 38: after 60 s with no touch and no boss on screen, draw every 3rd frame (the game still runs at full speed)
  const idle = t - lastInput > 60000 && !(s && G.foeNow(s).boss) && !modalOpen;
  if (idle && (skipN++ % 3) !== 0) { requestAnimationFrame(frame); return; }
  try {
    frameBody(t);
  } catch (e) {
    showCrash(e);
    return;
  }
  requestAnimationFrame(frame);
}
function frameBody(t: number) {
  if (crashTest) throw new Error('Crash test (?crash=1).');
  const dt = t < hitStopUntil ? 0 : Math.min(0.5, (t - lastFrame) / 1000);
  lastFrame = t;
  if (s) {
    const now = Date.now();
    if ((now - s.lastSeen) / 1000 > 5) catchUp();
    if (!modalOpen || modalOpen === 'inspect' || modalOpen === 'info') {
      const ev = G.tick(s, dt);
      if (ev.escapeEnded || ev.dungeonEnded) lastPanel = '';
      if (ev.wandererLeft) toast('The wandering boss left.');
      // run 6 (Elliot testers): "boss failure was too quiet"
      if (ev.bossFailed) { banner('⏱ The boss outlasted you', 'boss'); toast('Grow stronger (Hero, Named, Gear), then tap Fight boss.'); buzz(40); }
    }
    s.lastSeen = now;
    if (!modalOpen) {
      prefs.playSec = (prefs.playSec ?? 0) + dt;
      if (prefs.playSec >= (prefs.saveNagAt ?? 3600)) {
        prefs.saveNagAt = prefs.playSec + 10 * 3600;
        showModal('confirm', `<h2>${ic('lantern')} Keep your hero safe</h2>
          <p>Your game saves on this phone. If the browser data is cleared, it is gone. Copy your save code somewhere safe (notes, an email to yourself).</p>
          <textarea id="codeout" readonly>${esc(G.exportCode(s))}</textarea>
          <button class="big" data-act="copy">Copy my save code</button><button data-act="close">Later</button>`);
      }
      maybeScare();
      if (Math.floor(prefs.playSec) % 30 === 0) savePrefs();
    }
    renderBattle(dt);
    while (s.events.length) toast(s.events.shift()!);
    if (t - autoT > 1000 && !modalOpen) {
      autoT = t;
      if (prefs.autocast && G.autoCastUnlocked(s)) { const id = G.autoCast(s); if (id) { const b = document.querySelector<HTMLElement>(`[data-use="${id}"]`); if (b) flash(b); } }
      if (prefs.autobuy && G.autoBuyUnlocked(s)) G.autoBuy(s);
    }
    if (t - lastPanelTime > 300) {
      lastPanelTime = t;
      renderPanel(false);
      renderBadges();
      refreshForge();
      checkModals();
      if (dayCheck++ % 20 === 0) G.refreshDaily(s, now);
    }
  }
}

/** Something broke: stop, protect the last good save, and hand the player their save text. */
let crashed = false;
function showCrash(e: unknown) {
  if (crashed) return;
  crashed = true;
  saveBlocked = true; // the state in memory may be the broken thing; keep the last good save as it is
  const msg = e instanceof Error ? e.message : String((e as { reason?: unknown })?.reason ?? e);
  const raw = readStored() ?? '';
  const box = document.createElement('div');
  box.className = 'crash';
  box.innerHTML = `<div class="crashcard"><h2>${ic('skull')} Something broke</h2>
    <p>The game stopped to keep your progress safe. Your last good save is untouched.</p>
    <p class="note">${esc(msg.slice(0, 200))}</p>
    <h3>Your save (copy it somewhere safe)</h3>
    <textarea readonly>${esc(raw)}</textarea>
    <div class="row"><button data-c="copy">Copy</button><button class="big" data-c="reload">Reload</button></div><p class="rerr"></p></div>`;
  box.onclick = (ev) => {
    const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-c]');
    if (!el) return;
    if (el.dataset.c === 'reload') location.reload();
    else {
      const ta = box.querySelector('textarea')!;
      ta.select();
      navigator.clipboard?.writeText(ta.value).then(() => { box.querySelector('.rerr')!.textContent = 'Copied.'; }, () => { box.querySelector('.rerr')!.textContent = 'Select the text and copy it.'; });
    }
  };
  document.body.appendChild(box);
}
window.addEventListener('error', (ev) => showCrash(ev.error ?? ev.message));
window.addEventListener('unhandledrejection', (ev) => showCrash(ev.reason));
let dayCheck = 0;

let immuneTold: G.Foe | null = null;
let combo = 0;
let lastTapAt = 0;
function doTap(x: number, y: number, weak = false) {
  if (!s || modalOpen) return;
  const foe = G.foeNow(s);
  const r = G.tap(s, { weak });
  if (r.weak) { floatText(x, y - 24, `✸ x${G.WEAK_SPOT_MULT}`, 'crit'); buzz(12); }
  if (B.isZero(r.dmg) && !r.killed) {
    // a foe immune to your element: say so instead of doing nothing
    if (foe.immune?.includes(r.el)) {
      floatText(x, y, `⊘ ${ELEMENT_NAME[r.el]}`, 'immune');
      // testers stalled here thinking the game was broken: say it big, once per foe, with what still works
      if (immuneTold !== foe) {
        immuneTold = foe;
        banner(`⊘ Immune to your ${ELEMENT_NAME[r.el]} taps`, 'wander');
        toast('Your Named and pets still hurt it. Level them up, or wear a weapon of another element.');
      }
    }
    return;
  }
  view?.strike(r.crit);
  view?.foeHit(r.el, r.crit);
  const now = performance.now();
  combo = now - lastTapAt < 700 ? combo + 1 : 1;
  lastTapAt = now;
  floatText(x, y, fmt(r.dmg), r.crit ? 'crit' : '', r.el);
  // run 2, idea 48: numbers grow with the combo (up to 1.6x at x30)
  const ft = document.getElementById('floats')!.lastElementChild as HTMLElement | null;
  if (ft && combo >= 5) ft.style.fontSize = `${Math.min(1.6, 1 + (combo - 4) * 0.025)}em`;
  const c = document.getElementById('combo')!;
  if (combo >= 5) { c.innerHTML = `x${combo}<small>streak</small>`; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
  if (r.crit) { shake(false); buzz(8); }
  if (r.killed && foe.boss) { shake(true); buzz(30); }
  if (prefs.sound) sfx.tap(r.crit);
  if (prefs.hitstop && (r.crit || (r.killed && foe.boss))) hitStopUntil = performance.now() + (r.killed && foe.boss ? 110 : 45);
}
/** Run 2, idea 29: a short freeze on crits and boss kills (off by default). */
let hitStopUntil = 0;
let autoT = 0;

/** Run 3, item 18: do a buy and float what it added ("+1.2K tap"), so every purchase visibly does something. */
function gain(el: HTMLElement, buy: () => number, read: () => B.Big, what: string): boolean {
  const before = read();
  if (!buy()) return false;
  const add = B.sub(read(), before);
  const r = el.getBoundingClientRect();
  if (!B.isZero(add)) floatText(r.left + r.width / 2, r.top, `+${fmt(add)} ${what}`, 'gain');
  return true;
}
/** Run 3, item 18: a Named milestone says what it gave. */
function milestoneToast(st: State, i: number, before: number) {
  const now = st.life.allyLevels[i];
  for (const m of NAMED_MILESTONES[i] ?? []) {
    if (m.level <= before || m.level > now) continue;
    const who = ALLIES[i].name;
    const el = ELEMENT_NAME[G.namedElement(i)];
    const what = m.scope === 'self' ? `${who} deals +${m.pct}% damage` : m.scope === 'element' ? `every ${el} Named deals +${m.pct}%` : m.scope === 'all' ? `every Named deals +${m.pct}%` : `your taps deal +${m.pct}%`;
    toast(`${who} level ${m.level}: ${what}.`);
  }
}
function floatText(x: number, y: number, text: string, cls: string, el?: Element, color?: string) {
  const host = document.getElementById('floats')!;
  if (host.childElementCount > 14) host.firstElementChild?.remove();
  const box = document.getElementById('battle')!.getBoundingClientRect();
  const e = document.createElement('div');
  e.className = `float ${cls}`;
  e.textContent = text;
  if (el && el !== 'phys' && cls !== 'crit') e.style.color = ELEMENT_COLOR[el];
  if (color) e.style.color = color;
  e.style.left = `${x - box.left + (Math.random() * 30 - 15)}px`;
  e.style.top = `${y - box.top - 20}px`;
  host.appendChild(e);
  setTimeout(() => e.remove(), cls === 'loot' ? 1600 : 800);
}

/** A tap that cannot do anything still answers: a small shake and what is missing (run 2, item 9). */
/** "1.99K / 2.00K" must never look finished: round the progress down, so only a real finish shows the full number. */
function progressText(h: number, n: number): string {
  if (h >= n) return `${fmt(B.big(n))} / ${fmt(B.big(n))}`;
  const shown = fmt(B.big(h));
  return shown === fmt(B.big(n)) ? `${Math.floor((h / n) * 1000) / 10}%` : `${shown} / ${fmt(B.big(n))}`;
}
function nope(el: HTMLElement, msg: string) {
  el.classList.remove('nope');
  void el.offsetWidth;
  el.classList.add('nope');
  buzz(12);
  toast(msg);
}
function flash(el: HTMLElement) {
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

// ------------------------------------------------------------------ battle

/** Run 5: each class's meter under the fight (long-press explains the loop). */
/** Run 5 gate: testers found their class's loop late or never; say it once, on the fight, the first time. */
function classIntro(st: State) {
  const k = st.hero.cls;
  const loop = G.CLASS_LOOP[k];
  if (!loop || (prefs.seenLoop ?? []).includes(k) || modalOpen) return;
  (prefs.seenLoop ??= []).push(k); savePrefs();
  const how: Record<string, string> = {
    warrior: 'Tap fast: the Rage bar under the fight fills. When it says "next tap: STRIKE!", your next tap hits for 25x.',
    mage: 'Tap to refill the mana bar under the fight, then tap a glowing spell on the bar below to cast it.',
    rogue: 'On bosses and elites a glowing ✸ appears. Tap it for 5x and a combo; do not leave it waiting.',
    ranger: 'Your arrows fire on their own. Spend your time on gear, pets and Named; tap when you like.',
    cleric: 'Keep tapping to fill Prayer: your Named hit up to 3x harder. Stop, and it fades. Close the game for a while and your Vigil climbs for you, toward 90% of your best stage.',
  };
  showModal('confirm', `<h2>⚑ ${esc(classOf(st))}: ${esc(loop.name)}</h2><p>${esc(loop.text)}</p><p class="rule">👉 ${esc(how[k] ?? '')}</p><button class="big" data-act="close">Got it</button>`);
}
const classOf = (st: State) => CLASSES.find((c) => c.id === st.hero.cls)?.name ?? st.hero.cls;
function renderClassMeter(st: State) {
  if (st.totalTaps >= 3 && st.life.stage <= 30 && !st.escape) classIntro(st);
  const el = document.getElementById('classmeter') as HTMLElement;
  const L = st.life;
  const k = st.hero.cls;
  const loop = G.CLASS_LOOP[k];
  let html = '';
  if (k === 'warrior') { const r = Math.round(L.rage ?? 0); html = `<span>🔥 Rage</span><i class="mbar"><u style="width:${r}%"></u></i><b>${r >= G.RAGE_MAX ? 'next tap: STRIKE!' : r}</b>`; }
  if (k === 'cleric') { const p = Math.round(L.prayer ?? 0); html = `<span>🕯 Prayer</span><i class="mbar pray"><u style="width:${Math.min(100, (p / G.prayerMax(G.derive(st))) * 100)}%"></u></i><b>Named +${p}%</b>`; }
  if (k === 'rogue') { const c = L.combo ?? 0; const mx = G.comboMax(G.derive(st)); html = `<span>✸ Combo</span><b class="pips">${'●'.repeat(c)}${'○'.repeat(Math.max(0, mx - c))}</b>`; }
  if (k === 'mage') { const dm = G.derive(st); html = `<span>✨ Mana</span><i class="mbar mana"><u style="width:${(L.mana / dm.manaMax) * 100}%"></u></i><b>${Math.floor(L.mana)}/${Math.floor(dm.manaMax)} · taps refill</b>`; }
  if (k === 'ranger') { const d = G.derive(st); const mk = G.ruleSum(d.rules, 'volleyAuto')?.b ?? 0; html = `<span>🏹 Quiver</span><b>${+d.autoTap.toFixed(1)} arrows a second${mk ? ` · 🎯 marked +${mk}%` : ''}</b>`; }
  // run 6 testers: "the set's effect never showed up on screen": the live gear bonus rides on the meter
  if ((L.surgeT ?? 0) > 0) html += `<b class="surge">${k === 'warrior' ? '🔥 Fury' : '✨ Surge'} +${Math.round((L.surgeMag ?? 0) * 100)}% ${Math.ceil(L.surgeT!)}s</b>`;
  if (k === 'rogue') { const cd = G.ruleSum(G.derive(st).rules, 'comboDeep'); if (cd?.b && (L.combo ?? 0) > 0) html += `<b class="surge">+${Math.round(cd.b * (L.combo ?? 0))}%</b>`; }
  el.classList.toggle('full', k === 'warrior' && (L.rage ?? 0) >= G.RAGE_MAX);
  if (el.dataset.html !== html) { el.dataset.html = html; el.innerHTML = html; el.dataset.long = `text:${loop ? `${loop.name}: ${loop.text}` : ''}`; }
}

/** Run 5: Reshape (change class, race or faith for gems). */
function reshapeSheet(st: State): string {
  const sec = (kind: G.ReshapeKind, title: string, list: { id: string; name: string; text?: string }[], cur: string) =>
    `<h3>${title}</h3><div class="reshape">${list.map((x) => {
      const why = G.reshapeBlock(st, kind, x.id);
      const rule = kind === 'cls' ? G.CLASS_LOOP[x.id]?.text : x.text;
      return `<button class="choice-btn ${x.id === cur ? 'on' : why ? 'no' : ''}" data-act="reshape-do:${kind}:${x.id}"><b>${esc(x.name)}${x.id === cur ? ' (now)' : ''}</b><span>${esc(rule ?? '')}</span></button>`;
    }).join('')}</div>`;
  return `<h2>💎 Reshape</h2><p>Change your class, race or faith for <b>${G.RESHAPE_COST} gems</b> each. You have <b>${st.gems ?? 0}</b>. Gems come from great chests, first wins against special bosses, achievements and weekly tasks.</p>
    <p class="note">A new class gives your class points back and starts its path at tier 1. Gear, spells, relics and transformations stay.</p>
    ${sec('cls', 'Class', CLASSES, st.hero.cls)}${sec('race', 'Race', RACES, st.hero.race)}${sec('faith', 'Faith', FAITHS, st.hero.faith)}
    <button data-act="close">Close</button>`;
}

/** Run 4: the weak spot over the foe, the hunt chip and the shrine button. */
let eliteTold: G.Foe | null = null;
let weakTold = false; // the first weak spot of a session says what it is
let wanderWarned: G.Foe | null = null;
function renderRun4(st: State) {
  const L = st.life;
  const world = !st.escape && !(st.dungeon && !st.dungeon.done);
  const ws = document.getElementById('weakspot') as HTMLElement;
  const box = world && G.weakOpen(st) && !modalOpen ? view?.foeScreen() : null;
  ws.hidden = !box;
  if (box && !weakTold) { weakTold = true; banner(`✸ Weak spot! Tap the glow for x${G.WEAK_SPOT_MULT}`, 'treasure'); }
  if (box) {
    const bt = document.getElementById('battle')!.getBoundingClientRect();
    const spots = [[0.5, 0.35], [0.35, 0.55], [0.62, 0.6], [0.45, 0.25], [0.55, 0.5]];
    const [fx, fy] = spots[G.weakIndex(st) % spots.length];
    ws.style.left = `${box.x - bt.left + box.w * fx}px`;
    ws.style.top = `${box.y - bt.top + box.h * fy}px`;
  }
  const hc = document.getElementById('huntchip') as HTMLElement;
  const mm = (x: number) => `${Math.floor(x / 60)}:${Math.floor(x % 60).toString().padStart(2, '0')}`;
  let html = '';
  if (world && L.hunt) {
    const [h, n] = G.huntProgress(st);
    html = `<span>🎯 ${esc(G.HUNT_DEFS[L.hunt.kind].text)} <b>${h}/${n}</b> · ${mm(Math.max(0, L.hunt.left))}</span>`;
  } else if (world && L.huntOffer) {
    const def = G.HUNT_DEFS[L.huntOffer.kind];
    const prize = def.rewards.map((r) => (r.kind === 'key' ? `${r.n} key` : `${r.n} Marks`)).join(', ');
    html = `<span>🎯 Hunt: ${esc(def.text)} in ${mm(def.secs)} for ${prize}</span><button data-act="hunt:yes">Take</button><button data-act="hunt:no" aria-label="Ignore">✕</button>`;
  }
  hc.hidden = !html || !!modalOpen;
  if (hc.dataset.html !== html) { hc.dataset.html = html; hc.innerHTML = html; }
  (document.getElementById('shrinebtn') as HTMLElement).hidden = !(world && G.offeringReady(st)) || !!modalOpen;
}
function shrineSheet(st: State): string {
  const cost = G.offeringCost(st);
  const can = B.gte(st.life.gold, cost);
  const z = zoneFor(st.life.stage);
  return `<h2>⛩ The land's shrine</h2><p class="dim">${esc(z.name)}</p><p>Once in each land, every life. Pick one offering for <b>${fmt(cost)} gold</b> (you have ${fmt(st.life.gold)}).</p>
    ${G.offerKinds(st).map((k) => `<button class="big choice-btn ${can ? '' : 'no'}" data-act="offer:${k}"><b>${esc(G.OFFER_DEFS[k].name)}</b><span>${esc(G.OFFER_DEFS[k].text)}</span></button>`).join('')}
    ${(st.life.nextBossDelta ?? 0) < 0 ? '<p class="dim">Lantern oil is not offered while you owe the Toll Collector.</p>' : ''}
    <button data-act="close">Not now</button>`;
}

function renderBattle(dt: number) {
  const st = s!;
  const L = st.life;
  const e = st.escape;
  const g = st.dungeon;
  const d = G.derive(st);
  const foe = G.foeNow(st);
  const realm = g && !g.done ? REALMS.find((r) => r.id === g.realm)! : e ? REALMS.find((r) => r.id === e.realm)! : null;
  const zone = zoneFor(L.stage);

  setText('stage', g && !g.done ? `Dungeon · ${realm!.name}` : e ? `Escape · ${realm!.name}` : `Stage ${L.stage}`);
  setText('zone', g && !g.done ? `${Math.min(g.killed, G.DUNGEON_MOBS)} / ${G.DUNGEON_MOBS} foes, then the boss` : e ? (e.special ? 'A rare way out. Clear it for a prize.' : realm!.text) : zone.name);
  setText('gold', fmt(L.gold));
  setText('embers', fmt(st.embers));
  setText('marks', String(st.marks));
  setText('gemn', String(st.gems ?? 0));
  setText('keyn', String(st.keys));

  const pips = `${(foe.immune ?? []).map((x) => `<i class="pip imm" style="--ec:${ELEMENT_COLOR[x]}" title="Immune to ${ELEMENT_NAME[x]}">⊘</i>`).join('')}${(foe.weak ?? []).map((x) => `<i class="pip weak" style="--ec:${ELEMENT_COLOR[x]}" title="Weak to ${ELEMENT_NAME[x]}">▼</i>`).join('')}`;
  setHtml('foename', `${esc(foe.name)}${foe.boss ? ' ★' : ''}${foe.kind === 'treasure' ? ' 💰' : ''}${foe.kind === 'wanderer' ? ' ☄' : ''} ${pips}`, true);
  // run 3: gimmick bosses say what they do, the ward gets a banner, and the toll shows a bell to tap
  // run 3: the event running now (banner when it starts, a timer chip under the land name)
  const evc = document.getElementById('evchip') as HTMLElement;
  const ev = !e && !(g && !g.done) ? L.event : null;
  evc.hidden = !ev || !!modalOpen;
  if (ev) {
    const def = G.EVENT_DEFS[ev.id];
    const ask = ev.id === 'collector' && L.collector;
    const txt = ask ? `${EVENT_ICON[ev.id]} ${def.name}: 2x gold 60 s, next boss −5 s` : `${EVENT_ICON[ev.id]} ${def.name} ${Math.ceil(ev.left)} s`;
    const html = ask ? `<span>${esc(txt)}</span><button data-act="collector:yes">Accept</button><button data-act="collector:no">No</button>` : esc(txt);
    if (evc.dataset.html !== html) { evc.dataset.html = html; evc.innerHTML = html; }
    evc.classList.toggle('ask', !!ask);
    evc.dataset.long = `text:${def.text}`;
    if (seenEvent !== ev) { seenEvent = ev; banner(`${EVENT_ICON[ev.id]} ${def.name}`, 'treasure'); buzz(20); }
  }
  const tell = document.getElementById('gimtell') as HTMLElement;
  const gim = foe.boss ? foe.gimmick : undefined;
  const elite = !foe.boss && !e && !(g && !g.done) ? foe.elite : undefined;
  tell.hidden = !gim && !elite;
  if (elite) {
    // run 4: an elite says what it is, with its own countdown
    const txt = elite === 'armoured' ? ((foe.armour ?? 0) > 0 ? `⚔ Elite · Armoured: ${foe.armour} crit${foe.armour === 1 ? '' : 's'} to break it` : '⚔ Elite · Armour broken')
      : elite === 'swift' ? `⚔ Elite · Swift: flees in ${Math.max(0, Math.ceil(foe.fleeLeft ?? 0))} s` : `⚔ Elite · Warded: immune to ${foe.immune?.map((x) => ELEMENT_NAME[x]).join(', ') ?? 'one element'}`;
    if (tell.textContent !== txt) tell.textContent = txt;
    tell.dataset.long = `text:${G.ELITE_TEXT[elite]} Elites pay 5x gold.`;
    if (eliteTold !== foe) { eliteTold = foe; if (!(st.counts.elites ?? 0)) banner('⚔ An elite foe', 'treasure'); }
  }
  if (gim) {
    const warded = (foe.shieldLeft ?? 0) > 0;
    const adds = foe.addHp?.filter((h) => !B.isZero(h)).length ?? 0;
    const txt = gim === 'adds' ? (adds ? `👥 ${adds} add${adds > 1 ? 's' : ''} guard it: the boss takes 20%` : '👥 The adds are down') : gim === 'shield' ? (warded ? `🛡 Warded ${Math.ceil(foe.shieldLeft!)} s: your Named and pets still hit` : foe.shieldLeft === -1 ? '🛡 Ward broken' : '🛡 Raises a ward at half health') : (foe.tolled ?? 0) > 0 ? '🔔 Tolling! Tap the bell' : '🔔 Tolls every 8 s and stops your Named';
    if (tell.textContent !== txt) tell.textContent = txt;
    tell.dataset.long = `text:${G.GIMMICK_TEXT[gim]}`;
    if (warded && !wardTold) { wardTold = true; banner('🛡 The boss raises a ward', 'wander'); buzz(25); }
  }
  if (!gim || !((foe.shieldLeft ?? 0) > 0)) wardTold = false;
  (document.getElementById('bellbtn') as HTMLElement).hidden = !(gim === 'tolling' && (foe.tolled ?? 0) > 0);
  renderRun4(st);
  renderClassMeter(st);
  const frac = B.isZero(foe.max) ? 0 : Math.max(0, Math.min(1, B.ratio(foe.hp, foe.max)));
  (document.getElementById('hpfill') as HTMLElement).style.width = `${frac * 100}%`;
  setText('hptext', `${fmt(foe.hp)} / ${fmt(foe.max)}`);
  (document.getElementById('minihp') as HTMLElement).style.width = `${frac * 100}%`;
  setText('mininame', `${foe.name}${foe.boss && !e && !(g && !g.done) ? ` · ${Math.ceil(L.bossLeft)}s` : ''}`);
  {
    const q = G.questDef(st.quest.num, st.hero.cls);
    const [qh, qn] = G.questProgress(st);
    const mq = document.getElementById('mainquest')!;
    mq.classList.toggle('ready', qh >= qn);
    setHtml('mainquest', `${ic('star')}<span class="mqt">${esc(qh >= qn ? 'Quest done! Tap to claim' : q.text)}</span><span class="mq"><i style="width:${Math.min(1, qh / qn) * 100}%"></i></span><b>${progressText(qh, qn)}</b>`);
  }

  const timer = document.getElementById('timerbar')!;
  const frozen = L.buffs.some((b) => b.kind === 'freeze');
  let candleFrac = -1;
  let candleLeft = 0;
  const clock = (left: number, total: number, label: string, bar = true) => {
    candleFrac = Math.max(0, Math.min(1, left / total));
    candleLeft = left;
    timer.hidden = !bar;
    (document.getElementById('timerfill') as HTMLElement).style.width = `${Math.max(0, Math.min(1, left / total)) * 100}%`;
    setText('timertext', `${frozen ? '❄ ' : ''}${label}`);
  };
  const mmss = (x: number) => `${Math.floor(x / 60)}:${Math.floor(x % 60).toString().padStart(2, '0')}`;
  if (g && !g.done) {
    clock(g.timeLeft, G.DUNGEON_SECONDS + (d.stats.dungeonSec ?? 0), `${mmss(g.timeLeft)} left`);
    setText('dots', g.killed >= G.DUNGEON_MOBS ? 'Boss' : '●'.repeat(g.killed) + '○'.repeat(G.DUNGEON_MOBS - g.killed));
  } else if (e) {
    clock(e.timeLeft, ESCAPE_SECONDS * (e.special ? G.SPECIAL_ESCAPE_MULT : 1), `${mmss(e.timeLeft)} to reach the gate`);
    setText('dots', `${Math.min(e.killed, ESCAPE_FOES)} / ${ESCAPE_FOES} foes, then the gate`);
  } else if (L.foe.boss) {
    clock(L.bossLeft, G.bossTime(st, d), `${L.bossLeft.toFixed(1)} s`, false);
    setText('dots', 'Boss');
  } else if (L.foe.kind === 'wanderer') {
    clock(L.wanderLeft, G.WANDER_SECONDS, `${L.wanderLeft.toFixed(1)} s before it wanders off`, false);
    // gate fix: a tester lost a Legendary with no warning; say it once when it is about to leave
    if (L.wanderLeft <= 5 && wanderWarned !== L.foe) { wanderWarned = L.foe; banner('☄ It is about to wander off!', 'wander'); buzz(25); }
    setText('dots', 'Wandering boss: always drops a Legendary');
  } else {
    timer.hidden = true;
    setText('dots', '●'.repeat(Math.min(L.kills, G.KILLS_PER_STAGE)) + '○'.repeat(Math.max(0, G.KILLS_PER_STAGE - L.kills)));
  }
  timer.classList.toggle('frozen', frozen);
  {
    const candle = document.getElementById('candle')!;
    const dark = document.getElementById('dark')!;
    const big = document.getElementById('bigcount')!;
    const on = candleFrac >= 0;
    candle.hidden = !on;
    candle.classList.toggle('frozen', frozen);
    candle.classList.toggle('low', on && candleLeft < 10 && !frozen);
    (document.getElementById('wax') as HTMLElement).style.height = `${Math.max(3, candleFrac * 100)}%`;
    (document.getElementById('flame') as HTMLElement).style.bottom = `${Math.max(3, candleFrac * 100)}%`;
    setText('candlet', on ? (candleLeft >= 60 ? `${Math.floor(candleLeft / 60)}:${Math.floor(candleLeft % 60).toString().padStart(2, '0')}` : `${Math.ceil(candleLeft)}`) : '');
    // the dark creeps in over the second half of the clock
    dark.style.setProperty('--dk', String(on ? Math.max(0, Math.min(1, (0.5 - candleFrac) / 0.5)) : 0));
    const last = on && candleLeft < 5 && candleLeft > 0;
    const sec = last ? Math.ceil(candleLeft) : -1;
    if (sec !== lastBeat) {
      lastBeat = sec;
      if (last) {
        big.textContent = String(sec);
        big.classList.remove('beat');
        void big.offsetWidth;
        big.classList.add('beat');
        if (!frozen) buzz(25);
      }
    }
    big.classList.toggle('show', last);
  }
  (document.getElementById('fightboss') as HTMLElement).hidden = !!e || !!g || L.autoBoss || L.kills < G.KILLS_PER_STAGE;

  // pixel scene
  const named = namedLooks(st, d, foe);
  const pets = st.petsOut.map((id) => PETS.find((p) => p.id === id)).filter((p) => !!p).map((p) => ({ id: p!.id, body: p!.body, element: p!.element }));
  // play the kill puff at most every 300 ms, or fast kills keep every new foe hidden
  if (lastFoe && lastFoe !== foe && B.isZero(lastFoe.hp) && performance.now() - lastKillFx > 300) { view?.kill(); lastKillFx = performance.now(); }
  lastFoe = foe;
  const scene: Scene = {
    hero: heroLook(st), foe: foeLook(st, foe), named, pets,
    mode: g && !g.done ? 'dungeon' : e ? 'escape' : 'world',
    fairy: !e && !g && L.fairy ? { x: L.fairy.x, y: L.fairy.y } : null,
  };
  view?.setScene(scene);
  namedFlashT += dt;
  if (named.length && namedFlashT > 0.45) {
    namedFlashT = 0;
    const n = named[Math.floor(Math.random() * named.length)];
    view?.namedHit(n.i, n.element);
  }
  setHtml('strip', namedStripHtml(named, ALLIES.filter((_, i) => G.allyUnlocked(st, i)).length));

  // skill bar: 4 class skills + 6 shared spells, icons only
  const actives = [
    ...G.classOf(st).tree.filter((n) => n.kind === 'active' && G.classNodeActive(st, n)).map((n) => ({ id: n.id, name: n.name, hint: kindIcon(n.active!), cd: n.cooldown ?? 30, dur: n.duration ?? 15, mana: n.mana ?? 0 })),
    ...G.ultimates(st).map((u) => ({ id: u.id, name: u.name, hint: u.icon, cd: u.cooldown, dur: u.duration || 15, mana: u.mana })),
  ];
  const spells = SPELLS.map((x) => ({ id: x.id, name: x.name, hint: x.icon, cd: x.cooldown, dur: x.duration || 15, mana: x.mana }));
  const qd = G.questDef(st.quest.num, st.hero.cls);
  const castQuest = qd.goal.kind === 'spells' && G.questProgress(st)[0] < G.questProgress(st)[1];
  const sb = [...actives, ...spells].filter((k) => G.canUse(st, k.id) !== 'locked').map((k) => {
    const c = G.canUse(st, k.id) + ((castQuest || st.hero.cls === 'mage') && G.canUse(st, k.id) === 'ok' ? ' questcast' : '');
    const cd = L.cooldowns[k.id] ?? 0;
    const buff = L.buffs.find((b) => b.from === k.id);
    return `<button data-use="${k.id}" data-long="skill:${k.id}" class="sk ${c}${buff ? ' live' : ''}" aria-label="${esc(k.name)}">
      ${sIcon(k.id, k.hint)}
      ${cd > 0 ? `<i class="cd" style="height:${Math.min(100, (cd / k.cd) * 100)}%"></i><em>${Math.ceil(cd)}</em>` : ''}
      ${buff ? `<u style="width:${Math.min(100, (buff.left / Math.max(1, k.dur)) * 100)}%"></u>` : ''}
    </button>`;
  }).join('');
  setHtml('skillbar', sb);
  (document.getElementById('manafill') as HTMLElement).style.width = `${(L.mana / d.manaMax) * 100}%`;
  document.getElementById('manabar')!.dataset.long = `text:Mana ${Math.floor(L.mana)} / ${Math.floor(d.manaMax)}. Spells and skills cost mana; it refills as you fight.`;
  const [hintText, hintTab] = hint(st);
  setText('hint', hintText);
  document.querySelectorAll<HTMLButtonElement>('#tabs button').forEach((b) => b.classList.toggle('pulse', !!hintTab && b.dataset.tab === hintTab && !(tabOpen && tab === hintTab)));
  const coach = document.getElementById('coach') as HTMLElement;
  const wisp = (st.counts.fairies ?? 0) === 0 && st.quest.num < 10 && st.returns === 0 && st.totalTaps >= 8 && !modalOpen ? view?.fairyScreen() : null;
  if (wisp) {
    const br = document.getElementById('battle')!.getBoundingClientRect();
    coach.style.left = `${wisp.x - br.left}px`; coach.style.top = `${wisp.y - br.top + 34}px`;
    coach.innerHTML = '👆<b>WISP</b>'; coach.hidden = false;
  } else {
    if (coach.style.left) { coach.style.left = ''; coach.style.top = ''; coach.innerHTML = '👆<b>TAP</b>'; }
    coach.hidden = st.totalTaps >= 8 || !!modalOpen;
  }
  // R3: boss tension
  if (foe !== seenFoe) {
    if (foe.boss) { banner(!e && !g && G.bountyOn(st) && G.isBountyStage(L.stage) ? `💰 Bounty: ${foe.name} · ${G.BOUNTY_GOLD}× gold` : `☠ ${foe.name}`, 'boss'); if (prefs.sound) sfx.bell(); }
    else if (foe.kind === 'wanderer') banner(`☄ ${foe.name}`, 'wander');
    else if (foe.kind === 'treasure') banner(`💰 ${foe.name}`, 'treasure');
    seenFoe = foe;
  }
  if (L.stage > seenStage && seenStage > 0 && !e && !(g && !g.done)) {
    const z = zoneFor(L.stage);
    if (z !== zoneFor(seenStage)) arriveLand(st, z); else banner(`Stage ${L.stage - 1} cleared`, 'clear');
  }
  seenStage = L.stage;
  timer.classList.toggle('urgent', !frozen && ((L.foe.boss && !e && !(g && !g.done) && L.bossLeft < 5) || (!!g && !g.done && g.timeLeft < 20) || (!!e && !e.done && e.timeLeft < 30)));
  // R5: loot beams for new items
  const newest = st.bag.reduce((m, it) => Math.max(m, it.id), 0);
  if (newest > lastBagId && lastBagId > 0) {
    for (const it of st.bag.filter((x) => x.id > lastBagId)) {
      const bx = document.getElementById('battle')!.getBoundingClientRect();
      floatText(bx.left + bx.width * 0.7, bx.top + bx.height * 0.55, `◆ ${it.name}`, 'loot', undefined, rarityDef(it.rarity).color);
      if (['epic', 'legendary', 'set', 'artifact'].includes(it.rarity)) { shake(true); buzz(40); banner(`${rarityDef(it.rarity).name}!`, 'loot'); if (prefs.sound) sfx.chime(); gearTab = 'bag'; }
    }
  }
  lastBagId = Math.max(lastBagId, newest);
  const escbar = document.getElementById('escbar')!;
  escbar.hidden = !e && !(g && !g.done);
  if (g && !g.done) escbar.style.width = `${(g.killed / (G.DUNGEON_MOBS + 1)) * 100}%`;
  else if (e) escbar.style.width = `${G.escapeProgress(e) * 100}%`;
}

const textCache = new Map<string, string>();
function setText(id: string, t: string) {
  if (textCache.get(id) === t) return;
  textCache.set(id, t);
  document.getElementById(id)!.textContent = t;
}
function setHtml(id: string, h: string, always = false) {
  if (textCache.get(id) === h || (pointerDown && !always)) return;
  textCache.set(id, h);
  document.getElementById(id)!.innerHTML = h;
}

/** One plain-words tip at a time, so a new player always knows the next step; the tab it points at glows. */
function hint(st: State): [string, Tab | ''] {
  const L = st.life;
  if (st.escape?.done || st.dungeon?.done) return ['', ''];
  if (st.dungeon) return ['Beat 9 foes and the boss before the clock runs out.', ''];
  if (st.escape) return ['Reach the gate before the clock runs out, or the realm keeps a scar.', ''];
  const step = G.firstRunStep(st);
  if (step < G.FIRST_RUN_STEPS) {
    const n = `${step + 1}/${G.FIRST_RUN_STEPS} · `;
    if (step === 0) return [`${n}Tap the foe to strike.`, ''];
    if (step === 1) return B.gte(L.gold, G.heroCost(st)) ? [`${n}Gold! Open Hero and train.`, 'hero'] : [`${n}Tap foes for gold, then train in Hero.`, ''];
    if (step === 2) return B.gte(L.gold, G.allyCost(st, 0)) ? [`${n}Hire your first Named in Named.`, 'named'] : [`${n}Save gold to hire your first Named.`, ''];
    if (step === 3) return [`${n}Beat the boss before the candle burns out.`, ''];
    if (step === 4) { const [h, q] = G.questProgress(st); return h >= q ? [`${n}Quest done! Tap the quest bar to claim it.`, ''] : [`${n}Your first quest is on the bar under the fight. Keep fighting.`, '']; }
    if (!G.tabReady(st, 'skills')) return [`${n}Keep climbing: Skills open at stage ${G.TAB_STAGE.skills}.`, ''];
    return G.skillPointsFree(st) > 0 ? [`${n}Spend your class point in Skills.`, 'skills'] : [`${n}Claim quests to earn class points.`, 'quests'];
  }
  if (st.totalTaps < 8) return ['Tap the fight to strike.', ''];
  if (L.fairy) return ['A wisp! Tap it before it fades.', ''];
  if (L.heroLevel < 4 && B.gte(L.gold, G.heroCost(st))) return ['Gold! Train in Hero to hit harder.', 'hero'];
  if (L.allyLevels[0] === 0 && B.gte(L.gold, G.allyCost(st, 0))) return ["Win back Hed's name in Named.", 'named'];
  if (!L.autoBoss) return ['Too strong. Train and level Named, then Fight boss.', 'named'];
  const [have, need] = G.questProgress(st);
  if (have >= need) return G.tabReady(st, 'quests') ? ['Quest done! Claim it.', 'quests'] : ['Quest done! Tap the quest bar to claim it.', ''];
  if (G.availableTrials(st).some((tr) => { const [h, n] = G.trialProgress(st, tr); return h >= n; })) return ['A trial is complete! Claim it in Quests.', 'quests'];
  if (L.foe.immune?.length) return [`Immune to ${L.foe.immune.map((x) => ELEMENT_NAME[x]).join(' and ')}. Named of other elements still hurt it; a weapon with another element changes your taps.`, '']; // run 8: testers did not know what to build
  // run 8 testers: "Points to spend" with 0 class points showing was confusing, so the hint names the kind of point
  if (G.tabReady(st, 'skills')) {
    if (G.skillPointsFree(st) > 0) return ['A class point to spend: Skills → Class or Spells.', 'skills'];
    if (G.racePointsFree(st) > 0) return ['A race point to spend: Skills → Race.', 'skills'];
    if (G.formPointsFree(st) > 0 && st.forms.length) return ['A transformation point to spend: Skills → Mastery.', 'skills']; // only once a transformation is taken
  }
  if (!st.forms.length && st.formOffered) return ['A transformation is offered in Skills → Mastery.', 'skills'];
  if (st.eggs > 0) return ['A pet egg! Hatch it in Pets.', 'pets'];
  if (G.tabReady(st, 'death') && G.canDie(st) && st.returns === 0) return ['Stuck? Fall in Death and return stronger.', 'death'];
  return ['', ''];
}

function renderBadges() {
  const st = s!;
  const [qh, qn] = G.questProgress(st);
  const taskReady = [...st.daily.tasks, ...st.daily.weekly].some((t) => { const [h, n] = G.taskProgress(st, t); return !t.claimed && h >= n; });
  const on: Record<Tab, boolean> = {
    // run 2, idea 26: a dot means something to claim or use, never "you can afford this" (that was on almost all the time)
    hero: G.trainPerksWaiting(st) > 0, // run 3: a Train perk to choose
    named: false,
    gear: st.bag.some((it) => G.mergeTarget(st, it) || G.verdict(st, it) === 'better'),
    skills: G.skillPointsFree(st) > 0 || G.racePointsFree(st) > 0 || G.formPointsFree(st) > 0 || (!st.forms.length && st.formOffered),
    pets: st.eggs > 0,
    quests: qh >= qn || taskReady || G.availableTrials(st).some((tr) => { const [h, n] = G.trialProgress(st, tr); return h >= n; }),
    death: (G.canDie(st) && st.returns === 0) || (!st.dungeon && st.keys > 0 && st.bestStage >= 10),
    menu: false,
  };
  document.querySelectorAll<HTMLButtonElement>('#tabs button').forEach((b) => {
    b.classList.toggle('on', tabOpen && b.dataset.tab === tab);
    const shut = !G.tabReady(st, b.dataset.tab!);
    b.classList.toggle('locked', shut);
    // run 8 testers: a grey tab with no reason looked broken, so a locked tab says when it opens
    const at = (G.TAB_STAGE as Record<string, number>)[b.dataset.tab!];
    const lock = shut ? (b.dataset.tab === 'pets' ? 'Egg' : at ? `Stage ${at}` : '') : '';
    if ((b.dataset.lock ?? '') !== lock) { if (lock) b.dataset.lock = lock; else delete b.dataset.lock; }
    b.querySelector('.badge')!.classList.toggle('show', !shut && on[b.dataset.tab as Tab]);
  });
}

// ------------------------------------------------------------------ panels

function renderPanel(force: boolean) {
  if (!s) return;
  if (pointerDown && !force) return;
  const fn = { hero: heroPanel, named: namedPanel, gear: gearPanel, skills: skillsPanel, pets: petsPanel, quests: questsPanel, death: deathPanel, menu: menuPanel }[tab];
  const html = fn();
  if (!force && html === lastPanel) return;
  const panel = document.getElementById('panel')!;
  if (!force && panel.contains(document.activeElement) && document.activeElement?.tagName === 'TEXTAREA') return;
  lastPanel = html;
  panel.innerHTML = html;
}

/** Small tabs inside a tab. A dot marks one with something to claim. */
function subTabs(act: string, items: [string, string, boolean?][], cur: string): string {
  return `<div class="subtabs n${items.length}">${items.map(([id, name, dot]) => `<button data-act="${act}:${id}" class="${cur === id ? 'on' : ''}">${name}${dot ? '<em class="sdot"></em>' : ''}</button>`).join('')}</div>`;
}

/** One line per skill: icon, name, rank dots and +1. What it does is on long-press. */
function skillRow(o: { icon: string; name: string; r: number; max: number; act?: string; label?: string; long: string; cls?: string; right?: string }): string {
  const pips = o.max <= 10
    ? `<span class="pips">${'●'.repeat(Math.min(o.r, o.max))}<s>${'●'.repeat(Math.max(0, o.max - o.r))}</s></span>`
    : `<span class="pips">${o.r}/${o.max}</span>`;
  return `<div class="srow ${o.r ? 'have' : ''} ${o.cls ?? ''}" data-act="info" data-long="text:${esc(o.long)}">${o.icon}<div class="sn"><b>${esc(o.name)}</b>${o.right ?? pips}</div>${o.act ? `<button class="plus" data-act="${o.act}">${o.label ?? '+1'}</button>` : ''}</div>`;
}
function lockedLine(names: string[]): string {
  return names.length ? `<div class="lockline" data-act="info" data-long="text:${esc(`Still locked: ${names.join(', ')}.`)}">🔒 ${names.length} more locked · long-press to see</div>` : '';
}

function qtyBar() {
  const next = qty === 1 ? 10 : qty === 10 ? 'max' : 1;
  return `<div class="qty"><button class="qtysw" data-act="qty:${next}">Buy ${qty === 'max' ? 'Max' : `x${qty}`} ▾</button></div>`;
}

/** The next few things the player is working towards, nearest first. */
const GOAL_ICON: Record<G.GoalKindNext, string> = {
  named: 'banner', chest: 'coin', drop: 'coin', zone: 'lantern', bishop: 'skull', fall: 'skull', immune: 'shield', best: 'star',
};
const goalHtml = (g: G.NextGoal) => `${ic(GOAL_ICON[g.kind])}<b>${g.stage}</b> ${esc(g.what)}`;
function comingUp(): string {
  // run 2, idea 43: until quest 10, one goal only, so the first screens stay quiet
  return `<div class="nextline" data-long="help:next">Next: ${G.upcomingGoals(s!).slice(0, s!.quest.num < 10 ? 1 : 3).map(goalHtml).join(' · ')}</div>`;
}

const REWARD_ICON: Record<string, () => string> = {
  classPt: () => ic('book'), formPt: () => ic('flame'), key: () => '🗝', marks: () => '✦', embers: () => '<span class="ember-i"></span>',
  gold: () => '<span class="gold-i"></span>', egg: () => petIcon('wisp', 'magic'), pet: () => petIcon('crow', 'phys'),
};
const rewardIcons = (rs: { kind: string; n: number }[]) => rs.map((r) => `<span class="rw">${(REWARD_ICON[r.kind] ?? (() => ''))()}${r.kind === 'gold' || r.kind === 'embers' || r.kind === 'pet' ? '' : r.n}</span>`).join('');

function questCard(): string {
  const st = s!;
  const q = G.questDef(st.quest.num, st.hero.cls);
  const [have, need] = G.questProgress(st);
  const done = have >= need;
  return `<div class="card quest ${done ? 'ready' : ''}" data-long="help:quest">
    <div class="qh">${ic('star')}<b>${esc(q.text)}</b><span class="rws">${rewardIcons(q.rewards)}</span></div>
    <div class="pbar"><i style="width:${(have / need) * 100}%"></i><span>${progressText(have, need)}</span></div>
    ${!done && q.goal.kind === 'spells' ? `<p class="note qhint">${G.barSkillIds(st).length ? '✨ Tap a spell or skill on the bar under the fight to cast it.' : G.skillPointsFree(st) > 0 ? '✨ Learn a spell first: Skills › Spells (1 class point). Then tap it on the bar under the fight.' : '✨ You need a spell: Skills › Spells costs 1 class point. Quests and trials give class points; Skills › "Take all points back" returns spent ones.'}</p>` : ''}
    ${done ? '<button class="big" data-act="quest">Claim</button>' : ''}</div>`;
}

function rewardText(r: { kind: string; n: number; pets?: string[] }): string {
  switch (r.kind) {
    case 'classPt': return `${r.n} class point${r.n > 1 ? 's' : ''}`;
    case 'formPt': return `${r.n} transformation point${r.n > 1 ? 's' : ''}`;
    case 'key': return `${r.n} key${r.n > 1 ? 's' : ''}`;
    case 'marks': return `${r.n} Marks`;
    case 'embers': return 'Embers';
    case 'gold': return 'gold';
    case 'egg': return `${r.n} pet egg${r.n > 1 ? 's' : ''}`;
    case 'pet': return r.pets && r.pets.length > 1 ? 'a pet (choose)' : 'a pet';
  }
  return r.kind;
}

const ATTR_ICON: Record<string, string> = { str: 'fist', agi: 'echo', sta: 'shield', int: 'book', spi: 'heart' };

function heroPanel(): string {
  const st = s!;
  const d = G.derive(st);
  const n = qty === 'max' ? Math.max(1, G.maxHeroBuy(st)) : qty;
  const cost = G.heroCost(st, n);
  const afford = B.gte(st.life.gold, cost);
  const nextTap = B.times(G.heroBaseBig(st.life.heroLevel + n), d.tapMult);
  const race = RACES.find((r) => r.id === st.hero.race)!;
  const cls = G.classOf(st);
  const faith = FAITHS.find((f) => f.id === st.hero.faith)!;
  const form = FORMS.find((f) => f.id === st.hero.form)!;
  const lvl = G.xpLevel(st.xp);
  const xpFrac = (st.xp - G.xpForLevel(lvl)) / Math.max(1, G.xpForLevel(lvl + 1) - G.xpForLevel(lvl));
  const tile = (icon: string, v: string, label: string, help = '') => `<div class="tile" ${help ? `data-long="text:${esc(help)}"` : ''}>${icon}<b>${v}</b><small>${label}</small></div>`;
  const attrs = ATTRS.map((a) => tile(stIcon(a, ATTR_ICON[a]), String(Math.round(d.attrs[a])), ATTR_NAME[a].slice(0, 3) + (a === cls.main ? '★' : ''), ATTR_HELP[a])).join('');
  const fight = [
    tile(stIcon('tap', 'fist'), fmt(d.tap), 'Tap', d.tapEl === 'phys' ? 'Your taps are physical. A weapon with an element changes that.' : `Your weapon makes your taps ${ELEMENT_NAME[d.tapEl]}.`),
    tile(stIcon('crit', 'eye'), `${(d.critChance * 100).toFixed(1)}%`, 'Crit'),
    tile(stIcon('critdmg', 'sword'), `x${d.critMult.toFixed(2)}`, 'Crit dmg'),
    tile(stIcon('bossdmg', 'skull'), `x${d.bossMult.toFixed(2)}`, 'Boss dmg'),
    tile(stIcon('named', 'banner'), fmt(d.allyDps), 'Named/s', `x${d.allyMult.toFixed(2)} from Spirit and gear`),
    tile(stIcon('bosstime', 'clock'), `${d.timer.toFixed(0)}s`, 'Boss time'),
    tile(stIcon('mana', 'drop'), `${Math.floor(d.manaMax)}`, 'Mana', `+${d.manaRegen.toFixed(2)} a second`),
    tile(stIcon('skill', 'bolt'), `x${d.skillPower.toFixed(2)}`, 'Skill'),
    tile(stIcon('gold', 'coin'), `x${d.goldMult.toFixed(2)}`, 'Gold'),
    ...(d.overkill > 0 ? [tile(stIcon('cleave', 'sword'), `${Math.round(d.overkill * 100)}%`, 'Cleave', HELP.cleave)] : []),
    tile(stIcon('best', 'star'), String(st.bestStage), 'Best'),
  ].join('');
  const els = ELEMENTS.map((el) => {
    const p = d.stats[ELEMENT_PCT[el]] ?? 0;
    const pi = Math.min(G.MAX_PIERCE, (d.stats[ELEMENT_PIERCE[el]] ?? 0) + (d.stats.pierceAll ?? 0));
    return `<div class="tile el" data-long="help:elements">${elDot(el)}<b>${p ? `+${num(p)}%` : '–'}</b><small>${pi ? `⊘ ${num(pi)}%` : ELEMENT_NAME[el]}</small></div>`;
  }).join('');
  const head = subTabs('htab', [['train', 'Train'], ['stats', 'Stats'], ['rewards', 'Rewards']], heroTab);
  // run 6 (Elliot testers): show the race and faith rules at work this life
  const mom = st.life.moments ?? {};
  const momRow = (id: string, name: string, text: string) => `<p class="rule">⚑ <b>${esc(name)}</b>: ${esc(text)} <small>${mom[id] ? `· worked ${mom[id]}x this life` : '· not yet this life'}</small></p>`;
  const rulesCard = `<div class="card"><h4>Your race and faith</h4>${momRow(race.id, race.name, race.text)}${momRow(faith.id, faith.name, faith.text.split('. ').slice(1).join('. ') || faith.text)}</div>`;
  if (heroTab === 'stats') {
    return `${head}${rulesCard}<div class="card">
      <h4>Attributes</h4><div class="tiles">${attrs}</div>
      <h4>Fighting</h4><div class="tiles">${fight}</div>
      <h4>Elements ${helpBtn('elements')}</h4>
      <div class="tiles six">${els}</div>
      ${st.scars.length ? `<h4>Scars ${helpBtn('scars')}</h4><div class="tiles">${st.scars.map((id) => { const x = SCARS.find((y) => y.id === id)!; return `<div class="tile scar" data-long="text:${esc(x.text)}">${ic('skull')}<small>${esc(x.name)}</small></div>`; }).join('')}</div>` : ''}
    </div>`;
  }
  if (heroTab === 'rewards') {
    const login = LOGIN.map((l, i) => `<div class="day ${i < st.daily.loginDay ? 'got' : i === st.daily.loginDay ? 'next' : ''}" data-act="login:${i}" data-long="text:${esc(l.rewards.map(rewardText).join(', '))}"><b>${i + 1}</b>${rewardIcons(l.rewards)}</div>`).join('');
    const ach = ACHIEVEMENTS.map((a) => {
      const tier = st.ach[a.id] ?? 0;
      const next = a.tiers[tier];
      const v = G.goalValue(st, a.kind);
      return `<div class="ach" data-long="text:${esc(a.text)}"><div><b>${esc(a.name)}</b> <span class="stars">${'★'.repeat(tier)}${'☆'.repeat(a.tiers.length - tier)}</span></div>
        <div class="ar">${next !== undefined ? `${fmt(B.big(Math.min(v, next)))} / ${fmt(B.big(next))}` : 'Done'}<small>${esc(statLine(a.stat, a.per * Math.max(1, tier)))}</small></div></div>`;
    }).join('');
    return `${head}<h3 class="sect">${ic('coin')} Login days</h3><div class="login">${login}</div>
      <h3 class="sect">${ic('star')} Achievements ${helpBtn('ach')}</h3><div class="card">${ach}</div>`;
  }
  const key = [
    tile(stIcon('tap', 'fist'), fmt(d.tap), 'Tap', 'Damage of one tap.'),
    tile(stIcon('crit', 'eye'), `${(d.critChance * 100).toFixed(1)}%`, 'Crit', 'Chance a tap is a critical hit.'),
    tile(stIcon('named', 'banner'), fmt(d.allyDps), 'Named/s', 'Damage the Named do each second on their own.'),
    tile(stIcon('gold', 'coin'), `x${d.goldMult.toFixed(2)}`, 'Gold', 'Gold from every foe is multiplied by this.'),
    tile(stIcon('best', 'star'), String(st.bestStage), 'Best', 'Deepest stage you have reached.'),
  ].join('');
  const perks = G.trainPerksWaiting(st);
  const perkCard = perks > 0 ? `<div class="card perkcard"><h3>${ic('star')} Train perk ${perks > 1 ? `(${perks} waiting)` : ''}</h3>
      <p class="note">Every ${G.TRAIN_PERK_EVERY} Train levels: pick one. Perks last forever.</p>
      <div class="perkrow">${(Object.keys(G.TRAIN_PERKS) as G.TrainPerk[]).map((k) => `<button class="big" data-act="perk:${k}"><b>${esc(G.TRAIN_PERKS[k].name)}</b><small>${esc(G.TRAIN_PERKS[k].text)}</small></button>`).join('')}</div></div>` : '';
  return `${head}${perkCard}<div class="row-h nextrow">${comingUp()}${qtyBar()}</div>
    <div class="card buy" data-long="help:train">
      <div class="trainrow">${ic('fist')}<div><b>Training ${st.life.heroLevel} → ${st.life.heroLevel + n}</b><small>${fmt(d.tap)} → ${fmt(nextTap)}</small></div></div>
      <button class="buybtn ${afford ? '' : 'no'}" data-act="hero">${fmt(cost)}<small>gold</small></button>
    </div>
    <div class="card">
      <div class="herohead" data-long="help:level">${heroPortrait(heroLook(st), 72)}<div><h3>${esc(st.hero.name)} <small class="note">XP level ${lvl}</small></h3>
      <p class="who">${race.name} · ${esc(G.classTitle(st))} · ${faith.name} · ${st.forms.length ? st.forms.map((f) => FORMS.find((x) => x.id === f)?.name).join(' + ') : form.name}</p>
      <div class="pbar xp"><i style="width:${Math.max(0, Math.min(1, xpFrac)) * 100}%"></i></div></div></div>
      <div class="tiles">${key}</div>
      <p class="note center">Long-press any number to see what it does. All numbers are under Stats.</p>
    </div>`;
}

function namedPanel(): string {
  const st = s!;
  const d = G.derive(st);
  const mc = G.mercCost(st);
  const mercs = st.life.mercs ?? 0;
  const merc = `<div class="card namedcard buy merc"><div><h3>⚔ Sellswords <small class="note">${mercs}/${G.MERC_MAX}</small></h3><p>+${Math.round(G.MERC_STEP * 100)}% damage for every Named, this life only${mercs ? ` · now +${Math.round(G.MERC_STEP * 100 * mercs)}%` : ''}</p></div>
    ${mercs < G.MERC_MAX ? `<button class="buybtn ${B.gte(st.life.gold, mc) ? '' : 'no'}" data-act="merc">${fmt(mc)}<small>gold</small></button>` : '<b class="note">Full</b>'}</div>`;
  return `<div class="row-h">${qtyBar()}${helpBtn('named')}</div>` + merc +
    ALLIES.map((a, i) => {
      if (!G.allyUnlocked(st, i)) return `<div class="card namedcard locked"><div><h3>??? </h3><p>${ic('lantern')} Stage ${a.unlockStage}</p></div></div>`;
      const lv = st.life.allyLevels[i];
      const n = qty === 'max' ? Math.max(1, G.maxAllyBuy(st, i)) : qty;
      const cost = G.allyCost(st, i, n);
      const afford = B.gte(st.life.gold, cost);
      const el = NAMED_ELEMENTS[i] ?? 'phys';
      const next = G.nextMilestone(st, i);
      return `<div class="card namedcard buy" data-long="namedinfo:${i}">
        <div><h3>${elDot(el)} ${esc(a.name)}${st.life.spec?.[i] ? ` <small class="spectag">${G.SPEC_DEFS[st.life.spec[i]].name}</small>` : ''}</h3><p>${lv ? `Lv <b>${lv}</b> · ${fmt(d.namedDps[i])}/s${next ? ` · ${ic('star')}${next}` : ''}` : ''}</p>
          ${G.specWaiting(st, i) ? `<div class="specpick"><span>Level ${G.SPEC_LEVEL}: choose a trade</span>${(['boss', 'horde'] as G.NamedSpec[]).map((k) => `<button data-act="spec:${i}:${k}"><b>${G.SPEC_DEFS[k].name}</b> ${G.SPEC_DEFS[k].text}</button>`).join('')}</div>` : ''}</div>
        <button class="buybtn ${afford ? '' : 'no'}" data-act="ally:${i}">${lv ? '' : `${ic('banner')}<br>`}${fmt(cost)}<small>gold</small></button>
      </div>`;
    }).join('');
}

function itemCell(it: Item | undefined, label: string, act: string, mark = ''): string {
  if (!it) return `<button class="cell empty" data-act="${act}"><small>${label}</small></button>`;
  const r = rarityDef(it.rarity);
  return `<button class="cell" data-act="${act}" style="--rc:${r.color}">${itemIcon(it.slot, it.rarity, it.look)}<span class="ct"><small>${label} · <span class="pw">${G.itemPower(s!, it)}</span>${it.plus ? ` <b class="plus">+${it.plus}</b>` : ''}</small><b>${esc(it.name)}</b></span>${mark}</button>`;
}

const focusName = (st: State) => G.GEAR_FOCUS.find((f) => f.id === (st.gearFocus ?? 'balanced'))!.name;
const classNameOf = (id: string) => CLASSES.find((c) => c.id === id)?.name ?? id;
/** Run 6: the Stash. Complete sets here (up to 10) each give 1% of your worn gear's stats and a small form of their bonus. */
function stashPanel(st: State): string {
  const done = G.stashSets(st);
  const items = (st.stash ?? []).map((it) => itemCell(it, SLOT_NAME[it.slot], `stash-see:${it.id}`, '')).join('');
  const list = done.map((d) => `<p>★ <b>${esc(d.name)}</b>${G.setRuleActive(st, d) ? (G.stashRule(d) ? `: a small form of “${esc(d.text)}”` : `: +${G.STASH_FLAT_DMG}% damage`) : ' (another class: stats only)'}</p>`).join('');
  return `<p class="rule">📦 Keep set pieces here instead of the bag. A set counts when <b>all</b> its pieces are in the Stash: each one gives <b>+${Math.round(G.STASH_STAT * 100)}% of your worn gear's stats</b> and a small form of its bonus. Up to ${G.STASH_SETS_MAX} sets count.</p>
    <p class="note">Complete sets counting: <b>${done.length}</b> (up to ${G.STASH_SETS_MAX}). Pieces kept: ${(st.stash ?? []).length} of ${G.STASH_MAX} spaces. Tap a piece to see it or take it out.</p>
    ${list ? `<div class="card">${list}</div>` : ''}
    <div class="bag">${items || '<p class="note">Empty. Open a set piece in your bag and choose “Put in the Stash”.</p>'}</div>`;
}

/** Run 6: the chase collection, 2 named items per land, from that land's bosses. */
function chasePanel(st: State): string {
  const found = new Set(st.chaseFound ?? []);
  const rows = ZONES.map((z, land) => {
    const items = CHASE.filter((x) => x.land === land);
    if (!items.length) return '';
    return `<div class="card chaseland"><h3>${esc(z.name)}</h3>${items.map((x) => found.has(x.id)
      ? `<p class="good">★ <b>${esc(x.name)}</b> <small>${SLOT_NAME[x.slot]}</small><br><small>${esc(x.text)}</small></p>`
      : `<p class="note">${ic('lock')} ??? <small>${SLOT_NAME[x.slot]} · drops from bosses here</small></p>`).join('')}</div>`;
  }).join('');
  return `<p class="rule">★ Every land hides 2 named items. Its bosses drop them, rarely (about 1 boss in 40). Finding 5, 13 and all 26 gives 2 gems each time.</p>
    <p class="note">${found.size} / ${CHASE.length} found.</p>${rows}`;
}

function gearPanel(): string {
  const st = s!;
  const left: Slot[] = ['head', 'neck', 'shoulders', 'back', 'chest', 'wrists'];
  const right: Slot[] = ['hands', 'waist', 'legs', 'feet', 'ring1', 'ring2', 'trinket1', 'trinket2'];
  const bottom: Slot[] = ['mainHand', 'offHand'];
  const cell = (sl: Slot) => itemCell(st.equipped[sl], SLOT_NAME[sl], `slot:${sl}`);
  const bag = st.bag.map((it) => {
    const v = G.verdict(st, it);
    const mark = G.mergeTarget(st, it) ? '<i class="up">⇪</i>' : v === 'better' ? '<i class="up">▲</i>' : v === 'worse' || v === 'same' ? '<i class="down">▼</i>' : '<i class="mixed">◆</i>';
    return itemCell(it, SLOT_NAME[it.slot], `item:${it.id}`, mark + (it.id > prefs.seenItem ? '<i class="newb">NEW</i>' : ''));
  }).join('');
  const counts = RARITIES.filter((r) => r.id !== 'artifact' && r.id !== 'ancestry' && r.id !== 'set')
    .map((r) => [r, st.bag.filter((i) => i.rarity === r.id).length] as const).filter(([, k]) => k > 0);
  const sellRow = counts.length ? `<div class="sellrow"><span>${ic('coin')} Sell all:</span>${counts.map(([r, k]) => `<button class="small" style="--rc:${r.color}" data-act="sell-rarity:${r.id}">${r.name} (${k})</button>`).join('')}</div>` : '';
  // set progress for any set you have pieces of
  const sets = SETS.map((def) => {
    const worn = new Set<number>();
    for (const it of Object.values(st.equipped)) if (it?.set === def.id && it.piece !== undefined) worn.add(it.piece);
    const owned = new Set<number>([...worn]);
    for (const it of [...st.bag, ...(st.stash ?? [])]) if (it.set === def.id && it.piece !== undefined) owned.add(it.piece);
    if (!owned.size) return '';
    const done = worn.size === def.pieces.length;
    const off = !G.setRuleActive(st, def);
    return `<div class="card setcard ${done ? 'done' : ''}" data-long="set:${def.id}" data-act="set:${def.id}"><b>${done ? '★ ' : ''}${esc(def.name)}${def.cls ? ` <small class="note">${esc(classNameOf(def.cls))}${off ? ' · stats only' : ''}</small>` : ''}</b>
      <span class="setpips">${def.pieces.map((_, i) => `<i class="${worn.has(i) ? 'w' : owned.has(i) ? 'o' : ''}"></i>`).join('')}</span></div>`;
  }).join('');
  // run 2, idea 24: Worn / Bag / Sets, like the other busy tabs. The Bag dot means an upgrade or a merge is waiting.
  const upgrade = st.bag.some((it) => G.mergeTarget(st, it) || G.verdict(st, it) === 'better');
  const head = subTabs('gtab', [['worn', 'Worn'], ['bag', `Bag ${st.bag.length}/${BAG_SIZE}`, upgrade], ['sets', 'Sets'], ['stash', `Stash${G.stashSets(st).length ? ` · ${G.stashSets(st).length} set${G.stashSets(st).length > 1 ? 's' : ''}` : ''}`], ['found', `Found ${(st.chaseFound ?? []).length}/${CHASE.length}`]], gearTab);
  if (gearTab === 'stash') return `${head}${stashPanel(st)}`;
  if (gearTab === 'found') return `${head}${chasePanel(st)}`;
  if (gearTab === 'bag') return `${head}
    <button class="small focusbtn" data-act="focus-next">⚖ Judge gear by: <b>${esc(focusName(st))}</b> ▾</button>
    <div class="baghead"><h3>${ic('coin')} ${st.bag.length}/${BAG_SIZE} ${helpBtn('gear')}</h3>${st.bag.some((it) => G.mergeTarget(st, it)) ? '<button data-act="merge-all">⇪ Merge all</button>' : ''}<button data-act="salvage-worse">▼ ${ic('coin')}</button></div>
    ${sellRow ? (sellOpen ? sellRow : '<button class="small" data-act="sell-open">' + ic('coin') + ' Salvage by rarity…</button>') : ''}
    ${st.life.autoSold ? `<p class="note">${ic('coin')} ${st.life.autoSold} worse drop${st.life.autoSold > 1 ? 's' : ''} salvaged for gold this life (Menu › Settings turns this off).</p>` : ''}
    <div class="bag">${bag || '<p class="note">Bosses drop gear. Dungeons drop realm set pieces.</p>'}</div>`;
  if (gearTab === 'sets') return `${head}${sets ? `<div class="sets">${sets}</div>` : `<p class="note center">${ic('lock')} No set pieces yet. Dungeon bosses drop them (Death tab, with a key).</p>`}`;
  return `${head}
    <div class="doll">
      <div class="col">${left.map(cell).join('')}</div>
      <div class="col mid">${heroPortrait(heroLook(st), 120)}${bottom.map(cell).join('')}</div>
      <div class="col">${right.map(cell).join('')}</div>
    </div>
    ${st.bag.length ? `<button class="small center" data-act="gtab:bag">${ic('coin')} Bag: ${st.bag.length} item${st.bag.length > 1 ? 's' : ''}${upgrade ? ' · ▲ upgrade waiting' : ''} ›</button>` : ''}`;
}

// ---- skills: class tree, shared spells, race tree, transformation tree

function skillsPanel(): string {
  const st = s!;
  const tabs = (['class', 'spells', 'race', 'form'] as SkillTab[]).map((t) => {
    const free = t === 'race' ? G.racePointsFree(st) : t === 'form' ? G.formPointsFree(st) : G.skillPointsFree(st);
    const name = { class: G.classOf(st).name, spells: 'Spells', race: 'Race', form: st.forms.length ? 'Form' : 'Mastery' }[t];
    return `<button data-act="stab:${t}" class="${skillTab === t ? 'on' : ''}">${name}${free > 0 ? ` <b class="free">${free}</b>` : ''}</button>`;
  }).join('');
  const respec = (G.skillPointsSpent(st) || Object.keys(st.raceRanks).length || Object.keys(st.formRanks).length)
    ? `<button class="small ${B.gte(st.embers, G.respecCost(st)) ? '' : 'no'}" data-act="reset-skills">Take all points back · ${fmt(G.respecCost(st))} Embers</button>` : '';
  const body = skillTab === 'class' ? classTree() : skillTab === 'spells' ? spellList() : skillTab === 'form' ? formView() : treeView('race');
  return `<div class="row-h"><div class="subtabs">${tabs}</div>${helpBtn('skills')}</div>${body}${respec ? `<div class="card">${respec}</div>` : ''}`;
}

function trackBar(tr: G.Track, cap = G.MAX_TIER): string {
  const need = G.rankXp(tr.tier);
  const full = tr.rank >= G.MAX_TIER_RANK;
  return `<span class="tierb">T${tr.tier}</span><small>${tr.rank}/${G.MAX_TIER_RANK}${full ? (tr.tier < cap ? ' · trial ✦' : ' · max') : ''}</small><i class="trk"><u style="width:${full ? 100 : (tr.xp / need) * 100}%"></u></i>`;
}

function classTree(): string {
  const st = s!;
  const cls = G.classOf(st);
  const free = G.skillPointsFree(st);
  const canSwitch = G.canSwitchPath(st);
  const pathCard = (p: string) => {
    const tr = st.classPaths[p];
    const name = p === 'base' ? cls.name : p;
    if (!tr) return `<div class="path locked" data-long="text:Max your base class (T1 rank 10), then clear the ${esc(p)} trial in Quests.">${icon32(`sub:${cls.id}:${p}`, 28) || ic('lantern')}<b>${esc(name)}</b><small>🔒 trial</small></div>`;
    const on = st.classPath === p;
    return `<button class="path ${on ? 'on' : ''}" data-act="path:${p}" ${!on && !canSwitch ? 'disabled' : ''}>${icon32(p === 'base' ? `class:${cls.id}` : `sub:${cls.id}:${p}`, 28) || ic(p === 'base' ? 'star' : 'sword')}<b>${esc(name)}</b>${trackBar(tr, p === 'base' ? 1 : G.MAX_TIER)}</button>`;
  };
  const shut: string[] = [];
  const node = (n: (typeof cls.tree)[number]) => {
    const r = st.ranks[n.id] ?? 0;
    const open = G.classNodeUnlocked(st, n);
    if (!open) { shut.push(`${n.name} (T${n.tier + 1})`); return ''; }
    const can = free > 0 && r < MAX_RANK;
    const eff = n.kind === 'active'
      ? `${ACTIVE_HELP[n.active!](Math.max(1, r))} ${n.mana} mana · ${n.cooldown} s`
      : `${statLine(n.stat!, (n.perRank ?? 0) * Math.max(1, r))}`;
    const cl = n.cleave ? ` · cleave +${n.cleave * Math.max(1, r)}%` : '';
    return skillRow({ icon: n.kind === 'active' ? sIcon(n.id, kindIcon(n.active!)) : icon32(n.id) || ic(n.cleave ? 'sword' : 'star'), name: `${n.name}${n.mainGame ? ' ◆' : ''}`, r, max: MAX_RANK,
      act: can ? `rank:${n.id}` : undefined, long: `${n.name}: ${n.text} Now: ${eff}${cl}.`, cls: n.cleave ? 'cleave' : '' });
  };
  const extra = (n: TierNode) => {
    const r = st.ranks[n.id] ?? 0;
    if (!G.tierNodeOpen(st, n)) { shut.push(`${n.name} (T${n.tier})`); return ''; }
    const can = free > 0 && r < n.max;
    return skillRow({ icon: icon32(n.id) || ic(n.effect.rule ? 'star' : 'shield'), name: `${n.name}${n.mainGame ? ' ◆' : ''}`, r, max: n.max,
      act: can ? `rank:${n.id}` : undefined, long: `${n.name}: ${effectLine(n.effect, Math.max(1, r), n.text)}` });
  };
  const found = cls.tree.filter((n) => n.tier === 0);
  const branch = st.classPath === 'base' ? [] : cls.tree.filter((n) => n.branch === st.classPath).sort((a, b) => a.tier - b.tier);
  const ex = SUBCLASS_EXTRA[G.subclassKey(st, st.classPath)];
  const ult = ex?.ultimate;
  const ultOpen = (st.classPaths[st.classPath]?.tier ?? 0) >= 7;
  const rows = [...found.map(node), ...branch.map(node), ...(ex?.nodes ?? []).map(extra)].join('');
  if (ult && !ultOpen) shut.push(`${ult.name} (T7 ultimate)`);
  const ultRow = ult && ultOpen ? skillRow({ icon: sIcon(ult.id, ult.icon), name: ult.name, r: 1, max: 1, long: `${ult.name}: ${ult.text}`, cls: 'ult', right: '<span class="pips">Ultimate</span>' }) : '';
  return `<div class="card pts">${ic('book')} <b>${free}</b> · <b class="title">${esc(G.classTitle(st))}</b></div>
    <div class="card rows">${rows}${ultRow}${lockedLine(shut)}</div>
    ${st.classPath === 'base' ? `<p class="note center">Max ${esc(cls.name)} (rank 10) to see the subclass trials.</p>` : ''}
    <h3 class="sect">${ic('sword')} Paths${canSwitch ? '' : ' <small class="note">(no switching in a fight)</small>'}</h3>
    <div class="paths">${['base', ...cls.branches].map(pathCard).join('')}</div>`;
}

function spellList(): string {
  const st = s!;
  const free = G.skillPointsFree(st);
  const lvl = G.xpLevel(st.xp);
  const shut: string[] = [];
  const rows = SPELLS.map((sp) => {
    const lv = st.spells[sp.id] ?? 0;
    if (lvl < sp.unlock) { shut.push(`${sp.name} (Lv ${sp.unlock})`); return ''; }
    const can = free > 0 && lv < sp.max;
    return skillRow({ icon: sIcon(sp.id, sp.icon), name: sp.name, r: lv, max: sp.max, act: can ? `spell:${sp.id}` : undefined, label: lv ? '+1' : 'Learn',
      long: `${sp.name}: ${sp.text} ${ACTIVE_HELP[sp.active](sp.base + sp.per * Math.max(0, lv - 1))} ${sp.mana} mana, every ${sp.cooldown} s.` });
  }).join('');
  return `<div class="card pts">${ic('book')} <b>${free}</b> class points</div><div class="card rows">${rows}${lockedLine(shut)}</div>`;
}

function formView(): string {
  const st = s!;
  const free = G.formPointsFree(st);
  const ids = st.forms.length ? st.forms : ['mastery'];
  const fname = (f: string) => (f === 'mastery' ? 'Mortal Master' : FORMS.find((x) => x.id === f)?.name ?? f);
  const tracks = ids.map((f) => `<div class="path on">${icon32(`form:${f}`, 28) || (f === 'mastery' ? ic('star') : ic(FORM_ICON[f] ?? 'flame'))}<b>${esc(fname(f))}</b>${trackBar(st.formTracks[f], G.formCap(st, f))}<small class="note">${esc(G.formTitle(st, f))}${G.formCap(st, f) < 7 ? ` · cap T${G.formCap(st, f)}` : ''}</small></div>`).join('');
  let offer = '';
  if (!st.forms.length && st.formOffered) {
    offer = `<div class="card offer"><h3>${ic('drop')} A transformation is offered</h3><p class="warn">Taking one closes Mortal Master forever.</p>
      <div class="opts">${FORMS.filter((f) => f.id !== 'mortal').map((f) => `<button class="opt" data-act="form-take:${f.id}">${heroPortrait({ ...heroLook(st), form: f.id }, 48)}<b>${f.name}</b></button>`).join('')}</div></div>`;
  } else if (G.canAddForm(st)) {
    offer = `<div class="card offer"><h3>${ic('drop')} Hybrid</h3><p class="note">Add a form while all yours are T1–T2. Caps: two forms T4/T3, three forms T2. Every weakness applies.</p>
      <div class="opts">${FORMS.filter((f) => f.id !== 'mortal' && !st.forms.includes(f.id)).map((f) => `<button class="opt" data-act="form-take:${f.id}">${heroPortrait({ ...heroLook(st), form: f.id }, 48)}<b>${f.name}</b></button>`).join('')}</div></div>`;
  } else if (!st.forms.length) {
    offer = `<p class="note center">${ic('lock')} Everyone begins as a Mortal Master. A transformation is offered by a trial after quest ${G.OFFER_QUEST}; until you take one, you can stay mortal.</p>`;
  }
  const shut: string[] = [];
  const nodes = G.formNodes(st).map((n) => {
    const r = st.formRanks[n.id] ?? 0;
    if (!G.formNodeOpen(st, n)) { shut.push(`${n.name} (${n.need > G.formCap(st, n.form) ? 'over your cap' : `T${n.need}`})`); return ''; }
    const can = free > 0 && r < n.max;
    return skillRow({ icon: icon32(n.id) || ic(n.effect.rule ? 'star' : 'flame'), name: `${n.name}${n.mainGame ? ' ◆' : ''}`, r, max: n.max, act: can ? `tree:form:${n.id}` : undefined,
      long: `${n.name}: ${effectLine(n.effect, Math.max(1, r), n.text)}` });
  }).join('') + lockedLine(shut);
  const ults = ids.map((f) => FORM_EXTRA[f]?.ultimate).filter((u) => !!u).map((u) => {
    const open = G.ultimates(st).some((x) => x.id === u!.id);
    return `<div class="node ult ${open ? 'have' : 'shut'}" data-long="text:${esc(u!.text)}"><div class="nt"><b>${sIcon(u!.id, u!.icon)}${esc(u!.name)}</b><span>${open ? 'Ultimate' : '🔒 T7'}</span></div><p class="eff">${esc(u!.text)}</p></div>`;
  }).join('');
  return `<div class="card pts">${ic('flame')} <b>${free}</b> transformation points</div><div class="paths">${tracks}</div>${offer}<div class="card rows">${nodes}</div>${ults}`;
}

function treeView(kind: 'race' | 'form'): string {
  const st = s!;
  const tree: TreeDef | undefined = kind === 'race' ? G.raceTree(st) : G.formTree(st);
  if (!tree) return '<div class="card"><p>No tree for this choice yet.</p></div>';
  const ranks = kind === 'race' ? st.raceRanks : st.formRanks;
  const free = kind === 'race' ? G.racePointsFree(st) : G.formPointsFree(st);
  const shut: string[] = [];
  const tiers = `<div class="card rows">${[0, 1, 2].map((tier) => tree.nodes.filter((n) => n.tier === tier).map((n) => {
    const r = ranks[n.id] ?? 0;
    if (!G.treeNodeOpen(tree, ranks, n.id)) { shut.push(n.name); return ''; }
    const can = free > 0 && r < n.max;
    return skillRow({ icon: icon32(n.id) || ic(n.effect.rule ? 'star' : 'shield'), name: `${n.name}${n.mainGame ? ' ◆' : ''}`, r, max: n.max, act: can ? `tree:${kind}:${n.id}` : undefined,
      long: `${n.name}: ${effectLine(n.effect, Math.max(1, r), n.text)}` });
  }).join('')).join('')}${lockedLine(shut)}</div>`;
  return `<div class="card pts">${ic(kind === 'race' ? 'heart' : 'flame')} <b>${free}</b> ${kind === 'race' ? 'race' : 'transformation'} points <small class="note">· ${esc(tree.name)}</small></div>${tiers}`;
}

// ---- pets

function petsPanel(): string {
  const st = s!;
  const owned = PETS.filter((p) => p.id in st.pets);
  const d = G.derive(st);
  const card = (p: typeof PETS[number]) => {
    const lv = st.pets[p.id];
    const out = st.petsOut.includes(p.id);
    const cost = G.petLevelCost(st, p.id);
    const val = p.per * lv * (out ? 1 : G.PET_BENCH) * d.petMult;
    return `<div class="card petcard ${out ? 'out' : ''}" data-long="pet:${p.id}">
      ${petIcon(p.body, p.element)}<div class="pt"><b>${esc(p.name)}</b> ${elDot(p.element)} <span class="note">Lv ${lv}</span>
      <p>${esc(statLine(p.stat, val))}</p></div>
      <div class="pb"><button class="small ${out ? 'on' : ''}" data-act="petout:${p.id}">${out ? '✔ Out' : '↑ Out'}</button>
      <button class="small ${st.marks >= cost ? '' : 'no'}" data-act="petlv:${p.id}">+1 · ${cost} ✦</button></div></div>`;
  };
  const outRow = owned.length ? `<div class="outrow">${Array.from({ length: G.PETS_OUT }, (_, i) => {
    const p = PETS.find((q) => q.id === st.petsOut[i]);
    return p ? `<div class="outslot on" data-long="pet:${p.id}">${petIcon(p.body, p.element)}<small>${esc(p.name)}</small></div>` : `<div class="outslot"><b>+</b><small>Free slot: tap ↑ Out</small></div>`;
  }).join('')}</div>` : '';
  return `${outRow}<div class="card pts">${petIcon('crow', 'phys')} <b>${owned.length}/${PETS.length}</b> · ${st.petsOut.length}/${G.PETS_OUT} out · ✦ ${st.marks} ${helpBtn('pets')}
      ${st.eggs > 0 ? `<button class="big" data-act="hatch">${petIcon('wisp', 'magic')} Hatch (${st.eggs})</button>` : ''}</div>
    ${owned.length ? '' : `<div class="card empty">${petIcon('wisp', 'magic')}<p><b>No pets yet.</b> Some quests give a pet, and every 100th stage's chest holds an egg to hatch here.</p></div>`}
    ${owned.filter((p) => st.petsOut.includes(p.id)).map(card).join('')}
    ${owned.filter((p) => !st.petsOut.includes(p.id)).map(card).join('')}
    `;
}

// ---- quests, tasks, login, achievements

function questsPanel(): string {
  const st = s!;
  const task = (t: { id: string; base: number; claimed: boolean }) => {
    const def = G.taskDef(t.id);
    if (!def) return '';
    const [h, n] = G.taskProgress(st, t);
    return `<div class="card task ${t.claimed ? 'claimed' : h >= n ? 'ready' : ''}"><b>${esc(def.text)}</b>
      <div class="pbar"><i style="width:${(h / n) * 100}%"></i><span>${progressText(h, n)}</span></div>
      <span class="rws">${rewardIcons(def.rewards)}</span>
      ${!t.claimed && h >= n ? `<button data-act="task:${t.id}">Claim</button>` : t.claimed ? '<p class="good">Claimed</p>' : ''}</div>`;
  };
  const trials = G.availableTrials(st).map((tr) => {
    const [h, n] = G.trialProgress(st, tr);
    return `<div class="card task trial ${h >= n ? 'ready' : ''}"><b>${ic(tr.kind === 'form' || tr.kind === 'offer' ? 'flame' : 'sword')} ${esc(tr.text)}</b>
      <div class="pbar"><i style="width:${(h / n) * 100}%"></i><span>${progressText(h, n)}</span></div>
      ${h >= n ? `<button data-act="trial:${tr.id.replace(/:/g, '|')}">Claim</button>` : ''}</div>`;
  }).join('');
  const ready = (list: typeof st.daily.tasks) => list.some((x) => { const [h, n] = G.taskProgress(st, x); return !x.claimed && h >= n; });
  const [qh, qn] = G.questProgress(st);
  const trialReady = G.availableTrials(st).some((tr) => { const [h, n] = G.trialProgress(st, tr); return h >= n; });
  const head = subTabs('qtab', [['quest', 'Quest', qh >= qn], ['trials', 'Trials', trialReady], ['daily', 'Daily', ready(st.daily.tasks)], ['weekly', 'Weekly', ready(st.daily.weekly)]], questTab);
  if (questTab === 'trials') return `${head}${trials || `<p class="note center">${ic('lock')} No trials open yet. They appear when a class path or form reaches rank 10.</p>`}<p class="note center">${helpBtn('trials')}</p>`;
  if (questTab === 'daily') return `${head}${st.daily.tasks.map(task).join('')}<p class="note center">New tasks every day. ${helpBtn('tasks')}</p>`;
  if (questTab === 'weekly') return `${head}${st.daily.weekly.map(task).join('')}<p class="note center">New tasks every week.</p>`;
  return `${head}${questCard()}<p class="note center">Quest ${st.quest.num} · quests give class and transformation points.</p>`;
}

// ---- death: dungeons, falling, relics, scars

function deathPanel(): string {
  const st = s!;
  const parts: string[] = [];
  const g = st.dungeon;
  // run 2, idea 25: Fall / Relics / Dungeon. A running dungeon or escape always shows its own page.
  const keyDot = !st.dungeon && st.keys > 0 && st.bestStage >= 10;
  const fallDot = G.canDie(st) && st.returns === 0;
  const dt: DeathTab = st.dungeon ? 'dungeon' : st.escape ? 'fall' : deathTab;
  parts.push(subTabs('dtab', [['fall', 'Fall', fallDot], ['relics', `Relics ${G.relicsOwnedCount(st)}`], ['dungeon', `Dungeon 🗝${st.keys}`, keyDot]], dt));
  if (dt === 'dungeon') {
  if (g) {
    parts.push(`<div class="card dungeon"><h3>Dungeon: ${REALMS.find((r) => r.id === g.realm)!.name}</h3><p>${g.done ? (g.cleared ? 'Cleared.' : 'The clock ran out.') : `${g.killed} / ${G.DUNGEON_MOBS} foes, then the boss.`}</p>
      ${g.done ? '<button class="big" data-act="leave">Leave the dungeon</button>' : ''}</div>`);
  } else {
    parts.push(`<div class="card dungeon"><h3>${ic('lantern')} Dungeon <small>🗝 ${st.keys}</small> ${helpBtn('dungeon')}</h3>
      <p>${G.DUNGEON_MOBS} ${ic('skull')} + boss · ${ic('clock')} ${G.DUNGEON_SECONDS / 60} min → set piece</p>
      <button class="big ${st.keys > 0 && !st.escape ? '' : 'no'}" data-act="dungeon">🗝 Enter</button></div>`);
  }
  return parts.join('');
  }
  if (dt === 'fall') {
  if (st.escape) {
    parts.push(`<div class="card"><h3>Escaping</h3><p>Reach the gate of the ${REALMS.find((r) => r.id === st.escape!.realm)!.name}. Embers so far: ${fmt(G.escapeReward(st.escape))}.</p></div>`);
  } else if (G.canDie(st)) {
    const base = G.previewEmbers(st);
    parts.push(`<div class="card fall">
      <h3>${ic('skull')} Fall at stage ${st.life.maxStage} ${helpBtn('fall')}</h3>
      <p><span class="ember-i"></span> <b>${fmt(B.times(base, 0.4))}</b> – <b>${fmt(B.times(base, 1.5))}</b> Embers <small class="note">(rare escapes up to ${fmt(B.times(base, 2))})</small> · ${ic('clock')} ${Math.round(ESCAPE_SECONDS / 60)} min · <span class="warn">scar risk</span></p>
      <p class="note">${(() => { const need = G.newRelicCost(st); const have = B.add(st.embers, B.times(base, 0.4)); return B.gte(have, need) ? `${ic('eye')} Even a poor escape pays for a new relic.` : `${ic('eye')} Next new relic: ${fmt(need)} Embers. You have ${fmt(st.embers)}.`; })()}</p>
      ${st.life.tithe ? `<p class="note">⛪ Tithed: +${Math.round(st.life.tithe * 100)}% Embers from this fall.</p>` : !B.isZero(st.life.gold) && G.titheBonus(st) >= 0.005 ? `<button data-act="tithe">⛪ Tithe all your gold to the Bell: +${Math.max(1, Math.round(G.titheBonus(st) * 100))}% Embers</button>` : ''}
      <button class="big danger" data-act="die">Fall</button></div>`);
  } else if (!st.dungeon) {
    parts.push(`<div class="card"><h3>${ic('skull')} Fall ${helpBtn('fall')}</h3><p>🔒 Stage ${G.MIN_DEATH_STAGE}</p></div>`);
  }
  pushScars(st, parts);
  parts.push(`<p class="note">↺ ${st.returns} · best <span class="ember-i"></span> ${fmt(st.bestReturn)}</p>`);
  return parts.join('');
  }
  const newCost = G.newRelicCost(st);
  const left = RELICS.filter((r) => !G.relicOwned(st, r.id)).length;
  parts.push(`<h3 class="sect">${ic('star')} Relics <small>${G.relicsOwnedCount(st)}/${RELICS.length}</small> ${helpBtn('relics')}</h3>
    ${left ? `<div class="card buy"><div><h3>${ic('eye')} Find a relic</h3></div><button class="buybtn ember ${B.gte(st.embers, newCost) ? '' : 'no'}" data-act="relic-new">${fmt(newCost)}<small>Embers</small></button></div>` : ''}`);
  parts.push(RELICS.filter((r) => G.relicOwned(st, r.id)).map((r) => {
    const lv = st.relics[r.id] ?? 0;
    const maxed = r.max !== undefined && lv >= r.max;
    const cost = G.relicCost(st, r.id);
    const ok = !maxed && B.gte(st.embers, cost);
    return `<div class="card buy rite" data-long="relic:${r.id}"><div><h3>${r.effect.rule ? '★ ' : ''}${esc(r.name)}</h3><p>${esc(lv ? effectLine(r.effect, lv, r.text) : r.text)} · <b>${lv}${r.max ? `/${r.max}` : ''}</b></p></div>
      <button class="buybtn ember ${ok ? '' : 'no'}" data-act="relic:${r.id}">${maxed ? 'Max' : `${fmt(cost)}<small>Embers</small>`}</button></div>`;
  }).join(''));
  return parts.join('');
}
function pushScars(st: State, parts: string[]) {
  if (st.scars.length) {
    const hc = G.healCost(st);
    parts.push(`<h3 class="sect">${ic('skull')} Scars ${helpBtn('scars')}</h3>`);
    parts.push(st.scars.map((id, i) => {
      const x = SCARS.find((y) => y.id === id)!;
      return `<div class="card buy"><div><h3>${x.name}</h3><p>${x.text}</p></div><button class="buybtn ember ${B.gte(st.embers, hc) ? '' : 'no'}" data-act="heal:${i}">Heal<small>${fmt(hc)}</small></button></div>`;
    }).join(''));
  }
}

function menuPanel(): string {
  const back = '<button class="small" data-act="menu:main">← Back</button>';
  if (menuPage === 'notes') return `${back}${patchNotesHtml()}`;
  if (menuPage === 'help') return `${back}<div class="card"><h3>${ic('book')} How to play</h3>
      <p><b>Tap</b> the fight to strike. Beat 8 foes, then the boss before its candle burns out. Leftover damage carries on to the next foes.</p>
      <p><b>Elements</b>: physical, magic, fire, cold, lightning, poison. Some foes are immune to one; every boss has a weakness.</p>
      <p><b>Named</b> fight on their own, each with an element. <b>Pets</b>: up to 3 fight with you.</p>
      <p><b>Quests</b> give class and transformation points; your <b>level</b> gives race points.</p>
      <p><b>Dungeons</b> (keys) drop realm set pieces. A full set type unlocks a rule-bender.</p>
      <p><b>Death</b>: when you stall, fall. Escape the realm for Embers; spend them on relics.</p>
      <p><b>Away</b>: the Named keep earning gold for up to 24 hours.</p>
      <p><b>Tabs</b>: tap a tab to open it, tap it again to go back to the fight. Long-press almost anything to see what it does.</p></div>`;
  if (menuPage === 'words') return `${back}<div class="card glossary"><h3>${ic('book')} Words of Lanternfall</h3>
      ${GLOSSARY.map(([w, icon, text]) => `<p>${ic(icon)} <b>${esc(w)}</b>: ${esc(text)}</p>`).join('')}</div>`;
  if (menuPage === 'save') return `${back}<div class="card"><h3>${ic('book')} Copy my save code</h3>
      <p>Your game saves on this device by itself. To play on another phone or PC, copy this code there and paste it under Load.</p>
      <button data-act="export">Show my save code</button>
      <textarea id="codeout" readonly placeholder="Your code appears here">${esc(shownCode)}</textarea>
      <button data-act="copy">Copy</button></div>
    <div class="card"><h3>${ic('book')} Load a save code</h3>
      <textarea id="codein" placeholder="Paste a code that starts with UT1:"></textarea>
      <button data-act="import">Load this save</button></div>`;
  const tog = (k: Toggle, label: string, icon: string) => `<button class="setting ${prefs[k] ? 'on' : ''}" data-act="pref:${k}">${ic(icon)}<span>${label}</span><b>${prefs[k] ? 'On' : 'Off'}</b></button>`;
  const st = s!;
  const locked = (label: string, icon: string, why: string) => `<button class="setting lockedset" data-long="text:${esc(why)}" data-act="help-text:${esc(why)}">${ic(icon)}<span>${label}</span><b>🔒</b></button>`;
  return `<div class="card"><h3>${ic('clock')} Settings</h3><div class="settings">${tog('vibrate', 'Vibration', 'bell')}${tog('motion', 'Shake and motion', 'bolt')}${tog('big', 'Larger text', 'book')}${tog('sci', 'Big numbers as 1.23e45', 'star')}${tog('sound', 'Sound', 'bell')}<button class="setting ${st.eventsOff ? '' : 'on'}" data-act="events-toggle">${ic('star')}<span>Events (Eclipse, Bell Toll, Grave Rush)</span><b>${st.eventsOff ? 'Off' : 'On'}</b></button><button class="setting ${st.autoSalvageOff ? '' : 'on'}" data-act="autosalvage-toggle">${ic('coin')}<span>Auto-salvage worse drops (Rare and below)</span><b>${st.autoSalvageOff ? 'Off' : 'On'}</b></button><button class="setting on" data-act="focus-next">${ic('coin')}<span>Judge gear by (bag arrows, Compare, auto-salvage)</span><b>${esc(focusName(st))}</b></button><button class="setting ${prefs.scaresOff ? '' : 'on'}" data-act="scares-toggle">${ic('skull')}<span>Jumpscares (rare)</span><b>${prefs.scaresOff ? 'Off' : 'On'}</b></button>${tog('hitstop', 'Hit-stop on big hits', 'sword')}
    ${G.autoCastUnlocked(st) ? tog('autocast', 'Auto-cast spells at full mana', 'flame') : locked('Auto-cast spells', 'flame', `Unlocks at level ${G.AUTO_CAST_LEVEL}.`)}
    ${G.autoBuyUnlocked(st) ? tog('autobuy', 'Auto-buy Train and Named', 'coin') : locked('Auto-buy', 'coin', `Unlocks with ${G.AUTO_BUY_RELICS} relics.`)}</div></div>
    <div class="card menulist">
      <button class="mrow" data-act="menu:help">${ic('book')}<span>How to play</span><b>›</b></button>
      <button class="mrow" data-act="menu:words">${ic('eye')}<span>Words (Embers, Marks, scars…)</span><b>›</b></button>
      <button class="mrow" data-act="menu:notes">${ic('star')}<span>Patch notes</span><b>›</b></button>
      <button class="mrow" data-act="menu:save">${ic('lantern')}<span>Move your save (copy or load)</span><b>›</b></button>
    </div>
    <div class="card menulist startover"><button class="mrow danger" data-act="newgame">${ic('skull')}<span>Start over (new character)</span><b>›</b></button></div>`;
}

function showModal(kind: string, html: string) {
  const m = document.getElementById('modal')!;
  modalOpen = kind;
  const x = ['info', 'inspect', 'confirm', 'offline'].includes(kind) ? '<button class="sheetx" data-act="close" aria-label="Close">✕</button>' : '';
  m.innerHTML = `<div class="sheetbox">${x}${html}</div>`;
  m.hidden = false;
  // run 6 testers (Sonnet and Elliot): the Toll Collector's Accept showed through a popup but could not be tapped
  const evc = document.getElementById('evchip');
  if (evc) evc.hidden = true;
}
function closeModal() {
  const m = document.getElementById('modal')!;
  m.hidden = true;
  m.innerHTML = '';
  modalOpen = null;
  inspect = null;
}

/** Long-press details. */
function showInfo(what: string) {
  const st = s as State;
  const [k, id] = what.split(':');
  if (!st && k !== 'text' && k !== 'help') {
    return;
  }
  let html = '';
  if (k === 'help') html = `<h2>${ic('book')} Help</h2><p>${esc(HELP[id] ?? '')}</p>`;
  else if (k === 'text') html = `<p>${esc(what.slice(5))}</p>`;
  else if (k === 'skill') {
    const n = G.classOf(st).tree.find((x) => x.id === id);
    const sp = SPELLS.find((x) => x.id === id);
    if (n) html = `<h2>${sIcon(n.id, kindIcon(n.active ?? ''))} ${esc(n.name)}</h2><p>${esc(n.text)}</p><p class="eff">${esc(ACTIVE_HELP[n.active!](Math.max(1, st.ranks[n.id] ?? 1)))}</p><p class="note">Rank ${st.ranks[n.id] ?? 0}/${MAX_RANK} · ${n.mana} mana · every ${n.cooldown} s</p>`;
    else if (sp) html = `<h2>${sIcon(sp.id, sp.icon)} ${esc(sp.name)}</h2><p>${esc(sp.text)}</p><p class="note">Level ${st.spells[sp.id] ?? 0}/${sp.max} · ${sp.mana} mana · every ${sp.cooldown} s</p>`;
  } else if (k === 'namedinfo') {
    const i = Number(id);
    const a = ALLIES[i];
    const el = NAMED_ELEMENTS[i] ?? 'phys';
    const d = G.derive(st);
    html = `<h2>${elDot(el)} ${esc(a.name)}</h2><p>${esc(a.text)}</p><p>Element: <b style="color:${ELEMENT_COLOR[el]}">${ELEMENT_NAME[el]}</b> · Level ${st.life.allyLevels[i]} · ${fmt(d.namedDps[i])}/s</p>
      ${G.nextMilestone(st, i) ? `<p class="note">Next milestone at level ${G.nextMilestone(st, i)}.</p>` : ''}
      <button class="big" data-act="ally:${i}">Level up · ${fmt(G.allyCost(st, i, 1))} gold</button>`;
  } else if (k === 'pet') {
    const p = PETS.find((x) => x.id === id)!;
    html = `<h2>${petIcon(p.body, p.element)} ${esc(p.name)}</h2><p>${esc(p.text)}</p><p>${esc(statLine(p.stat, p.per))} per level · attacks for ${p.atk}% of your tap damage a second (${ELEMENT_NAME[p.element]}).</p>`;
  } else if (k === 'relic') {
    const r = RELICS.find((x) => x.id === id)!;
    html = `<h2>${esc(r.name)} <small class="note">#${r.num} · ${esc(r.group)}</small></h2><p>${esc(r.text)}</p><p class="note">Level ${st.relics[r.id] ?? 0}${r.max ? ` of ${r.max}` : ''}</p>`;
  } else if (k === 'set') {
    const def = SETS.find((x) => x.id === id)!;
    const worn = new Set(Object.values(st.equipped).filter((x) => x?.set === def.id).map((x) => x!.piece));
    html = `<h2>${esc(def.name)}</h2><p class="note">${def.cls ? `${esc(classNameOf(def.cls))} gear${G.setRuleActive(st, def) ? '' : ' (stats only for you)'}` : REALMS.find((r) => r.id === def.realm)?.name ?? ''} · ${def.type}</p><ul class="pieces">${def.pieces.map((p, i) => `<li class="${worn.has(i) ? 'good' : ''}">${esc(p.name)} <small>${SLOT_NAME[p.slot]}</small></li>`).join('')}</ul><p>★ ${esc(def.text)}</p>`;
  }
  if (html) showModal('info', `${html}<button data-act="close">Close</button>`);
}

/** The Forge price follows your best stage, which can rise while the popup is open (re-test, 11 Nov): keep the button's price live. */
function refreshForge() {
  if (!s || modalOpen !== 'inspect') return;
  document.querySelectorAll<HTMLElement>('.forgebtn[data-act^="forge:"]').forEach((b) => {
    const it = s!.equipped[b.dataset.act!.slice(6) as Slot];
    if (!it) return;
    const c = G.forgeCost(s!, it);
    const tag = b.querySelector('small');
    if (tag) tag.textContent = tag.textContent!.replace(/· .* gold$/, `· ${fmt(c)} gold`);
    b.classList.toggle('no', !B.gte(s!.life.gold, c));
  });
}
function inspectHtml(it: Item, from: 'bag' | Slot): string {
  const st = s!;
  const r = rarityDef(it.rarity);
  const order: StatKey[] = ['weapon', 'str', 'agi', 'sta', 'int', 'spi'];
  const keys = Object.keys(it.stats) as StatKey[];
  const k = 1 + G.PLUS_STEP * (it.plus ?? 0);
  const base = order.filter((x) => keys.includes(x)).map((x) => `<div class="base">${statLine(x, it.stats[x]! * k)}</div>`).join('');
  const aff = keys.filter((x) => !order.includes(x)).map((x) => `<div class="aff">${statLine(x, it.stats[x]! * k)}</div>`).join('');
  const rule = (it.ruleText ? `<div class="rule" style="color:${r.color}">${it.chase ? '★ Chase item: ' : ''}${esc(it.ruleText)}</div>` : '')
    + (it.cls && !it.set && it.cls !== st.hero.cls ? `<div class="note">${esc(classNameOf(it.cls))} gear: for you it gives its stats only. Reshape into a ${esc(classNameOf(it.cls))} and its rule wakes up.</div>` : '');
  const def = it.set ? G.setById(it.set) : undefined;
  const setInfo = def ? (() => {
    const worn = new Set<number>();
    for (const x of Object.values(st.equipped)) if (x?.set === def.id && x.piece !== undefined) worn.add(x.piece);
    const after = new Set(worn); if (from === 'bag' && it.piece !== undefined) after.add(it.piece);
    const offNote = def.cls && !G.setRuleActive(st, def) ? `<div class="note">${esc(classNameOf(def.cls))} gear: for you it gives its stats only. Reshape into a ${esc(classNameOf(def.cls))} and the bonus wakes up.</div>` : '';
    return `${offNote}<div class="rule" style="color:${r.color}">${esc(def.name)} (${def.type}${def.cls ? `, ${esc(classNameOf(def.cls))}` : ''}): wear all ${def.pieces.length} for ★ ${esc(def.text)}</div>
      <div class="note">You wear ${worn.size}/${def.pieces.length}${from === 'bag' && after.size > worn.size ? `; wearing this makes ${after.size}/${def.pieces.length}${after.size === def.pieces.length ? ' ★ set bonus on' : ''}` : ''}.</div>`;
  })() : '';
  const elInfo = it.el ? `<div class="aff" style="color:${ELEMENT_COLOR[it.el]}">Your taps deal ${ELEMENT_NAME[it.el]} damage</div>` : '';
  let cmp = '';
  let buttons = '';
  if (from === 'bag') {
    const slots = G.fitsSlots(it);
    cmp = slots.map((sl) => {
      const c = G.compare(st, it, sl);
      const worn = st.equipped[sl];
      const cl = (x: number) => (x > 0.0005 ? 'good' : x < -0.0005 ? 'bad' : '');
      return `<div class="cmp"><small>Instead of ${worn ? `<span style="color:${rarityDef(worn.rarity).color}">${esc(worn.name)}</span> (Power ${G.itemPower(st, worn)})` : 'nothing'} · ${SLOT_NAME[sl]}${slots.length > 1 ? ` ${slots.indexOf(sl) + 1}` : ''}</small>
        ${(() => { const j = G.judge(st, c); return `<div class="verdict ${j === 'better' ? 'good' : j === 'worse' ? 'bad' : ''}">${j === 'better' ? '▲ Better' : j === 'worse' ? '▼ Worse' : j === 'same' ? '= About the same' : '◆ Mixed: check below'}${focusName(st) !== 'Balanced' ? ` <small>(judged by ${esc(focusName(st))})</small>` : ''}</div>`; })()}
        <div class="${cl(c.tap)}">Tap damage ${pct(c.tap)}</div><div class="${cl(c.ally)}">Named damage ${pct(c.ally)}</div>${c.gold ? `<div class="${cl(c.gold)}">Gold ${pct(c.gold)}</div>` : ''}${c.timer ? `<div class="${cl(c.timer)}">Boss time ${c.timer > 0 ? '+' : ''}${c.timer.toFixed(1)} s</div>` : ''}</div>`;
    }).join('');
    const fin = G.completesSet(st, it);
    if (fin) cmp = `<div class="rule">★ Wearing this completes <b>${esc(fin.name)}</b>: ${esc(fin.text)} (the numbers above leave this out)</div>` + cmp;
    const mt = G.mergeTarget(st, it);
    buttons = (mt ? `<button class="big" data-act="merge:${it.id}">Merge into ${esc(mt.name)} → +${(mt.plus ?? 0) + 1}</button>` : '') +
      slots.map((sl, i) => `<button class="big" data-act="equip:${it.id}:${sl}">Wear${slots.length > 1 ? ` in ${SLOT_NAME[sl]} ${i + 1}` : ''}</button>`).join('') +
      (it.rarity === 'ancestry' || it.set ? '' : `<button data-act="salvage:${it.id}">Salvage for gold</button>`) +
      (it.set ? `<button data-act="stash-put:${it.id}">📦 Put in the Stash</button>` : '');
    if (it.rarity === 'artifact') buttons += '<p class="note">Only one Artifact can be worn. Wearing this takes off any other.</p>';
  } else {
    const fl = it.forge ?? 0;
    const forgeRow = it.set ? '<p class="note">Set pieces grow by merging copies, not at the Forge.</p>'
      : fl >= G.FORGE_MAX ? `<p class="note">⚒ Forged to the top (+${fl}).</p>`
      : (() => { const c = G.forgeCost(st, it); return `<button class="forgebtn ${B.gte(st.life.gold, c) ? '' : 'no'}" data-act="forge:${from}">⚒ Forge +${fl} → +${fl + 1} <small>(+${Math.round(G.FORGE_STEP * 100)}% stats) · ${fmt(c)} gold</small></button>`; })();
    buttons = `${forgeRow}<button data-act="unequip:${from}">Take off</button>`;
  }
  return `<div class="tooltip" style="--rc:${r.color}">
      <h3 style="color:${r.color}">${itemIcon(it.slot, it.rarity, it.look)} ${esc(it.name)}${it.plus ? ` +${it.plus}` : ''}</h3>
      <div class="meta"><span>${SLOT_NAME[it.slot]}</span><span>${r.name}</span></div>
      <div class="meta"><span>Item level ${it.ilvl}</span><span>Power ${G.itemPower(st, it)}</span></div>
      ${base}${aff}${elInfo}${rule}${setInfo}
    </div>${cmp}<div class="btns">${buttons}<button data-act="close">Close</button></div>`;
}

let pendingShown = '';
function checkModals() {
  const st = s!;
  if (modalOpen && !['inspect', 'escape', 'pending', 'dungeon', 'info'].includes(modalOpen)) return;
  const e = st.escape;
  if (st.pending.length) {
    const p = st.pending[0];
    const sig = `p${st.pending.length}${p.kind}${p.choices.join()}`;
    if (pendingShown === sig && modalOpen === 'pending') return;
    pendingShown = sig;
    if (p.kind === 'pet') {
      showModal('pending', `<h2>Choose your first pet</h2><p>The others can still be found later.</p>${p.choices.map((id) => {
        const x = PETS.find((y) => y.id === id)!;
        return `<button class="big choice-btn" data-act="choose:${id}">${petIcon(x.body, x.element)}<b>${esc(x.name)}</b><span>${esc(x.text)} ${esc(statLine(x.stat, x.per))} per level.</span></button>`;
      }).join('')}`);
    } else if (p.kind === 'scar') {
      const realm = e ? REALMS.find((r) => r.id === e.realm)! : null;
      showModal('pending', `<h2>${the(realm?.name ?? 'realm')} keeps a piece of you</h2>
        <p>The clock ran out at ${Math.min(e?.killed ?? 0, ESCAPE_FOES)} of ${ESCAPE_FOES} foes. You still return, with ${fmt(e ? G.escapeReward(e) : B.ZERO)} Embers.</p>
        <p class="warn">Choose one permanent scar:</p>
        ${p.choices.map((id) => { const x = SCARS.find((y) => y.id === id)!; return `<button class="big choice-btn" data-act="choose:${id}"><b>${x.name}</b><span>${x.text}</span></button>`; }).join('')}`);
    } else {
      const opts = p.choices.map((c) => {
        if (c === 'heal') return `<button class="big choice-btn" data-act="choose:heal"><b>Heal a scar</b><span>The realm gives back what it took: your oldest scar.</span></button>`;
        const a = ARTIFACTS.find((x) => x.id === c.split(':')[1])!;
        return `<button class="big choice-btn" data-act="choose:${c}" style="--rc:#d8243c"><b style="color:#d8243c">${a.name} (Artifact)</b><span>${a.text}</span></button>`;
      }).join('');
      showModal('pending', `<h2>A rare way out</h2><p>You broke through the special gate. Choose your prize:</p>${opts}`);
    }
    return;
  }
  const g = st.dungeon;
  if (g?.done) {
    if (modalOpen === 'dungeon') return;
    const realm = REALMS.find((r) => r.id === g.realm)!;
    const it = g.drop !== null ? st.bag.find((x) => x.id === g.drop) : undefined;
    showModal('dungeon', `<h2>${g.cleared ? `${the(realm.gate)} falls` : 'The way out closes'}</h2>
      ${it ? `<p>Set piece: <b style="color:${rarityDef('set').color}">${itemIcon(it.slot, 'set', it.look)} ${esc(it.name)}${it.plus ? ` +${it.plus}` : ''}</b> (${SLOT_NAME[it.slot]})</p>` : `<p>You beat ${g.killed} of ${G.DUNGEON_MOBS} foes. You keep the gold you earned.</p>`}
      <p class="big-gold">+${fmt(g.gold)} gold</p>
      <button class="big" data-act="leave">Back to the fight</button>`);
    return;
  }
  if (e?.done) {
    if (modalOpen === 'escape') return;
    const realm = REALMS.find((r) => r.id === e.realm)!;
    showModal('escape', `<h2>${e.cleared ? 'You broke the gate' : 'Dragged back'}</h2>
      <p>${e.cleared ? `${the(realm.gate)} falls. The way home opens.` : `${the(realm.name)} lets you go, marked.`}</p>
      <div class="tiles"><div class="tile">${ic('skull')}<b>${Math.min(e.killed, ESCAPE_FOES)}/${ESCAPE_FOES}</b><small>foes</small></div><div class="tile">${ic('clock')}<b>${Math.round(e.timeLeft)}s</b><small>left</small></div><div class="tile">${ic('star')}<b>${e.stageAtDeath}</b><small>fell at</small></div></div>
      <p class="big-gold">+${fmt(G.escapeReward(e))} Embers</p>
      <p class="note">Spend Embers in the Death tab on relics that last forever.</p>
      <button class="big" data-act="return">Return to Lanternfall</button>`);
  } else if (modalOpen === 'escape' || modalOpen === 'pending' || modalOpen === 'dungeon') {
    closeModal();
  }
}

// ------------------------------------------------------------------ actions

function act(ev: Event) {
  if (longFired) { longFired = false; return; }
  const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!el || !s) return;
  const [a, x, y] = el.dataset.act!.split(':');
  const st = s;
  const n = (cap: number) => (qty === 'max' ? Math.max(1, cap) : qty);
  switch (a) {
    case 'tab': goTab(x as Tab); return;
    case 'help': showInfo(`help:${x}`); return;
    case 'help-text': nope(el, x); return;
    case 'perk': if (G.chooseTrainPerk(st, x as G.TrainPerk)) { flash(el); view?.levelUp(-1); } break;
    case 'forge': {
      const sl = x as Slot;
      const it = st.equipped[sl];
      if (it && G.forge(st, sl)) { flash(el); toast(`${it.name} forged to +${it.forge}.`); showModal('inspect', inspectHtml(it, sl)); }
      else if (it && G.inRealm(st)) nope(el, 'The Forge is closed inside a realm.');
      else if (it) { refreshForge(); nope(el, `The Forge needs ${fmt(G.forgeCost(st, it))} gold. You have ${fmt(st.life.gold)}. (The price rises as you climb.)`); }
      return;
    }
    case 'collector': G.answerCollector(st, x === 'yes'); return;
    case 'reshape': showModal('confirm', reshapeSheet(st)); return;
    case 'reshape-do': {
      const why = G.reshapeBlock(st, x as G.ReshapeKind, y);
      if (why) { nope(el, why); return; }
      if (G.reshape(st, x as G.ReshapeKind, y)) { closeModal(); banner('💎 Reshaped', 'treasure'); lastPanel = ''; }
      return;
    }
    case 'merc': if (G.hireMerc(st)) { flash(el); view?.levelUp(-1); } else nope(el, (st.life.mercs ?? 0) >= G.MERC_MAX ? 'All the sellswords are hired.' : `Sellswords ask ${fmt(G.mercCost(st))} gold. You have ${fmt(st.life.gold)}.`); break;
    case 'tithe': if (G.tithe(st)) flash(el); break;
    case 'spec': if (G.chooseSpec(st, Number(x), y as G.NamedSpec)) { flash(el); view?.levelUp(Number(x)); } break;
    case 'hunt': if (x === 'yes') { if (G.acceptHunt(st)) { flash(el); buzz(15); } } else G.declineHunt(st); return;
    case 'shrine': if (G.offeringReady(st)) showModal('confirm', shrineSheet(st)); return;
    case 'offer': {
      if (G.makeOffering(st, x as G.OfferKind)) { closeModal(); banner(`⛩ ${G.OFFER_DEFS[x as G.OfferKind].name}`, 'treasure'); buzz(20); }
      else nope(el, `The shrine asks ${fmt(G.offeringCost(st))} gold. You have ${fmt(st.life.gold)}.`);
      return;
    }
    case 'autosalvage-toggle': st.autoSalvageOff = !st.autoSalvageOff; break;
    case 'focus-next': {
      const i = G.GEAR_FOCUS.findIndex((f) => f.id === (st.gearFocus ?? 'balanced'));
      const nx = G.GEAR_FOCUS[(i + 1) % G.GEAR_FOCUS.length];
      st.gearFocus = nx.id; lastPanel = '';
      toast(`⚖ Judging gear by ${nx.name}: ${nx.text}`);
      break;
    }
    case 'scares-toggle': prefs.scaresOff = !prefs.scaresOff; savePrefs(); break;
    case 'events-toggle': st.eventsOff = !st.eventsOff; if (st.eventsOff) st.life.event = null; break;
    case 'merge-all': { const n = G.mergeAll(st); toast(n ? `${n} merge${n > 1 ? 's' : ''} done.` : 'Nothing to merge.'); break; }
    case 'pref': { const k = x as Toggle; prefs[k] = !prefs[k]; if (k === 'sound' && prefs.sound) sfx.chime(); savePrefs(); applyPrefs(); if (k === 'vibrate' && prefs.vibrate) buzz(30); break; }
    case 'trial': G.claimTrial(st, x.replace(/\|/g, ':')); break;
    case 'path': if (!G.equipPath(st, x)) toast('Finish the fight first.'); break;
    case 'form-take': {
      const f = FORMS.find((q) => q.id === x)!;
      showModal('confirm', `<h2>${ic(FORM_ICON[f.id] ?? 'flame')} Become ${esc(f.name)}?</h2><p>${esc(f.text)}</p>
        <p class="warn">${st.forms.length ? 'A hybrid caps your forms (two: T4/T3, three: T2) and keeps every weakness.' : 'This closes Mortal Master forever.'} It cannot be undone.</p>
        <button class="big danger" data-act="form-yes:${f.id}">Take it</button><button data-act="close">Not now</button>`);
      break;
    }
    case 'form-yes': if (G.acceptForm(st, x)) toast('The change takes hold.'); closeModal(); break;
    case 'set': showInfo(`set:${x}`); return;
    case 'info': if (el.dataset.long) showInfo(el.dataset.long); return;
    case 'qty': qty = x === 'max' ? 'max' : (Number(x) as 1 | 10); break;
    case 'hero': if (gain(el, () => G.buyHero(st, n(G.maxHeroBuy(st))), () => G.derive(st).tap, 'tap')) { flash(el); view?.levelUp(-1); } else nope(el, `1 level costs ${fmt(G.heroCost(st))} gold. You have ${fmt(st.life.gold)}.`); break;
    case 'ally': { const i = Number(x); const lv0 = st.life.allyLevels[i]; if (gain(el, () => G.buyAlly(st, i, el.closest('#strip') ? 1 : n(G.maxAllyBuy(st, i))), () => G.derive(st).allyDps, 'Named/s')) { flash(el); view?.levelUp(i); milestoneToast(st, i, lv0); } else nope(el, G.allyUnlocked(st, i) ? `1 level costs ${fmt(G.allyCost(st, i))} gold. You have ${fmt(st.life.gold)}.` : `Opens at stage ${ALLIES[i].unlockStage}.`); if (modalOpen === 'info') closeModal(); break; }
    case 'rank': if (!G.rankUp(st, x)) nope(el, G.skillPointsFree(st) > 0 ? 'Not open yet.' : 'No class points. Quests give them.'); break;
    case 'stab': skillTab = x as SkillTab; break;
    case 'htab': heroTab = x as HeroTab; document.getElementById('panel')!.scrollTop = 0; break;
    case 'gtab': if (gearTab === 'bag' && x !== 'bag') markGearSeen(); gearTab = x as GearTab; document.getElementById('panel')!.scrollTop = 0; break;
    case 'sell-open': sellOpen = true; break;
    case 'dtab': if (st.escape && x !== 'fall') { nope(el, 'Relics and dungeons wait until the escape is over.'); return; } deathTab = x as DeathTab; document.getElementById('panel')!.scrollTop = 0; break;
    case 'qtab': if (x === 'quest') { const [qh, qn] = G.questProgress(st); if (qh >= qn && G.claimQuest(st)) { banner('★ Quest done', 'treasure'); lastPanel = ''; return; } } questTab = x as QuestTab; if (tab !== 'quests' || !tabOpen) { goTab('quests'); return; } document.getElementById('panel')!.scrollTop = 0; break;
    case 'spell': if (!G.learnSpell(st, x)) nope(el, G.skillPointsFree(st) > 0 ? 'Not yet: your level is too low.' : 'No class points. Quests give them.'); break;
    case 'tree': if (!G.rankTree(st, x as 'race' | 'form', y)) nope(el, x === 'race' ? (G.racePointsFree(st) > 0 ? 'Not open yet.' : 'No race points. Levels give them.') : (G.formPointsFree(st) > 0 ? 'Not open yet.' : 'No transformation points. Quests give them.')); break;
    case 'reset-skills': {
      const c = G.respecCost(st);
      if (B.lt(st.embers, c)) { toast(`Taking points back costs ${fmt(c)} Embers. Fall and return to earn them.`); break; }
      showModal('confirm', `<h2>Take all points back?</h2><p>Class, spell, race and transformation points all come back. Costs <b class="big-gold">${fmt(c)}</b> Embers (a quarter of your best return).</p>
        <button class="big" data-act="reset-yes">Take them back</button><button data-act="close">Keep my skills</button>`);
      break;
    }
    case 'reset-yes': if (G.resetSkills(st)) toast('Points are free to spend again.'); closeModal(); break;
    case 'sell-rarity': {
      const r = rarityDef(x as Item['rarity']);
      const k = st.bag.filter((i) => i.rarity === r.id).length;
      showModal('confirm', `<h2>Salvage all ${r.name} items?</h2><p>${k} item${k > 1 ? 's' : ''} in your bag become gold. Worn gear is not touched.</p>
        <button class="big danger" data-act="sell-yes:${r.id}">Salvage ${k}</button><button data-act="close">Cancel</button>`);
      break;
    }
    case 'sell-yes': { const k = G.salvageRarity(st, x as Item['rarity']); closeModal(); toast(`Salvaged ${k} item${k === 1 ? '' : 's'} for gold.`); break; }
    case 'slot': { const it = st.equipped[x as Slot]; if (!it) { gearTab = 'bag'; toast(st.bag.length ? `Pick something for ${SLOT_NAME[x as Slot]} from the Bag.` : 'Nothing to wear here yet. Bosses drop gear.'); break; } if (it) { inspect = { slot: x as Slot }; showModal('inspect', inspectHtml(it, x as Slot)); } break; }
    case 'item': { const it = st.bag.find((i) => i.id === Number(x)); if (it) { inspect = { id: it.id }; showModal('inspect', inspectHtml(it, 'bag')); } break; }
    case 'equip': G.equip(st, Number(x), y as Slot); closeModal(); break;
    case 'unequip': if (!G.unequip(st, x as Slot)) alertModal('Your bag is full.'); else closeModal(); break;
    case 'salvage': G.salvage(st, Number(x)); closeModal(); break;
    case 'merge': if (G.merge(st, Number(x))) toast('Merged.'); closeModal(); break;
    case 'stash-put': if (G.stashPut(st, Number(x))) toast('📦 Put in the Stash.'); else toast('Cannot stash now (full, or in a dungeon or escape).'); closeModal(); break;
    case 'stash-take': if (!G.stashTake(st, Number(x))) toast('Cannot take it out now (bag full, or in a dungeon or escape).'); else toast('Moved to the bag.'); closeModal(); break;
    case 'stash-see': {
      const it = (st.stash ?? []).find((q) => q.id === Number(x));
      if (it) showModal('confirm', `<h2>📦 ${esc(it.name)}</h2><p class="note">${SLOT_NAME[it.slot]} · ${esc(G.setById(it.set ?? '')?.name ?? '')}</p><p>While all pieces of its set are in the Stash, the set counts. Taking this out stops that.</p><button class="big" data-act="stash-take:${it.id}">↩ Take out to the bag</button><button data-act="close">Keep it here</button>`);
      break;
    }
    case 'salvage-worse': { const k = G.salvageWorse(st); toast(k ? `Salvaged ${k} item${k > 1 ? 's' : ''} for gold.` : 'Nothing worse to salvage.'); break; }
    case 'relic': if (G.levelRelic(st, x)) flash(el); else nope(el, 'Not enough Embers. Fall to earn them.'); break;
    case 'relic-new': { const id = G.findRelic(st); if (id) { const r = RELICS.find((q) => q.id === id)!; showModal('confirm', `<h2>Relic found</h2><p><b>${esc(r.name)}</b></p><p>${esc(r.text)}</p><button class="big" data-act="close">Good</button>`); } break; }
    case 'heal': if (!G.healScar(st, Number(x))) nope(el, 'Not enough Embers.'); break;
    case 'hatch': { const id = G.hatchEgg(st); if (id) { const p = PETS.find((q) => q.id === id)!; showModal('confirm', `<h2>${petIcon(p.body, p.element)} ${esc(p.name)} hatched</h2><p>${esc(p.text)}</p><p>${esc(statLine(p.stat, p.per))} per level.</p><button class="big" data-act="close">Welcome</button>`); } break; }
    case 'petout': if (!G.togglePet(st, x)) toast(`Only ${G.PETS_OUT} pets can be out. Call one back first.`); break;
    case 'petlv': if (!G.levelPet(st, x)) nope(el, 'Not enough Marks. Chests and tasks give them.'); else flash(el); break;
    case 'login': { const i = Number(x); const D = st.daily.loginDay; toast(i < D ? `Day ${i + 1}: claimed ✓` : i === D ? `Day ${i + 1}: yours when you come back tomorrow.` : `Day ${i + 1}: ${i - D + 1} days away.`); break; }
    case 'quest': G.claimQuest(st); break;
    case 'task': G.claimTask(st, x); break;
    case 'dungeon':
      if (st.dungeon) { goTab('death'); return; }
      if (st.keys <= 0) { toast('No keys. You get 1 free key a day; quests and tasks give more.'); break; }
      if (st.escape) { toast('Finish the escape first.'); break; }
      showModal('confirm', `<h2>Use a key?</h2><p>A random death realm: ${G.DUNGEON_MOBS} foes and a boss in ${G.DUNGEON_SECONDS / 60} minutes. The boss drops a set piece. Your stage waits for you.</p>
        <button class="big" data-act="dungeon-yes">Enter</button><button data-act="close">Not now</button>`);
      break;
    case 'dungeon-yes': closeModal(); if (G.startDungeon(st)) { closeTab(); banner(`🗝 ${REALMS.find((r) => r.id === st.dungeon!.realm)!.name}`, 'wander'); buzz(30); } break;
    case 'leave': G.leaveDungeon(st); closeModal(); save(); break;
    case 'die':
      if (!prefs.seenFall) {
        showModal('confirm', `<h2>${ic('skull')} The first fall</h2>
          <div class="fallcard">
            <div>${icon32('tab:death', 32) || ic('skull')}<p><b>You fall.</b> Gold, Train and Named levels reset.</p></div>
            <div>${icon32('stat:bosstime', 32) || ic('clock')}<p><b>Escape a realm:</b> ${ESCAPE_FOES} foes and a gate before the candle burns out.</p></div>
            <div><span class="ember-i big"></span><p><b>Embers:</b> clear it to earn them. Deeper falls pay more.</p></div>
            <div>${ic('eye')}<p><b>Relics</b> cost Embers and stay forever. You return stronger.</p></div>
          </div>
          <button class="big danger" data-act="die-yes">Fall at stage ${st.life.maxStage}</button><button data-act="close">Not yet</button>`);
        prefs.seenFall = true; savePrefs();
        break;
      }
      showModal('confirm', `<h2>Fall at stage ${st.life.maxStage}?</h2><p>Your gold, Train levels and Named levels reset. Then you must escape a realm of death before the candle burns out (${Math.round(ESCAPE_SECONDS / 60)} min).</p>
        <button class="big danger" data-act="die-yes">Fall</button><button data-act="close">Not yet</button>`);
      break;
    case 'die-yes': {
      closeModal();
      if (G.die(st)) { const r = REALMS.find((q) => q.id === st.escape!.realm)!; banner(`☠ ${r.name}${st.escape!.special ? ' ✦' : ''}`, 'boss'); shake(true); buzz(60); }
      pendingShown = ''; tab = 'death'; tabOpen = false; applyTabOpen(); break;
    }
    case 'choose': G.choose(st, x === 'artifact' ? `${x}:${y}` : x); pendingShown = ''; closeModal(); break;
    case 'return': G.returnToLife(st); closeModal(); save(); tab = 'death'; tabOpen = false; applyTabOpen(); break;
    case 'menu': menuPage = x as typeof menuPage; document.getElementById('panel')!.scrollTop = 0; break;
    case 'export': { shownCode = G.exportCode(st); const t = document.getElementById('codeout') as HTMLTextAreaElement | null; if (t) t.value = shownCode; toast('Your save code is in the box. Tap Copy.'); break; }
    case 'copy': {
      const t = document.getElementById('codeout') as HTMLTextAreaElement;
      if (!t.value) { shownCode = G.exportCode(st); t.value = shownCode; }
      t.select();
      navigator.clipboard?.writeText(t.value).then(() => toast('Save code copied.'), () => toast('Select the code and copy it.'));
      break;
    }
    case 'import': {
      const t = document.getElementById('codein') as HTMLTextAreaElement;
      try {
        const loaded = G.importCode(t.value);
        showModal('confirm', `<h2>Load ${esc(loaded.hero.name)}?</h2><p>Best stage ${loaded.bestStage}, ${loaded.returns} returns. This replaces the save on this device.</p>
          <button class="big" data-act="import-yes">Load</button><button data-act="close">Cancel</button>`);
        pendingImport = loaded;
      } catch (err) {
        alertModal((err as Error).message);
      }
      break;
    }
    case 'import-yes':
      if (pendingImport) {
        s = pendingImport;
        pendingImport = null;
        s.lastSeen = Date.now();
        save();
        closeModal();
        toast('Save loaded.');
      }
      break;
    case 'newgame':
      showModal('confirm', `<h2>Delete this save?</h2><p class="warn">This cannot be undone. Copy your save code first if you may want it.</p>
        <button class="big danger" data-act="newgame-yes">Delete and start over</button><button data-act="close">Keep playing</button>`);
      break;
    case 'newgame-yes':
      localStorage.removeItem(KEY);
      s = null;
      location.reload();
      break;
    case 'close': closeModal(); break;
  }
  lastPanel = '';
  renderPanel(true);
  renderBadges();
}
let pendingImport: State | null = null;

function alertModal(text: string) {
  showModal('confirm', `<p>${esc(text)}</p><button class="big" data-act="close">OK</button>`);
}
const toastQueue: string[] = [];
let toastBusy = false;
const BIG = /Level \d|rank 10|reaches T|Achievement|chest|unlocked|hatches|Relic found|Quest done|joins you|transformation/i;
let toastNow = '';
function toast(text: string) {
  if (text === toastNow || toastQueue.includes(text)) return; // play-test gate: repeated taps stacked the same toast for 10+ seconds
  if (BIG.test(text)) { buzz(20); }
  toastQueue.push(text);
  if (!toastBusy) nextToast();
}
/** Popups with buttons: toasts wait until they close, so they never sit over a choice (run 2, item 8). */
const HOLD_TOASTS = ['pending', 'escape', 'dungeon', 'confirm', 'offline'];
function nextToast() {
  if (modalOpen && HOLD_TOASTS.includes(modalOpen)) { toastBusy = true; setTimeout(nextToast, 400); return; }
  // a long backlog only shows the big moments and the latest small one
  if (toastQueue.length > 5) { const keep = toastQueue.filter((x, i) => BIG.test(x) || i === toastQueue.length - 1); toastQueue.splice(0, toastQueue.length, ...keep); }
  const text = toastQueue.shift();
  if (!text) { toastBusy = false; return; }
  toastBusy = true;
  toastNow = text;
  const t = document.createElement('div');
  const big = BIG.test(text);
  t.className = big ? 'toast big' : 'toast';
  t.textContent = text;
  const bt = document.getElementById('battle')?.getBoundingClientRect();
  if (bt && bt.height > 80) t.style.top = `${Math.round(bt.top + bt.height * 0.62)}px`; // final play-test: toasts covered the boss health bar
  document.body.appendChild(t);
  setTimeout(() => { t.remove(); toastNow = ''; nextToast(); }, big ? 2600 : 1700);
}

// ------------------------------------------------------------------ boot

/** ?demo=<tab> shows a mid-game hero for screenshots. It never touches the real save. */
function demoState(): State {
  const st = G.newGame({ name: 'Vaelis', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' }, 7, Date.now());
  st.bestStage = 140;
  st.life.stage = st.life.maxStage = 87;
  st.life.heroLevel = 260;
  st.life.allyLevels = st.life.allyLevels.map((_, i) => (i < 8 ? 180 - i * 15 : 0));
  st.life.gold = B.big(3e15);
  st.xp = G.xpForLevel(34);
  st.points = { classPt: 30, formPt: 12 };
  st.embers = B.big(4200);
  st.marks = 140;
  st.keys = 2;
  st.eggs = 1;
  for (const id of PETS.slice(0, 5).map((p) => p.id)) st.pets[id] = 3;
  st.petsOut = PETS.slice(0, 3).map((p) => p.id);
  for (const sp of SPELLS.slice(0, 4)) st.spells[sp.id] = 3;
  const cls = G.classOf(st);
  st.classPaths = { base: { tier: 1, rank: 10, xp: 0 }, Assassin: { tier: 4, rank: 6, xp: 400 }, Trickster: { tier: 2, rank: 3, xp: 80 } };
  st.classPath = 'Assassin';
  for (const n of cls.tree.filter((x) => x.tier === 0 || x.branch === 'Assassin')) st.ranks[n.id] = 2;
  st.formOffered = true;
  st.quest.num = 18;
  st.formTracks.mastery = { tier: 2, rank: 10, xp: 0 };
  const slots: Item['slot'][] = ['head', 'shoulders', 'chest', 'hands', 'legs', 'feet', 'back', 'offHand', 'neck', 'waist', 'wrists'];
  slots.forEach((sl, i) => { const it = G.makeItem(st, 80, (['rare', 'epic', 'uncommon', 'legendary'] as const)[i % 4], sl); st.bag.push(it); G.equip(st, it.id); });
  const def = SETS.find((x) => !x.cls)!;
  for (let i = 0; i < 3; i++) st.bag.push(G.makeSetPiece(st, def.id, 0, 120));
  for (let i = 0; i < 6; i++) st.bag.push(G.makeItem(st, 70, (['poor', 'common', 'rare'] as const)[i % 3]));
  st.life.foe = { name: 'Bell Ringer', hp: B.big(5e13), max: B.big(8e13), boss: false, immune: ['fire'], weak: ['cold'] };
  st.life.fairy = { x: 0.6, y: 0.3, left: 999 };
  G.refreshDaily(st, Date.now());
  G.checkAchievements(st);
  st.events = [];
  return st;
}

setupLongPress();
applyPrefs();
const demo = new URLSearchParams(location.search).get('demo');
const createStep = new URLSearchParams(location.search).get('create');
if (new URLSearchParams(location.search).has('icons')) {
  // ?icons=<group>: review sheet of the 32 px icons (64 px and real size), with names. ?icons=all: every group, small.
  (window as any).__demo = true;
  const want = new URLSearchParams(location.search).get('icons') || 'all';
  const groups = want === 'all' ? Object.keys(ICON_GROUPS) : [want];
  app.innerHTML = groups.map((gname) => {
    const list = ICON_GROUPS[gname]?.() ?? [];
    const done = list.filter((x) => icon32(x.id)).length;
    return `<h2 class="ishead">${esc(gname)} · ${done}/${list.length}</h2><div class="iconsheet ${want === 'all' ? 'small' : ''}">${list.map((x) => {
      const big = icon32(x.id, want === 'all' ? 32 : 64);
      return `<div class="isx ${big ? '' : 'missing'}">${big || '<i class="imiss">?</i>'}${want === 'all' ? '' : icon32(x.id, 32)}<b>${esc(x.name)}</b><small>${esc(x.id)}</small></div>`;
    }).join('')}</div>`;
  }).join('');
} else if (createStep !== null) {
  (window as any).__demo = true;
  showCreate(Number(createStep) || 0);
} else if (demo !== null) {
  s = demoState();
  (window as any).__demo = true;
  let away = false;
  if (demo) {
    const [t1, t2] = demo.split('.');
    tab = (t1 === 'fight' || t1 === 'land' || t1 === 'arrive' || t1 === 'scare' || t1 === 'class' || t1 === 'reshape' ? 'hero' : t1) as Tab;
    tabOpen = t1 !== 'fight' && t1 !== 'land' && t1 !== 'arrive' && t1 !== 'scare' && t1 !== 'class' && t1 !== 'reshape';
    // run 5: ?demo=class.warrior (its meter on the fight) and ?demo=reshape
    if (t1 === 'class' && t2) { s.hero.cls = t2; s.life.rage = 72; s.life.prayer = 140; s.life.combo = 4; s.life.fairy = null; }
    if (t1 === 'reshape') { s.gems = 12; setTimeout(() => showModal('confirm', reshapeSheet(s!)), 500); }
    if (t1 === 'scare') setTimeout(() => startScare(t2 || 'bishop', 0), 400); // ?demo=scare.bishop / scare.erased / scare.hanged
    if (t1 === 'land' || t1 === 'arrive') {
      // run 3: ?demo=land.7 shows the fight in land 7 (13+ = Deeper copies); ?demo=arrive.7 shows its arrival card
      const n = Math.max(1, Number(t2) || 6);
      const from = n <= ZONES.length ? ZONES[n - 1].from : 501 + (n - ZONES.length - 1) * 50;
      s.life.stage = s.life.maxStage = from + (t1 === 'arrive' ? 0 : 7);
      s.bestStage = Math.max(s.bestStage, s.life.stage);
      s.life.kills = 3; s.life.fairy = null;
      s.life.foe = { ...s.life.foe, name: zoneFor(s.life.stage).foes[1], boss: false, immune: [], weak: [] };
      if (t1 === 'arrive') setTimeout(() => arriveLand(s!, zoneFor(s!.life.stage)), 600);
    }
    if (t1 === 'fight') {
      if (t2 === 'boss') { s.life.kills = G.KILLS_PER_STAGE; G.fightBoss(s); s.life.foe.hp = s.life.foe.max = B.big(1e30); s.life.bossLeft = 3.4; s.life.fairy = null; }
      if (t2 === 'new') { s.totalTaps = 0; s.life.fairy = null; }
      // run 3: ?demo=fight.tolling / fight.shield (a gimmick boss at stage 160) and ?demo=fight.event (an event running)
      if (t2 === 'tolling' || t2 === 'shield') {
        s.life.stage = s.life.maxStage = s.bestStage = 160; s.life.kills = G.KILLS_PER_STAGE; s.life.foe.boss = false; G.fightBoss(s);
        const f = s.life.foe; f.gimmick = t2; f.gimT = 7.5; f.shieldLeft = 0; f.tolled = 0; f.hp = f.max = B.big(1e40); s.life.bossLeft = 99; s.life.fairy = null;
        if (t2 === 'shield') f.hp = B.times(f.max, 0.49);
      }
      if (t2 === 'event') { s.life.fairy = null; G.startEvent(s, 'eclipse'); }
      // run 4: ?demo=fight.elite / fight.weak / fight.adds / fight.hunt / fight.collector / fight.shrine
      if (t2 === 'elite' || t2 === 'hunt' || t2 === 'collector' || t2 === 'shrine') {
        s.life.fairy = null; s.life.event = null; s.life.huntIn = 999;
        s.life.foe = { ...s.life.foe, boss: false, kind: undefined, elite: 'armoured', armour: 2, weakT: 0, hp: B.big(1e40), max: B.big(1e40), immune: [], weak: [] };
        if (t2 === 'hunt') s.life.huntOffer = { kind: 'elites', base: 0, left: 99 };
        if (t2 === 'collector') G.startEvent(s, 'collector');
        if (t2 === 'shrine') { s.life.gold = B.times(G.offeringCost(s), 3); setTimeout(() => showModal('confirm', shrineSheet(s!)), 500); }
      }
      if (t2 === 'weak' || t2 === 'adds') {
        s.life.stage = s.life.maxStage = s.bestStage = 160; s.life.kills = G.KILLS_PER_STAGE; s.life.foe.boss = false; G.fightBoss(s);
        const f = s.life.foe; f.hp = f.max = B.big(1e40); s.life.bossLeft = 99; s.life.fairy = null; s.life.event = null; s.life.huntIn = 999;
        f.weakT = 3;
        if (t2 === 'weak') setInterval(() => { const ff = s && G.foeNow(s); if (ff && (ff.weakT ?? 0) < 2.1) ff.weakT = 2.1; }, 200); // the demo reopens the spot at once
        if (t2 === 'adds') { f.gimmick = 'adds'; f.gimT = 0; f.addHp = [B.big(1e40), B.big(1e40)]; }
      }
      if (t2 === 'away') { s.lastSeen = Date.now() - 3 * 3600 * 1000; away = true; }
    } else if (t2) {
      if (t1 === 'hero') heroTab = t2 as HeroTab;
      else if (t1 === 'quests') questTab = t2 as QuestTab;
      else if (t1 === 'menu') menuPage = t2 as typeof menuPage;
      else if (t1 === 'gear') gearTab = t2 as GearTab;
      else if (t1 === 'death') deathTab = t2 as DeathTab;
      else skillTab = t2 as SkillTab;
    }
  }
  if (s.totalTaps === 0 && demo !== 'fight.new') s.totalTaps = 100;
  startGame(away);
} else {
  const raw = readStored();
  const r = G.readSave(raw);
  if (r.kind === 'ok') { s = r.state; startGame(true); }
  else if (r.kind === 'bad') { saveBlocked = true; keepBadCopy(raw!); showRecovery(raw!, r.reason); }
  else if (COLD_OPEN_ON || new URLSearchParams(location.search).has('coldopen')) showColdOpen(() => showCreate());
  else showCreate();
}
void SET_SLOTS;
