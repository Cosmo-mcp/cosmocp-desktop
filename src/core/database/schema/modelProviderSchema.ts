import {pgTable, text, timestamp, uuid, pgEnum} from "drizzle-orm/pg-core";
import {InferSelectModel, InferInsertModel} from "drizzle-orm";

// --- ENUM and Base Fields ---
export const ModelProviderTypeEnum = {
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    GOOGLE: 'google',
    CUSTOM: 'custom',
} as const;

export const PredefinedProviders = [
    ModelProviderTypeEnum.OPENAI,
    ModelProviderTypeEnum.ANTHROPIC,
    ModelProviderTypeEnum.GOOGLE,
] as const;

export const CustomProvider = ModelProviderTypeEnum.CUSTOM;

// Define the ModelProviderType enum for PostgreSQL
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

// --- Drizzle Types ---
// The full model, retrieved from the database with a decrypted apiKey.
export type ModelProvider = InferSelectModel<typeof modelProvider>;
// The raw type used for inserting a record into the database.
export type ModelProviderInsert = InferInsertModel<typeof modelProvider>;

// New type for user input, omitting DB-managed fields.
export type ModelProviderCreateInput = Omit<ModelProviderInsert, 'id' | 'createdAt' | 'updatedAt'>;

// The safe model for sending to the renderer process (no API key).
export type ModelProviderLite = Omit<ModelProvider, "apiKey">;

// Simple Model interface (kept here for full context)
export interface Model {
    id: string;
    name: string;
    description: string;
}
