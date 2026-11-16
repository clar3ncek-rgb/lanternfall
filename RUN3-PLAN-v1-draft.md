# Run 3 plan: The Unwritten: Lanternfall, the mid-game (draft 1, for review)

Elephant draft by Claude, 11 Nov 2026. Method as run 2: EGM (Haiku goldfish reviewers, merged by the synthesizer), one Elliot (Codex)
check, then Clarence approves the top 20, built round by round with a Lavish report each round.

## Clarence's decisions (11 Nov 2026)
1. Content: **all four** of new lands past stage 100, boss gimmicks, events, real upgrade choices.
2. Lore: Claude drafts names and places from The Unwritten's design log; everything is marked DRAFT and stays off until Clarence approves the list (as with the cold open).
3. Method: full EGM x MIB x 100.
4. Budget: API cap $50 (spent $28.54); one 15-tester AI gate after building (about $11). The pacing sim is free.
5. Depth: **a new land every 50 stages, from 101 to 500** (8 new lands); past 500 the lands cycle as "deeper" versions.
6. Approval: Clarence approves the top 20 before anything is built.

## The game today (facts, from the code, version 2.1)
- Phone browser idle/tap RPG, TypeScript + Vite, no server. Rules in `src/rules/game.ts` (log10 big numbers), UI in `src/ui/main.ts`,
  pixel art drawn in code (`src/ui/pixel/foes.ts` builds foes from archetypes chosen by name keyword; `backdrops.ts` per land).
- Loop: 8 foes per stage (`KILLS_PER_STAGE`) then a boss with a candle clock (about 30 s; land 1 +5 s). Named (10 allies) deal DPS;
  gold buys Train (tap) levels and Named levels. Fall from stage 20: an escape run (24 foes + a gate, 300 s) pays Embers for 100 relics.
- **Lands (`ZONES` in `src/rules/data.ts`): only 5.** 1 Lanternfall Graves (1-25), 2 Blackroot Approach (26-50), 3 The Broken Causeway
  (51-75), 4 Shrine Antechamber (76-100), 5 Beneath the Bell (101 onward, **forever**). Each land: 3 foe names, 1 boss name, sky and ground colours.
  The Hollow Bishop guards every 50th stage (`BISHOP_EVERY`). Special foes: treasure foes per land, wandering bosses, fairies (wisps).
- Pacing sim (5 builds): life 1 ends at stage 210-290; later lives reach 310-400 within 25 min. So **most of every life is spent in land 5**
  with the same 3 foes and one boss: the testers' top complaint ("same loop, nothing new", 10 of 15 runs; "same boss again and again", 6 of 15).
- Other complaints: one upgrade track (6 of 15), costs outrunning gold (7 of 15), no clear goal (5 of 15).
- Spending today: gold -> Train and Named; Embers -> relics, scar healing, respec; Marks -> pet levels; class/race/form points -> trees.
  Gear drops from bosses; dungeons (keys) drop realm set pieces. Auto-buy exists (off, 10 relics).
- Tests: 132 unit tests, 29 browser smoke checks, the pacing sim gate (`npm run sim`), `npm run release`.
- Lore available (The Unwritten design log): Lanternfall's funeral bell beneath a sealed shrine; the dead rise with their names taken; the
  Hollow Bishop erases names with the stolen bell; Blackroot, the Causeway, the Shrine; death realms; Faith; the Ashborn (fire/curse,
  death-realm knowledge); scars; the smith, healer and alchemist of Lanternfall. Nothing in the log describes places below the Bell.

## How ideas are ranked
Score = player impact (1 to 5) x confidence (1 to 3) / size (S=1, M=2, L=3). Ties go to what fixes the testers' top complaints first.

## The 100 ideas

