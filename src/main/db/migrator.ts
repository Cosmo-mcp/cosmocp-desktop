import {getDb} from "./db";
import { migrate } from "drizzle-orm/pglite/migrator";

/**
 * Executes pending database migrations against the initialized PGlite client.
 * This should be called immediately after initDatabaseClient() in the Electron main process.
 */
export async function runElectronMigrations() {
    console.log('Checking and running application migrations...');

    try {
        const db = getDb();
        const start = Date.now();

        await migrate(db, { migrationsFolder: 'migrations' });

        const end = Date.now();
        console.log(`Migrations checked/applied successfully in ${end - start} ms.`);

    } catch (error) {
        console.error('FATAL: Database migration failed during application startup.', error);
        throw new Error('Database initialization failed due to migration error.');
    }
}