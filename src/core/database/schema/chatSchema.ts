import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import {InferSelectModel} from "drizzle-orm";

export const chat = pgTable("Chat", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
});

export type Chat = InferSelectModel<typeof chat>;