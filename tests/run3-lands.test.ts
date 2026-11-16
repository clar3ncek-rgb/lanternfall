import { describe, expect, it } from 'vitest';
import * as G from '../src/rules/game';
import { BELLROPE, DEEP_SHOWN, FIRST_DEEP, LANDS_END, LORE_APPROVED, ZONES, zoneFor } from '../src/rules/data';
import { SPECIAL_FOES } from '../src/rules/content';

const fresh = () => G.newGame({ name: 'Test', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' }, 7, Date.now());

describe('the lands below the Bell (run 3, round 1)', () => {
  it('a land every 50 stages from 151 to 500; Beneath the Bell is 101-125 and The Bellrope Descent 126-150', () => {
    expect(ZONES).toHaveLength(13);
    expect(FIRST_DEEP).toBe(BELLROPE + 1);
    expect(zoneFor(101).name).toBe('Beneath the Bell');
    expect(zoneFor(125).name).toBe('Beneath the Bell');
    expect(zoneFor(126)).toBe(ZONES[BELLROPE]);
    expect(zoneFor(150).name).toBe('The Bellrope Descent');
    expect(G.landIndex(126)).toBe(BELLROPE);
    for (let i = 0; i < 7; i++) {
      expect(zoneFor(151 + i * 50)).toBe(ZONES[FIRST_DEEP + i]);
      expect(zoneFor(200 + i * 50)).toBe(ZONES[FIRST_DEEP + i]);
    }
  });
  it('past 500 the deep lands repeat as Deeper copies, forever, with no dead end', () => {
    const z = zoneFor(LANDS_END + 1);
    expect(z.name.startsWith('Deeper')).toBe(true);
    expect(z.base).toBe(FIRST_DEEP);
    expect(G.landIndex(LANDS_END + 1)).toBe(FIRST_DEEP);
    expect(G.landIndex(LANDS_END + 7 * 50 + 1)).toBe(FIRST_DEEP); // one full lap later
    expect(zoneFor(LANDS_END + 7 * 50 + 1).name.startsWith('Deeper 2')).toBe(true);
    expect(zoneFor(99999).foes.length).toBe(3);
  });
  it('a land shows its 3 bosses in turn, and the Hollow Bishop still guards every 50th stage', () => {
    const s = fresh();
    const names = new Set<string>();
    for (let st = 151; st < 200; st++) { s.life.stage = st; s.life.foe.boss = false; s.life.kills = G.KILLS_PER_STAGE; G.fightBoss(s); names.add(s.life.foe.name); }
    expect(names.size).toBe(3);
    s.life.stage = 200; s.life.foe.boss = false; s.life.kills = G.KILLS_PER_STAGE; G.fightBoss(s);
    expect(s.life.foe.name).toBe('The Hollow Bishop');
  });
  it('every land from The Bellrope Descent down has its own treasure foe and wanderer', () => {
    expect(SPECIAL_FOES.some((f) => f.name === 'The Coin-Swallower' && f.lands.includes(BELLROPE))).toBe(true);
    expect(SPECIAL_FOES.some((f) => f.name === 'The Falling Monk' && f.lands.includes(BELLROPE))).toBe(true);
    for (let i = 0; i < DEEP_SHOWN.length; i++) {
      expect(SPECIAL_FOES.some((f) => f.kind === 'treasure' && f.lands.includes(FIRST_DEEP + i))).toBe(true);
      expect(SPECIAL_FOES.some((f) => f.kind === 'wanderer' && f.lands.includes(FIRST_DEEP + i))).toBe(true);
    }
  });
  it('until the lore is approved, the deep lands show placeholder names only', () => {
    if (LORE_APPROVED) return;
    for (const d of DEEP_SHOWN) expect(d.name).toMatch(/^Land \d+$/);
    expect(zoneFor(151).foes.every((f) => f.startsWith('Deep '))).toBe(true);
  });
  it('the Next line keeps a land goal past stage 101', () => {
    const s = fresh();
    s.life.stage = s.life.maxStage = s.bestStage = 120;
    expect(G.upcomingGoals(s).some((g) => g.kind === 'zone' && g.stage === 126)).toBe(true);
    s.life.stage = s.life.maxStage = s.bestStage = 130;
    expect(G.upcomingGoals(s).some((g) => g.kind === 'zone' && g.stage === 151)).toBe(true);
  });
  it('old saves keep their seen lands after the split (deep lands move up one)', () => {
    const s = fresh();
    s.landsSeen = [5, 7]; delete s.landSplit;
    const back = G.deserialize(G.serialize(s));
    expect(back.landsSeen).toEqual([6, 8]);
    expect(G.deserialize(G.serialize(back)).landsSeen).toEqual([6, 8]);
  });
});
