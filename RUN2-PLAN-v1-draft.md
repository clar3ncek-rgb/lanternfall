# Run 2 plan: The Unwritten: Lanternfall, launch-ready (draft for review)

Elephant draft by Claude, 10 Nov 2026. Method: EGM (goldfish reviewers on Haiku, merged by the synthesizer), then one check by
Elliot (Codex). Clarence's decisions: focus = the whole game as a new itch.io player meets it; 100 ranked ideas; he approves the
top 20, which are built round by round and shown in Lavish; nothing ships to itch until run 2 is done.

## The game today (facts, from the code)
- Phone browser idle/tap RPG, TypeScript + Vite, no server. Save in localStorage plus a `UT1:` code. 101 tests pass.
- Loop: tap the fight; 8 foes (`KILLS_PER_STAGE`) then a boss with a candle clock; Named allies earn DPS; gold buys hero levels
  and Named levels. At a wall you **fall** (Death tab, from stage 20): a 300 s escape run of 24 foes + a gate boss gives Embers,
  spent on 100 relics. Dungeons (keys, 9 foes + boss, 180 s) drop realm set pieces. Quests (100 + endless) give class and
  transformation points; XP level gives race points. Classes T1 to T7 by quest trials; forms (Vampire etc.) with hybrid caps.
- Layout B (10 Nov): the fight screen plus tabs at the bottom; a tab's page covers the fight; Hero/Quests/Skills have sub-tabs.
- 246 hand-drawn 32 px icons, pixel art fight view, candle boss clock, banners, loot beams, Welcome back, settings.
- Known problems: escape runs are easy (60 to 85 s left at the gate); the race tree (90 points) fills during life 2; no sound;
  no proper tutorial beyond tips; the first minutes show many systems at once; no offline progress for anything but gold.
- Pacing sim (4 lives x 25 min, steady tapper): life 1 stalls near stage 252; base class rank 10 at about 30 min; XP level 43
  after life 1, 100 after life 2.

## How ideas are ranked
Score = player impact (1 to 5) x confidence (1 to 3) / size (S=1, M=2, L=3). Ties go to what a **new** player meets first.
"Launch-ready" means: a stranger on itch.io understands it in 60 s, wants to come back tomorrow, and nothing breaks.

## The 100 ideas
### A. First 10 minutes (new player)
1. Guided first run: 6 short coached steps (tap, buy level, hire Named, beat boss, spend point, claim quest), each unlocking the next tab. Impact 5, conf 3, M.
2. Hide tabs until their system first matters (Pets after first egg, Death at stage 20, Gear at first drop); show an "unlocked" banner. 5, 3, S.
3. A 20-second cold open: the hero falls into the Lanternfall, one line of story, then TAP. 4, 2, S.
4. First boss tuned to be beaten on the first try, second to need one upgrade. 4, 3, S.
5. Character creation: a "Quick start" button that picks a balanced build. 3, 3, S.
6. Show the next goal as a single pinned line until quest 10 (no Next/Buy clutter early). 3, 2, S.
7. First fall forced-tutorial: explain Embers and relics with one picture card. 4, 3, S.
8. A "What does this do?" first long-press tip, so players learn long-press exists. 4, 3, S.
9. Starter pet given at quest 3 so Pets is not empty when it unlocks. 3, 3, S.
10. Make the first wisp guaranteed in minute 2 with an arrow. 2, 3, S.

### B. Balance and pacing
11. Escape runs harder: gate boss HP x1.6, 22 foes, 240 s, so a fresh fall ends with 15 to 30 s left. 4, 3, S.
12. Race tree pace: XP curve exponent up so the tree fills across lives 3 to 4. 3, 3, S.
13. Stage wall softening: a "bounty" boss every 25 stages that pays 3x gold to help past plateaus. 3, 2, S.
14. Hero vs Named balance check: neither path should be useless at stage 100 (sim both). 4, 2, M.
15. Relic cost curve review so relic 30 to 60 stays reachable by life 6. 3, 2, M.
16. Dungeon difficulty scales with best stage, not current stage. 3, 2, S.
17. Boss clock base +2 s in land 1 only. 2, 3, S.
18. Treasure foe rate up early (fun spikes), down late. 2, 2, S.
19. Cleave cap check so Berserker does not trivialise escapes. 3, 2, S.
20. Pacing sim covers escape runs and dungeons and prints a pass/fail table against targets. 3, 3, M.

