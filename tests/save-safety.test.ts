import { describe, expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';

const fresh = () => G.newGame({ name: 'Test', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' }, 7, Date.now());

describe('reading the save slot (run 2, item 1)', () => {
  it('an empty slot is "none", so the game may start fresh', () => {
    expect(G.readSave(null).kind).toBe('none');
    expect(G.readSave('').kind).toBe('none');
  });
  it('a good save loads', () => {
    const r = G.readSave(G.serialize(fresh()));
    expect(r.kind).toBe('ok');
  });
  it('broken JSON is "bad", never "none"', () => {
    const r = G.readSave('{"hero": {"name": "Vae');
    expect(r.kind).toBe('bad');
    if (r.kind === 'bad') expect(r.reason).toMatch(/damaged/);
  });
  it('a save from a newer version is "bad" with a clear reason', () => {
    const raw = JSON.parse(G.serialize(fresh()));
    raw.v = 999;
    const r = G.readSave(JSON.stringify(raw));
    expect(r.kind).toBe('bad');
    if (r.kind === 'bad') expect(r.reason).toMatch(/newer version/);
  });
  it('a save with no version number is "bad" and says so', () => {
    const raw = JSON.parse(G.serialize(fresh()));
    delete raw.v;
    const r = G.readSave(JSON.stringify(raw));
    expect(r.kind).toBe('bad');
    if (r.kind === 'bad') expect(r.reason).toMatch(/no version/);
  });
  it('something that is not a save at all is "bad"', () => {
    expect(G.readSave('[1,2,3]').kind).toBe('bad');
  });
});

describe('round 2 rule fixes', () => {
  it('gear, pets and skill resets are locked inside an escape', () => {
    const s = fresh();
    s.life.maxStage = 30;
    expect(G.die(s)).toBe(true);
    expect(G.inRealm(s)).toBe(true);
    expect(G.resetSkills(s)).toBe(false);
    expect(G.unequip(s, 'mainHand')).toBe(false);
  });
  it('dailies refresh at most once per 8 real hours, even across midnight', () => {
    const s = fresh();
    const t0 = new Date(2026, 10, 10, 22, 0, 0).getTime(); // 22:00 local
    G.refreshDaily(s, t0);
    expect(G.refreshDaily(s, t0 + 3 * 3600000)).toBe(false); // 01:00 next day: a new calendar day, but only 3 hours later
    expect(G.refreshDaily(s, t0 + 9 * 3600000)).toBe(true); // 07:00: 9 hours later
  });
  it('realms are sized from the damage actually dealt this life when that is higher', () => {
    const s = fresh();
    s.life.peakDps = B.big(1e12);
    expect(G.realmUnit(s)).toEqual(B.times(B.big(1e12), 0.8));
    s.life.peakDps = B.big(1);
    expect(G.realmUnit(s)).toEqual(G.estimateDps(s));
  });
});
