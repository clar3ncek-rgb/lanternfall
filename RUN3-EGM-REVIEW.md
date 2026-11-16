# RUN3 EGM Goldfish Review: RUN3-PLAN-v1-draft.md

**Target:** `C:\AI Workspace\Hobby\Unwritten Tapper\RUN3-PLAN-v1-draft.md` (100 ideas, top 20, build rounds)
**Code root:** `C:\AI Workspace\Hobby\Unwritten Tapper\`
**Reviewers (all haiku):** egm-zoom-out, egm-design, egm-codebase-details, egm-implementation-readiness, egm-comprehension
**Scope note:** Owner decisions (four content areas; a new land every 50 stages from 101 to 500, cycling after; lore hidden until approved; 15-tester AI gate; owner approves a top 20) were treated as fixed. Only the land count inside those decisions is flagged, because the plan contradicts itself on it.

Findings below are merged and de-duplicated across the five reviewers. Where two or more reviewers independently found the same thing, that is noted as "(x N reviewers)". Code facts were checked by the reviewers against file:line; I did not re-open each file myself.

---

## 1. Agreed strengths

- **The facts in the opening section mostly check out.** ZONES has 5 entries with the listed names, foes and boss (`src/rules/data.ts:265-271`). `BISHOP_EVERY = 50` (`data.ts:272`). `KILLS_PER_STAGE = 8` (`game.ts:21`). Escape is 300 s and 24 foes (`data.ts:289-290`). Boss clock is 30 s, plus 5 s on land 1 (`game.ts:682, 1065-1066`). Auto-buy is at 10 relics and off by default (`game.ts:2446`). Version 2.1 (`src/ui/patchnotes.ts:12`). (x 4 reviewers)
- **Land data path is cheap.** `zoneFor` is a linear scan (`data.ts:274-278`), and `SPECIAL_FOES` already has per-land index lists (`content.ts:821-828`). Adding lands as data is the right shape. (codebase-details, implementation-readiness)
- **Events as buffs is the right design.** The existing `Buff` type (`game.ts:83`) covers `goldBuff` and `allyBuff`/`critBuff`. (design, implementation-readiness)
- **Keeping events out of escape and dungeon matches the code** (`game.ts:1211, 1227`). (design)
- **Reuse of the existing gate and migration pattern is correct** (`scripts/ai/gate.mjs`, `??=` defaults in `migrate`). (implementation-readiness)
- **The "least sure" section is candid and useful.** (design, comprehension)
- **Budget math is right.** $28.54 spent + ~$11 gate = $39.54, under the $50 cap. (comprehension)
- **Strong individual ideas:** Idea 6 (land arrival card), Idea 97 (lore before any name ships), Idea 16 (the strongest boss idea, though it needs the immunity reuse below), Idea 75 (something new every 3 minutes, which addresses the top tester complaint), Idea 99 as the last gate, Ideas 2/3 (lands and cycling) once the schedule is fixed. (zoom-out, codebase-details)

---

## 2. Ranked required changes

### R1. Land schedule contradicts itself (Blocker, x 5 reviewers)

- **Evidence:** Idea 1 says "Eight new lands, one every 50 stages (101, 151 ... 451)". Idea 2 shrinks Beneath the Bell to 101-150 so the first new land starts at 151. Decision 5 says 8 new lands, 101 to 500. Beneath the Bell is `from: 101` today (`src/rules/data.ts:270`). Under Idea 2, starts 151, 201, 251, 301, 351, 401, 451 give **7** new lands inside 101-500; an eighth would start at 501, past the cap. Idea 71 says "lands 6 to 13" (8), and Idea 96 uses `?demo=land.7`. Round 1 builds both at once.
- **Proposed fix:** Clarence picks one before Round 1, and the plan gets one stage table (land number, start stage, name, keep or replace Beneath the Bell):
  - (a) Keep Beneath the Bell at 101-150 and build **7** new lands (151-451 starts), or
  - (b) Replace the 101-150 land and keep **8** new lands.
  Then fix Decision 5, Ideas 1, 2, 3, 71, 76, 77 and 96 to match. Art, backdrop and sim counts follow the choice.

### R2. Round 1 cannot ship distinct lands (Blocker)

- **Evidence:** Round 1 is "2, 1, 3, 6" (plan line 160). Ideas 4 (foe archetypes) and 5 (backdrops) are missing from it. `src/ui/pixel/backdrops.ts:233` has 5 `LAND_KINDS`, and `backdrops.ts:238` clamps with `Math.min(4, land)`, so land 5+ silently shows the bell backdrop. `zoneFor` (`data.ts:274-276`) returns the last zone forever, so the cycling in Idea 3 needs new code, not just data. Unmatched foe names fall to a hash-picked archetype (`foes.ts:228-229`).
- **Proposed fix:** Move 4 and 5 into Round 1, or make one parameterised land backdrop generator (`backdrops.ts:173-206` helpers) and treat it as one L item. Extend `BackdropKind`, `LAND_KINDS`, and remove the clamp (caller `view.ts:156`). Add a cyclic zone lookup for stage > 500, with a unit test.

### R3. Top 20 does not follow its stated rule (Major, x 4 reviewers)

- **Evidence:** The plan says "by score (impact x confidence / size), ties broken by testers' complaints". Scores included: 1 (5.0), 16 (5.0), 31 (5.0), 46 (7.5), 71, 72, 94 (6.0). Scores excluded: 74, 98, 57, 24, 34-36, 63, 65, 79, 81, 86-88, 95 (all 9.0), and 75, 37 (8.0). Score-7 and score-9 items are in or out without an override note.
- **Proposed fix:** Add a score column and either re-rank strictly by score, or write each override next to the item ("in despite score: owner decision 1 needs a real choice"). Use complaints only to break exact ties.

### R4. Top 20 has no real upgrade choice (Major, x 3 reviewers)

- **Evidence:** Owner decision 1 includes "real upgrade choices". The top 20 includes 46 (a gold sink), 52-54 (hints and toasts). Real choices 47, 48, 50 and 58 are all excluded. The "one upgrade track" complaint (6 of 15 testers) is unanswered.
- **Proposed fix:** Add 48 (Train branch choice) to the top 20, with an explicit override note. See swaps below.

### R5. Pacing gate cannot see most of the top 20 (Major, x 2 reviewers)

- **Evidence:** Sim checks sit on 22, 40, 73, 74. None of them is in the top 20, while 1, 16, 31, 46 are. The bot never buys Forge or event items, never fights gimmicks, and always takes `choices[0]` (`scripts/pace.sim.ts:29`; bot buys only Train and Named, `tests/helpers.ts:22-37`). Taps are fixed at 5/s (`pace.sim.ts:82`), with stage samples at minutes 1, 5, 10, 25 (`:84`). There is no per-minute "something new" metric and no minutes-per-land metric, which is the testers' top complaint. Idea 71 is not binding: the plan already says life 2 reaches 310-400, so "2 new lands per life" passes once the lands exist.
- **Proposed fix:** Put 22, 40, 74 into the top 20 as acceptance criteria for 16, 31, 46. Add a gate metric for max minutes in any one land and a pass/fail line for Idea 75. Make the bot sample pending choices and events, not only `choices[0]`. Randomise the choice pick.

### R6. Gold can buy the currency that only falling pays (Major, design)

- **Evidence:** Idea 51 is gold-to-Embers exchange; Idea 57 turns gold into boss seconds. Gold per kill is `foe.max x 0.09` (`game.ts:978, 248`); foe HP is `12 x 1.16^(stage-1)` (`game.ts:240-242`), so gold grows about 1.16 per stage. Embers from a fall grow about 1.09 per stage (`game.ts:266-270`), and gate relics, scars and respec (`game.ts:1652`). Late gold can buy Embers.
- **Proposed fix:** Cap the exchange per life (a fixed share of `previewEmbers(s)`, `game.ts:1652`). Cap oil at N seconds per boss. Make the bot buy each sink in the sim.

### R7. Enrage depends on a UI-only combo (Major, x 4 reviewers)

- **Evidence:** Idea 18 asks for "combo >= 10". Combo exists only in the UI (`src/ui/main.ts:725-754`, counted on real taps at 747, threshold shown from x5). The rules have no combo; `tap(s)` at `game.ts:890` takes no timestamp, and `rules/game.ts:1-3` forbids timers. Auto-tap damage runs in `tick` (`game.ts:1184-1187`) and never increments the UI combo, so auto-tap players never switch enrage off, and the sim cannot model it.
- **Proposed fix:** Either define combo in rules state, counted in `tick` beside `tapCounter` (so auto-tap counts), or replace the condition with a rules-side damage-per-second threshold. Drop Idea 18 if it is not needed for the top 20. Define "combo" in the glossary either way (taps within 0.7 s, per `main.ts:747-754`).

### R8. Adds and shield are under-sized; shield must reuse immunity (Major, x 2 reviewers)

- **Evidence:** A foe is a single slot (`game.ts:85-89`, `currentFoe` at 894), and `view.ts:14` takes one `FoeLook`. Adds (Idea 17) touch tap, damage, carry, tick and render: L, not M. Shield (Idea 16) can reuse `foe.immune` and `elementFactor` (`game.ts:709-716`; "Immune to X" hint `main.ts:1005`), so M is right, but the bot has no element-switch policy (`tapElement` is the gear enchant only, `game.ts:719-723`; `tests/helpers.ts:12-48`). Idea 27 (armoured) is the same mechanic and should fold into 16.
- **Proposed fix:** Re-score Adds as L. Make Shield a mid-fight `immune` set. Add a bot element-switch policy. Merge 17 and 28 (splitting) into one row.

### R9. Element and resistance systems overlap (Major, x 2 reviewers)

- **Evidence:** Random immunities already roll from stage 26, and a second from 101, plus a boss weakness guarantee (`game.ts:745-754`; `IMMUNE_FROM`/`TWO_IMMUNE_FROM` at `:43-44`). Immunity already has a damage floor since run 2 (`game.ts:711-713`). Ideas 8, 16 and 27 add three more resistance paths; Idea 27 is an immunity with no floor.
- **Proposed fix:** Pick one resistance model. Idea 8 should be an `immune` list per `ZONES` entry, read by `rollElements`, not a new element system. Any new immunity gets the floor and respects the boss-weakness rule.

### R10. Boss gimmicks are per land, but every stage has a boss (Major, implementation-readiness)

- **Evidence:** Each stage ends in a boss (`game.ts:1025-1033`, `startBoss` at 1073), and `plainFoe` uses the land boss name for every stage (`game.ts:740`). Idea 20 ("one gimmick per land boss") therefore means roughly 50 identical gimmick fights per land. The "same boss again and again" complaint (6 of 15 testers) stays unresolved.
- **Proposed fix:** Define a per-stage rule (e.g., gimmick when `stage % N === 0`, boss name rotates by stage hash) and sim-check the frequency. Name the gimmick table contents and say which gimmicks ship in Round 2 and which later.

### R11. Hollow Bishop cadence is already in code (Major, x 2 reviewers)

- **Evidence:** `plainFoe` already names every 50th stage the Hollow Bishop and doubles its HP (`game.ts:740, 245-246`). Idea 2 is therefore only the ZONES boundary change (`data.ts:265-271`). Making the Bishop the land-end boss at 150, 200 ... 500 (with two gimmicks per Idea 20) repeats the complaint.
- **Proposed fix:** Reframe Idea 2 as the ZONES change only. Keep Bishop at 100, 250, 400 (or as the existing cadence), and give other land ends unique bosses.

### R12. Lore gate is missing from the build order (Major, comprehension)

- **Evidence:** Decision 2 says names stay off until Clarence approves. Idea 6 (arrival card with lore) and Idea 1 (land names) are in Round 1. Round 0 lists "97 lore list" with no sign-off step. Names reach persisted strings: `say()` (`game.ts:228`), `s.events` (`game.ts:1012`), the wander message (`game.ts:1280`), and `ZONES` and `SPECIAL_FOES` (`data.ts:265-271`, `content.ts:821-827`).
- **Proposed fix:** Add "Gate 0: Clarence approves LORE-DRAFT.md; Round 1 does not start until then (or ships placeholder names with the flag on)." Add one approved-name set read by every name renderer and by `say()`. Acceptance: no unapproved name in a fresh save's log.

### R13. Save migration and save-version plan is missing (Major, x 3 reviewers)

- **Evidence:** Idea 93 has no field list and no version decision. `SAVE_VERSION` is 3 (`game.ts:20`); the loader refuses newer saves (`game.ts:2356`); migrate runs at `game.ts:2353-2419`, and the loader already fills defaults (`game.ts:2358-2395`). Fixtures cover v1-v3 only (`tests/old-saves.test.ts`, `tests/fixtures/save-v1/v2/v3.json`); `fixtures.sim.ts:1-2` says not to regenerate v1-v3. `State.events` already exists as the UI toast queue (`game.ts:203`, pushed 396-1265), so Idea 38 and Idea 93 collide with it. Gimmick state lives on foe and life (`game.ts:1073-1087, 1258-1274`) and must reset in `advanceStage` (1040), boss fail (1269) and `startBoss` (1073).
- **Proposed fix:** List every new field with its `??=` default. Rename the event log (e.g., `eventLog`). Bump to v4, add a v4 fixture via a new script, and add a v3 mid-boss fixture. Write one line on what a 2.1 build does with a 2.2 save. Idea 93 needs no new migration design beyond that.

### R14. Pending choices freeze the idle loop (Major, design)

- **Evidence:** `tick` returns early when `s.pending.length` is set (`game.ts:1153`), so Named DPS and the boss clock stop. Ideas 47, 48, 50 would normally go through `pending`.
- **Proposed fix:** Store upgrade choices as a flag, like `formOffered` (`game.ts:2390`), not as a modal pending. Have the sim pick options at random.

### R15. Events are too big (Major, x 2 reviewers)

- **Evidence:** Fifteen event ideas (31-45). Ideas 42 (seasonal), 38 (event log), 41 (event achievements), 43 (omen; daily tasks already exist, `game.ts:1966`), 45 (lore collectible, new collection system), and 36 (Night of Names is just `allyBuff`, `data.ts:102`) add weight without value. Idea 31 duplicates `Ferryman's Toll` `goldBuff` (`content.ts:381`) and `Call the Named` `allyBuff` (`content.ts:384`). Idea 33 (weekly realm modifier) should reuse `weekIndex` (`game.ts:1954`) or `dayIndex` (`game.ts:1952`), not the device clock.
- **Proposed fix:** Cut 42, 38, 41, 43, 45, 36. Build events as an event table in Idea 31 with Eclipse = `critBuff`, Bell Toll = `goldBuff`. Fold 33 into that table.

