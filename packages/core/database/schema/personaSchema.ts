import {pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";

export const persona = pgTable("Persona", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
    name: text("name").notNull().unique(),
    details: text("details").notNull(),
});
