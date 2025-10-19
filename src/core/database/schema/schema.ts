import {InferSelectModel, InferInsertModel} from "drizzle-orm";
import {pgTable, text, timestamp, uuid, pgEnum} from "drizzle-orm/pg-core";
import {ModelProviderTypeEnum} from "@database/schema/modelProviderSchema";

export const providerTypeEnum = pgEnum('provider_type', [
    ModelProviderTypeEnum.OPENAI,
    ModelProviderTypeEnum.ANTHROPIC,
    ModelProviderTypeEnum.GOOGLE,
    ModelProviderTypeEnum.CUSTOM,
]);

export const modelProvider = pgTable("ModelProvider", {
    // Service-set fields
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt"),

    // Discriminator
    type: providerTypeEnum("type").notNull(),

    // User-editable fields
    nickName: text("nickName"),
    apiKey: text("apiKey").notNull(),

    // Optional for Predefined, required for Custom
    apiUrl: text("apiUrl"),
});

export const chat = pgTable("Chat", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
});

export const message = pgTable("Message", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
        .notNull()
        // No circular import issue here as 'chat' is defined directly above
        .references(() => chat.id),
    text: text("title").notNull(),
    createdAt: timestamp("createdAt").notNull(),
});

export type ModelProvider = InferSelectModel<typeof modelProvider>;
export type ModelProviderInsert = InferInsertModel<typeof modelProvider>;
export type Chat = InferSelectModel<typeof chat>;
export type Message = InferSelectModel<typeof message>;