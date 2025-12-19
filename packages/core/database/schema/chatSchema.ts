import {relations} from "drizzle-orm";
import {pgTable, text, timestamp, uuid, boolean, pgEnum} from "drizzle-orm/pg-core";

export const chat = pgTable("Chat", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull().default(new Date()),
    title: text("title").notNull(),
    pinned: boolean("pinned").notNull().default(false),
    pinnedAt: timestamp("pinnedAt").default(new Date()),
    lastMessage: text("lastMessage"),
    lastMessageAt: timestamp("lastMessageAt"),
});

export const chatRelations = relations(chat, ({many}) => ({
    messages: many(message),
}));

export const messageRole = pgEnum("message_role", ["user", "assistant", "system"]);

export const message = pgTable("Message", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
        .notNull()
        .references(() => chat.id, {onDelete: 'cascade'}),
    role: messageRole("role"),
    text: text("text"),
    reasoning: text("reasoning"),
    createdAt: timestamp("createdAt").notNull(),
});

export const messageRelations = relations(message, ({one}) => ({
    chat: one(chat, {
        fields: [message.chatId],
        references: [chat.id],
    }),
}));