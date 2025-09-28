import {config} from 'dotenv';
import {drizzle} from 'drizzle-orm/pglite';
import {PGlite} from "@electric-sql/pglite";
import {migrate} from "drizzle-orm/pglite/migrator";

config({
    path: '.env',
});

const runMigrate = async () => {
    if (!process.env.DATABASE_NAME) {
        throw new Error('DATABASE_NAME is not defined');
    }

    const connection = new PGlite(process.env.DATABASE_NAME);
    const db = drizzle(connection);

    console.log('⏳ Running migrations...');

    const start = Date.now();
    await migrate(db, {migrationsFolder: './migrations'});
    const end = Date.now();

    console.log('✅ Migrations completed in', end - start, 'ms');
};

runMigrate().catch((err) => {
    console.error('❌ Migration failed');
    console.error(err);
    process.exit(1);
});