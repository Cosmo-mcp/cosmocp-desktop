import {json, pgTable, text, timestamp, uuid, varchar,} from "drizzle-orm/pg-core";
import {InferSelectModel} from "drizzle-orm";

export const chat = pgTable("chat", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("message", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
        .notNull()
        .references(() => chat.id),
    role: varchar("role").notNull(),
    parts: json("parts").notNull(),
    attachments: json("attachments").notNull(),
    createdAt: timestamp("createdAt").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;