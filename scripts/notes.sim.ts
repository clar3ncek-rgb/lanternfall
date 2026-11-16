// Writes PATCH_NOTES.md from the game data: npx vitest run --config vitest.sim.config.ts scripts/notes.sim.ts
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { patchNotesMarkdown } from '../src/ui/patchnotes';

it('writes PATCH_NOTES.md', () => {
  writeFileSync(new URL('../PATCH_NOTES.md', import.meta.url), patchNotesMarkdown());
});
