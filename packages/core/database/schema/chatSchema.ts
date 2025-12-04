import {relations} from "drizzle-orm";
import {pgTable, text, timestamp, uuid, boolean} from "drizzle-orm/pg-core";

export const chat = pgTable("Chat", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    pinned: boolean("pinned").default(false),
    lastMessage: text("lastMessage"),
    lastMessageAt: timestamp("lastMessageAt"),
});

export const chatRelations = relations(chat, ({many}) => ({
    messages: many(message),
}));

export const message = pgTable("Message", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
        .notNull()
        .references(() => chat.id, {onDelete: 'cascade'}),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt").notNull(),
});

export const messageRelations = relations(message, ({one}) => ({
    chat: one(chat, {
        fields: [message.chatId],
        references: [chat.id],
    }),
}));