// Pacing sim as a pass/fail gate (run 2, item 4). `npm run sim`. It plays several builds and seeds, prints a table, and fails with
// named lines when a target is missed. Targets come from RUN2-PLAN.md (Clarence's run 2, 10 Nov 2026).
import { expect, it } from 'vitest';
import * as B from '../src/rules/big';
import * as G from '../src/rules/game';
import { RELICS } from '../src/rules/content';
import { ESCAPE_FOES, ESCAPE_SECONDS } from '../src/rules/data';
import { readFileSync } from 'node:fs';
import { play, T0, type Policy } from '../tests/helpers';

const TARGET = {
  life1Stall: [150, 350] as const, // stage at the end of life 1 (25 min)
  rank10Min: [20, 40] as const, // minutes of play until base class rank 10
  escapeLeft: [3, 30] as const, // Clarence: every escape about 10 s. Run 5 lands 9-16 s on most, up to about 28 (was 3-35, before that 3-70) // seconds left at the gate on the FIRST fall (life 1); Clarence 11 Nov: he likes it tense, about 10 s is good
  escapeLaterMin: 3, // run 3 (Clarence: every escape tight): later lives use the same band as the first fall
  dungeonClearRate: 0.5, // share of dungeons cleared at the player's own level
  raceTreeFullNotBeforeLife: 3, // the 90-point race tree (XP level 91) should not fill in lives 1 to 2
  // run 3, item 3: the middle. After stage 100, the longest stretch with nothing new (a land, a boss name, a gimmick, an event).
  noveltyGapMaxMin: 4,
  noveltyBinding: true, // binding since run 3 rounds 1-4 (RUN3-PLAN item 3)
};

/** Run 3: what counts as "something new" this life, sampled every 10 s of play. */
function noveltyTracker() {
  const seen = new Set<string>();
  let lastNew = 0, t = 0, worst = 0, deep = 0;
  const landMin: Record<number, number> = {};
  return {
    sample(s: G.State, dt: number) {
      t += dt;
      if (s.escape || s.dungeon) return;
      const land = G.landIndex(s.life.stage);
      landMin[land] = (landMin[land] ?? 0) + dt / 60;
      const foe = s.life.foe;
      const keys = [`land:${land}`];
      if (foe.boss) keys.push(`boss:${foe.name}`);
      if (foe.gimmick) keys.push(`gimmick:${foe.gimmick}:${s.life.stage}`);
      const ev = (s.life as { event?: { id: string } | null }).event;
      if (ev) keys.push(`event:${ev.id}:${Math.floor(t / 60)}`);
      let fresh = false;
      for (const k of keys) if (!seen.has(k)) { seen.add(k); fresh = true; }
      if (s.life.stage <= 100) { lastNew = t; return; }
      deep += dt;
      if (fresh) lastNew = t;
      worst = Math.max(worst, (t - lastNew) / 60);
    },
    report: () => ({ worstGapMin: Math.round(worst * 10) / 10, deepMin: Math.round(deep / 6) / 10, maxLandMin: Math.round(Math.max(0, ...Object.values(landMin)) * 10) / 10, lands: Object.keys(landMin).length }),
  };
}

const SPECIAL_LEFT_MULT = 1.25;
const CLASS_IDS = ['warrior', 'mage', 'rogue', 'ranger', 'cleric'];
const lifeOne: Record<string, number[]> = {};
/** Run 5: each class's bot must show its loop happened (RUN5-PLAN.md, the deterministic gate). */
function loopCheck(cls: string, tag: string, c0: Partial<Record<string, number>>, c1: Partial<Record<string, number>>) {
  const d = (k: string) => (c1[k] ?? 0) - (c0[k] ?? 0);
  const mins = Math.max(1, d('fightSec') / 60);
  if (cls === 'warrior' && d('rageStrikes') / mins < 1) fail(`${tag}: ${d('rageStrikes')} Rage Strikes in ${mins.toFixed(0)} min (target 1 a minute)`);
  if (cls === 'mage' && d('spells') / mins < 4) fail(`${tag}: ${d('spells')} casts in ${mins.toFixed(0)} min (target 4 a minute)`);
  if (cls === 'mage' && d('manaFromTaps') <= 0) fail(`${tag}: no mana from taps`);
  if (cls === 'rogue' && (c1.comboMax ?? 0) < 5) fail(`${tag}: combo never reached 5 (best ${c1.comboMax ?? 0})`);
  if (cls === 'cleric' && d('prayerSec') / Math.max(1, d('fightSec')) < 0.6) fail(`${tag}: prayer above 50 for ${Math.round((100 * d('prayerSec')) / Math.max(1, d('fightSec')))}% of the fight (target 60%)`);
  console.log(`  loop ${tag}: strikes ${d('rageStrikes')}, casts ${d('spells')}, mana from taps ${Math.round(d('manaFromTaps'))}, combo best ${c1.comboMax ?? 0}, prayer ${Math.round((100 * d('prayerSec')) / Math.max(1, d('fightSec')))}%`);
}
const failures: string[] = [];
const fail = (line: string) => { failures.push(line); console.log(`  FAIL ${line}`); };
const inRange = (v: number, [a, b]: readonly [number, number]) => v >= a && v <= b;

