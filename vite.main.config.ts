import {defineConfig} from 'vite';
import path from 'path';
import fs from 'fs';
import tsconfigPaths from "vite-tsconfig-paths";


const copyFolderRecursive = (source: string, target: string) => {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    // Copy all files and folders from source to target
    fs.readdirSync(source).forEach((file) => {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);

        if (fs.lstatSync(sourcePath).isDirectory()) {
            copyFolderRecursive(sourcePath, targetPath);
        } else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    });
};

// Custom Vite plugin to copy the migrations folder
const copyMigrationsPlugin = () => ({
    name: 'copy-migrations',
    // Hook into the build process after all modules are bundled but before the final output
    closeBundle() {
        // Define source and destination paths relative to the project root
        const sourceDir = path.resolve(__dirname, 'migrations');
        const targetDir = path.resolve(__dirname, '.vite/build', 'migrations');

        console.log(`[Vite Plugin] Copying migrations from ${sourceDir} to ${targetDir}`);

        try {
            copyFolderRecursive(sourceDir, targetDir);
            console.log('Migrations folder copied successfully.');
        } catch (e) {
            console.error('Failed to copy migrations folder:', e);
        }
    }
});

export default defineConfig({
    optimizeDeps: {
        exclude: ['@electric-sql/pglite']
    },
    build: {
        // If needed, mark PGlite as external so Vite does not bundle it
        rollupOptions: {
            external: ['@electric-sql/pglite']
        },
        outDir: path.resolve(__dirname, '.vite/build'),
        lib: {
            entry: './src/main/index.ts',
            formats: ['cjs'],
            fileName: 'main'
        },
        sourcemap: true,
        emptyOutDir: true, // Ensures a clean build every time
    },
    // Add the custom plugin to the plugins array
    plugins: [
        tsconfigPaths(),
        copyMigrationsPlugin()
    ],
    // You might have other Vite specific configurations here, like define, resolve, etc.
});