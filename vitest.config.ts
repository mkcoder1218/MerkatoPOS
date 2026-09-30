import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['apps/**/*.spec.ts', 'packages/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@merkatopos/database': new URL('./packages/database/src/index.ts', import.meta.url).pathname,
      '@merkatopos/shared': new URL('./packages/shared/src/index.ts', import.meta.url).pathname,
    },
  },
});
