import {defineConfig} from 'vite';
import path from 'path';

export default defineConfig({
    optimizeDeps: {
        exclude: ['@electric-sql/pglite']
    },
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