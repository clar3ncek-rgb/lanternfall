// j3: story, dialogue and item text drafts in one voice. Haiku drafts, Sonnet polishes. Writes samples/playtest/j3/text-drafts.md.
// Nothing here goes into the game until Clarence approves the text.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { message, textOf, spentUsd, HAIKU, SONNET } from './api.mjs';

const OUT = 'samples/playtest/j3';
mkdirSync(OUT, { recursive: true });
const data = readFileSync('src/rules/data.ts', 'utf8');
const pick = (start, len) => { const i = data.indexOf(start); return i < 0 ? '' : data.slice(i, i + len); };
const lore = readFileSync('C:/AI Workspace/Hobby/The Unwritten/The_Unwritten_Design_Log.md', 'utf8').slice(0, 14000);
const world = [pick('const allyNames', 2600), pick('export const ZONES', 2400), pick('export const REALMS', 2600)].join('\n\n');

const NEEDS = `Write these pieces of in-game text (short, phone screen, plain words, gothic but not purple; no real-world religion; no slurs):
1. Cold open: 3 lines shown before the first tap (the hero falls into the Lanternfall).
2. Guided start: 6 one-line prompts (tap the foe; buy a hero level; hire your first Named; beat the boss before the candle burns out; spend a class point in Skills; claim a quest).
3. First-fall card: a title and 4 short lines (fall, escape the realm, Embers, return stronger with relics).
4. Glossary for players: one line each for Stage, Land, Realm, Life, Fall, Escape, Embers, Relics, Named, Marks, Keys, Scars, Cleave, Immune, Class points, Race points, Transformation points.
5. Named barks: for each of the 10 Named, one line when first hired and one when they reach a milestone level.
6. The Hollow Bishop: 5 short lines, one per meeting (every 50 stages).
7. Realm flavour: one line per realm shown on the fall banner.
8. Land arrival: one line per land when you first reach it.
9. Welcome back: 5 varied one-line greetings.
10. itch.io: a 1-sentence hook and a 3-sentence description.`;

const draft = textOf(await message(HAIKU, [{ type: 'text', text: `You write text for a phone idle RPG spin-off of an indie game called The Unwritten.
MAIN GAME LORE AND TONE (excerpt of the creator's design log):\n${lore}\n\nTHIS GAME'S WORLD (names from the code):\n${world}\n\n${NEEDS}` }], { maxTokens: 6000, tag: 'j3-story' }));
writeFileSync(`${OUT}/draft-haiku.md`, draft);

const polished = textOf(await message(SONNET, [{ type: 'text', text: `You are the lead writer. Polish this draft into one consistent voice: terse, haunted, a little dry humour, every line short enough for a phone.
Keep the numbering and every requested piece. Fix anything that contradicts the world names below or uses real-world religion. Keep names exactly as given.
WORLD NAMES:\n${world}\n\nDRAFT:\n${draft}` }], { maxTokens: 6000, tag: 'j3-story' }));
writeFileSync(`${OUT}/text-drafts.md`, `# Story, dialogue and item text (j3: Haiku draft, Sonnet polish, about $${spentUsd().toFixed(2)})\n\nNot in the game yet; for Clarence to approve.\n\n${polished}\n`);
console.log(`done j3: $${spentUsd().toFixed(2)}`);
