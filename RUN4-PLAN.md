# Run 4 plan: more to do between bosses (draft 2, after Codex; for Clarence's approval)

Draft 1: RUN4-PLAN-v1-draft.md. Codex critique (read-only, once): .lavish/codex-run4.md, verdict **ACCEPT WITH CHANGES**. All five changes taken (below).

## Decisions so far (Clarence, 11 Nov 2026)
Focus: more to do between bosses. Size: top 10. Plan: Claude drafts, Codex critiques once, Clarence approves. Gate: 15 AI testers tonight, before the credit expires (12 Nov 08:00 his time); cap $80. The cost wall is intended; escapes stay tight; feel changes start off unless he says.

## Tonight: build, then the 15-tester gate
| # | Idea | What the player sees | Size |
|---|---|---|---|
| 0 | **Sim first** (Codex 1, 4) | The pacing sim gets 3 players from the stage-100 save: *waiter* (cheapest Named, wait), *active* (aims weak spots, takes hunts and choices), *idle* (ignores them). Gate: active progresses or earns at least 10% faster than waiter; idle stays inside today's bands (never stalls); boss fail rate after stage 100 logged with a band; escapes unchanged. | M |
| 1 | **Elite foes** | From stage 26, about 1 normal foe in 8 is an elite: *Armoured* (taps half until 3 crits), *Swift* (flees after 8 s; a chest if caught), *Warded* (immune to one shown element). x5 gold. | M |
| 2 | **Weak spot** | On bosses and elites a glowing spot opens for 1.5 s every ~6 s; taps landing on it do x3. Auto-tap and Named never use it. | M |
| 3 | **Hunts** | A chip offers a short goal built from 1 and 2 ("Kill 3 elites in 2 min", "Hit 10 weak spots", "Beat the next boss with 5 s left"). Accept or ignore; pays Marks or a key. | M |
| 4 | **The Toll Collector** | Choice event: "Double gold for 60 s, but your next boss has 5 s less. Accept?" | S |
| 5 | **Adds** gimmick | A third gimmick for every-10th bosses: 2 small seeded foes; the boss takes 20% damage until they die; the boss clock rule is fixed and sim-checked. | M |
| 6 | **Offering** (shrine + oil merged, Codex 2) | Once per land, before a boss, a shrine offers one gold choice: +5 s on the next boss, or tap x1.5, or Named x1.5 for 5 minutes. Not offered while a Toll is pending. Its price is set in the sim against what the same gold buys in Named levels. | S |

## After the gate (sim and browser checks only; the credit is gone by then)
| # | Idea | Why later |
|---|---|---|
| 7 | Mercenary for one life | Passive DPS: more waiting, not a new action (Codex 2). |
| 8 | Gold to Embers at the Fall | Happens at the Fall, not between bosses. |
| 9 | Named specialisation at level 100 | Biggest job, one-off choice; layered on existing level-100 milestones. |

## Rules for building (Codex 3, 4, 5)
- **Boundaries table**, written before code: what each feature does in the world, a boss fight, an escape, a dungeon, offline time and the Fall. Default: none of them appear in escapes or dungeons; their timers pause offline (no silent rewards or expiries); buffs end on falling.
- Weak spot and elite clocks are rule fields advanced only by `tick`; the UI passes `tap(s, { weak: true })` when the tap lands on the spot; the rules check that the spot is open.
- New random draws use a new seed stream derived from the save seed, so old saves replay exactly.
- Elite and weak-spot damage are left out of the adaptive escape measure, like events and immune foes are now.
- One boss-clock change per boss (`nextBossDelta`, capped at ±5 s), used once.
- **Save stays v4**: new fields are optional with defaults (like `landSplit`); old saves (v1 to v4) and the stage-100 save load and replay in tests before the testers run.

## Gate pass bar (15 testers, stage-100 save)
- At most 5 of 15 would not come back.
- At least 10 of 15 use at least 2 of: elites, weak spots, hunts, Toll, adds, Offering.
- "Buy the cheapest Named and wait" named as the main loop in at most 5 runs.

## Order
0 (sim) → 1 + 2 → 3 → 4 + 5 → 6 → sim gate, release → 15 testers → one fix round and a re-test → 7, 8, 9 → change log.
