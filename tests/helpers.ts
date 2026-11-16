import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { ALLIES } from '../src/rules/data';
import { SPELLS } from '../src/rules/content';

export const T0 = 1_800_000_000_000;

export function fresh(cls = 'rogue', seed = 42): G.State {
  return G.newGame({ name: 'Vaelis', race: 'elf', cls, faith: 'redhunt', form: 'mortal' }, seed, T0);
}

/** A simple player: taps `tapsPerSec`, buys the cheapest useful upgrade, retries bosses, uses skills. */
/** Run 4: an active player aims taps at open weak spots (`aim` = share that land on it), takes hunts, answers the Toll Collector
 *  and makes a shrine offering; without a policy the player ignores all of it (the "waiter"). */
export interface Policy { aim?: number; choices?: boolean; noGear?: boolean }
export function play(s: G.State, seconds: number, tapsPerSec = 6, dt = 0.25, policy: Policy = {}) {
  let tapCarry = 0, aimCarry = 0;
  for (let t = 0; t < seconds; t += dt) {
    tapCarry += tapsPerSec * dt;
    while (tapCarry >= 1) {
      let weak = false;
      if (policy.aim && G.weakOpen(s)) { aimCarry += policy.aim; if (aimCarry >= 1) { aimCarry -= 1; weak = true; } }
      G.tap(s, { weak });
      tapCarry -= 1;
    }
    G.tick(s, dt);
    G.cancelToll(s); // run 3: a sensible player taps the bell when a gimmick boss tolls
    if (s.escape) continue;
    if (policy.choices) {
      if (s.life.huntOffer) G.acceptHunt(s);
      if (s.life.collector) G.answerCollector(s, true);
      if (G.offeringReady(s)) G.makeOffering(s, s.life.foe.boss ? 'named' : 'oil');
    }
    // spend gold: hero first if it is the cheapest, else the cheapest unlocked ally
    for (let guard = 0; guard < 50; guard++) {
      let bestCost = G.heroCost(s);
      let buy: () => number = () => G.buyHero(s);
      ALLIES.forEach((_, i) => {
        if (!G.allyUnlocked(s, i)) return;
        const c = G.allyCost(s, i);
        if (B.lt(c, bestCost)) {
          bestCost = c;
          buy = () => G.buyAlly(s, i);
        }
      });
      if (B.lt(s.life.gold, bestCost) || buy() === 0) break;
    }
    if (!s.life.autoBoss && s.life.kills >= G.KILLS_PER_STAGE) G.fightBoss(s);
    for (const n of G.classOf(s).tree) if (G.canUse(s, n.id) === 'ok') G.useSkill(s, n.id);
    for (const sp of SPELLS) if (G.canUse(s, sp.id) === 'ok') G.useSkill(s, sp.id); // run 5: learned spells too (the Mage lives on them)
    while (G.skillPointsFree(s) > 0) {
      const open = G.classOf(s).tree.find((n) => G.nodeOpen(s, n) && (s.ranks[n.id] ?? 0) < 5);
      if (!open || !G.rankUp(s, open.id)) break;
    }
    // wear anything better
    if (!policy.noGear) for (const it of [...s.bag]) {
      const c = G.compare(s, it);
      const worn = s.equipped[c.slot as keyof typeof s.equipped];
      if (worn?.set && G.setsComplete(s).some((d) => d.id === worn.set)) continue; // run 6: a sensible player keeps a working set on
      if (c.tap > 0.02 || G.completesSet(s, it)) G.equip(s, it.id, c.slot);
    }
  }
}
