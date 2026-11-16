import { describe, expect, it } from 'vitest';
import * as G from '../src/rules/game';
import { fresh } from './helpers';

describe('guided start (run 2, item 13)', () => {
  it('walks the six steps in order, then is done', () => {
    const s = fresh();
    expect(G.firstRunStep(s)).toBe(0);
    s.totalTaps = 8; expect(G.firstRunStep(s)).toBe(1);
    s.life.heroLevel = 2; expect(G.firstRunStep(s)).toBe(2);
    s.life.allyLevels[0] = 1; expect(G.firstRunStep(s)).toBe(3);
    s.bestStage = 2; expect(G.firstRunStep(s)).toBe(4);
    s.quest.num = 2; expect(G.firstRunStep(s)).toBe(5);
    const node = G.classOf(s).tree.find((n) => n.tier === 0)!;
    s.ranks[node.id] = 1; expect(G.firstRunStep(s)).toBe(G.FIRST_RUN_STEPS);
  });
  it('is skipped for anyone who has fallen or gone deep', () => {
    const s = fresh(); s.returns = 1;
    expect(G.firstRunStep(s)).toBe(G.FIRST_RUN_STEPS);
  });
});

describe('dimmed tabs (run 2, item 14)', () => {
  it('run 8: tabs open one at a time (Quests 5, Skills 15, Gear 25, Death 40; Pets with an egg)', () => {
    const s = fresh();
    s.bag = []; s.equipped = {};
    for (const t of ['hero', 'named', 'menu']) expect(G.tabReady(s, t)).toBe(true);
    for (const t of ['quests', 'skills', 'pets', 'gear', 'death']) expect(G.tabReady(s, t)).toBe(false);
    s.eggs = 1; expect(G.tabReady(s, 'pets')).toBe(true);
    s.bestStage = 5; expect(G.tabReady(s, 'quests')).toBe(true); expect(G.tabReady(s, 'skills')).toBe(false);
    s.bestStage = 15; expect(G.tabReady(s, 'skills')).toBe(true); expect(G.tabReady(s, 'gear')).toBe(false);
    s.bestStage = 25; expect(G.tabReady(s, 'gear')).toBe(true); expect(G.tabReady(s, 'death')).toBe(false);
    s.bestStage = 40; expect(G.tabReady(s, 'death')).toBe(true);
    const m = fresh('mage'); expect(G.tabReady(m, 'skills')).toBe(false);
    m.points.classPt = 1; expect(G.tabReady(m, 'skills')).toBe(true);
  });
  it('saves with progress see every tab', () => {
    const s = fresh(); s.bag = []; s.equipped = {}; s.bestStage = 40;
    for (const t of ['pets', 'gear', 'death']) expect(G.tabReady(s, t)).toBe(true);
  });
});
