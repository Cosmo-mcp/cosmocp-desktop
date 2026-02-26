import {relations} from "drizzle-orm";
import {boolean, pgEnum, pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";

// --- ENUM and Base Fields ---
export enum ModelProviderTypeEnum {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    GOOGLE = 'google',
    XAI = 'xai',
    GROQ = 'groq',
    MISTRAL = 'mistral',
    OLLAMA = 'ollama',
    MOONSHOT = 'moonshotai',
    CUSTOM = 'custom',
}

export const providerTypeEnum = pgEnum('provider_type', [
    ModelProviderTypeEnum.OPENAI,
    ModelProviderTypeEnum.ANTHROPIC,
    ModelProviderTypeEnum.GOOGLE,
    ModelProviderTypeEnum.XAI,
    ModelProviderTypeEnum.GROQ,
    ModelProviderTypeEnum.MISTRAL,
    ModelProviderTypeEnum.OLLAMA,
    ModelProviderTypeEnum.MOONSHOT,
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
    name: text("name").notNull().unique(),
    apiKey: text("apiKey").notNull(),

    // Optional for Predefined, required for Custom
    apiUrl: text("apiUrl"),
});

export enum ModelStatusEnum {
    NOT_DEFINED = `not_defined`,
    DEPRECATED = `deprecated`,
}

export const modelStatusEnum = pgEnum("model_status", [
    ModelStatusEnum.NOT_DEFINED,
    ModelStatusEnum.DEPRECATED
]);

export enum ModelModalityEnum {
    TEXT = 'text',
    IMAGE = 'image',
    AUDIO = 'audio',
    VIDEO = 'video',
    PDF = 'pdf',
}

export const modelModalityEnum = pgEnum('model_modality', [
    ModelModalityEnum.TEXT,
    ModelModalityEnum.IMAGE,
    ModelModalityEnum.AUDIO,
    ModelModalityEnum.VIDEO,
    ModelModalityEnum.PDF,
]);

export const model = pgTable("Model", {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt"),
    name: text("name").notNull(),
    modelId: text("modelId").notNull(),
    description: text("description"),
    providerId: uuid("providerId").references(() => modelProvider.id, {onDelete: 'cascade'}),
    reasoning: boolean("reasoning").default(false),
    attachment: boolean("attachment").default(false),
    toolCall: boolean("toolCall").default(false),
    status: modelStatusEnum("status").default(ModelStatusEnum.NOT_DEFINED),
    inputModalities: modelModalityEnum("input_modalities").array().notNull().default([]),
    outputModalities: modelModalityEnum("output_modalities").array().notNull().default([]),
    releaseDate: timestamp("releaseDate"),
    lastUpdatedByProvider: timestamp("lastUpdatedByProvider")
});

export const modelProviderRelations = relations(modelProvider, ({ many }) => ({
    models: many(model),
}));

export const modelRelations = relations(model, ({ one }) => ({
    provider: one(modelProvider, {
        fields: [model.providerId],
        references: [modelProvider.id],
    }),
}));
