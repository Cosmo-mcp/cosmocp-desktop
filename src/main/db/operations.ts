import { getDb } from './db';
import { table } from './schema';
import { InferSelectModel } from 'drizzle-orm';

export type TestItem = InferSelectModel<typeof table>;

/**
 * Reads all records from the 'test' table.
 * This is the function you will invoke from your Electron main process.
 * * @returns A promise that resolves to an array of test records.
 */
export async function readTestItems(): Promise<TestItem[]> {
    console.log('Fetching all test items from the database...');
    try {
        const db = getDb();
        const allRecords = await db.select().from(table);
        console.log(`Successfully fetched ${allRecords.length} records.`);
        return allRecords;
    } catch (error) {
        console.error('Error reading test items:', error);
        throw new Error('Database read operation failed.');
    }
}
