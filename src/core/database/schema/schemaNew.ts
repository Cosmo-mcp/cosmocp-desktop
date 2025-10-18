import {InferSelectModel, InferInsertModel} from "drizzle-orm";
import {pgTable, text, timestamp, uuid, pgEnum} from "drizzle-orm/pg-core";

// ====================================================================
// 1. ModelProvider Schema & Enum
// ====================================================================

// Constants (Self-contained for Drizzle-kit compatibility)
const ModelProviderTypeEnum = {
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    GOOGLE: 'google',
    CUSTOM: 'custom',
} as const;

// Define the ModelProviderType enum for PostgreSQL
export const providerTypeEnum = pgEnum('provider_type', [
    ModelProviderTypeEnum.OPENAI,
    ModelProviderTypeEnum.ANTHROPIC,
    ModelProviderTypeEnum.GOOGLE,
    ModelProviderTypeEnum.CUSTOM,
]);

// Drizzle Table Definition
export const modelProvider = pgTable("ModelProvider", {
    // Service-set fields
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt"),

    // Discriminator
    // NOTE: I've UNCOMMENTED this based on your initial intention,
    // as it was missing from your last provided block.
    type: providerTypeEnum("type").notNull(),

    // User-editable fields
    nickName: text("nickName"),
    apiKey: text("apiKey").notNull(),

    // Optional for Predefined, required for Custom
    apiUrl: text("apiUrl"),
});

// ====================================================================
// 2. Chat Schema
// ====================================================================

export const chat = pgTable("Chat", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
});

// ====================================================================
// 3. Message Schema
// ====================================================================

export const message = pgTable("Message", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
        .notNull()
        // No circular import issue here as 'chat' is defined directly above
        .references(() => chat.id),
    text: text("title").notNull(),
    createdAt: timestamp("createdAt").notNull(),
});

// ====================================================================
// 4. TypeScript Exported Types (Optional for Drizzle-kit, useful for code)
// ====================================================================

export type ModelProvider = InferSelectModel<typeof modelProvider>;
export type ModelProviderInsert = InferInsertModel<typeof modelProvider>;
export type Chat = InferSelectModel<typeof chat>;
export type Message = InferSelectModel<typeof message>;