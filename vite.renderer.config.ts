import { defineConfig } from 'vite';

export default defineConfig({
  root: './src/renderer', // This tells Vite where to find index.html
  build: {
    outDir: '.vite/renderer/main_window', // This is where Vite outputs the renderer assets
  },
});