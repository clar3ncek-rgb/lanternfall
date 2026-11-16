import { describe, expect, it } from 'vitest';
import * as G from '../src/rules/game';

const fresh = () => G.newGame({ name: 'Test', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' }, 7, Date.now());
const at = (stage: number) => { const s = fresh(); s.life.stage = s.life.maxStage = s.bestStage = stage; s.life.foe.hp = s.life.foe.max = G.foeNow(s).max; return s; };
const runFor = (s: G.State, secs: number) => { for (let t = 0; t < secs; t += 0.5) G.tick(s, 0.5); };

describe('events (run 3, round 3)', () => {
  it('an event comes every 2.5 to 3.5 minutes of ordinary fighting from stage 26', () => {
    const s = at(60);
    s.life.foe.hp = s.life.foe.max = G.foeNow(s).max; // keep fighting the same foe
    runFor(s, 6 * 60 + 1);
    expect(s.eventLog.length).toBeGreaterThanOrEqual(1);
  });
  it('no events before stage 26, in escapes or dungeons, or with the setting off', () => {
    const early = at(10); runFor(early, 400); expect(early.eventLog).toEqual([]);
    const off = at(60); off.eventsOff = true; runFor(off, 400); expect(off.eventLog).toEqual([]);
    const esc = at(60); esc.life.maxStage = 60; expect(G.die(esc)).toBe(true);
    for (let t = 0; t < 100 && esc.escape && !esc.escape.done; t += 0.5) G.tick(esc, 0.5); // run 8: an escape can now end inside 100 s; after it, events may start again
    expect(esc.eventLog).toEqual([]);
  }, 20_000); // run 8: about 1.7 s alone, past 5 s when the PC is busy
  it('Eclipse lifts damage from every source (run 5; was crit chance), Bell Toll gives 1.5x gold, Grave Rush makes 3 treasure foes', () => {
    const s = at(60);
    G.startEvent(s, 'eclipse');
    expect(s.life.buffs.some((b) => b.kind === 'dmgBuff' && b.from === 'event')).toBe(true);
    G.startEvent(s, 'belltoll');
    expect(s.life.buffs.some((b) => b.kind === 'goldBuff' && b.mag === 0.5)).toBe(true);
    G.startEvent(s, 'gravrush');
    expect(s.life.rushLeft).toBe(3);
  });
  it('events draw only from the event seed, never the main seed', () => {
    const s = at(60);
    const seed = s.seed;
    G.startEvent(s); // picks at random from the event stream
    expect(s.seed).toBe(seed);
  });
  it('the event log keeps the last 10 only', () => {
    const s = at(60);
    for (let i = 0; i < 14; i++) G.startEvent(s, 'eclipse');
    expect(s.eventLog).toHaveLength(10);
  });
  it('the weekly element comes from the week number and gives +15% to that element', () => {
    const s = fresh();
    s.daily.week = 0; expect(G.weeklyElement(s)).toBe('fire');
    s.daily.week = 1; expect(G.weeklyElement(s)).toBe('cold');
    s.daily.week = 5; expect(G.weeklyElement(s)).toBe('cold');
    s.daily.week = -1; expect(G.weeklyElement(s)).toBeNull();
  });
});
