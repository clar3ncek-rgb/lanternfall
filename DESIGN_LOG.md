# Unwritten Tapper: design log

An idle/tap spin-off of The Unwritten. It uses the Tap Titans loop, but the content is original. This log belongs to this project; the main game's log (`The Unwritten\The_Unwritten_Design_Log.md`) is not edited from here.

## v1 (6 Nov 2026), built and published privately

- Hero: create once per save (name, race, class, Faith, form); classes, trees, races, Faiths and forms come from the main game.
- Allies: the Named dead (10). Prestige: fall → a 5-minute escape run in a random death realm (1/8 special) → Embers.
- A failed escape leaves a permanent scar (no limit), healed by a special-run prize or 20× your best return in Embers.
- Gear: WoW-style slots from the start, main-game rarity colours. Offline: gold only, up to 24 h. Saves: auto-save plus a save code.
- Skill points from boss milestones. Hand-made SVG chibi sprites.

## v1.1 fixes (7 Nov 2026)

- The Named cards overlapped because they shared a CSS class with the battle ghosts. Fixed.
- Respec costs **Embers**: a quarter of your best return, minimum 5 (Clarence: "cannot be free"; the quarter is Claude's guess).
- Every item has one **Power** number (stats weighted for your class, main attribute ×1.5). "Salvage worse" sells items whose Power is no higher than the weakest worn item they would replace. There is a "salvage all of a rarity" row. Artifacts and heirlooms are never sold.
- A "Coming up" card shows the next 3 goals.

## v2 decision map (grilled 7 Nov 2026), one big drop

1. Graphics: **pixel art** drawn in code (samples in `samples/`). Not chosen: detailed chibi, AI art.
   - 1.1 Battle layout **C**: the 3 strongest Named in the scene, the rest in a portrait strip with an "All 10" list. Not chosen: A back rows, B front view, D arena.
   - 1.2 Strip: live info (level, element dot, hit flash, damage share), immunity warning (greyed ⊘), quick level-up (glows, tap buys, long-press details, milestone ring). Not chosen: drag-to-pick who is on screen.
2. Respec: **Embers** (done in v1.1). Not chosen: gold.
3. Things to look forward to:
   - Milestone chest every 25 stages.
   - Daily and weekly tasks.
   - Achievements: small permanent bonuses.
4. Wandering bosses: **rare, with a timer, always drop Legendary**. Not chosen: Epic-or-better with no timer.
5. Dungeons (solo):
   - 5.1 The realm is **random, shown at the door**; dungeon realms are the 5 death realms. No route choice (an earlier "pick a route" was dropped).
   - 5.2 **9 mobs + 1 boss**, **3 minutes** for the whole run. Difficulty scales to your best stage.
   - 5.3 Keys: 1 free a day plus prizes, **store up to 3**.
   - 5.4 A boss kill gives **1 sure set piece** from that realm. A failed run keeps what was earned before the wipe and uses up the key.
6. Gear sets (per realm, 5 realms):
   - 6.1 Three set types per realm. **Every slot belongs to a set**:
     - Weapon pair: main and off hand.
     - Accessories: neck, back, 2 rings, 2 trinkets.
     - Main armour: head, shoulders, chest, wrists, hands, waist, legs, feet.
   - 6.2 No 2- or 4-piece bonuses. A **complete** set type gives its own **rule-breaking** bonus: 15 in total. Claude drafts them and Clarence vets them before they go in.
   - 6.3 Duplicates merge: **two copies at the same + level make +1, up to +5** (32 copies for +5).
7. Damage types, following **Diablo II** for now (expand later): physical, magic, fire, cold, lightning, poison.
   - 7.1 Each Named has **one fixed element**. Your taps are physical; weapons can roll an element enchant.
   - 7.2 Immune foes start at **stage 26**, with more deeper. **A boss is never fully immune: always at least 1 weakness.**
   - 7.3 Named **level milestones** (10, 25, 50, 100, 200…) can boost a whole element.
8. Points, following the main game:
   - 8.1 A new **permanent XP level** from kills (never resets) → **race-tree points**. Train stays the gold upgrade.
   - 8.2 A **quest chain** → **class and transformation points**: **100 hand-made quests, then endless generated ones**. Kept through death.
   - 8.3 The **6 shared spells** are levelled with **class points**. Not chosen: race points, their own points.
   - 8.4 **Race trees, transformation trees and a Mortal Master "Mastery" tree**: Claude drafts them, marked proposal.
9. Skill bar: **all 10** (6 shared spells + 4 class skills), **two rows of 5, icons only, long-press for the tooltip**.
10. **Marks**: a new non-money currency from daily and weekly tasks, achievements and fairies. It levels the pets.
11. Pets: **collect all 3** (grave crow, lantern wisp, bone hound) and switch between them. They come as **quest-chain rewards** (the first early, pick 1 of 3).
12. Overkill: leftover damage carries to the next foes and can **skip stages, always stopping at a boss**.
13. Relics: **about 100**. A **random new relic** for Embers, getting dearer with each one owned; each relic levels up. The 9 rites fold in as the starting relics. Claude drafts them themed by realm, marked proposal.
14. Fairies (wisps): about every 1–2 minutes; tap to collect gold, mana, a free spell, or rarely Marks.
15. Treasure foes: a rare gold-rich foe in place of a normal one.
16. Daily login: a 7-day cycle; a missed day pauses it.
17. Tasks: 3 daily and 3 weekly, paying Marks and keys.
18. Delivery: **one big drop**.
19. Not taken from Tap Titans 2: tournaments, clan raids, seasonal events.

### Round after the content draft (7 Nov 2026)

20. Content draft: `samples/v2-content-draft.md`. Clarence reads it **as patch notes** once it is built in, so the numbers are tuned during play.
21. Rule-benders that were too strong:
    - Execute set: **mobs only, below 10% HP**; **bosses take extra damage below 10%**.
    - No-cooldown set: cooldowns **halved** instead.
    - Offline stage push: **capped at 25% of the gap**.
    - Relic #22 (start partway to best): **capped at 20% of best**.
22. Pets: **one pet per stat key** (about 60).
    - **3 out at once**; owned pets not out give **10%** of their passive.
    - Sources: the **quest chain** (3 starters at quests 4, 35 and 70, more spread through) and **pet eggs** from wandering bosses, dungeon bosses, milestone chests and achievements. An egg hatches a pet you do not have yet.
    - Levelled with Marks.
23. Keys: the cap of 3 applies to the **free daily key only**; quest and task keys can go over 3.
24. Patch notes: an in-game **Patch notes** page in Menu, plus `PATCH_NOTES.md`, sent to Clarence's phone.

### v2.1 round (7 Nov 2026, Clarence)

25. Overkill is no longer for everyone. It is **cleave**, from the **Warrior Berserker** branch only:
    - Battle Fury +8%, Blood Momentum +8% and Unbroken Rage +4% per rank, so 100% at max ranks.
    - Everyone else gets **tiny** amounts: a pet +0.25% per level, relics +0.5% per level, set pieces 1%, the Orc Overrun node +0.5%. **Capped at 15% together.**
    - Quests 29 and 74 no longer ask for overkill (they became treasure-foe kills).
26. Fewer words: cards show **icon + number + short name**; explanations moved to **long-press / ?**. Tabs are **an icon plus one word**.
27. Character creation is **step by step** (Race → Class → Faith → Form → Name). Each step has a big animated hero, option portraits or crests, lore, stat bars, skill and tree previews. Lore lines are Claude's proposal.

## Claude's guesses (not on the map; open to change)

- v1: heal cost 20× the best return; escape foes worth 9 s of damage, the gate 75 s; the Embers curve; skill effect sizes; Faith and form numbers; Named names; the Artifact and heirloom rules; tree names not in the main game (marked).
- v1.1: respec = a quarter of the best return; Power weights; bag size 40.
- v2 numbers, all Claude's guesses and visible in `PATCH_NOTES.md`:
  - Overkill: 50% of leftover damage carries on by default. It never hits a boss. On stages you have cleared before, it "sweeps" the stage, which is how "skip stages, stop at a boss" was built.
  - Immunity: 30% chance of one from stage 26, and a 25% chance of a second from stage 101.
  - Treasure foes: 1 in 40, ×20 gold. Wanderers: 1 in 400, 30 s. Wisps: every 60–120 s.
  - XP: level L needs 30·(L−1)^1.7.
  - Dungeon foes take 6 s of your damage and the boss 40 s. Set pieces roll ×2.0; each merge adds 20%.
  - Prices: a new relic costs 3×1.35^(owned−9) Embers; a pet level costs 5×1.3^(level−1) Marks.
  - Tap cleave and crit splash only reach the next foe when the tap kills. Drift = the next stage starts at its last foe.
  - `?demo=<tab>` opens a throwaway mid-game save for screenshots. It never saves.
- The content agent's `// changed:` list is in `src/rules/content.ts`: 37 quest goals mapped to existing counters, and niche relic effects mapped to the nearest stat.
- Pacing check, 7 Nov: the first life reaches about stage 157 at 5 min and stalls around 265. Each return pushes about 200 stages deeper, faster than v1. Tune it once Clarence plays.

### v3 tiers round (7 Nov 2026, Clarence)

28. Undead stays a transformation, as in the main game (Clarence withdrew the race idea).
29. **Class tiers, AdventureQuest-style.**
    - T1 is the base class; T2–T6 belong to a subclass; T7 is a subclass ultimate.
    - Every tier has 10 ranks, earned through **class XP from fighting** by the equipped path. A tier's next trial only appears at **rank 10**. Base class rank 10 shows all 3 subclass trials.
    - You can **own every subclass and equip one**, switching any time except during a boss, a dungeon or an escape.
    - **Tiers open nodes; class points rank them.** Branch tiers 1, 2 and 3 open at T2, T3 and T4; new T5 and T6 nodes and a T7 ultimate come from `src/rules/tiers-content.ts` (Claude's draft).
30. **Transformations by quest.**
    - Everyone starts mortal. After quest 15, a trial ("first blood", reach stage 60) unlocks the offer. Taking a form closes Mortal Master forever.
    - Forms climb T1–T7 by form XP, rank 10 and a trial.
    - Hybrids follow the main game: a 2nd or 3rd form is only possible while every form is T1–T2. Caps are dual T4/T3 and triple T2; each form uses its own tree up to its cap; every weakness applies; T7 is for pure forms only.
    - Mortal Master has a Mastery ladder T1–T7, with a mortal ultimate in the Netero / Escanor spirit: "Every Morning at Once" (original name).
31. Pace: T1 to rank 10 takes about 20 minutes, and each tier doubles (150 XP per rank at T1; a kill is 1 XP, a boss 5).
32. **v2 saves reset to mortal and to base class T1.** Foundation ranks are kept, other class ranks are refunded (points stay), and form ranks are cleared.
33. Claude's guesses: the trial goals per tier (T2 10 bosses, T3 a dungeon, T4 stage 150, T5 5 dungeons, T6 3 Bishops, T7 10 Bishops); offer at quest 15 plus stage 60; hybrid form XP split evenly.

## Run 2 (10 Nov 2026): version 2.1 "Ready for the Road", ideas 1 to 50
- Clarence's calls: whole game launch-ready; top 20 then ideas 21 to 50; feel changes built but off by default; $35 API cap; stop and ask on lore or balance the sim can't settle.
- Safety: unreadable saves kept and never overwritten; crash screen with the save; old-save fixtures; `npm run release`; pacing sim as a gate.
- Layout: half-cover tabs; Gear (Worn/Bag/Sets) and Death (Fall/Relics/Dungeon) sub-tabs; popups with a close cross and a full-width Close; info popups close on any tap.
- Balance (sim-checked): immune floor 20 %; winter set halves the clock; realms sized from measured DPS; XP exponent 1.82; land-1 bosses +5 s (Clarence: 2 s felt negligible); bounty bosses every 25th stage (not the Bishop's) pay 1.5x gold from life 2 (3x and 2x failed the gate).
- New player: guided start (6 steps), Begin now, dimmed tabs, first-fall card, glossary, hold-to-explain on the top numbers, first wisp arrow.
- Settings, all off at first: sound (synthesized), hit-stop, scientific numbers, auto-cast (level 25), auto-buy (10 relics).
- Cold open (4 lines from the design log's bell / names / Hollow Bishop) approved by Clarence 10 Nov and on for new players (tap to skip; `?nocoldopen` for test scripts).
- AI play-test gate: 15 runs, 0 yes / 11 maybe / 2 no / 2 no verdict; final 4 runs 0 / 3 / 1. Main complaint: the middle repeats (content, ideas 51+).