function make(race: string, cls: string, seed: number) {
  return G.newGame({ name: 'Sim', race, cls, faith: 'lantern', form: 'mortal' }, seed, T0);
}

/** What a sensible player does between fights: claim, learn, spend points. */
function tidy(s: G.State) {
  while (s.pending.length) G.choose(s, s.pending[0].choices[0]);
  while (true) { const [h, n] = G.questProgress(s); if (h < n || !G.claimQuest(s)) break; }
  for (const tr of G.availableTrials(s)) { const [h, n] = G.trialProgress(s, tr); if (h >= n) G.claimTrial(s, tr.id); }
  for (const id of ['lantern-strike', 'ferrymans-toll', 'grave-sight', 'call-the-named', 'bell-frenzy', 'echo-hands']) G.learnSpell(s, id);
  const tree = G.raceTree(s);
  if (tree) for (let guard = 0; guard < 100 && G.racePointsFree(s) > 0; guard++) {
    const n = tree.nodes.find((x) => G.treeNodeOpen(tree, s.raceRanks, x.id) && (s.raceRanks[x.id] ?? 0) < x.max);
    if (!n || !G.rankTree(s, 'race', n.id)) break;
  }
  G.salvageWorse(s);
  // run 3: pick Train perks (alternating) and forge the main hand when there is gold to spare
  while (G.trainPerksWaiting(s) > 0) G.chooseTrainPerk(s, s.trainPerks.length % 2 ? 'crit' : 'tap');
  G.forge(s, 'mainHand');
  // run 4 (after the gate): Named at level 100 take Bossbreaker, and sellswords are hired when the gold is there
  s.life.allyLevels.forEach((_, i) => { if (G.specWaiting(s, i)) G.chooseSpec(s, i, 'boss'); });
  G.hireMerc(s);
}

/** Spend Embers: find new relics while it is the cheapest choice, else level the cheapest owned relic. */
function spendEmbers(s: G.State) {
  for (let i = 0; i < 2000; i++) {
    const owned = RELICS.filter((r) => G.relicOwned(s, r.id)).map((r) => [r.id, G.relicCost(s, r.id)] as const).sort((a, b) => (B.lt(a[1], b[1]) ? -1 : 1));
    const find = G.newRelicCost(s);
    if (owned.length && B.lt(owned[0][1], find)) { if (!G.levelRelic(s, owned[0][0])) break; }
    else if (!G.findRelic(s)) break;
  }
}

it('first bosses can be beaten', () => {
  for (const seed of [5, 11, 23]) {
    const s = make('elf', 'rogue', seed);
    // stage 1 boss, no upgrades at all, 5 taps a second
    for (let t = 0; t < 90 && s.life.stage < 2; t += 0.2) { G.tap(s); G.tick(s, 0.2); if (s.life.kills >= G.KILLS_PER_STAGE) G.fightBoss(s); }
    if (s.life.stage < 2) fail(`seed ${seed}: the stage-1 boss is not beaten in 90 s with no upgrades`);
    // stage 5 boss with at most 2 hero levels bought
    let bought = 0;
    for (let t = 0; t < 400 && s.life.stage < 6; t += 0.2) {
      G.tap(s); G.tick(s, 0.2);
      if (s.life.kills >= G.KILLS_PER_STAGE) G.fightBoss(s);
      if (bought < 2 && G.buyHero(s)) bought++;
    }
    if (s.life.stage < 6) fail(`seed ${seed}: the stage-5 boss is not beaten with 2 hero levels (reached stage ${s.life.stage})`);
  }
});

