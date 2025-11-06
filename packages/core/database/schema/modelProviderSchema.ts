import {pgEnum, pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";

// --- ENUM and Base Fields ---
export enum ModelProviderTypeEnum {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    GOOGLE = 'google',
    CUSTOM = 'custom',
}

export const PredefinedProviders = [
    ModelProviderTypeEnum.OPENAI,
    ModelProviderTypeEnum.ANTHROPIC,
    ModelProviderTypeEnum.GOOGLE,
] as const;

export const CustomProvider = ModelProviderTypeEnum.CUSTOM;

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
