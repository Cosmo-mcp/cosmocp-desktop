// Define the ModelProviderType enum for PostgreSQL
import {pgEnum, pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";

const ModelProviderTypeEnum = {
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    GOOGLE: 'google',
    CUSTOM: 'custom',
} as const;

export const providerTypeEnum = pgEnum('provider_type', [
    ModelProviderTypeEnum.OPENAI,
    ModelProviderTypeEnum.ANTHROPIC,
    ModelProviderTypeEnum.GOOGLE,
    ModelProviderTypeEnum.CUSTOM,
]);

// --- Drizzle Table Definition ---
export const modelProvider = pgTable("ModelProvider", {
    // Service-set fields
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt"),

    // Discriminator
    type: providerTypeEnum("type").notNull(),

    // User-editable fields
    nickName: text("nickName"),
    // API Key will be stored *encrypted*
    apiKey: text("apiKey").notNull(),

    // Optional for Predefined, required for Custom in Zod logic (now just nullable text)
    apiUrl: text("apiUrl"),
});