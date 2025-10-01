import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;
let pgliteConnectionInstance: PGlite | null = null;

export function getDb() {
    if (!dbInstance) {
        throw new Error('Database client not initialized. Call initDatabaseClient() first.');
    }
    return dbInstance;
}

export function getPgliteConnection() {
    if (!pgliteConnectionInstance) {
        throw new Error('PGlite connection not initialized. Call initDatabaseClient() first.');
    }
    return pgliteConnectionInstance;
}

export type DBClient = ReturnType<typeof getDb>;

/**
 * Initializes the PGlite connection and Drizzle client.
 * This MUST be called from the Electron main process (after app.ready()) or the migration script.
 * @param absoluteDbPath - The absolute filesystem path where the database file will be stored.
 */
export async function initDatabaseClient(absoluteDbPath: string) {
    if (dbInstance) {
        console.warn('[DB INIT] Database client already initialized.');
        return;
    }

    console.log(`[DB INIT] Attempting to connect PGlite to absolute path: ${absoluteDbPath}`);

    try {
        const connection = new PGlite(absoluteDbPath);

        pgliteConnectionInstance = connection;
        dbInstance = drizzle(connection, { schema });

        console.log('[DB INIT] Drizzle client successfully initialized.');
    } catch (error) {
        console.error('[DB INIT] Failed to initialize database client:', error);
        throw error;
    }
}
