# Run 3 plan: The Unwritten: Lanternfall, the mid-game (version 2, after the EGM review)

Draft 1: `RUN3-PLAN-v1-draft.md` (100 ideas). Review: `RUN3-EGM-REVIEW.md` (5 Haiku goldfish, 22 changes; nearly all taken, see the end).
Elliot (Codex): ACCEPT WITH CHANGES, all 5 taken (`.lavish/elliot-run3.md`). Next: Clarence approves this top 20.

## Clarence's decisions (11 Nov 2026)
1. Content: all four of new lands past stage 100, boss gimmicks, events, real upgrade choices.
2. Lore: Claude drafts names from The Unwritten's design log; everything stays hidden (placeholder names) until Clarence approves `LORE-DRAFT.md`.
3. Method: full EGM x MIB x 100 (done: draft 1 and the review).
4. Budget: API cap $50; spent $28.54. Planned: a 3-tester smoke test (about $2), then one 15-tester gate (about $11). Total about $41.50.
5. Depth: a land every 50 stages to 500; past 500 the lands cycle as "Deeper" versions.
6. He approves the top 20 before building.

## Words used here
- **Land**: a band of stages with its own foes, boss names, colours and backdrop (`ZONES` in `src/rules/data.ts`). Numbered from 1 here (code is 0-based).
- **Boss**: every stage ends with one, against the candle clock. **Gimmick boss**: a boss with a special rule (below).
- **Event**: a short timed happening during ordinary fighting (never in an escape or dungeon).
- **Sim / bot / gate**: `scripts/pace.sim.ts` plays 5 runs (elf rogue x3 seeds, troll cleric x2) for several lives with a scripted bot; the gate fails the build when targets are missed.

## The land table (Clarence: every 50 to 500)
| Land | Stages | Status |
|---|---|---|
| 1 to 4 | 1-100 | unchanged |
| 5 Beneath the Bell | 101-150 | today it runs forever; it now ends at 150 |
| 6 to 12 | 151, 201, 251, 301, 351, 401, 451 (each 50 stages) | **7 new lands**, names in `LORE-DRAFT.md` |
| Past 500 | 501 onward | lands 6 to 12 repeat as "Deeper: <name>", darker tint, foes x1.0 HP curve (no extra jump) |
The Hollow Bishop keeps guarding every 50th stage (already in code, `game.ts:740`), so he closes each land; each land also has its own bosses (item 8).

## Top 20 (version 2)
Score = impact x confidence / size. Overrides are named.

