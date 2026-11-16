# Run 5 plan, draft 1: choices that change how you play (for Clarence's approval)

## Clarence's decisions (11 Nov 2026, evening)
1. **Class, race and faith** each get a strategic role, not roleplay only. "There must be a stark difference in playstyle."
2. **Class = a different core loop**, not just bigger numbers.
3. **Re-pick costs gems.** Gems arrive now as an **earn-only** rare currency; buying gems comes later with a shop (PARKED-gems.md).
4. Method: Claude drafts, Codex critiques once, Clarence approves.
5. Budget: the rest of the expiring $100 credit (about $43 left); paid testing must finish before **12 Nov 08:00**.
6. Standing: escapes about 10 s spare (now ESCAPE_TUNE.foe 8.25, sim band 3-35 s); the cost wall is intended; lore names only after his OK (this plan uses plain mechanic names only).

## Today (what the code shows)
- Class: own skill tree and active skills; its main attribute adds 4% tap per point. All five play the same tap-buy-wait loop.
- Race: five starting attribute sets 2-3 points apart (about ±10% tap or a couple of seconds of boss time). Barely felt.
- Faith: one small passive (+25% to bosses, +10% Embers, ...). Barely felt.
- Forms (later) are the only real trade-off today (+50% one thing, a weakness).

## The design: three layers
**Class decides how your hands play. Race adds one rule. Faith decides what you chase.**

### Classes: five core loops (each has a meter or a rule shown under the fight)
| Class | Core loop | What you do | Trade-off |
|---|---|---|---|
| **Warrior** | **Rage** | Every tap adds Rage (0-100); it drains when you stop. At 100 the next tap is a **Rage Strike** (x25 tap damage, cleaves). Tap fast and in bursts. | Named -30%. |
| **Mage** | **Spellweave** | Taps do half damage but **restore mana** (1 per tap). Spells and skills cost -40% cooldown and hit x2. Tap to charge, cast constantly. | Tap damage x0.5. |
| **Rogue** | **Precision** | Weak spots return after 1 s (not 2) and hit x5 (not x3); each weak-spot hit adds a **Combo** (+10% crit damage per stack, up to 10, lost if you miss one). Hunt the glow. | Boss clock -5 s. |
| **Ranger** | **Volley** | Arrows fly by themselves: **auto-tap 4 a second** from the start; pets x2. Manual taps do half. The idle class: set up pets and gear, then watch. | Manual taps x0.5. |
| **Cleric** | **Prayer** | Taps do no damage; each tap adds **Prayer** (+1% Named damage, up to +200%), which fades 4% a second. Keep the prayer up and your Named do everything. | Taps deal 0 (Prayer only). |

### Races: one rule each
| Race | Rule | Pushes you to |
|---|---|---|
| Human | **Adaptable**: two shrine offerings per land, and Train perks every 75 levels (not 100). | Use every system. |
| Elf | **Keen**: weak spots open 50% sooner; +5% crit chance. | Active tapping. |
| Dwarf | **Smith**: the Forge costs half; +3 s boss time. | Gear and patience. |
| Orc | **Brutal**: every 10th tap is a guaranteed crit at x2 crit damage; Named -10%. | Tap counts. |
| Troll | **Regrowth**: a failed boss keeps the damage you dealt for the retry; a failed escape gives no scar. | Push walls, retry. |

### Faiths: what you chase
| Faith | Chase | Rule |
|---|---|---|
| Lantern Covenant | Wanderers and the Named | Wanderers stay twice as long and come twice as often; +10% Named. |
| Red Hunt | Elites and hunts | Elites twice as often and pay x8 gold (not x5); hunts pay double. |
| Silent Archive | Spells | Spell cooldowns -25%; every spell cast gives 1 Mark (up to 50 a life). |
| Iron Testament | Loot | Bosses drop gear twice as often; auto-salvage pays x3; better loot. |
| Veiled Balance | Escapes and Embers | +25% Embers; the tithe can reach +40%. |
| Unbound | Events | Events come twice as often and last 50% longer. |

## Gems (earn-only, now)
- Earned: 5 per great chest (every 100 stages), 1 per first win against each gimmick, 2 per achievement tier, 1 per weekly task. Shown next to Marks.
- **Reshape** (Menu): change class, race or faith for 10 gems each. Changing class refunds class points and resets the class tree; the rest stays.
- Old saves: start with 10 gems so each player can re-pick once now that the choices mean something.

## Top 10 (in build order)
| # | Item | Size |
|---|---|---|
| 0 | **Sim first**: each of the 5 classes played by a bot that uses its loop, at stages 1-100 (life 1), 100-250 (life 2) and from the stage-100 save. Gate: every class within ±25% of the average stage at each band; escapes 3-35 s; idle Ranger and waiter Cleric never stall. | M |
| 1 | Warrior Rage | M |
| 2 | Mage Spellweave | M |
| 3 | Rogue Precision | S |
| 4 | Ranger Volley | S |
| 5 | Cleric Prayer | M |
| 6 | Race rules (5) | M |
| 7 | Faith rules (6) | M |
| 8 | Gems (earn-only) and Reshape | M |
| 9 | Character creation shows each class's loop in one line and a tiny demo; class meter on the fight screen | S |

Built with each: rules in `game.ts` (pure, seeded, save stays v4 with optional fields), tests, demo screens, patch notes 2.4, smoke checks.

## Test gate (before 08:00, about $12)
15 AI testers from a **new game**, 3 per class (the persona is told which class to pick; race and faith free). Pass bar:
- At most 5 of 15 would not come back.
- Asked "how did your class play?", at least 4 of the 5 classes are described with their own loop (not "tap and buy").
- No class is called clearly weakest by 2 or more of its 3 testers.

## Least sure
- Cleric with zero tap damage may feel bad in the first minutes; a floor of 20% tap damage before stage 26 may be needed.
- Ranger's auto-tap may make it strictly best for idle play; its manual-tap penalty and the escape sizing (adaptive) should hold it.
- Five meters is a lot of UI; each class shows only its own.
