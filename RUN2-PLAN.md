# Run 2 plan (revised after review): The Unwritten: Lanternfall, launch-ready

Version 4, 10 Nov 2026: Elliot's 5 changes taken, plus the results of the paid play-test and balance jobs (j1 to j4). Draft 1 (`RUN2-PLAN-v1-draft.md`) has the full list of 100 ideas. Five fresh reviewers on Haiku
(design, zoom-out, comprehension, readiness and code facts) read it. Claude merged their findings and wrote this version. Elliot
(Codex) checks it once next.

Clarence's decisions: focus on the whole game as a new itch.io player meets it; 100 ideas, of which he approves the top 20;
build round by round, shown in Lavish; nothing goes to itch until run 2 is done.

## Glossary (one word, one meaning)
- **Stage**: one step of the descent: 8 foes, then a boss with a candle clock.
- **Land**: a block of stages with its own backdrop and foes (land 1 = Lanternfall Graves; Shrine Antechamber starts at stage 76). The second land starts at stage 26.
- **Realm**: a place you reach by falling or with a dungeon key. Each realm has its own gate boss and set pieces.
- **Life**: the time from a fresh start, or from returning after a fall, to the next fall.
- **Fall**: choosing to die (Death tab, any time once you have reached stage 20). This starts an **escape**: 24 foes and a gate
  boss inside 300 s in a realm. Clearing it pays **Embers**. You then return to life with your relics.
- **Embers**: buy and level **relics** (100 relics; the first 9 "rites" are always owned).
- **Hero level**: bought with gold. **Named level**: each ally (a "Named") bought with gold.
- **XP level**: permanent, from kills. Gives **race points**.
- **Class rank/tier**: T1 to T7, 10 ranks each, from fighting. **Class points**: from quests, spent in Skills.
- **Transformation points**: from quests, spent in a form tree. **Pet level**: bought with **Marks**.
- **Spells**: 6 shared actives unlocked by XP level. **Skills**: class actives and passives.
- **Wall**: the stage where gold and damage stop carrying you forward. This is a feeling, not a rule; falling is always allowed.
- **Build round**: one step of building run 2. This is not the same as an escape run.
- Tools: **Lavish** is the local review page Clarence comments on. The **sim** is `scripts/pace.sim.ts` (`npm run sim`).

## The game today (corrected facts)
- Phone browser idle/tap RPG (TypeScript and Vite, no server). The save is one localStorage key written every 5 s; the `UT1:` code
  is the manual backup. 101 tests cover the rules only (there are no DOM tests).
- Tabs, all always visible at the bottom: Hero (Train/Stats/Rewards), Named, Gear, Skills (class/spells/race/form), Pets,
  Quests (Quest/Trials/Daily/Weekly), Death (dungeon, fall, relics, scars), Menu. A tab's page covers the fight; tapping it again closes it.
- **Already built, often missed:**
  - a one-tip-at-a-time guide (`hint()`), which makes the matching tab glow
  - a TAP coach for the first 8 taps
  - long-press details on most tiles, not on gear cells
  - the Welcome back screen
  - the login calendar (in Hero > Rewards)
  - the "Next" goals line (`comingUp()`)
  - patch notes
  - offline stage pushing from the Winter Sepulchre set (`offlinePush`, up to 25 % of the gap)
  - auto-cast on some skill-tree nodes
  - an auto-boss toggle
  - Buy x1/x10/Max
  - the Embers range on the Fall card (0.4x to 1.5x; a cleared special escape pays 2x, so the top is understated)
  - `?demo=` screenshot routes
  - the itch folder (zip, cover, 5 shots, ITCH_PAGE.md)