### R16. Duplicates of features the game already has (Major, x 4 reviewers)

Each row: existing code, then the fix.

| Idea | Already exists | Fix |
|---|---|---|
| 46 Forge | Merge already raises `plus` up to `MAX_PLUS` 5 (`game.ts:288, 2209-2217`; "Merge all" `main.ts:1244`) | Reframe as "merge costs gold" (S). Drop Forge tab (88); treat the sink in 74 as the merge cost. Merge is set-only (`game.ts:2204-2206`), so if a real Forge is kept, extend `mergeTarget` (M+) |
| 35 Lantern procession | Fairies (wisps) with marks reward (`game.ts:1210-1224`; tap `main.ts:431-433`; `content.ts:814-819`) | Cut |
| 34 Gold rush | Treasure foes and `treasureNext` flag (`game.ts:777, 988`) | Fold into 31 as a table row |
| 9, 10 Per-land treasure and wanderer foes | `SPECIAL_FOES` already has `lands` (`content.ts:821-828`; `specialName` `game.ts:758-762`) | Make them data rows in Idea 1. Note that `specialName` falls back silently if a land has none. Tests `content.test.ts:50-51` assert exactly 3 treasure and 3 wanderer, so update the test |
| 8 Element theme per land | See R9 | Per-land `immune` list |
| 12 and 97 | Duplicate | Merge into 97 |
| 13, 41, 67 achievements | `ACHIEVEMENTS` (`content.ts:726`); test asserts length 30 (`content.test.ts:44`) | Merge into 67; update that test count |
| 84 reduce motion | `prefs.motion` (`main.ts:84-91`, `style.css:413`) | Extend, do not add |
| 11, 85 sound | `prefs.sound` | Extend |
| 61 next-land goal | Next line already shows next zone (`game.ts:2433-2434`; `main.ts:1077`); Welcome back (`main.ts:617`) | Real gap: zone goal disappears after stage 101. Fold into Idea 1 |
| 86 long-press boss | Long-press exists (`main.ts:560-585`) | Merge with 21 (one tell) |
| 21, 23, 78, 86 | Four tells for one gimmick | Keep 21 |
| 32, 87 | Both event chips | Keep 32 |
| 7 and 89 | Same land map strip | Merge |
| 30, 68, 92 | Boss gallery, codex, glossary overlap | Keep one menu page |
| 54 "Train 25" milestone | Does not exist; milestones are Named levels 10/25/50/100/200/400/800 (`content.ts:793-802`) and a chest every 25 stages (`content.ts:809`) | Correct the example |
| 50 level-200 specialisation | Fixed level-200 perk per Named (`content.ts:777-802`) | Say it replaces those perks |
| 52, 53 | `floatText` exists (`main.ts:764`) | Extend |