let paceDone = false;
it('pace across lives, builds and seeds', () => {
  // run 5: every class, two seeds, two lives each; race and faith are class-neutral now, so all are Human of the Lantern Covenant
  const runs: [string, string, number, number][] = [];
  for (const cls of CLASS_IDS) for (const seed of [5, 23]) runs.push(['human', cls, seed, 2]);
  const dungeons = { tried: 0, cleared: 0 };
  const special = { tried: 0, cleared: 0 };
  for (const [race, cls, seed, lives] of runs) {
    const s = make(race, cls, seed);
    const tag = `${race} ${cls} seed ${seed}`;
    let minutes = 0;
    let rank10At = -1;
    console.log(tag);
    const policy: Policy = cls === 'rogue' ? { aim: 0.8 } : {};
    for (let life = 1; life <= lives; life++) {
      const c0 = { ...s.counts };
      const marks: string[] = [];
      const nov = noveltyTracker();
      for (let m = 1; m <= 25; m++) {
        for (let k = 0; k < 6; k++) { play(s, 10, 5, 0.25, policy); nov.sample(s, 10); }
        tidy(s); minutes++;
        if (rank10At < 0 && (s.classPaths.base?.rank ?? 0) >= 10) rank10At = minutes;
        if ([1, 5, 10, 25].includes(m)) marks.push(`${m}m:${s.life.stage}`);
      }
      // a dungeon at the player's own level, if a key is there
      if (s.keys > 0 && G.startDungeon(s)) {
        for (let w = 0; w < 10 && s.dungeon && !s.dungeon.done; w++) play(s, 30, 5);
        dungeons.tried++; if (s.dungeon?.cleared) dungeons.cleared++;
        G.leaveDungeon(s);
        if (s.dungeon) fail(`${tag} life ${life}: could not leave the dungeon`);
      }
      const stage = s.life.stage;
      loopCheck(cls, `${tag} life ${life}`, c0, s.counts);
      if (life === 1) (lifeOne[cls] ??= []).push(stage);
      if (life === 1 && !inRange(stage, TARGET.life1Stall)) fail(`${tag}: life 1 ends at stage ${stage}, target ${TARGET.life1Stall.join(' to ')}`);
      G.tithe(s); // run 4: give the leftover gold to the Bell before falling
      if (!G.die(s) || !s.escape) { fail(`${tag} life ${life}: could not fall (stage ${s.life.stage}, max ${s.life.maxStage}, dungeon ${!!s.dungeon})`); break; }
      const e = s.escape;
      // run 5: trace the gate (where the spare seconds come from)
      let gateLeft = -1, gateHp = 0, gateT = 0;
      for (let tt = 0; tt < ESCAPE_SECONDS * 1.6 && !e.done; tt += 0.5) {
        play(s, 0.5, 5);
        if (e.foe.boss && gateLeft < 0) { gateLeft = e.timeLeft; gateHp = B.ratio(e.foe.max, e.unit); }
        if (gateLeft >= 0 && !e.done) gateT += 0.5;
      }
      console.log(`  gate ${tag} life ${life}: started with ${gateLeft.toFixed(0)} s left, ${gateHp.toFixed(0)} s of damage, fought ${gateT.toFixed(0)} s, killed ${e.killed}, nudged x${(e.gateScale ?? 1).toFixed(2)}, special ${e.special}`);
      const left = Math.round(e.timeLeft);
      if (e.special) { special.tried++; if (e.cleared) special.cleared++; }
      else if (!e.cleared) fail(`${tag} life ${life}: normal escape not cleared (killed ${e.killed}/${ESCAPE_FOES})`);
      else if (life === 1 && !inRange(left, TARGET.escapeLeft)) fail(`${tag} life 1: ${left} s left at the gate, target ${TARGET.escapeLeft.join(' to ')}`);
      else if (life > 1 && !inRange(left, TARGET.escapeLeft)) fail(`${tag} life ${life}: ${left} s left at the gate, target ${TARGET.escapeLeft.join(' to ')} (every escape tight)`);
      if (e.special && e.cleared && !inRange(left, [TARGET.escapeLeft[0], TARGET.escapeLeft[1] * SPECIAL_LEFT_MULT])) fail(`${tag} life ${life}: special escape left ${left} s, target ${TARGET.escapeLeft[0]} to ${TARGET.escapeLeft[1] * SPECIAL_LEFT_MULT}`);
      while (s.pending.length) G.choose(s, s.pending[0].choices[0]);
      G.returnToLife(s);
      spendEmbers(s);
      const xl = G.xpLevel(s.xp);
      const nv = nov.report();
      const novLine = `after 100: ${nv.deepMin} min, longest with nothing new ${nv.worstGapMin} min | lands ${nv.lands}, most time in one land ${nv.maxLandMin} min`;
      if (TARGET.noveltyBinding && nv.deepMin > 0 && nv.worstGapMin > TARGET.noveltyGapMaxMin) fail(`${tag} life ${life}: ${nv.worstGapMin} min with nothing new after stage 100, target at most ${TARGET.noveltyGapMaxMin}`);
      console.log(`  life ${life}: ${marks.join(' ')} | ${novLine}`);
      console.log(`  life ${life}: escape ${e.special ? 'special ' : ''}${e.cleared ? `cleared, ${left} s left` : `failed ${e.killed}/${ESCAPE_FOES}`} | XP level ${xl} | relics ${G.relicsOwnedCount(s)} | rank ${s.classPaths.base?.rank}`);
      if (life < TARGET.raceTreeFullNotBeforeLife && xl >= 91) fail(`${tag}: race tree full (XP level ${xl}) in life ${life}`);
    }
    if (rank10At < 0 || !inRange(rank10At, TARGET.rank10Min)) fail(`${tag}: base class rank 10 at ${rank10At < 0 ? 'never' : `${rank10At} min`}, target ${TARGET.rank10Min.join(' to ')} min`);
  }
  console.log(`dungeons cleared ${dungeons.cleared}/${dungeons.tried}; special escapes cleared ${special.cleared}/${special.tried}`);
  // run 5: no class far from the others at the end of life 1 (median of each class within 30% of the median of the five)
  const med = (a: number[]) => { const b = [...a].sort((x, y) => x - y); return b.length % 2 ? b[(b.length - 1) / 2] : (b[b.length / 2 - 1] + b[b.length / 2]) / 2; };
  const per = CLASS_IDS.map((c) => med(lifeOne[c] ?? [0]));
  const mid = med(per);
  console.log(`  life 1 end stage by class: ${CLASS_IDS.map((c, i) => `${c} ${per[i]}`).join(', ')} (median ${mid})`);
  CLASS_IDS.forEach((c, i) => { if (Math.abs(per[i] - mid) > 0.3 * mid) fail(`run 5: ${c} ends life 1 at stage ${per[i]}, more than 30% from the median ${mid}`); });
  if (dungeons.tried && dungeons.cleared / dungeons.tried < TARGET.dungeonClearRate) fail(`dungeons cleared ${dungeons.cleared}/${dungeons.tried}, target at least ${TARGET.dungeonClearRate * 100} %`);
  if (special.tried && special.cleared === 0) fail(`special escapes cleared 0/${special.tried}`);
  paceDone = true;
}, 3_600_000);

