import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, '.vite/preload'),
    lib: {
      entry: './src/preload/index.ts',
      formats: ['cjs']
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});