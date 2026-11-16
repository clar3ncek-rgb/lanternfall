# Run 5 plan, draft 2 (after Codex REDO): choices that change how you play

Draft 1: RUN5-PLAN-v1-draft.md. Codex round 1: .lavish/codex-run5.md, **REDO** (five points, all taken; see "Changes from Codex" at the end).

## Clarence's decisions (11 Nov 2026, evening)
Class, race and faith each get a strategic role, a **stark difference in playstyle**; class = a different core loop; re-pick costs **gems**, earn-only for now; Claude drafts, Codex critiques, Clarence approves; budget = the rest of the expiring $100 credit (paid testing must end before 12 Nov 08:00). Escapes about 10 s spare (ESCAPE_TUNE.foe 8.25, sim band 3-35 s). Plain mechanic names only (no new lore).

## Layers
**Class decides how your hands play. Race adds one rule. Faith decides what you chase.**

## 1. Class loops: exact rules (all pure, in `game.ts`; new optional Life fields; no new randomness)
Words: *manual tap* = a call of `tap(s)` from the player or the bot. *Auto-tap* = the aggregated `tick` damage (autoTap stat, buffs). Neither Named-as-tap nor skills count as manual taps.

| | Warrior: Rage | Mage: Spellweave | Rogue: Precision | Ranger: Quiver | Cleric: Prayer |
|---|---|---|---|---|---|
| Saved field | `L.rage` 0-100 | none | `L.combo` 0-10 | none | `L.prayer` 0-200 |
| Built by | +4 per manual tap | each manual tap restores 1 mana (also on an immune foe) | +1 per weak-spot hit | nothing to build | +2 per manual tap |
| Decays | -12/s after 1.5 s with no manual tap | | reset to 0 when an open weak spot is left 2 s without a hit | | -4/s after 1 s with no manual tap |
| Spent / effect | at 100 the next manual tap is a **Rage Strike**: that tap x25 (after crit and weak spot); rage to 0; cleave uses the tap *without* the x25 | spells and skills: skill power x2; their cooldowns x0.6 applied after the global 50% cap (floor 25% of base) | weak spots open after 1 s (not 2) and hit x5 (not x3); crit damage x(1 + 0.1 x combo) | auto-tap +4 a second from the start; pets x2 | Named damage x(1 + prayer/100) in `tick` only (not pets, not buffs) |
| Cost | Named x0.7 | manual tap damage x0.5 | world boss clock -5 s | manual tap damage x0.5 | manual tap damage x0.25 (stage-1 boss stays beatable) |
| Escapes and dungeons | works (manual) | works | weak spots exist in realms for Rogue only | works | works |
| Offline | rage set to 0 | | combo 0 | Ranger is the "leave it open" class: offline still uses Named only | prayer 0 |
| Bot counters | `rageStrikes` | `manaFromTaps`, `spells` | `weakHits`, `comboMax` | auto vs manual damage | `prayerUptime` |

**Contradictory nodes (Codex 2):** Cleric Inquisitor's tap buff also multiplies Prayer gained per tap; Mage Battlemage keeps its tap buff (half taps, still useful); Ranger's existing *Volley* active stays (the loop is named *Quiver* to avoid the clash). Forms stay as they are; the sim runs every class with Mortal and with the form that boosts its loop (Werewolf/Warrior, Elemental/Mage, Vampire/Rogue, Undead/Cleric), and any pair over +60% of the class median is capped.

**Escape sizing (Codex 2):** `estimateDps` becomes class-aware with the same factors (Warrior: tap x2 average for strikes; Mage: tap x0.5 plus spells; Ranger: + auto-tap 4/s, manual x0.5; Cleric: tap x0.25, Named x3 at steady prayer; Rogue unchanged). The in-escape adaptation measures the last 15 s (rolling), not everything since the start, so a Rage Strike does not inflate the next foe.

## 2. Race rules
| Race | Rule (exact) |
|---|---|
| Human | Two shrine offerings per land; Train perks every 75 levels. |
| Elf | Weak spots open 50% sooner (also for Rogue: 0.5 s); +5% crit chance. |
| Dwarf | Forge costs x0.5; +3 s boss time. |
| Orc | Every 10th manual tap is a guaranteed crit with x2 crit damage; Named x0.9. |
| Troll | A failed world boss keeps its lost health for the retry (until you leave the stage); a failed escape gives no scar. |