- **Known problems:**
  - **Data-loss bug (new, all reviewers):** if the save cannot be read, `load()` returns null, creation starts, and Begin
    overwrites the old save. A save from a newer build does the same.
  - There is no crash handler: an error in `frame()` freezes the screen.
  - Escape runs feel easy: the sim shows 60 to 85 s left, assuming 5 taps a second with no freeze. Freeze spells also stop the escape clock.
  - The race tree fills during life 2.
  - There is no sound.
  - The sim prints but asserts nothing, and it still shows "/25" foes (the real count is 24).
  - The escape clock (`ESCAPE_SECONDS = 300`) is shown as a literal "5 min"/300 in main.ts 125, 604, 1198, 1479 and the sim; the gate's HP budget is a separate number (`ESCAPE_GATE_SECONDS = 75`, seconds of estimated DPS).

## Ranking
Score = impact (1 to 5) x confidence (1 = guess, 2 = likely, 3 = shown by code, sim or playtest) / size (S = 1, M = 2, L = 3).
Items that draft 1 counted as new but that are partly built are scored on the **gap that remains**. Overrides are named with a reason.

## Play-test and balance results (10 Nov 2026, Clarence's API credit, $12.02 in total)
- **j1** (Sonnet, 500 steps, $1.91) and **j2** (careless first-timer, speed-runner and rule-breaker, 3 runs each, $7.00) all played a fresh game on a 390 x 844 browser.
  Reports are in `samples/playtest/*/report.md`. 13 of the 15 runs would not come back tomorrow. The reason is almost always one thing:
  **an open tab hides the fight and nobody found the way back.** Some lost 100 of their first 140 steps; one never left 5.2 gold.
  Clarence decided (10 Nov): **tab pages cover half the screen; a smaller fight stays visible and tappable above.**
- Other bugs seen in several runs:
  - popups need 2 to 6 taps to close (cause found: after a long-press, the next tap is swallowed by `longFired`)
  - the Salvage confirm ignores taps
  - toasts cover the Continue button
  - the login reward gives no feedback
  - the Pets and Trials tabs are empty, with no hint
  - blocked actions fail silently
  - "The The Sepulchre Keeper"
  - the gear compare shows a green + when tap damage drops
- **j4** (Opus, $3.05, the first 3 tries returned only thinking) read every rule. 3 blockers:
  - the boss clock can be paused forever (the winter set)
  - special escapes are unwinnable (436 s of work in 300 s)
  - overkill below your best stage skips bosses
  It also found exploits (sandbag DPS before falling, dungeon gold from the best stage, clock-change dailies) and pacing numbers:
  - foe seconds 9 → 8.5 leaves 21 s at the gate
  - XP exponent 1.7 → 2.0 makes the race tree fill in lives 3 to 4
  - compound rites dwarf every other Ember sink
  Every j4 claim is checked with the sim before any number changes. Report: `samples/playtest/j4/report.md`.
- **j3** ($0.06) drafted story and UI text (`samples/playtest/j3/text-drafts.md`). Some glossary lines are wrong (Marks, class points), so it needs a
  fact pass before Clarence reads it. Nothing goes into the game without his yes.

## Top 20 (version 4), in build order
Item specs carried over from version 3 are in `RUN2-PLAN-v3.md`.

### Round 0: safety net and measuring stick
1. Never lose a save (v3 item 1, with the browser-test done-condition).
2. Crash catcher (v3 item 2).
3. Old-save fixtures (v3 item 3).
4. Sim as a gate (v3 item 4), plus j4's gaps: spend points, claim quests and trials, buy relics, print escape time left.
5. Release check with the browser smoke suite (v3 item 5). The play-test robot (`scripts/ai/playtest.mjs`) is already built.

### Round 1: what the testers hit (biggest win)
6. **Half-cover tab pages** (Clarence, 10 Nov). The tab page takes the lower ~55 %. The fight shrinks above it and stays tappable.
   Spell row and candle stay visible. Tap the open tab again, or the page's grab bar, for the full fight.
   *Done:* a browser test taps the foe with every tab open, and screenshots of all 8 tabs.
7. **Popups close on the first tap.**
   - Fix the `longFired` swallow.
   - Tapping the dimmed backdrop closes a popup.
   - Fix the Salvage confirm.
   *Done:* a browser test: hold, Close, then the popup is gone after 1 tap.
