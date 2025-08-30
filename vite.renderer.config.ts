import {defineConfig} from 'vite';
import path from "path";

export default defineConfig({
  root: './src/renderer/out/', // This tells Vite where to find index.html
  build: {
      outDir: path.resolve(__dirname, '.vite/renderer/main_window'), // This is where Vite outputs the renderer assets
  },
});