### Round 0: lore list, save v4 and measuring first
1. **Lore list and gate (#97, #12).** `LORE-DRAFT.md`: 7 land names, 21 foe names, 21 boss names, 7 arrival lines, 3 event names, weekly modifier names, all from the design log (bell, names taken from the dead, Hollow Bishop, death realms, Faith, Ashborn). Until approved, the game shows placeholder names ("Land 6", "Deep Foe") through one name table read by every renderer and by `say()`. *Done:* a fresh save's log has no unapproved name. **Gate 0: Clarence approves the list before Round 1 ships names.**
2. **Save version 4 (#93).** New fields with defaults: `eventLog` (not `events`, which is the toast queue), `trainPerks`, `forge` on non-set items (a separate field; `plus` stays for set merging only), gimmick state on the foe, and two new random seeds `eventSeed` and `gimmickSeed` with fixed v3 defaults that never touch the old `seed`. The weekly modifier is not saved; it is worked out from the week number. The v3 mid-boss fixture also checks gimmick restore, seed continuation and the weekly rollover. `SAVE_VERSION` 3 -> 4, a v4 fixture, a v3 mid-boss fixture, and one line on what a 2.1 build does with a 2.2 save (refuses it with the clear "newer version" message, run 2 item 1).
3. **Sim metrics before content (#71, #75 as metrics).** The gate prints and checks: minutes spent in any one land (max), minutes between "new things" (land, gimmick, event), and the lands reached per life. Baseline today; targets set after Round 1. Events and gimmicks use their own seeds (item 2), so old seeded results stay comparable. **Binding before the 15-tester gate:** after stage 100, no more than 4 minutes pass without something new (a land, a new boss name, a gimmick or an event).

### Round 1: the lands
4. **Seven new lands and the land table (#1, #2, #61 gap).** `ZONES` rows for lands 6 to 12 (3 foes, 3 boss names, colours, an `immune` theme, an arrival line). `zoneFor` and the Next line work past 101 (today the zone goal disappears after 101).
5. **Deeper cycling past 500 (#3).** A cyclic land lookup with a unit test; "Deeper:" prefix; darker tint.
6. **Backdrops (#5, #76; one L item).** One parameterised land backdrop generator with one landmark per land (for example a drowned bell tower, a root cathedral, an ash field); remove the `Math.min(4, land)` clamp in `backdrops.ts`. Screenshot review of all 7.
7. **Two new foe archetypes (#4, #77, corrected).** Drowned, bell-bound and root already exist; add **rooted** and **ash**, and map every new foe name to an archetype by keyword so none falls to hash art.
8. **Boss variety (new, from review R10).** Each land has 3 boss names; the stage's boss is picked by stage, so a land shows 3 bosses, not one boss 50 times. Arrival card the first time you reach a land (#6): name, one line, its immune element.
9. **Per-land treasure foe and wanderer (#9, #10)** as data rows in `SPECIAL_FOES`; update the content test counts.

### Round 2: gimmick bosses
10. **Gimmick bosses every 10th stage (#16, #20, #21, #27 folded).** Not on the Hollow Bishop's stages. Ship two gimmicks: **Shield** (at 50% health the boss becomes immune to your tap element for 10 s, reusing `foe.immune` and the 20% floor; your Named and pets keep hitting it at full damage, and the tell says so; there is no in-fight element switch, so wearing a weapon of another element beforehand is the player's choice) and **Tolling** (every 8 s the Named pause for 2 s; tapping the bell icon cancels it). A one-line tell under the boss name and on long-press. First win per gimmick: a one-off reward (#24).
11. **The bot plays gimmicks (#22, #72).** The bot relies on Named and pets during a Shield (no gear swap); tests cover: no other weapon, every element immune, a Named-only win. Every gimmick boss must be beatable in the sim at its stage; the gate checks it.

### Round 3: events
12. **Event table (#31, #34 folded, #33 folded).** Every 3 to 6 minutes of ordinary fighting: **Eclipse** (crit chance up, reuses `critBuff`), **Bell Toll** (gold x2 for 30 s, `goldBuff`), **Grave Rush** (5 treasure foes in a row). Never during escapes or dungeons. Own random stream.
13. **Event banner and chip (#32).** A banner when it starts and a small timer chip under the stage name; long-press explains it. A Settings toggle "Events" (#90), on by default.
14. **Weekly modifier (#33).** From `weekIndex` (not the device clock): one of 4 mild modifiers per week ("Fire week: +15% fire damage"), shown on Welcome back.
15. **Sim checks events (#40).** The gate must still pass with events on.

### Round 4: real upgrade choices
16. **Train branches (#48, override: owner decision 1).** Every 100 Train levels, choose one of two perks (more crit chance or more tap damage). Stored as a flag like `formOffered`, never as a blocking pending choice (the idle loop must not freeze). The sim picks at random.
17. **The Gold Forge (#46 reframed, #74).** Gold raises a worn non-set item's **forge level** (its own field, capped at 10, +4% of the item's stats per level, kept on salvage value; sets keep merging with `plus`). Cost grows at least 1.16x per stage of depth, so it stays a sink as gold grows. A Forge row inside the item popup, not a new tab. Sim-checked for runaway. Tests prove the Forge never touches set pieces and old +0 to +5 merge saves are unchanged.
18. **Show the gain (#53, #54 corrected).** Every buy floats "+X tap" or "+X Named/s"; Named milestones (levels 10, 25, 50...) say what they gave when they trigger.

### Round 5: test and ship
19. **Tests (#94, #95), built with each round:** save tests in Round 0, lands and cycling in Round 1, gimmicks in Round 2, events and seeds in Round 3, Train and Forge in Round 4. Round 5 runs the whole suite, smoke checks for one gimmick fight and one event, and demo screens for every land (a `land` branch in `demoState`, #96).
20. **Play-test gates (#99).** First a 3-tester smoke test (about $2). Then the 15-tester gate (about $11), same personas as run 2 (careless, curious, casual, speedrun, breaker x3). **Pass bar:** at most 5 of 15 say no; at least 10 of 15 meet at least three different new things after stage 100 (new land, new boss name, gimmick, event) and say whether the repetition came back; "same loop" after stage 100 is named in at most 5 runs (it was 10). To reach the middle in 180 steps, testers start from a prepared mid-game save (stage 95). **On fail:** one fix round and a re-test of the failing personas only, within the $50 cap.

## Next in line (not in the 20)
Adds and splitting bosses (#17, #28, now sized L), enrage (needs a rules-side tap rate), named formations (#47), relic focus (#58), a gold-to-Embers exchange capped per life (#51), a foe codex / boss gallery as one Menu page (#30, #68), 20 new achievements (#67), patch notes 2.2 (#91, done in Round 5 anyway).

## Cut or folded after review
- Cut: #35 lantern procession (duplicates wisps), #36 night of names (it is `allyBuff`), #38 event log as a UI page, #41, #42, #43, #45, #14, #15, #98, #100 (a release task).
- Folded: #34 into #31, #27 into #16, #12 into #97, #13/#41 into #67, #86/#23/#78 into #21, #7/#89 into one map strip (next in line), #84/#85/#11 extend the existing settings.
- Corrected facts: the sim is 5 runs over 2 builds; life-end stages come from the run-2 sim logs (`samples/playtest/sim-*.txt`); the Next line already shows the next land (the gap is after 101); "Train 25" milestones do not exist (Named milestones do); drowned, bell-bound and root archetypes already exist; merge already raises `plus` for set pieces; reduce-motion already exists.

## Least sure
- Backdrops for 7 lands drawn in code is the biggest job; if a land looks weak in the screenshots, it ships with a recoloured backdrop and a later fix.
- Shield on every 10th boss may feel punishing for single-element builds; the 20% floor and Named damage keep it beatable, and the sim checks it.
- Events every 3 to 6 minutes may be too often for a calm idle game; the toggle and the gate decide.
