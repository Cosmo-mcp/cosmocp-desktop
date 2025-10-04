import {getDb} from "./db";
import { migrate } from "drizzle-orm/pglite/migrator";
import path from "path";

/**
 * Executes pending database migrations against the initialized PGlite client.
 * This should be called immediately after initDatabaseClient() in the Electron main process.
 */
export async function runElectronMigrations() {
    console.log('Checking and running application migrations...');

    try {
        const db = getDb();
        const start = Date.now();
        const migrationDir = path.resolve(__dirname, "./migrations");
        await migrate(db, { migrationsFolder: migrationDir });

        const end = Date.now();
        console.log(`Migrations checked/applied successfully in ${end - start} ms.`);

    } catch (error) {
        console.error('FATAL: Database migration failed during application startup.', error);
        throw new Error('Database initialization failed due to migration error.');
    }
}