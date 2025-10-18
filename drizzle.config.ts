import {defineConfig} from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/core/database/schema/schemaNew.ts",
    driver: "pglite",
    dbCredentials: {
        //database folder
        url: "./cosmodb/"
    },
    out: './migrations',
});