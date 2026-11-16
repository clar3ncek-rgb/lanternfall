# Run 4 plan, draft 1: more to do between bosses (for Clarence's approval)

## Clarence's decisions (11 Nov 2026)
1. Focus: **more to do between bosses**. The testers' main complaint after stage 130: "buy the cheapest Named, wait, repeat".
2. Size: **top 10**.
3. Method: Claude drafts, Codex critiques once, Clarence approves.
4. Test gate: **15 AI testers tonight**, before the API credit expires (12 Nov 08:00 his time). Cap $80 ($39.91 used per his console).
5. Standing: the upgrade-cost wall is intended; every escape stays tight; feel changes start off unless he says; lore only after his OK.

## What the testers did between bosses (gate-mid, gate-retest)
Tap the foe, buy the cheapest Named x10, wait for gold, fight the boss, repeat. Spells sit on cooldown. Events every 2.5-3.5 min and a gimmick boss every 10 stages break it up, but between them the hands have little to decide. So each idea below gives either **something to aim taps at**, **a choice to make**, or **a short goal**.

## Top 10
| # | Idea | What the player sees | Size |
|---|---|---|---|
| 1 | **Elite foes** | From stage 26, about 1 normal foe in 8 is an elite with one affix: *Armoured* (taps do half until you land 3 crits), *Swift* (flees after 8 s unless killed; drops a chest if caught), *Warded* (immune to one element, shown). Elites pay x5 gold. Not in escapes or dungeons. | M |
| 2 | **Weak spot** | On bosses and elites a glowing spot opens for 1.5 s every ~6 s. Taps while it is open do x3. Auto-tap and Named do not use it, so active tapping matters. | M |
| 3 | **Hunts** | Every few minutes (between events) a short side goal is offered on a chip: "Kill 3 elites in 2 min", "Beat the next boss with 5 s left", "Hit 10 weak spots". Accept or ignore. Pays Marks or a key. | M |
| 4 | **The Toll Collector** (choice event) | A new event: "Double gold for 60 s, but your next boss has 5 s less. Accept?" Yes / No. | S |
| 5 | **Shrine offerings** | Once per land, a shrine appears: spend gold for one of 3 buffs for 5 minutes (tap damage, Named damage, gold). A real choice that sinks gold. | S |
| 6 | **Lantern oil** | Spend gold to add up to +5 s to the next boss candle (cost grows with stage and per use in a life). Never in escapes. | S |
| 7 | **Mercenary** | Hire one mercenary for this life only: DPS = 25% of your best Named, cost grows each hire. A gold sink when Named costs pull away. | M |
| 8 | **Named specialisation** | At level 100 each Named asks you to pick 1 of 2 traits (e.g. Mirela: +50% vs bosses, or cleave 20% to the next foe). Kept for the life; picks shown on the portrait. | L |
| 9 | **Gold to Embers** | At the Fall card: trade late gold for Embers at a poor rate, capped per life, so leftover gold has a use. | S |
| 10 | **Adds gimmick** | A third gimmick for every-10th bosses: the boss calls 2 small foes; it takes only 20% damage until they are dead. | M |

## Built with each (not separate items)
- Rules in `src/rules/game.ts` (seeded, no timers or Math.random; new seed stream `elitSeed`), save v5 with fixtures, unit tests per idea.
- The sim bot learns each (aims weak spots at a set rate, takes hunts, buys oil and shrines by a simple rule). Gate: pacing unchanged within bands; "longest with nothing new" stays under 4 min; escapes unchanged.
- Smoke checks: one elite, one weak spot, one hunt chip, one choice event. Demo screens `?demo=fight.elite`, `fight.weak`, `fight.hunt`, `toll`, `shrine`, `spec`.
- Patch notes 2.3, release, then the 15-tester gate from the stage-100 save.

## Pass bar for the gate (15 testers)
- At most 5 of 15 say they would not come back.
- At least 10 of 15 use at least 2 of: elites, weak spots, hunts, a choice (toll, shrine, oil, mercenary, specialisation).
- "Buy the cheapest Named and wait" named as the main loop in at most 5 runs (it was nearly all).

## Order (so testers can run tonight)
Round 1: 1, 2, 10 (combat) · Round 2: 3, 4 (goals and choice event) · Round 3: 5, 6, 7, 9 (gold choices) · Round 4: 8 · then sim, release, gate. If time runs short before the credit expires, the gate runs after Round 3 and 8 ships after.

## Least sure
- Weak spots on phones: 1.5 s may be too short or too fiddly; tune by the testers.
- Elites + hunts + events + gimmicks may feel busy for a calm idle game; Elites and Hunts could get a setting like Events.
- Specialisation at level 100 is the biggest job and the easiest to cut.
