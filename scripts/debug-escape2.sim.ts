// Debug (run 3): one adaptive escape, foe by foe.
import { it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { play, T0 } from '../tests/helpers';
it('debug adaptive escape', () => {
  const s = G.newGame({ name: 'Sim', race: 'troll', cls: 'cleric', faith: 'redhunt', form: 'mortal' }, 23, T0);
  for (let m = 0; m < 25; m++) { play(s, 60, 5); while (s.pending.length) G.choose(s, s.pending[0].choices[0]); while (true) { const [h, n] = G.questProgress(s); if (h < n || !G.claimQuest(s)) break; } }
  G.die(s);
  const e = s.escape!;
  const start = e.unit;
  let last = -1, t = 0, lastT = 0;
  const rows: string[] = [];
  while (!e.done && t < 400) {
    play(s, 0.25, 5); t += 0.25;
    if (e.killed !== last) { rows.push(`k${e.killed} t${t.toFixed(1)} dt${(t - lastT).toFixed(1)} unit/start ${B.ratio(e.unit, start).toFixed(2)} meas/start ${e.spent ? B.ratio(B.times(e.dealt ?? B.ZERO, 1 / e.spent), start).toFixed(2) : '-'}`); last = e.killed; lastT = t; }
  }
  console.log(`DBG2 left ${e.timeLeft.toFixed(0)} special ${e.special}\n` + rows.join('\n'));
}, 600000);
