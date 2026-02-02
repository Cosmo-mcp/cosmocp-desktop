import {pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";

export const slashCommand = pgTable("SlashCommand", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    name: text("name").notNull().unique(),
    description: text("description").notNull(),
    template: text("template").notNull(),
    argumentLabel: text("argumentLabel"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