### R17. Save-breaking or sim-breaking item: Idea 96 demo (Minor, codebase-details)

- **Evidence:** `?demo=land.7` will not work. The demo parser takes a Tab name (`src/ui/main.ts:1949-1952`; Tab type `:355`). Needs a new branch in `demoState` (`main.ts:1949-1966`).
- **Proposed fix:** Add a land branch to `demoState`, estimated as S.

### R18. Sizing: art and sim are under-estimated (Major, x 3 reviewers)

- **Art:** Idea 81 (icons) rated S, but `ICON_BRIEF.md:3` requires every icon hand-drawn, one each. Re-score M or L. Idea 5 (M per land) and Idea 76 (8 backdrops, L) are the same work; each backdrop is 25-45 lines of canvas code (`backdrops.ts:113-228`) plus an ambient case (`backdrops.ts:250ff`). Re-score as one L item with one landmark per land, roughly one session per two lands with screenshot review (`scripts/shots.mjs`). Recolour does not help because backdrops have no palette.
- **Foe archetypes:** Idea 4 says one new archetype per land (8). Idea 77 says 4 (drowned, rooted, ash, bell-bound). Drowned, bell-bound and rootmother already exist (`foes.ts:201-202, 189, 95`); ashwarden is boss-only (`foes.ts:186`). Only rooted and ash are new. Fix: Idea 77 = 2 new kinds. Keep the keyword rule in mind (`foes.ts:210-227`), because misses fall to hash art. Each archetype gives one a/b frame pair (`foes.ts:11, 236-247`), so count frames, not archetypes.
- **Pacing and test budget:** `pace.sim.ts` targets are fixed numbers (10-16), and the test has a 60-minute timeout (`:116`). Gimmicks and events will shift boss time and pace, so the gate will fail on the first run and there is no re-baseline rule. `rand()` uses one shared seed (`game.ts:219-221`), so any new `rand` call in `tick` or `makeFoe` changes every seeded result. Give events a separate RNG stream. `helpers.ts` `play()` knows no gimmick or event. Budget the helper extension and a re-baseline step.
- **Test changes not budgeted:** `tests/content.test.ts:50-51` (treasure and wanderer counts, Ideas 9, 10); `:44` (achievement count, 13, 41, 67). `npm test` runs 132 `it(` calls across 11 files in `tests\**\*.test.ts` (`vite.config.ts:6`), confirmed by a reviewer. The 29 smoke checks are in `scripts/smoke.mjs`.

