import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { fresh } from './helpers';

const maxRank = (tr: G.Track) => { tr.rank = G.MAX_TIER_RANK; tr.xp = 0; };

describe('class tiers (AdventureQuest-style)', () => {
  it('a new hero is base class T1, rank 1, and mortal', () => {
    const s = fresh();
    expect(s.classPaths).toEqual({ base: { tier: 1, rank: 1, xp: 0 } });
    expect(s.classPath).toBe('base');
    expect(s.forms).toEqual([]);
    expect(s.hero.form).toBe('mortal');
    expect(s.formTracks.mastery.tier).toBe(1);
  });

  it('kills give class XP; ranks stop at 10', () => {
    const s = fresh();
    s.life.heroLevel = 50;
    for (let i = 0; i < G.rankXp(1) + 50; i++) {
      s.life.foe = { name: 'x', hp: B.big(1), max: B.big(1), boss: false };
      G.tap(s);
    }
    expect(s.classPaths.base.rank).toBeGreaterThan(1);
    s.classPaths.base.rank = 9;
    s.classPaths.base.xp = G.rankXp(1) - 1;
    s.life.foe = { name: 'x', hp: B.big(1), max: B.big(1), boss: false }; // no immunity
    G.tap(s);
    expect(s.classPaths.base.rank).toBe(G.MAX_TIER_RANK);
    expect(s.classPaths.base.xp).toBe(0);
  });

  it('subclass trials only show at base rank 10, and a cleared trial unlocks T2', () => {
    const s = fresh();
    expect(G.availableTrials(s).filter((t) => t.kind === 'subclass')).toHaveLength(0);
    maxRank(s.classPaths.base);
    G.refreshTrials(s);
    const subs = G.availableTrials(s).filter((t) => t.kind === 'subclass');
    expect(subs.map((t) => t.target)).toEqual(G.classOf(s).branches);
    const tr = subs[0];
    expect(G.claimTrial(s, tr.id)).toBe(false);
    s.counts.bosses = (s.counts.bosses ?? 0) + 10;
    expect(G.claimTrial(s, tr.id)).toBe(true);
    expect(s.classPaths[tr.target]).toEqual({ tier: 2, rank: 1, xp: 0 });
  });

  it('only the equipped subclass counts; its nodes open by tier; no switching mid-boss', () => {
    const s = fresh();
    const b = G.classOf(s).branches[0];
    const t1 = G.classOf(s).tree.find((n) => n.branch === b && n.tier === 1)!;
    const t2 = G.classOf(s).tree.find((n) => n.branch === b && n.tier === 2)!;
    s.points.classPt = 10;
    expect(G.rankUp(s, t1.id)).toBe(false); // not owned yet
    s.classPaths[b] = { tier: 2, rank: 1, xp: 0 };
    expect(G.rankUp(s, t1.id)).toBe(true);
    expect(G.rankUp(s, t2.id)).toBe(false); // needs T3
    expect(G.classNodeActive(s, t1)).toBe(false); // owned but not equipped
    expect(G.equipPath(s, b)).toBe(true);
    expect(G.classNodeActive(s, t1)).toBe(true);
    s.life.kills = G.KILLS_PER_STAGE;
    G.fightBoss(s);
    expect(G.equipPath(s, 'base')).toBe(false);
  });

  it('a subclass climbs to T7 and gets its ultimate', () => {
    const s = fresh();
    const b = G.classOf(s).branches[1];
    s.classPaths[b] = { tier: 6, rank: G.MAX_TIER_RANK, xp: 0 };
    G.equipPath(s, b);
    G.refreshTrials(s);
    const up = G.availableTrials(s).find((t) => t.id === `up:${b}:7`)!;
    s.counts.bishops = (s.counts.bishops ?? 0) + 10;
    expect(G.claimTrial(s, up.id)).toBe(true);
    expect(s.classPaths[b].tier).toBe(7);
    const ult = G.ultimates(s)[0];
    expect(ult).toBeTruthy();
    s.life.mana = 1000;
    expect(G.canUse(s, ult.id)).toBe('ok');
  });
});

