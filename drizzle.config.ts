import {defineConfig} from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/main/db/schema.ts",
    driver: "pglite",
    dbCredentials: {
        //database folder
        url: "./cosmodb/"
    },
    out: './migrations',
});