### R19. Gold sinks and income are not reconciled (Major, design)

- **Evidence:** Idea 55 wants less gold piling up, while line 24 says costs outrun gold (7 of 15 testers). Income is exponential (`game.ts:978, 240-242`), Train costs grow 1.07 per level (`game.ts:251`), Named 1.075 (`game.ts:259`). Sinks fall behind as depth grows. The Forge "grows with depth" (plan line 89) gives no growth rate.
- **Proposed fix:** State a target gold-to-cost ratio per stage band. Give the Forge a cost exponent of at least 1.16 per stage, or say why not.

### R20. Testing risk in the budget (Major, implementation-readiness)

- **Evidence:** The AI gate at about $11 leaves $10.46 of the $50 cap (`$50 - $28.54 - $11`), less than a second full gate, so one failure is terminal. The gate has no pass rule: nothing says what is measured, what passes, or what happens on fail (Decision 4, Idea 99; "same personas as run 2" refers to a document not in the plan).
- **Proposed fix:** Add a 3-tester smoke gate (~$2) before the 15-tester gate. State a pass bar (e.g., at least N of 15 reach a new land, and the top complaints drop below X) and the fail action (fix round, re-gate).

### R21. Build order ordering errors (Major, x 3 reviewers)

- **Evidence:** Round 0 puts 71 (sim covers new content) and 72 (bot plays gimmicks and events) before the content they test. 71 needs lands 6-13 (Round 1); 72 needs gimmicks (Round 2) and events (Round 3) (plan line 159-162).
- **Proposed fix:** Move 71 to Round 1 and 72 to Round 2 (or 3). Keep only the sim baseline in Round 0.

