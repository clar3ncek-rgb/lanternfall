import { defineConfig } from 'vitest/config';

// Relative asset paths so the built game works from any host (the private Claude link).
export default defineConfig({
  base: './',
  test: { include: ['tests/**/*.test.ts'] },
});