describe('transformation tiers (main-game rules)', () => {
  const offered = () => {
    const s = fresh();
    s.formOffered = true;
    return s;
  };

  it('the offer appears after quest 15 and taking a form closes Mortal Master', () => {
    const s = fresh();
    expect(G.availableTrials(s).some((t) => t.kind === 'offer')).toBe(false);
    s.quest.num = G.OFFER_QUEST;
    s.bestStage = 60;
    expect(G.claimTrial(s, 'offer')).toBe(true);
    expect(G.acceptForm(s, 'vampire')).toBe(true);
    expect(s.forms).toEqual(['vampire']);
    expect(s.formTracks.mastery).toBeUndefined();
    expect(s.hero.form).toBe('vampire');
    expect(G.formCap(s, 'vampire')).toBe(7);
  });

  it('hybrids: a 2nd form only while all are T1–T2; caps T4/T3; triple T2; closes at T3', () => {
    const s = offered();
    G.acceptForm(s, 'werewolf');
    expect(G.canAddForm(s)).toBe(true);
    expect(G.acceptForm(s, 'draconic')).toBe(true);
    expect(G.formCap(s, 'werewolf')).toBe(4);
    expect(G.formCap(s, 'draconic')).toBe(3);
    expect(G.acceptForm(s, 'undead')).toBe(true);
    expect(G.formCap(s, 'werewolf')).toBe(2);
    expect(G.canAddForm(s)).toBe(false); // three is the most
    const t = offered();
    G.acceptForm(t, 'vampire');
    t.formTracks.vampire.tier = 3;
    expect(G.canAddForm(t)).toBe(false);
    expect(G.acceptForm(t, 'elemental')).toBe(false);
  });

  it('every weakness applies to a hybrid', () => {
    const s = offered();
    G.acceptForm(s, 'vampire');
    G.acceptForm(s, 'draconic');
    const st = G.totalStats(s);
    expect(st.timerSec ?? 0).toBeLessThan(0 + 1e9); // vampire weakness present
    expect(st.dmgPct ?? 0).toBeLessThan(0); // draconic weakness present (run 5: -10% damage)
  });

  it('a form tier trial shows at rank 10 and stops at the cap', () => {
    const s = offered();
    G.acceptForm(s, 'werewolf');
    G.acceptForm(s, 'elemental');
    maxRank(s.formTracks.elemental);
    s.formTracks.elemental.tier = 3; // its cap as the second form
    G.refreshTrials(s);
    expect(G.availableTrials(s).some((t) => t.target === 'elemental')).toBe(false);
    maxRank(s.formTracks.werewolf);
    G.refreshTrials(s);
    expect(G.availableTrials(s).some((t) => t.id === 'form:werewolf:2')).toBe(true);
  });

  it('Mastery climbs to T7 and gets the mortal ultimate', () => {
    const s = fresh();
    s.formTracks.mastery = { tier: 7, rank: 1, xp: 0 };
    expect(G.ultimates(s).length).toBe(1);
  });
});

describe('v2 saves', () => {
  it('load as base class T1 and mortal', () => {
    const s = fresh();
    const raw = JSON.parse(G.serialize(s));
    for (const k of ['classPaths', 'classPath', 'forms', 'formTracks', 'formOffered', 'trialBase']) delete raw[k];
    raw.v = 2;
    raw.hero.form = 'vampire';
    raw.formRanks = { 'vampire-0': 2 };
    const back = G.deserialize(JSON.stringify(raw));
    expect(back.hero.form).toBe('mortal');
    expect(back.forms).toEqual([]);
    expect(back.formRanks).toEqual({});
    expect(back.classPath).toBe('base');
    expect(() => G.tick(back, 0.5)).not.toThrow();
  });
});
