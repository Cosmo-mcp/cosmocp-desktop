import {integer, pgTable, smallint} from "drizzle-orm/pg-core";

//test schema, (TODO) remove
export const table = pgTable('test', {
    int: integer(),
    smallint: smallint()
});