### C. Coming back (retention)
21. Offline progress beyond gold: Named also clear stages while away (capped at 25 stages). 4, 2, M.
22. Daily login: a visible 7-day calendar with a bigger day-7 prize (already exists; surface it on Welcome back). 3, 3, S.
23. A "Next big unlock" line on Welcome back (e.g. "Assassin trial: 3 bosses left"). 4, 3, S.
24. Weekly rotating "realm event" (modifier for a week: +fire damage, double keys) without servers. 3, 2, M.
25. Push-style reminder via the page title "(!)" when a chest or egg is ready on return. 1, 2, S.
26. A short "while you were away" log of what the Named did (bosses beaten, loot). 3, 2, S.
27. Streak flame for consecutive days, small bonus. 2, 2, S.
28. Save reminder: after 1 hour of play, nudge to copy the save code once. 3, 3, S.

### D. Feel and juice
29. Sound: tap ticks, crit clang, boss bell, candle hiss, loot chime, with a mute toggle (off by default on first load? no: on, with a clear toggle). 5, 2, M.
30. Music: one quiet looping ambient track per land, off by default. 3, 2, M.
31. Hit-stop: 40 ms freeze on crits and boss kills. 3, 3, S.
32. Foe death animations per foe type (shatter, dissolve, flee). 3, 2, M.
33. Damage numbers that grow with combo, with element colour trails. 2, 3, S.
34. Candle clock: wax drips and the flame flickers faster under 10 s. 2, 3, S.
35. Level-up flash on the hero sprite and the Named who levelled. 2, 3, S.
36. Screen-edge vignette pulses red when a boss is about to escape (already in, tune). 1, 3, S.
37. Tab-open slide animation (page slides up 120 ms). 2, 3, S.
38. Haptics map documented and consistent (tick, thump, long buzz). 1, 3, S.

### E. Clarity and UI
39. Every number tile long-press explains it (done for Hero; extend to Named, Gear, Pets, Relics). 3, 3, S.
40. One consistent "ready" dot rule for tabs and sub-tabs (claimable only, not "affordable"). 3, 3, S.
41. Named tab: one line per Named like Skills rows (portrait, level, DPS, buy). 3, 3, M.
42. Gear tab: tidy like the other tabs (sub-tabs Equipped / Bag / Sets). 4, 3, M.
43. Pets tab: 3 "out" slots shown as a row at the top; list below. 3, 3, S.
44. Death tab: sub-tabs Fall / Relics / Dungeon. 4, 3, M.
45. Compare arrows on items (green up / red down) in the bag. 3, 3, S.
46. Big-number format setting (aa/ab vs scientific). 2, 3, S.
47. A glossary page in Menu (Embers, Marks, keys, scars, cleave, immune). 3, 3, S.
48. Colour-blind safe element markers (shape + colour). 2, 3, S.
49. Landscape/desktop layout: fight left, tab page right, for itch.io desktop players. 4, 2, M.
50. Tap target audit: every button at least 44 px. 3, 3, S.

### F. Content and depth
51. New foes per land: 4 new foe sprites per land (lands 2 to 5). 3, 2, L.
52. Land bosses with a gimmick (shield phase, adds, enrage). 4, 2, M.
53. Two more dungeon realms with their own set. 2, 2, M.
54. Named personal quests (each Named has a 3-step story quest). 3, 2, M.
55. Relic sets: owning 3 related relics gives a bonus. 2, 2, M.
56. Pet evolutions at level 25 (new sprite + stronger effect). 3, 2, M.
57. Weekly boss: a big boss once a week with a leaderboard-free personal best. 3, 2, M.
58. Lore pages unlocked by quests (short, fits the main game). 2, 2, S.
59. More endless quest variety (12 templates instead of 6). 2, 3, S.
60. Achievements: 20 more, including secret ones. 2, 3, S.

