import { describe, expect, it } from 'vitest';
import * as G from '../src/rules/game';

const fresh = () => G.newGame({ name: 'Test', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' }, 7, Date.now());

describe('upcoming goals (run 2, item 17)', () => {
  it('a new player sees goals ahead of them, nearest first', () => {
    const g = G.upcomingGoals(fresh());
    expect(g.length).toBeGreaterThan(0);
    for (let i = 1; i < g.length; i++) expect(g[i].stage).toBeGreaterThanOrEqual(g[i - 1].stage);
    expect(g.every((x) => x.stage > 1)).toBe(true);
  });
  it('fall unlocks shows until stage 20 is reached, then goes', () => {
    const s = fresh();
    expect(G.upcomingGoals(s).some((x) => x.kind === 'fall')).toBe(true);
    s.life.maxStage = 25; s.life.stage = 25; s.bestStage = 25;
    expect(G.upcomingGoals(s).some((x) => x.kind === 'fall')).toBe(false);
  });
  it('after a fall, the best stage is a goal', () => {
    const s = fresh();
    s.bestStage = 300; s.life.stage = 40; s.life.maxStage = 40;
    expect(G.upcomingGoals(s).some((x) => x.kind === 'best' && x.stage === 300)).toBe(true);
  });
});