### R22. Ambiguous or under-specified terms (Minor, x 2 reviewers)

- Glossary needed (10 lines at the top): life, fall, escape run, gate, candle clock, Named, Train, Marks, relics, realm, banner, Next line, wisps, treasure foe, wanderer, archetype, sim, bot, smoke run, crit, affix, Forge. The code defines Embers as "earned by escaping after a fall" (`src/ui/main.ts:193`), so use that wording. (comprehension)
- "Bell Toll" names two things: the boss toll in Idea 19 and the event in Idea 31; Idea 37 (Toll Collector) overlaps the event. Rename the boss toll ("Tolling") and say whether 37 is a foe, an event or a variant of 31. (comprehension)
- Foe archetype count: Idea 4 says 8, Idea 77 says 4; "bell-bound" is ambiguous with the land-5 "Bell-Bound" foe (`data.ts:270`). (comprehension)
- "Realm" is overloaded (weekly realm modifier in Idea 33, dungeon realms in Idea 70, death realms in lore). Rename the weekly one "weekly modifier". (comprehension)
- Land index base: code uses 0-based (`content.ts:825` `lands: [0, 1]`), plan uses 1-based. State the base wherever "land N" appears. (comprehension)
- Idea 28: "two halves at 25% HP each" is 50% total, which is easier, not harder. Clarify. (zoom-out, comprehension)
- Idea 3: "+1 gimmick" and the formula past stage 500 are undefined; the plan's own life numbers never reach 500. (implementation-readiness, comprehension)
- Idea 15 ("land-only gear look, no stats") and Idea 14 (Named glow) add art with no gameplay. Cut or justify. (zoom-out, comprehension)
- Idea 98 (frame under 16 ms): `smoke.mjs:118` checks under 34 ms average, not 16 ms. Use the existing check. Drop until a measured bottleneck exists. (implementation-readiness, zoom-out)
- Idea 100 (itch page) is a release task, not a mid-game idea. Move it out. (zoom-out)
- Idea 90 (events toggle) is only meaningful if 31 ships; make it conditional. (zoom-out)
- Idea 33 uses a seed from the device clock, which a player can change. Use `dayIndex` (`game.ts:1952`). (design)
- "Decision 2 cold open" and "Decision 3 EGM x MIB x 100, Elliot (Codex)" are undefined. (comprehension)

