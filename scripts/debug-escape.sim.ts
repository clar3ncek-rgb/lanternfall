// Debug (run 3): why do some first falls leave 170+ s? Prints what the escape is sized from at the end of life 1.
import { it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { play, T0 } from '../tests/helpers';
it('debug escape sizing', () => {
  for (const [race, cls, seed] of [['troll', 'cleric', 5], ['elf', 'rogue', 5]] as const) {
    const s = G.newGame({ name: 'Sim', race, cls, faith: 'redhunt', form: 'mortal' }, seed, T0);
    let events = 0;
    for (let m = 0; m < 25; m++) {
      for (let k = 0; k < 6; k++) { play(s, 10, 5); }
      while (s.pending.length) G.choose(s, s.pending[0].choices[0]);
      while (true) { const [h, n] = G.questProgress(s); if (h < n || !G.claimQuest(s)) break; }
      while (G.trainPerksWaiting(s) > 0) G.chooseTrainPerk(s, s.trainPerks.length % 2 ? 'crit' : 'tap');
      G.forge(s, 'mainHand');
      events = s.eventLog.length;
    }
    const L = s.life;
    const nm = G.derive(s).normalMult; console.log(`DBG nm ${nm.toFixed(2)} ${race} ${cls} ${seed}: stage ${L.stage} events ${events} peak ${B.format(L.peakDps ?? B.ZERO)} hist ${(L.dpsHist ?? []).map(B.format).join(',')} est ${B.format(G.estimateDps(s))} unit ${B.format(G.realmUnit(s))} dmgT ${L.dmgT?.toFixed(1)} event ${JSON.stringify(L.event)} forge ${s.equipped.mainHand?.forge} perks ${s.trainPerks.join('')}`);
  }
}, 600000);