8. **Toasts never cover buttons.** They sit at the top and wait while a popup with buttons is open.
9. **Every tap answers.**
   - Blocked buys and point spends shake and say what is missing ("Need 12 gold", "No race points").
   - The login reward shows Claimed or Next with a toast.
   - Empty Pets and Trials say how to get them.
10. **Small bugs:** "The The" in gate names; the gear compare shows per-stat arrows instead of one green +.

### Round 2: balance blockers and exploits (j4, each sim-checked first)
11. **The three blockers.**
    - The clock pause becomes "clock runs at half speed while buffed".
    - Special escapes get a 450 s clock.
    - An overkill chain that reaches 8 kills starts the boss.
12. **Exploits and pacing.**
    - Lock equip, pets and respec during escapes and dungeons, and size realms from the life's peak DPS.
    - Dungeon gold is based on the realm's own foes.
    - Dailies need 20 h of real elapsed time.
    - Escape foe seconds go to 8.5.
    - The XP exponent goes to 2.0.
    - Compound rites drop to 12 %.
    - Immune foes: taps deal a floor of 20 % instead of 0 (j4 finding 10; both Round 1 re-tests stalled at an immune foe near stage 26).
    Nothing ships unless the item 4 sim gate passes.
    **Sim first (Round 0 result):** escapes leave 68 to 239 s, not j4's 9 s; specials were cleared 4 of 5. Tune from the sim, not from j4's maths.

### Round 3: the first ten minutes and falling
13. Guided start built on `hint()`, with a **Begin now** button (v3 item 6). It now also says "Tap the foe" on the fight itself.
14. Locked tabs dimmed, not hidden (v3 item 7).
15. First-fall picture card (v3 item 11), using j3's text after Clarence approves it.
16. "Next relic" on the Fall card, with the range corrected (v3 item 12).

### Round 4: coming back
17. Welcome back shows the next goal and the login reward (v3 item 14).

### Round 5: the stranger test and launch
18. **Play-test gate** (v3 item 8).
    - The AI testers re-run after rounds 1 to 4. 13 of 15 would not come back; the target is at most 5 of 15.
    - Then 3 people on a phone, if Clarence can arrange it.
19. Fix what the gate found (v3 item 19).
20. itch page refresh, zip and single-file game from the release check (v3 item 20).

## Next in line
In order: teach long-press once · glossary page (j3 text after its fact pass) · save reminder · Gear sub-tabs · Death sub-tabs ·
one dot rule · sound (3 cues, default off) · auto-cast · hit-stop · auto-buy.

## Changed or dropped after review
- **#2 hide tabs:** now dims, so hint() and the badges never point at nothing.
- **#1 guided first run:** now builds on hint(), not a new system.
- **#11 escape:** numbers fixed. Draft 1's 22 foes, 240 s and gate x1.6 would fail by about 78 s.
- **#72 three rolling backups:** replaced by item 1 (the real loss path) plus the save reminder.
- **#21 offline stage clearing:** it already exists as `offlinePush`. Any change goes there, sim-checked. It stays in the backlog.
- **#84 hold-to-auto-tap:** dropped, because it would undercut Echo Hands, Bell Rope, Volley and Sky of Shafts.
- **#92 supporter code:** dropped. Save codes are an unsigned checksum, so any public code can be shared.
- **#25 "push" reminder:** renamed "tab-title badge"; there is no real push notification.
- **Rename the Death tab:** kept. "Death" and "fall" are the main game's words (Clarence's lore rule).

## Backlog
Ideas 21 to 100 from draft 1, rescored on the gap that remains, in the same order. They are not built in run 2.

## Least sure
- Whether 15 to 30 s left at the gate is the right feel; a playtest would tell.
- Auto-buy changes the tapper feel; it defaults off and unlocks late.
- Without a DOM test setup, screen checks in rounds 1 to 4 rest on screenshots, not tests.