### A. New lands (stages 101 to 500)
1. Eight new lands, one every 50 stages (101, 151 ... 451), each with 3 foes, a land boss, sky/ground colours and a one-line arrival banner. 5, 3, L.
2. Land 5 "Beneath the Bell" shrinks to 101-150 so the first new land starts at 151; the Hollow Bishop's 50-stage cadence becomes each land's final boss. 4, 3, S.
3. Past stage 500, lands cycle as "Deeper: <land>" with darker tints and +1 gimmick, so no player hits a dead end. 4, 3, S.
4. Each new land gets one new foe archetype in `foes.ts` (not only recoloured existing ones). 4, 2, L.
5. Backdrop per new land in `backdrops.ts` (one landmark each: a drowned bell tower, a root cathedral, an ash field). 4, 2, M.
6. Land arrival card the first time you reach a land (name, one line of lore, its weakness hint). 4, 3, S.
7. A land map strip in the Hero tab: lands as beads, current one lit, next one's stage shown. 3, 3, S.
8. Each land has an element theme (e.g. a fire land, a cold land) so immunities and weaknesses change as you go deeper. 4, 2, M.
9. Land-specific treasure foe for every new land (extends `SPECIAL_FOES`). 2, 3, S.
10. Land-specific wandering boss for every new land. 3, 2, S.
11. Land music sting / sound cue on arrival (uses the existing synth, off unless Sound is on). 1, 3, S.
12. Foe names and lore lines drafted from the design log, all marked DRAFT until Clarence approves. 3, 3, S.
13. A "first time here" achievement per land. 2, 3, S.
14. Land-tinted Named attacks (the Named glow in the land's colour). 1, 3, S.
15. New lands each drop one land-only gear look (the item looks change with depth). 3, 2, M.

### B. Boss gimmicks
16. Shield phase: at 50% health the boss raises a shield that only one element breaks; the banner says which. 5, 2, M.
17. Adds: the boss summons 2 small foes that must die before it takes full damage. 4, 2, M.
18. Enrage: under 30% health the boss heals 1%/s unless you keep tapping fast (combo >= 10). 4, 2, M.
19. Bell toll: every 10 s the boss tolls and your Named stop for 2 s; tap the bell icon to cancel it. 3, 2, M.
20. One gimmick per land boss, chosen from a small table; Hollow Bishop fights use two. 5, 3, S.
21. Gimmicks are shown before the fight (a one-line tell under the boss name) so it is fair. 4, 3, S.
22. Gimmick difficulty is sim-checked: each new boss must be beatable in the sim at its stage. 4, 3, M.
23. A boss "intent" icon (shield / adds / enrage) next to the candle. 3, 3, S.
24. Beating a gimmick boss for the first time gives a one-off reward (a key or Marks). 3, 3, S.
25. The Hollow Bishop at 100, 150 ... gets a line of dialogue each time (lore draft). 2, 3, S.
26. Mirror boss: copies your top Named's element for the fight. 2, 2, M.
27. Armoured boss: physical immune until you crit 5 times. 3, 2, M.
28. Splitting boss: at 0 HP splits into two halves with 25% HP each. 3, 2, M.
29. Boss clock behaviour per gimmick (enrage bosses get +5 s). 2, 3, S.
30. A "boss gallery" in Menu listing every boss beaten, with its gimmick. 2, 3, S.

### C. Events
31. Random events while fighting (every 3 to 6 minutes): Eclipse (crit chance up), Bell Toll (gold x2 for 30 s), Grave Rush (foes come in a swarm). 5, 2, M.
32. Events are shown as a banner plus a small timer chip; never during an escape or dungeon. 4, 3, S.
33. A weekly realm modifier (no server: seeded from the week number), e.g. "+25% fire damage this week". 3, 2, M.
34. Gold rush: a treasure caravan of 5 treasure foes in a row. 3, 3, S.
35. Lantern procession: a line of wisps to tap for a burst of Marks. 3, 3, S.
36. Night of names: Named deal double damage for 60 s. 3, 3, S.
37. A risky event: the "Toll Collector" offers double gold for 60 s but the next boss has -5 s. Accept or decline. 4, 2, S.
38. Event log in Hero > Rewards (last 10 events). 1, 3, S.
39. Events scale with depth (deeper lands have rarer, bigger events). 2, 2, S.
40. Events are sim-checked so they never break the pacing gate. 4, 3, M.
41. An "event bell" achievement line (see 10 events, 50 events). 2, 3, S.
42. A seasonal event hook (date-seeded, e.g. a harvest of embers) left off by default. 1, 1, S.
43. A daily "omen" shown on Welcome back: today's boosted thing. 3, 2, S.
44. Event chance up after 2 minutes without an upgrade (anti-boredom). 3, 2, S.
45. A rare "Unwritten page" event: a lore line the player collects (draft lore). 2, 2, S.

### D. Real upgrade choices
46. The Forge: spend gold to raise a worn item's +level (a gold sink that grows with depth). 5, 3, M.
47. Named formations: choose front/back for Named (front take boss time, back deal more DPS); one free swap per life. 3, 2, M.
48. Train branches: every 100 Train levels choose one of two perks (more crit or more tap). 4, 2, M.
49. Shrine offerings: spend gold at a land shrine for a timed land-wide buff. 3, 2, S.
50. Named specialisation at level 200: pick one of two traits per Named. 4, 2, L.
51. Gold to Embers exchange at a poor rate (late-life gold has a use). 3, 2, S.
52. A "buy plan" hint: what gives the most damage per gold right now, marked with a star. 4, 3, S.
53. Upgrade +X pop-up showing the gain on every buy (the testers could not tell it worked). 4, 3, S.
54. Milestone bonuses explained when they trigger ("Train 25: taps x2"). 4, 3, S.
55. Cost scaling review so mid-life gold does not pile up unspent (the curious tester held 15K with 500-cost upgrades). 4, 2, M.
56. A second Named purchase: hire a mercenary for one life (gold sink, temporary DPS). 3, 2, M.
57. Lantern oil: spend gold to add seconds to the next boss candle. 3, 3, S.
58. Relic loadout: choose 5 "focused" relics that get +50% (a choice with Embers). 3, 2, M.
59. Pet training with gold (not only Marks). 2, 3, S.
60. Gear reroll with gold (one affix). 3, 2, M.

### E. Depth and goals
61. A "next land" goal on the Next line and on Welcome back. 4, 3, S.
62. Land completion stars (beat the land boss, its gimmick, its treasure foe). 3, 2, M.
63. A life summary card at the fall: deepest land, bosses beaten, events seen. 3, 3, S.
64. Best-depth per land shown on the map strip. 2, 3, S.
65. Quests reference new lands ("Reach the Drowned Bell"). 3, 3, S.
66. Endless quest templates extended for lands and gimmicks. 2, 3, S.
67. Achievements for gimmick bosses and events (20 new). 2, 3, S.
68. A "codex" of foes met (name, land, element) in Menu. 2, 2, M.
69. Rank-up pacing check for deeper lands (XP per kill deeper). 3, 2, S.
70. Dungeon realms scale to the new lands' depth. 3, 2, S.

### F. Balance and sim
71. The pacing sim covers lands 6 to 13: life 2 and 3 must see at least 2 new lands each. 4, 3, M.
72. The sim plays gimmick bosses and events (bot rules for shield elements and adds). 4, 3, M.
73. Foe HP curve per land reviewed so new lands do not wall players. 4, 2, M.
74. Gold curve with the Forge as a sink sim-checked (no runaway). 3, 3, S.
75. A sim target for "time between new things": something new (land, event, gimmick) at least every 3 minutes in lives 1 to 3. 4, 2, S.

### G. Art and feel
76. 8 new backdrops drawn in code (no AI images needed; Codex only if a raster is ever wanted). 4, 2, L.
77. 16 to 24 new foe sprites from 4 new archetypes (drowned, rooted, ash, bell-bound). 4, 2, L.
78. Boss sprites with a gimmick tell (glowing shield, chains for adds). 3, 2, M.
79. Event visuals (eclipse darkens the sky, gold rush sparkle). 3, 3, S.
80. Land arrival transition (sky blends over 1 s). 2, 3, S.
81. Icons for the new systems (forge, events, gimmicks) in the 32 px icon kit. 3, 3, S.
82. Foe death variants per archetype. 2, 2, M.
83. Named idle animation variety (they look alive in long fights). 1, 2, S.
84. Reduce-motion respected for all new effects. 2, 3, S.
85. New sound cues (shield break, event start) behind the Sound setting. 1, 3, S.

### H. UI
86. Boss gimmick explained on long-press of the boss name. 3, 3, S.
87. An event chip row under the stage name. 3, 3, S.
88. Forge as a sub-tab in Gear (Worn / Bag / Sets / Forge). 3, 3, S.
89. Land map in Hero > Stats. 2, 3, S.
90. Settings: "Events" on/off (some players want calm). 2, 3, S.
91. Patch notes 2.2 with every new land listed. 2, 3, S.
92. Glossary entries for gimmicks and events. 2, 3, S.

### I. Quality and safety
93. Save migration for new state (events, forge levels) with old-save fixtures. 4, 3, S.
94. Unit tests for every gimmick and event rule. 4, 3, M.
95. Smoke checks: a gimmick boss fight and an event appear and resolve without errors. 3, 3, S.
96. Demo screens for every new land (`?demo=land.7`). 2, 3, S.
97. Lore list file `LORE-DRAFT.md` with every new name for Clarence's approval, and a flag that hides unapproved names. 4, 3, S.
98. Performance check with gimmicks and events on (frame time under 16 ms on the smoke run). 3, 3, S.
99. The 15-tester AI gate after building (about $11), same personas as run 2. 4, 3, S.
100. Itch page and screenshots refreshed for 2.2. 2, 3, S.

## Proposed top 20 (by score, then the testers' complaints)
1, 2, 3, 16, 20, 21, 31, 32, 46, 52, 53, 54, 61, 6, 71, 72, 93, 94, 97, 99.

## Build order if approved
Round 0: 97 lore list, 93 save migration, 71/72 sim coverage (measuring first).
Round 1: 2, 1, 3, 6 (lands), with 61.
Round 2: 16, 20, 21 (gimmicks).
Round 3: 31, 32 (events).
Round 4: 46, 52, 53, 54 (choices).
Round 5: 94 tests throughout, then 99 the AI gate, fixes, patch notes.

## Points I am least sure about
- Art volume: 8 lands of backdrops and foes drawn in code is the biggest job; recolours plus one new archetype per land may be enough.
- Enrage (18) asks for fast tapping, which may fight with auto-tap builds.
- The Forge (46) may make gear drops matter less.
- Events every 3 to 6 minutes may be too often for a calm idle game; a setting (90) helps.
