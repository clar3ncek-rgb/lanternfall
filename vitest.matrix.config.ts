import { defineConfig } from 'vitest/config';
// Race x class x faith matrix (slow, free): npx vitest run --config vitest.matrix.config.ts
export default defineConfig({ test: { include: ['scripts/*.matrix.ts'], testTimeout: 3600000 } });
