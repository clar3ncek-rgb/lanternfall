// j4: Opus reads the game's rule numbers and hunts for exploits and unfair spikes. Writes samples/playtest/j4/report.md.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { message, textOf, spentUsd, OPUS } from './api.mjs';

const OUT = 'samples/playtest/j4';
mkdirSync(OUT, { recursive: true });
const files = ['src/rules/data.ts', 'src/rules/content-types.ts', 'src/rules/content.ts', 'src/rules/tiers-content.ts', 'src/rules/game.ts', 'src/rules/big.ts', 'scripts/pace.sim.ts'];
const code = files.map((f) => `=== ${f} ===\n${readFileSync(f, 'utf8')}`).join('\n\n');
const sim = readFileSync('samples/playtest/pace-latest.txt', 'utf8');

const prompt = `You are a senior game-balance designer. Below is the complete rules code of a phone idle/tap RPG ("The Unwritten: Lanternfall"),
plus the latest output of its pacing simulation (4 lives of 25 minutes with a steady 5-taps-a-second player).
Find: (1) exploits (cheap loops, stacking that breaks caps, timers that can be gamed, free resources, save or offline abuse);
(2) unfair spikes or dead zones (walls a new player cannot pass, stretches with nothing to buy, numbers that jump);
(3) systems that make others pointless (a relic, set, form or skill that dominates; anything never worth taking);
(4) pacing against these targets: life 1 stalls between stage 150 and 350; base class rank 10 at 20 to 40 min; a steady tapper has
15 to 30 s left at the escape gate; the race tree (90 points) should fill across lives 3 to 4, not life 2.
For every finding give: severity (blocker/major/minor), the exact file and line or constant, the evidence (show the arithmetic),
and a concrete fix with numbers. Rank by severity. At most 25 findings. Then a short table of the 10 numbers you would change first.

SIM OUTPUT:
${sim}

CODE:
${code}`;

const r = await message(OPUS, [{ type: 'text', text: prompt }], { maxTokens: 24000, tag: 'j4-balance', extra: { output_config: { effort: 'low' } } });
writeFileSync(`${OUT}/raw.json`, JSON.stringify({ stop: r.stop_reason, types: (r.content ?? []).map((c) => c.type), usage: r.usage, content: r.content }, null, 1));
writeFileSync(`${OUT}/report.md`, `# Balance and rules check (j4, Opus, about $${spentUsd().toFixed(2)})\n\n${textOf(r)}\n`);
console.log(`done j4: $${spentUsd().toFixed(2)}`);