## 3. Faith rules
| Faith | Rule (exact) |
|---|---|
| Lantern Covenant | Wanderers x2 as often and stay twice as long; Named +10%. |
| Red Hunt | Elites x2 as often, pay x8 gold; hunt rewards x2. |
| Silent Archive | Spell cooldowns x0.75; +1 Mark per spell cast (max 50 a life). |
| Iron Testament | Boss gear drops x2; auto-salvage pays x3; +10 loot luck. |
| Veiled Balance | +25% Embers; the tithe can reach +40%. |
| Unbound | Events x2 as often and 50% longer. |
(Their old small passives are replaced.)

## 4. Gems and Reshape (Codex 4)
- New fields: `s.gems`, `s.gemsWelcome` (one-time flag). Old saves get exactly **10 welcome gems** once on load; no back-pay for past chests, achievements or gimmicks.
- From now on: +5 per great chest (each 100 stages, once per stage via the existing `s.chest`), +1 joining the existing one-time first-gimmick reward, +2 per new achievement tier, +1 per weekly task claimed.
- **Reshape** (Menu), one atomic function `reshape(s, kind, id)`: checks first (not in a realm, no pending choice, gems >= 10, a real change), then charges. Class change: class ranks cleared (points come back), class path reset to base tier 1, class trials' progress cleared, class buffs and cooldowns cleared, the starter weapon swapped for the new class's only if it is still the untouched starter; spells, race ranks, forms, gear, relics kept. Race or faith change: only the hero field changes. A test matrix covers each case and old saves.

## 5. The gate (Codex 3, 5)
**Deterministic gate first (required before any paid tester):**
- Five class bots, each using its loop, from three fixtures per class (new game; life 2 start; a stage-100 save made per class by the sim, not by editing the Rogue save).
- Each bot must prove its loop happened: Warrior >= 1 Rage Strike a minute; Mage >= 30% of mana from taps; Rogue combo reaches 5; Ranger auto-tap >= 40% of its tap damage; Cleric prayer above 50 for >= 60% of fight time.
- Progress: each class's median stage (3 seeds) within ±30% of the median of the five medians at each band; a no-input run never stalls past stage 26 for Ranger and Cleric (their loops are the gentlest); first bosses beatable for all; escapes 3-35 s for all classes.
- All unit tests, smoke checks (one per class meter, Reshape), release.

**Paid gate (only if the deterministic gate passes by about 06:30):** 15 testers, 3 per class, new game, told which class to pick. The reports and logs must show the class's loop happening (meter seen, Rage Strikes, casts, weak-spot hits, prayer). Pass: at most 5 of 15 would not come back; no class unanimously rejected by its 3 testers. If the deterministic gate is not met in time, no paid testers (no spend after the credit ends without Clarence's new yes).

## Build order
Sim bots and counters → Warrior, Rogue (fewest new parts) → Mage, Ranger → Cleric → class-aware escapes → races → faiths → gems and Reshape → creation screen and fight meters → gate.

## Changes from Codex (round 1)
1. Transition table per class (above). 2. Contradictory nodes, forms and class-aware escape sizing with a rolling window. 3. Behavioural bots with loop-proof counters and per-class fixtures instead of a stage average. 4. Atomic Reshape, a welcome-gem flag and no retroactive gems. 5. Deterministic gate first; paid testers only after it passes.

## Codex round 2 (.lavish/codex-run5b.md): REDO on details; all taken, no third round
1. **Prayer formula:** Named damage in `tick` = namedDps x (1 + prayer/100) x (1 + allyBuff) x the rest as today; prayer multiplies the whole Named term, buffs included (test with Consecrate). Pets untouched.
2. **Forms:** the sim runs all 5 classes x all 6 forms from the stage-100 band and prints the table; any class-form pair more than 75% above its class's Mortal median **fails the gate** (no silent cap). **Escape estimate per class** from the tap rate r (default 5): Warrior tap x (24 + 25)/25 when r >= 1 (no decay), else x1; Mage tap x0.5 + sustainable spells = min(cooldown-limited, mana-limited by regen + r mana a second) x average spell damage; Ranger tap x0.5 x r + auto 4/s; Cleric tap x0.25 x r, Named x (1 + min(200, prayer at r)/100) where steady prayer = 200 if 2r > 4 else 0; Rogue as today. The in-escape rolling window is 15 s.
3. **Bots:** Mage bot casts whenever a spell is ready and mana allows; counters for casts, mana-starved seconds and cooldown occupancy; pass needs >= 4 casts a minute. **No input** = the bot buys upgrades but never taps: Ranger and Cleric must reach stage 26 within 25 minutes. **No upgrades** = taps only: every class beats the stage-1 and stage-5 bosses (as the existing first-bosses test). Boss fails after stage 100 at most half of boss fights, per class.
4. **Reshape:** the Hearth-Locket, if still the untouched original, switches its +3 to the new class's main attribute, in the same atomic step; a changed or replaced trinket is left alone. In the test matrix.
