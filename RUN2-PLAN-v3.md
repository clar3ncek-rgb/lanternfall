# Run 2 plan (revised after review): The Unwritten: Lanternfall, launch-ready

Version 3, 10 Nov 2026 (after Elliot: ACCEPT WITH CHANGES, all 5 taken). Draft 1 (`RUN2-PLAN-v1-draft.md`) has the full list of 100 ideas. Five fresh reviewers on Haiku
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

## Top 20 (revised), in build order
Each item names its **done** condition, so it can be checked.

### Round 0: the safety net and the measuring stick (before anything that changes saves or balance)
1. **Never lose a save (new, Blocker).** Tell "no save" apart from "unreadable save". When the save is unreadable, copy the raw text to
   `unwritten-tapper-save.bad` before anything writes, and show "Your save could not be read: paste your code, or start new". The
   game never saves over an unreadable key; autosave stays off until a valid save is loaded or the player confirms "Start new".
   *Done (browser test, corrupt JSON and newer-version JSON):* the key is byte-identical after a timer tick and `pagehide`; `.bad`
   holds the exact original text; the recovery screen shows, and still shows after reload; importing a valid code works; only a
   confirmed "Start new" lets a new save be written.
2. **Crash catcher (#73, rewritten).** Add a window `error` and `unhandledrejection` handler, plus a try/catch in `frame()`. On a crash,
   show "Something broke" with the raw save text in a box, a Copy button and a Reload button. A test hook `?crash=1` triggers it. *Done:* the hook shows the screen.
3. **Old-save fixtures (#71).** Frozen v1, v2 and v3 JSON files in `tests/fixtures`, each with the expected result (v1 and v2 reset
   class tiers and forms), plus the "newer version" refusal. *Done:* 4 new tests pass.
4. **Sim as a gate (#99, with the cheap part of #20).**
   - Fix "/25" and read the escape length from the constants.
   - Add a dungeon run.
   - Add assertions:
     - life 1 stalls between stage 150 and 350
     - a steady tapper has 15 to 30 s left at the escape gate, without freeze
     - a no-upgrade player at 5 taps a second kills the stage-1 boss (72 HP, 30 s); the stage-5 boss falls after at most 2 hero levels
     - base class rank 10 comes at 20 to 40 min
     - dungeon: a player at their best stage clears 9 foes and the boss in 180 s at least half the time
   - runs the default Elf Rogue plus the slowest build (the lowest-damage race and class) on 3 fixed seeds; prints the seed and the failed line
   - special escapes (budgets x1.5) are checked on their own
   - *Done:* `npm run sim` passes, or fails with a named line.
5. **Release check (#76), with a browser smoke suite.** An `npm run release` script:
   - runs a real-browser suite (Playwright, already installed): corrupt-save recovery, newer-save refusal, quick start, guided
     steps, locked-tab feedback, the crash hook, export and import, reload keeps progress
   - loads a stage-250, life-4 save and checks the log and events lists stay bounded and a frame stays under an agreed time
   - builds
   - makes the single-file game
   - zips it with forward-slash paths
   - fails if `phone.html`, `tall.html`, `ph.html` or demo files are inside
   - prints the size
   *Done:* the script produces both files and passes.

### Round 1: the first ten minutes
6. **Guided start (#1, now an extension of `hint()`, with #5 and #6 folded in).**
   - Six steps, each a predicate on state: tap 8; buy a hero level; hire the first Named; beat a boss; spend a class point; claim a quest.
   - The step and its tab glow come from `hint()`; no new screen.
   - The creation screen gets a **Begin now** button that keeps the defaults (Elf Rogue).
   - *Done:* a unit-tested `firstRunStep(state)`, and screenshots of the 6 steps.
7. **Locked tabs dimmed, not hidden (#2, changed after review).**
   - Pets, Gear and Death stay visible, dimmed, until they first matter: Pets at the first egg or pet, Gear at the first drop, Death at stage 20.
   - Tapping a dimmed tab says when it opens.
   - Saves that already have progress see every tab.
   - *Done:* a pure `tabOpen(state, tab)` function with a test table.
8. **Play-test gate (new, replaces old item 8, now folded into item 4).**
   - Every round: the AI testers (Clarence's approved API jobs j1 and j2) play the new build on a phone-sized browser and report.
   - Before item 20: at least 3 first-time people on a phone (only Clarence can arrange this). Record time to first tap, first
     upgrade and first boss, and after 60 s ask what the goal is.
   - *Pass:* no blocker open; every blocker found is fixed and re-tested.
9. **Teach long-press once (#8).**
   - After the guided start, one toast reads "Hold anything to see what it does".
   - Gear cells get long-press too (the only gap).
   - A shown-once flag sits in prefs.
10. **Glossary in Menu (#47).** The glossary above, written in plain words for players, on its own Menu page.

### Round 2: falling
11. **First fall card (#7).** The first time Fall is pressed, one picture card explains: fall, escape, Embers, relics, return stronger.
    The card has its own icon, the flag sits in prefs, and the card shows before the confirm.
12. **"Next relic" on the Fall card (#61).** "Fall now: about X Embers. Next relic needs Y more" (Y = `newRelicCost` minus the low estimate).
    The top of the range is corrected for special escapes.
13. **Escape tuned by one knob (#11, rewritten).** Change only the gate's seconds (`ESCAPE_GATE_SECONDS`, now 75) until the sim's
    steady tapper has 15 to 30 s left; foes and clock stay. Freeze stays legal. The 5 hard-coded copies of the escape length are
    replaced with the constant. *Done:* the sim assertion from item 4 passes.

### Round 3: coming back
14. **Welcome back shows what's next (#23, with #22).** Add the first goal from `comingUp()` (moved into rules as a tested function) and
    today's login reward. It also shows when gold earned is 0.
15. **Save reminder (#28).** After 60 minutes of play (a counter in prefs), one gentle card says "Copy your save code somewhere safe",
    with a Copy button. It shows once, then again every 10 hours of play.

### Round 4: the last two busy tabs
16. **Gear sub-tabs (#42 with #39).**
    - **Worn:** the doll and slots, with the set summary.
    - **Bag:** filter, NEW tags and compare arrows.
    - **Sets:** the set list.
    - It opens on Bag when there are new items, otherwise on Worn.
17. **Death sub-tabs (#44).**
    - **Fall:** the fall card, scars and heal.
    - **Relics.**
    - **Dungeon.**
    - During an escape or a dungeon it opens on Fall or Dungeon.
18. **One dot rule (#40).** One pure `badgeFor(tab, state)` function with a test table:
    - **Buy tabs** (Hero, Named, Pets) show a dot when something is affordable.
    - **Claim tabs** (Quests, Skills, Death) show a dot when something is ready to claim or spend.
    - **Sub-tab dots** use the claim rule.

### Round 5: the stranger test
19. **Fix what the play-test gate found (new).** Blockers and the top findings from item 8 (AI and human), each re-tested.

### Round 6: launch
20. **itch page refresh (#77).**
    - New shots from `?demo=` routes, plus a short GIF of the first minute.
    - Every number on the page is re-checked against the content files.
    - The zip and the single-file game come from item 5.
    - The page stays as it is on itch (Clarence uploads) until this round.

## Next in line (21 to 26; Clarence may swap any into the 20)
26. **Auto-buy (#62, one toggle, default off):** unlocks at 10 relics owned; once a second buys the cheapest affordable level with
    the Buy-max path; keeps 10 % of gold during a boss; sim-checked. Moved out by Elliot: comfort, not launch-readiness.
21. **Sound (#29), cut down:** 3 synthesized cues (tap, boss bell, loot chime). Default off; it starts on the first tap after
    being turned on. It is out of the 20 because no audio exists yet and the reviewers rated it risky.
22. **Auto-cast (#63):** one toggle, casting any ready spell when mana is full (`useSkill(free = false)` after `canUse`). It unlocks by XP level.
23. **Blind playtest (new):** 3 to 5 people try it on a phone, with a stopwatch on time to first boss and whether they can
    say the goal after 60 s. Only Clarence can arrange this; it is the only real test of "launch-ready".
24. **Hit-stop** on crits and boss kills (#31).
25. (Folded into item 5 by Elliot: performance and save-size check.) Free slot.

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