---

## 3. Suggested top-20 swaps

I did not reproduce the full top-20 list in my own pass, so these are the swaps the reviewers proposed, by idea number. Check each against the plan's list before applying.

| Out | In | Why |
|---|---|---|
| 46 (Forge as a sink, 7.5) | 48 (Train branch choice) | Owner decision 1 needs a real upgrade choice (R4) |
| 35 (Lantern procession) | nothing, cut | Duplicates fairies (R16) |
| 34 (Gold rush) | nothing, fold into 31 | Duplicates treasure foes (R16) |
| 72 (bot plays gimmicks and events) | 22, 40 and 74 (sim checks) | Pacing gate must see the top 20 (R5); move 72 to Round 2 |
| 52, 53, 54 (UI hints and toasts) | 47 or 58 (real choices) if swapping one slot | Hints are not choices (R4) |
| 2 (Bishop cadence, as a separate idea) | Idea 2 reframed as ZONES boundary only | Cadence already exists (R11) |
| 1 (lands) and 2 (Beneath the Bell shrink) | one merged row with the stage table | Land count contradiction (R1) |
| 73 or 74 (if not in top 20) | 75 (something new every 3 min) | Addresses the top tester complaint; pass/fail line for the gate |
| 99 (AI gate) | keep last, add 3-tester smoke gate | Budget (R20) |

