import {pgTable, text, timestamp, uuid,} from "drizzle-orm/pg-core";

export const chat = pgTable("Chat", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
});

export const message = pgTable("Message", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
        .notNull()
        .references(() => chat.id),
    text: text("title").notNull(),
    createdAt: timestamp("createdAt").notNull(),
});