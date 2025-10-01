import 'dotenv/config'; // Loads environment variables from .env
import * as path from 'path'; // Required for resolving local paths
import { migrate } from "drizzle-orm/pglite/migrator";
import { initDatabaseClient, getDb, getPgliteConnection } from './db'; // Import new setup functions

const runMigrate = async () => {
    const databaseName = process.env.DATABASE_NAME;
    if (!databaseName) {
        throw new Error('DATABASE_NAME is not defined in the environment. Please check your .env file.');
    }

    // 1. Resolve the path: Convert the relative path from .env (e.g., './database/')
    // to an absolute path, which is required by initDatabaseClient for local execution.
    const absoluteDbPath = path.resolve(databaseName);

    // 2. Initialize the DB client using the new shared function
    await initDatabaseClient(absoluteDbPath);

    // 3. Get the initialized database client and connection
    const db = getDb();
    const pgliteConnection = getPgliteConnection();

    console.log('⏳ Running migrations...');

    try {
        const start = Date.now();
        // 4. Run the migration
        await migrate(db, {migrationsFolder: './migrations'});
        const end = Date.now();

        console.log('✅ Migrations completed in', end - start, 'ms');
    } catch (error) {
        console.error('❌ Migration failed during execution.');
        throw error;
    } finally {
        // 5. Always close the connection after running migrations
        await pgliteConnection.close();
    }
};

runMigrate().catch((err) => {
    console.error('❌ Migration script failed unexpectedly.');
    console.error(err);
    process.exit(1);
});
