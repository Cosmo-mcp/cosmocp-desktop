import 'dotenv/config';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import { table } from './schema'

async function runTestQueries() {
    console.log('--- Starting PGlite/Drizzle ORM Test Queries ---');

    // 1. Connection Setup (Must match the setup in migrate.ts)
    const databaseName = process.env.DATABASE_NAME;
    if (!databaseName) {
        throw new Error('DATABASE_NAME is not defined in environment variables.');
    }

    // Initialize PGlite client with the persistent directory
    const connection = new PGlite(databaseName);
    const db = drizzle(connection);

    console.log(`Connection established to database folder: ${databaseName}`);

    let insertedId: number | undefined;

    try {
        // --- 2. CREATE (INSERT) ---
        console.log('\n[CREATE] Inserting new row...');
        const insertResult = await db.insert(table).values({
            // Note: Since 'int' and 'smallint' columns don't have auto-incrementing
            // primary keys defined in your schema, we must provide values,
            // and the 'returning()' clause might return an empty array if an ID isn't returned.
            int: 100,
            smallint: 5,
        }).returning();

        // Since no PK is defined, we'll try to find the inserted row later.
        console.log(`✅ Insert successful. Returning result:`, insertResult);


        // --- 3. READ (SELECT) ---
        console.log('\n[READ] Selecting all rows from "test" table...');
        const allRecords = await db.select().from(table);
        console.log('✅ Found records:', allRecords);

        // Use the first record found for the subsequent tests
        const testRecord = allRecords.find(r => r.int === 100 && r.smallint === 5);

        if (!testRecord) {
            console.warn('Could not reliably find the inserted test record for UPDATE/DELETE. Skipping these steps.');
            return;
        }

        // --- 4. UPDATE ---
        console.log(`\n[UPDATE] Updating record with int=100...`);

        // Since we don't have a unique ID, we use the values we inserted to find the row to update.
        await db.update(table)
            .set({ smallint: 50 })
            .where(eq(table.int, 100));

        const updatedRecords = await db.select().from(table).where(eq(table.int, 100));
        console.log('✅ Update successful. Verified record:', updatedRecords);


        // --- 5. DELETE ---
        console.log('\n[DELETE] Deleting the test row...');
        await db.delete(table).where(eq(table.int, 100));

        const finalRecords = await db.select().from(table).where(eq(table.int, 100));
        console.log('✅ Delete successful. Check for remaining records:', finalRecords);

    } catch (error) {
        console.error('❌ Test failed during database interaction:', error);
    } finally {
        // Close the PGlite client to release resources
        console.log('\nClosing PGlite connection.');
        await connection.close();
        console.log('--- Test Queries Complete ---');
    }
}

runTestQueries().catch((err) => {
    console.error('An unexpected error occurred during test execution:');
    console.error(err);
    process.exit(1);
});