// Run 4, item 0 (Codex): does active play beat "buy the cheapest Named and wait"? Three players from the stage-100 save, 8 minutes each (20 ran everyone into the stage-250 Bishop wall).
it('run 4: waiter, active and idle players from the stage-100 save', () => {
  const start = G.deserialize(readFileSync('samples/playtest/start-95.json', 'utf8'));
  const players: [string, number, Policy][] = [['waiter', 5, {}], ['active', 5, { aim: 0.8, choices: true }], ['idle', 1, {}]];
  const res: Record<string, { stage: number; gold: number; fails: number; bosses: number; used: string }> = {};
  // three seeds each: one run is too noisy (gear drops decide a lot); the results below are the averages
  for (const [name, taps, policy] of players) for (const k of [0, 1, 2]) {
    const s = G.deserialize(G.serialize(start));
    s.seed = (s.seed + k * 7919) | 0; s.r4Seed = (start.seed * 13 + 5 + k * 104729) | 0;
    const b0 = s.counts.bosses ?? 0, h0 = s.counts.hunts ?? 0, w0 = s.counts.weakHits ?? 0, e0 = s.counts.elites ?? 0;
    let fails = 0;
    for (let m = 0; m < 8; m++) {
      for (let k = 0; k < 60; k++) {
        const fb = s.life.bossFails;
        play(s, 1, taps, 0.25, policy);
        if (s.life.bossFails > fb) fails++;
      }
      tidy(s);
    }
    const gold = s.counts.gold ?? 0;
    const used = 'hunts ' + ((s.counts.hunts ?? 0) - h0) + ', weak hits ' + ((s.counts.weakHits ?? 0) - w0) + ', elites ' + ((s.counts.elites ?? 0) - e0) + ', shrines ' + (s.life.offered ?? []).length;
    const r = res[name] ??= { stage: 0, gold: 0, fails: 0, bosses: 0, used: '' };
    r.stage += s.life.stage / 3; r.gold += gold / 3; r.fails += fails; r.bosses += (s.counts.bosses ?? 0) - b0; r.used += (r.used ? ' / ' : '') + used;
    console.log('  run 4 ' + name + ' #' + k + ': stage ' + start.life.stage + ' -> ' + s.life.stage + ', lifetime gold 1e' + gold.toFixed(1) + ', boss fails ' + fails + ' | ' + used);
  }
  for (const n of Object.keys(res)) console.log('  run 4 ' + n + ' average: stage ' + res[n].stage.toFixed(0) + ', gold 1e' + res[n].gold.toFixed(1));
  const gain = (n: string) => Math.round(res[n].stage - start.life.stage);
  // run 5: one stage-100 save and gear luck make this comparison noisy (it has gone both ways); only require active play is never clearly worse
  if (gain('active') < gain('waiter') * 0.9 && res.active.gold < res.waiter.gold) fail('run 4: active play gains ' + gain('active') + ' stages vs waiter ' + gain('waiter') + ' (gold 1e' + res.active.gold.toFixed(2) + ' vs 1e' + res.waiter.gold.toFixed(2) + '); target: not clearly worse');
  if (gain('idle') < 3) fail('run 4: an idle player stalls (' + gain('idle') + ' stages in 8 min)');
  for (const n of Object.keys(res)) { const all = res[n].bosses + res[n].fails; if (all > 0 && res[n].fails / all > 0.5) fail('run 4: ' + n + ' fails ' + res[n].fails + ' of ' + all + ' boss fights after stage 100 (target at most half)'); }
}, 1_800_000);