### G. Progression systems
61. Prestige preview: Death tab shows "fall now: X Embers, next relic in Y". 4, 3, S.
62. Auto-buy hero/Named after relic 10 (toggle). 4, 3, S.
63. Auto-cast spells after a quest unlock (toggle per spell). 4, 3, S.
64. Skill loadout presets (2 slots) for class points. 2, 2, M.
65. Respec cost curve: first respec free per life. 2, 2, S.
66. Tier trials show a progress bar on the fight screen when close. 2, 3, S.
67. Form hybrid explainer with a picture of caps. 2, 3, S.
68. Set bonus preview before equipping. 3, 3, S.
69. Key drop pity timer (a key at least every 3 bosses past stage 100). 2, 3, S.
70. Merge-all button for +1 to +5 items. 3, 3, S.

### H. Robustness and launch
71. Save versioning test: old saves (v1, v2, v3) load in a test. 4, 3, S.
72. Save backup: keep the last 3 autosaves; "restore" in Menu. 4, 3, S.
73. Error catcher: a crash shows "copy your save code" instead of a blank page. 4, 3, S.
74. Performance check on a low-end phone profile (60 fps fight, no leaks over 30 min). 4, 2, M.
75. Battery: lower frame rate when the tab is hidden or idle 60 s. 3, 3, S.
76. Single-file build check in CI script (zip contents, no phone.html, forward slashes). 3, 3, S.
77. itch.io page: GIF of the first minute, 5 fresh screenshots, short controls note. 4, 3, S.
78. Version number in Menu and in the save. 2, 3, S.
79. Privacy note: no tracking, no server (itch page and Menu). 2, 3, S.
80. A feedback link (itch comments) in Menu. 2, 3, S.

### I. Accessibility and comfort
81. Larger text setting covers every screen (audit). 2, 3, S.
82. Reduce motion covers candle, banners, shakes, loot beams (audit). 2, 3, S.
83. One-hand mode: all buttons in the lower 60 % of the screen. 2, 2, S.
84. Tap-and-hold to auto-tap at 6/s after relic 5 (comfort, not a cheat). 3, 2, S.
85. Contrast check for dim text (WCAG AA on body text). 2, 3, S.

### J. Story and identity (fits the main game)
86. The Lanternfall intro and an ending card at stage 1000 (first "credits"). 3, 2, S.
87. Named barks: one short line when hired or levelled to a milestone. 2, 2, S.
88. Realm flavour lines on the escape banner. 1, 3, S.
89. Hollow Bishop encounters every 50 stages get a line of dialogue. 2, 3, S.
90. Title screen with the logo and "Continue". 3, 3, S.

### K. Monetisation (free with tips, Clarence's choice)
91. A gentle tip-jar line in Menu linking to the itch page (no in-game purchases). 2, 3, S.
92. "Supporter" cosmetic: a lantern skin unlocked by a code shown on the itch download page. 1, 1, S.
93. Credits card naming Clarence as creator. 2, 3, S.

### L. Tooling and quality
94. A visual regression sheet: the demo screens auto-shot to `samples/` with one command. 3, 3, S.
95. Icon sheet check: fails if any id lacks an icon. 2, 3, S.
96. Patch notes generated for run 2 and shown once per update in game. 3, 3, S.
97. Split `main.ts` (1,600 lines) into screen modules for safer changes. 3, 2, M.
98. Unit tests for the candle, tab-open and sub-tab state. 2, 3, S.
99. Pacing targets written down as tests (fail if life 1 stalls before stage 150 or after 350). 3, 3, S.
100. A "debug" overlay (hidden) for stage jump and stats, for faster testing. 2, 3, S.

## Proposed top 20 (by score, then new-player order)
1, 2, 4, 7, 8, 11, 23, 61, 62, 63, 71, 72, 73, 28, 29, 42, 44, 39, 40, 77.

## Build order if approved
Round 1: 1, 2, 4, 8 (first minutes). Round 2: 7, 61, 11 (falling). Round 3: 62, 63, 23, 28. Round 4: 42, 44, 39, 40 (tabs).
Round 5: 71, 72, 73 (safety). Round 6: 29 (sound). Round 7: 77 (itch page), then the zip.

## Points I am least sure about
- Hiding tabs (2) could annoy returning players; maybe only for new saves.
- Sound (29) is a real lift with no audio assets; it would be synthesized (WebAudio), which may sound thin.
- Desktop layout (49) may matter more on itch.io than I rank it.
- Offline stage clearing (21) changes the economy and needs the sim.
- Auto-buy and auto-cast (62, 63) reduce tapping; idle players love them, but they cut the "tapper" feel.
