import {pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";
import {chat} from "@database/schema/chatSchema";

export const message = pgTable("Message", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
        .notNull()
        .references(() => chat.id),
    text: text("title").notNull(),
    createdAt: timestamp("createdAt").notNull(),
});