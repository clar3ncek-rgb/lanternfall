# Run 6 plan, draft 2 (after Codex ACCEPT WITH CHANGES): gear that fits your class, and things worth hunting

## Clarence's decisions (12 Nov 2026, early morning)
1. Gear goal: **class-loop gear** and **chase items** (not crafting, not a simpler gear screen).
2. Process: Claude drafts, Codex critiques once, Clarence approves.
3. Per class: **3 sets (weapons, accessories, armour) + 2 legendaries + 1 artifact**.
4. Drops: **dungeons**. Off-class gear can drop; worn by another class it gives **plain stats only** (no class rule).
5. **Stash**: only **complete** sets count; each gives a small piece of its set effect plus about **1% of current equipment stats**, with a **cap**.
6. Chase items: **2 per land, 26 in all**.
7. Testers: AI testers before the credit ends (08:00), on the **slice = the 5 class weapon sets + the Stash**. The rest is proven by sim and tests only.
8. (Vigil, decided earlier today: a Cleric climbs toward 90% of best while away, 8 h for the full climb, also after a Fall.)

Standing rules kept: class-neutral race/faith/form (untouched here); plain mechanic names; set and item names in the existing style (no new lore beyond item names and one-line texts); saves stay v4, new fields optional.

## 1. Class gear: what drops and where
- **Class sets**: 15 new SetDefs with `cls` (new optional field) and `realm: 'any'`. Same slots as realm sets (`SET_SLOTS`).
- **Dungeon clear drop** (`endDungeon`, cleared): today one realm set piece. New: roll on `randR4`-style own stream (`randGear`, seeded from the seed on first use, like randR4) so old seeds' realm drops are unchanged in order:
  - 50%: realm set piece (as now);
  - 50%: class set piece, **70% your class / 30% another class** (uniform over the other four).
- **Class legendaries** (10) and **class artifacts** (5): from dungeon gate kills too, 1 chance in 12 per clear instead of the set piece (own class 70%). A legendary is a normal item at rarity `legendary` with a fixed name and a `rule` (like artifacts). Class artifacts follow the existing one-artifact-worn rule.
- **Off-class gear**: an item with `cls` ≠ your class keeps its stats (`SET_MULT` 2.0 rolls; legendary 1.8) but its `rule` / set bonus is **inactive**; the card says "Warrior gear: stats only for a Mage". If you Reshape into that class, it wakes up.
- `setsComplete` only counts a class set when `def.cls` is your class (or the set has no class).

## 2. The class rules (new `RuleKind`s, all read in `derive` rules, all pure)
Aim: every class's weapons set is worth about **+25% of that class's own damage at stage 300** (sim checks ±10 points between classes). Accessories ≈ +15%, armour ≈ +15% or a utility.

| Class | Weapons set (slice) | Accessories set | Armour set |
|---|---|---|---|
| Warrior | `rageCleave`: a Rage Strike also hits the next 2 foes for 50% of the strike | `rageFast`: +1 Rage per tap (4 → 5) | `rageKeep`: Rage starts fading after 3 s, not 1.5 s |
| Mage | `manaEcho`: every 4th cast refunds its mana | `spellCrit`: spells can crit (your crit chance, half crit damage) | `tapMana`: taps restore 2 mana, not 1 |
| Rogue | `comboHold`: an open spot can wait 4 s before the combo breaks; combo max 15 | `spotGold`: weak-spot hits drop gold (1 s of Named gold each) | `spotFast`: weak spots open after 0.7 s |
| Ranger | `volleyAuto`: +1 arrow a second (3 → 4) | `petHaste`: pets ×1.25 more | `quiverGold`: +20% gold from foes killed by arrows |
| Cleric | `prayerHold`: Prayer fades at half speed | `prayerFull`: at full Prayer, Named also +25% more | `vigilFast`: full Vigil climb in 6 h, not 8 |

**Legendaries (2 per class)**, single-slot, small loop twists (examples, final numbers set by the sim): Warrior "Ironvow Gauntlets" (Rage Strike crits always), "Bell-Breaker Helm" (+10% Rage Strike); Mage "Ashen Quill" (first spell after a boss appears is free), "Tidebound Circlet" (+10% mana max); Rogue "Knot of Whispers" (combo starts at 3 each boss), "Thornstep Boots" (+0.5 s spot wait); Ranger "Fletcher's Last Feather" (every 20th arrow is a crit), "Pack-Leader Cloak" (pets +10%); Cleric "Candle of Vigil" (come back with Prayer full even after 5 min), "Litany Beads" (+10% Prayer gained).

**Artifacts (1 per class)**: a trade-off rule like today's four, e.g. Warrior "Penitent's Chain": Rage Strikes ×40 but Rage fades twice as fast; Mage "Burnt Grimoire": spells ×1.5, taps restore no mana below 25% mana; Rogue "Glass Knife": weak spots ×7, combo resets on a miss; Ranger "Silent String": arrows ×1.5, your taps do nothing; Cleric "Ash Censer": Prayer max 300, decays ×2.