Owner's call: whether 16 stays top 20 with the immune-reuse rewrite (R8) and whether a Forge stays at all (R16).

---

## 4. Facts in the plan that are wrong or unverified

1. **Land count.** Idea 1 says 8 new lands from 101; Idea 2 keeps Beneath the Bell at 101-150 (so 7 new). Wrong in one place. (R1)
2. **"Land 5 has the same 3 foes and one boss" (line 23).** Land 5 has two boss names: Echo of the Bishop is the land boss (`data.ts:270`), and The Hollow Bishop replaces it at multiples of 50 (`game.ts:740`, `BISHOP_EVERY` at `data.ts:272`). (codebase-details)
3. **"Pacing sim (5 builds)" (line 22).** `scripts/pace.sim.ts:70` runs 5 runs over 2 builds (elf rogue x3 seeds, troll cleric x2), 12 lives in total. (codebase-details)
4. **Life-end stage numbers (life 1 at 210-290, later lives at 310-400).** Not asserted anywhere; the gate only checks life 1 in 150-350 (`pace.sim.ts:11, 94`). Cite a run log or drop the numbers. (design, codebase-details)
5. **Idea 61 "next-land goal on the Next line" is already built** (`game.ts:2433-2434`, `main.ts:1077`). The real gap is Welcome back and the post-101 disappearance. (x 3)
6. **"Idea 96 `?demo=land.7`"** does not parse today (`main.ts:1949-1952`). (codebase-details)
7. **"8 backdrops" (Idea 76)** and "5 LAND_KINDS, clamp at 4" (`backdrops.ts:233, 238`): land 5+ shows the bell backdrop today. (x 3)
8. **Idea 77 "new archetypes: drowned, rooted, ash, bell-bound"**: drowned and bell-bound already exist (`foes.ts:201-202`); rootmother already exists (`foes.ts:189, 95`). (x 2)
9. **"16 to 24 sprites from 4 archetypes"**: each archetype gives an a/b frame pair, so 4 gives 8 frames. (codebase-details)
10. **Idea 54 "Train 25: taps x2" milestone**: does not exist. Real milestones are Named levels and chests (`content.ts:793-802, 809`). (x 2)
11. **Idea 98 "16 ms"**: the smoke check is under 34 ms average (`scripts/smoke.mjs:118`). (implementation-readiness)
12. **Idea 46 Forge as new** : merge already raises `plus` up to 5 (`game.ts:288, 2205`; `main.ts:158, 1244`). (x 2)
13. **Idea 81 icons rated S**: `ICON_BRIEF.md:3` requires hand-drawn icons, one each. (zoom-out)
14. **Combo as a rules-side feature (Ideas 18, 72)**: combo is UI-only (`main.ts:725-754`). (x 3)
15. **"Idea 9 one treasure foe per land" with no test change**: `tests/content.test.ts:50-51` asserts exactly 3. (codebase-details)
16. **"Idea 33 seed from device clock"**: should be `dayIndex` or `weekIndex`. (design)
17. **"Reduce motion" (Idea 84) as new**: `prefs.motion` exists (`main.ts:84, 91, 1535`) plus a CSS rule (`style.css:413`). (codebase-details)
18. **Immunity (Ideas 8, 16, 27) as new**: random immunities exist from stage 26 and 101, with a floor (`game.ts:711-713, 745-754`). (x 2)
19. **"Idea 61 zone goal on Next line"** (repeated above). Done.
20. **"Idea 93 save migration needs no version bump"**: not stated; `SAVE_VERSION` is 3 (`game.ts:20`); a v4 fixture is needed. (x 2)

Unverified by reviewers: runtime sim life-end stages and the "about 30 s" boss-clock timing; the "100 relics" escape claim (Idea reword needed).

---

## 5. Reviewer notes

- All five reviewers flagged R1 and R3. R1 needs an owner decision (7 or 8 new lands), not a reviewer fix.
- The goldfish reviews were read-only; nothing in the codebase or the plan was changed. Only this file was written.
- No Codex critique was used (not a controlled document, no live app code, no law or money claim beyond the budget arithmetic).
