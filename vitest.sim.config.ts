import { defineConfig } from 'vitest/config';
// Pacing simulation (slow, prints a table): npm run sim
export default defineConfig({ test: { include: ['scripts/*.sim.ts'], testTimeout: 900000 } });
