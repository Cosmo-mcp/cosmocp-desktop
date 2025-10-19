import {InferInsertModel, InferSelectModel} from "drizzle-orm";
import {modelProvider} from "@database/schema/schema";

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
