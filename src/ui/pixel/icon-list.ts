// Every icon the game needs, by drawing group, with the name and text the artist works from.
import { CLASSES, FORMS, RACES } from '../../rules/data';
import { FORM_TREES, RACE_TREES, SPELLS } from '../../rules/content';
import { FORM_EXTRA, SUBCLASS_EXTRA } from '../../rules/tiers-content';

export interface IconNeed { id: string; name: string; text: string }

const classGroup = (cid: string): IconNeed[] => {
  const c = CLASSES.find((x) => x.id === cid)!;
  const out: IconNeed[] = [{ id: `class:${c.id}`, name: `${c.name} (class emblem)`, text: c.text ?? '' }];
  for (const n of c.tree) out.push({ id: n.id, name: `${n.name}${n.kind === 'active' ? ' (active skill)' : ' (passive)'}${n.branch ? ` · ${n.branch}` : ''}`, text: n.text });
  for (const b of c.branches) {
    out.push({ id: `sub:${c.id}:${b}`, name: `${b} (subclass emblem)`, text: `${b}, a ${c.name} subclass.` });
    const ex = SUBCLASS_EXTRA[`${c.id}:${b}`];
    if (!ex) continue;
    for (const n of ex.nodes) out.push({ id: n.id, name: `${n.name} (${b} T${n.tier})`, text: n.text });
    out.push({ id: ex.ultimate.id, name: `${ex.ultimate.name} (${b} ULTIMATE)`, text: ex.ultimate.text });
  }
  return out;
};

const formGroup = (ids: string[]): IconNeed[] => ids.flatMap((fid) => {
  const f = FORMS.find((x) => x.id === (fid === 'mastery' ? 'mortal' : fid));
  const name = fid === 'mastery' ? 'Mortal Master' : f?.name ?? fid;
  const out: IconNeed[] = [{ id: `form:${fid}`, name: `${name} (form emblem)`, text: f?.text ?? '' }];
  const tree = FORM_TREES.find((t) => t.id === fid);
  for (const n of tree?.nodes ?? []) out.push({ id: n.id, name: `${n.name} (${name} tree)`, text: n.text });
  const ex = FORM_EXTRA[fid];
  if (ex) {
    for (const n of ex.nodes) out.push({ id: n.id, name: `${n.name} (${name} T${n.tier})`, text: n.text });
    out.push({ id: ex.ultimate.id, name: `${ex.ultimate.name} (${name} ULTIMATE)`, text: ex.ultimate.text });
  }
  return out;
});

const races = (): IconNeed[] => RACES.flatMap((r) => [
  { id: `race:${r.id}`, name: `${r.name} (race emblem)`, text: r.text ?? '' },
  ...(RACE_TREES.find((t) => t.id === r.id)?.nodes ?? []).map((n) => ({ id: n.id, name: `${n.name} (${r.name} tree)`, text: n.text })),
]);

const STATS: [string, string, string][] = [
  ['str', 'Strength', 'Attribute: raw power, more tap damage.'], ['agi', 'Agility', 'Attribute: speed and crits.'], ['sta', 'Stamina', 'Attribute: endurance, longer boss time.'],
  ['int', 'Intellect', 'Attribute: mana and skill power.'], ['spi', 'Spirit', 'Attribute: the Named fight harder.'],
  ['tap', 'Tap damage', 'Damage of one tap.'], ['crit', 'Crit chance', 'Chance a tap is critical.'], ['critdmg', 'Crit damage', 'How hard a critical hits.'],
  ['bossdmg', 'Boss damage', 'Extra damage to bosses.'], ['named', 'Named damage per second', 'The Named (allies) fight on their own.'],
  ['bosstime', 'Boss time', 'Seconds on the boss clock (a candle).'], ['mana', 'Mana', 'Spells and skills cost mana.'], ['skill', 'Skill power', 'Skills and spells hit harder.'],
  ['gold', 'Gold', 'Gold found.'], ['cleave', 'Cleave', 'Leftover damage carries to the next foes.'], ['best', 'Best stage', 'Deepest stage reached.'],
];
const TABS: [string, string][] = [['hero', 'Hero'], ['named', 'Named (allies)'], ['gear', 'Gear'], ['skills', 'Skills'], ['pets', 'Pets'], ['quests', 'Quests'], ['death', 'Death (fall, relics, dungeons)'], ['menu', 'Menu']];

export const ICON_GROUPS: Record<string, () => IconNeed[]> = {
  warrior: () => classGroup('warrior'),
  mage: () => classGroup('mage'),
  rogue: () => classGroup('rogue'),
  ranger: () => classGroup('ranger'),
  cleric: () => classGroup('cleric'),
  formsa: () => formGroup(['mastery', 'vampire', 'werewolf']),
  formsb: () => formGroup(['draconic', 'undead', 'elemental']),
  races,
  general: () => [
    ...SPELLS.map((s) => ({ id: s.id, name: `${s.name} (shared spell)`, text: `${s.text} Picture idea: ${s.icon}.` })),
    ...STATS.map(([id, name, text]) => ({ id: `stat:${id}`, name: `${name} (stat)`, text })),
    ...TABS.map(([id, name]) => ({ id: `tab:${id}`, name: `${name} (bottom tab)`, text: '' })),
  ],
};
