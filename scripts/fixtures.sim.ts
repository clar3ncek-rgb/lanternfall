// One-time: freeze v1, v2 and v3 save files for tests/old-saves.test.ts (run 2, item 3). Re-running overwrites them; don't, unless the
// fixtures must change on purpose. v1 and v2 are rebuilt from the fields migrate() knows each version lacked.
import { test } from 'vitest';
import { writeFileSync } from 'node:fs';
import * as G from '../src/rules/game';
import { CLASSES } from '../src/rules/data';
test('freeze fixtures', () => {
  const s = G.newGame({ name: 'Fixture', race: 'dwarf', cls: 'warrior', faith: 'redhunt', form: 'mortal' }, 11, 1762700000000);
  for (let i = 0; i < 3000; i++) { G.tap(s); G.tick(s, 0.1); if (i % 50 === 0) { while (G.buyHero(s)) { /* */ } G.buyAlly(s, 0); } }
  const v3 = JSON.parse(G.serialize(s));
  writeFileSync('tests/fixtures/save-v3.json', JSON.stringify(v3, null, 1));
  const v2 = JSON.parse(JSON.stringify(v3));
  v2.v = 2;
  for (const k of ['classPaths', 'classPath', 'forms', 'formTracks', 'trialBase', 'formOffered']) delete v2[k];
  const branchNode = CLASSES.find((c) => c.id === 'warrior')!.tree.find((n) => n.branch)!;
  v2.ranks = { ...v2.ranks, [branchNode.id]: 3 };
  v2.hero.form = 'vampire';
  writeFileSync('tests/fixtures/save-v2.json', JSON.stringify(v2, null, 1));
  const v1 = JSON.parse(JSON.stringify(v2));
  v1.v = 1;
  v1.rites = v1.relics; delete v1.relics;
  for (const k of ['xp', 'raceRanks', 'formRanks', 'spells', 'points', 'quest', 'counts', 'marks', 'keys', 'eggs', 'pets', 'petsOut', 'ach', 'chest', 'daily', 'dungeon', 'events']) delete v1[k];
  writeFileSync('tests/fixtures/save-v1.json', JSON.stringify(v1, null, 1));
  console.log('fixtures: stage', s.life.stage, 'best', s.bestStage, 'branch node', branchNode.id);
});