## 3. The Stash
- New `s.stash: Item[]` (optional; old saves start empty). A **Stash** button on the gear screen. Only **set pieces** go in (any set: realm or class, any class). Stash holds 60 pieces; it does **not** count against the bag.
- A set counts in the Stash when **all its pieces are in the Stash** (duplicates don't count twice; a piece you are wearing does not count for the Stash, it counts for the worn set instead).
- Each complete stashed set gives:
  - **1% of your current equipment stats** (sum of `itemStats` of worn gear, each stat ×0.01), and
  - its set rule at **20% strength** (`a` and `b` ×0.2, rounded down to a safe minimum; rules with on/off effects such as `clockPauseSkill` are skipped and give +2% damage instead).
  - Off-class class sets in the Stash also give only the 1% stats (no rule), same as wearing.
- **Cap**: at most **10 complete sets count** (so at most +10% gear stats and 10 small rules). Shown as "Stash: 3 / 10 sets".
- Reshape: a stashed set of your new class starts giving its rule.

## 4. Chase items (2 per land, 26)
- Each of the 13 lands has 2 named uniques (`CHASE` list in content: id, land, slot, name, one rule from the existing `RuleKind`s at small strength, one-line text).
- Drop: any **boss of that land**, **1 in 40** per boss kill while you have not found it; 1 in 200 after (duplicates salvage for 10× gold). Only bosses of that land. Rarity `legendary`, rolls ×1.8, ilvl = stage.
- **Collection page** (from the gear screen and the Book): 13 rows × 2, found ones in colour, missing ones as silhouettes with "Drops from bosses in <land>". Achievement: 5 / 13 / 26 found (+2 gems per tier like other achievements).
- Not class-locked; their rules are class-neutral kinds only (gold, clock, drift, fairy, treasure, offline, Embers).

## 5. Tests and checks
- Unit tests: drop split 50/50 and 70/30 over 2000 clears on the gear stream; off-class item gives stats, no rule; setsComplete ignores off-class sets; Stash counts only complete sets, ignores worn pieces, caps at 10, 1% stats, 20% rules; Reshape wakes stashed sets; chase drop only from that land's bosses; save round-trip with stash; old save loads with empty stash.
- Sim (`npm run sim`): new check "class weapons set": each class, seeds [5, 23], with its weapons set worn from stage 150, end of life 1 within ±10 points of each other in % gain; escapes stay in the [3, 30] band with sets worn.
- Smoke: Stash sheet opens; collection page opens; a demo screen per class set (`gear.<cls>`).
- Release check passes.

## 6. Testers (slice, before 08:00)
- 10 AI testers (2 per class), mid-game save (stage ~200, a dungeon key), each given their class's weapons set pieces and 2 complete realm sets to stash. Question: does the set change how you play? is the Stash clear? would you chase the other pieces?
- Budget: what remains of the $100 credit, hard stop at 08:00.

## 7. Order of work
1. Slice: gear stream, class weapon sets (5), off-class rule, Stash, tests, sim check → testers.
2. Rest: accessories and armour sets (10), legendaries (10), artifacts (5), chase items (26) and collection page, tests, sim, release check.
3. Patch notes 2.5, change log, handoff.

## Changes from Codex (.lavish/codex-run6.md, ACCEPT WITH CHANGES; all five taken)
1. **Stash maths exact.** One pure `stashBonus(s)`: picks up to 10 complete set ids in a fixed order (SETS order); snapshots worn-item stats after merge/Forge and slot multipliers and before any Stash part; adds that snapshot once at count x 0.01. Rules use a per-RuleKind Stash table, not a blanket x0.2 (counts like "every 4th cast" become "every 10th"; on/off rules give +2% damage instead). Off-class sets: stats only. Worn pieces never count for the Stash. Bag to Stash and back are single atomic moves; Stash max 60; no moves during dungeons or escapes; merging also looks in the Stash.
2. **Sim measures the set alone.** At stage 300, for each class and seed: snapshot, clone into control and treatment, give the treatment its class weapons set, no other new drops, run the same fixed 10 minutes. Each class's median gain must be 15 to 35%, and the best minus the worst class at most 10 points. The full pace and escape gate runs again separately with sets worn.
3. **Class is part of the item.** `cls?` on SetDef and Item; class-set stats and looks come from the set's class, not the wearer's. One `itemRuleActive` / `setRuleActive` used by rules, setsComplete, stats, compare text and the Stash. Tests: off-class stats work worn and stashed, rules stay off, Reshape wakes them.
4. **Drops seeded exactly.** New optional `gearSeed` stream for the 50/50 and 70/30 rolls; when the result is a realm piece, the old main-stream calls run unchanged, so old seeds drop the same realm pieces. Chase items use their own stream too: one roll per boss of that base land (stages past 500 use the base land), 1 in 40 then a missing item chosen evenly; once both are found, 1 in 200 for a duplicate.
5. **Smaller first slice.** Build one class weapon set end to end first (stream, item class, off-class, Reshape, Stash, save, tests, one paired sim case), then the other four. AI testers run only if all five pass before about 07:30; otherwise the credit lapses and testing is the sim plus Clarence.
