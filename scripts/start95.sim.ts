// Run 3 play-test gate: a mid-game save at about stage 95 (one life played by the sim bot), so AI testers reach the new content in 180 steps.
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import * as G from '../src/rules/game';
import { play, T0 } from '../tests/helpers';
it('make the stage-95 start save', () => {
  const s = G.newGame({ name: 'Tester', race: 'human', cls: 'warrior', faith: 'redhunt', form: 'mortal' }, 31, T0);
  for (let m = 0; m < 30 && s.life.stage < 95; m++) {
    play(s, 30, 5);
    while (s.pending.length) G.choose(s, s.pending[0].choices[0]);
    while (true) { const [h, n] = G.questProgress(s); if (h < n || !G.claimQuest(s)) break; }
    for (const id of ['lantern-strike', 'ferrymans-toll']) G.learnSpell(s, id); // a real player learns spells; the first save never did
  }
  s.lastSeen = Date.now();
  writeFileSync('samples/playtest/start-95.json', G.serialize(s));
  console.log('START95 stage', s.life.stage, 'best', s.bestStage);
}, 600000);
