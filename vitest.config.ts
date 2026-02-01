import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    environment: 'node',
    include: [
      'packages/**/*.test.ts',
      'scripts/**/*.test.ts',
      'src/main/**/*.test.ts',
      'src/preload/**/*.test.ts',
    ],
  },
});