// Run 5: transformations must help every class the same; and the Ranger still plays with nobody tapping.
it('run 5: every class with every transformation, and the Ranger with no taps', () => {
  const FORM_IDS = ['mortal', 'vampire', 'werewolf', 'draconic', 'undead', 'elemental'];
  const rows: string[] = [];
  for (const cls of CLASS_IDS) {
    const base = make('human', cls, 11);
    for (let m = 0; m < 6 && base.life.stage < 100; m++) { play(base, 60, 5, 0.25, cls === 'rogue' ? { aim: 0.8 } : {}); tidy(base); }
    const snap = G.serialize(base);
    const res: Record<string, number> = {};
    for (const f of FORM_IDS) {
      const s = G.deserialize(snap);
      s.forms = f === 'mortal' ? [] : [f]; s.hero.form = f;
      const from = s.life.stage;
      for (let m = 0; m < 6; m++) { play(s, 60, 5, 0.25, cls === 'rogue' ? { aim: 0.8 } : {}); tidy(s); }
      res[f] = s.life.stage - from;
    }
    rows.push(`${cls}: ${FORM_IDS.map((f) => `${f} +${res[f]}`).join(', ')}`);
    for (const f of FORM_IDS) if (res.mortal > 0 && res[f] > res.mortal * 1.75) fail(`run 5: ${cls} with ${f} gains ${res[f]} stages vs ${res.mortal} as Mortal (more than 75% better)`);
  }
  console.log('  forms (stages gained in 6 min after the first 6):\n  ' + rows.join('\n  '));
  const r = make('human', 'ranger', 5);
  for (let m = 0; m < 25 && r.life.stage < 26; m++) { play(r, 60, 0); tidy(r); }
  console.log(`  ranger with no taps: stage ${r.life.stage} in 25 min`);
  if (r.life.stage < 26) fail(`run 5: the Ranger with no taps stalls at stage ${r.life.stage} (target 26 in 25 min)`);
}, 3_600_000);

it('pacing gate', () => {
  if (!paceDone) fail('the pace run did not finish (crashed); see above');
  console.log(failures.length ? `GATE FAILED (${failures.length}):\n${failures.join('\n')}` : 'GATE PASSED');
  expect(failures).toEqual([]);
});
