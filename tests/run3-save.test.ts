import { describe, expect, it } from 'vitest';
import * as G from '../src/rules/game';
import v3mid from './fixtures/save-v3-midboss.json?raw';
import v4 from './fixtures/save-v4.json?raw';

describe('save version 4 (run 3, item 2)', () => {
  it('a v3 save stopped mid-boss loads as v4 with the boss fight intact', () => {
    const before = JSON.parse(v3mid);
    const s = G.deserialize(v3mid);
    expect(s.v).toBe(4);
    expect(s.life.stage).toBe(before.life.stage);
    expect(s.life.foe.boss).toBe(true);
    expect(s.life.bossLeft).toBe(before.life.bossLeft);
    expect(s.trainPerks).toEqual([]);
    expect(s.landsSeen).toEqual([]);
    expect(s.eventLog).toEqual([]);
    expect(s.gimmicksBeaten).toEqual([]);
  });
  it('the new seeds come from the old seed without drawing from it, so a v3 save plays on exactly as before', () => {
    const before = JSON.parse(v3mid);
    const s = G.deserialize(v3mid);
    expect(s.seed).toBe(before.seed);
    expect(s.eventSeed).toBe(((before.seed | 0) * 31 + 7) | 0);
    expect(s.gimmickSeed).toBe(((before.seed | 0) * 17 + 3) | 0);
    // drawing from the event and gimmick streams never moves the main seed
    const seed = s.seed;
    G.randEvent(s); G.randGimmick(s); G.randEvent(s);
    expect(s.seed).toBe(seed);
  });
  it('the event and gimmick streams continue across a save and load', () => {
    const s = G.deserialize(v4);
    G.randEvent(s);
    const copy = G.deserialize(G.serialize(s));
    expect(G.randEvent(copy)).toBe(G.randEvent(s));
    expect(G.randGimmick(copy)).toBe(G.randGimmick(s));
  });
  it('a v4 save keeps its run 3 fields', () => {
    const s = G.deserialize(v4);
    expect(s.v).toBe(4);
    expect(s.trainPerks).toEqual(['crit']);
    expect(s.landsSeen).toEqual([0, 1]);
    expect(s.eventLog).toEqual(['eclipse']);
  });
  it('a save from a newer version than 4 is refused with a clear message', () => {
    const r = JSON.parse(v4); r.v = 5;
    const read = G.readSave(JSON.stringify(r));
    expect(read.kind).toBe('bad');
    if (read.kind === 'bad') expect(read.reason).toMatch(/newer version/);
  });
});
