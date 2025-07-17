import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, '.vite/build'),
    lib: {
      entry: './src/main/index.ts',
      formats: ['cjs'],
      fileName: 'main'
    },
    sourcemap: true,
    emptyOutDir: true, // Ensures a clean build every time
  },
  // You might have other Vite specific configurations here, like define, resolve, etc.
});