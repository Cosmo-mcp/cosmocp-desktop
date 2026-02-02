import {defineConfig} from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: [
            "packages/core/**/*.test.ts",
            "src/main/**/*.test.ts",
            "scripts/**/*.test.ts",
        ],
    },
});
