// One-time (run 3, item 2): freeze a v4 save and a v3 save stopped in the middle of a boss fight. Re-running overwrites them.
import { test } from 'vitest';
import { writeFileSync } from 'node:fs';
import * as G from '../src/rules/game';
test('freeze v4 fixtures', () => {
  const s = G.newGame({ name: 'Fixture4', race: 'elf', cls: 'rogue', faith: 'redhunt', form: 'mortal' }, 23, 1762800000000);
  for (let i = 0; i < 2600; i++) { G.tap(s); G.tick(s, 0.1); if (i % 50 === 0) { while (G.buyHero(s)) { /* */ } G.buyAlly(s, 0); } }
  // stop at a boss: tap until the current foe is a boss
  for (let i = 0; i < 4000 && !s.life.foe.boss; i++) { G.tap(s); G.tick(s, 0.1); }
  s.trainPerks = ['crit'];
  s.landsSeen = [0, 1];
  s.eventLog = ['eclipse'];
  writeFileSync('tests/fixtures/save-v4.json', JSON.stringify(JSON.parse(G.serialize(s)), null, 1));
  const v3 = JSON.parse(G.serialize(s));
  v3.v = 3;
  for (const k of ['eventSeed', 'gimmickSeed', 'trainPerks', 'landsSeen', 'eventLog', 'gimmicksBeaten']) delete v3[k];
  writeFileSync('tests/fixtures/save-v3-midboss.json', JSON.stringify(v3, null, 1));
  console.log('v4 fixtures: stage', s.life.stage, 'boss', s.life.foe.boss, 'bossLeft', s.life.bossLeft);
});
