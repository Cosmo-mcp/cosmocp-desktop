import {InferSelectModel} from "drizzle-orm";
import {chat, message} from "@database/schema";
import {z} from 'zod';

//full entity based dto
export type Message = InferSelectModel<typeof message>;
export type Chat = InferSelectModel<typeof chat>;

// DTOs for new database entry
export type NewChat = Omit<Chat, "id" | "createdAt">;

export const enum ModelProviderType {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    GOOGLE = 'google',
    CUSTOM = 'custom',
}

export const PredefinedProviders = [
    ModelProviderType.OPENAI,
    ModelProviderType.ANTHROPIC,
    ModelProviderType.GOOGLE,
] as const;

export const CustomProvider = ModelProviderType.CUSTOM as const;

// Fields that only the service sets, never user-provided
const ServiceOnlyFields = {
    id: z.string().uuid(),
    createdAt: z.date(),
};

// Fields the user can set for both provider types
const BaseUserEditableFields = {
    nickName: z.string().optional(),
    apiKey: z.string().min(1, 'API key is required'),
};

// Schema for service-level objects (full model with service-generated fields)
const PredefinedModelProviderSchema = z.object({
    ...ServiceOnlyFields,
    ...BaseUserEditableFields,
    type: z.enum(PredefinedProviders),
    apiUrl: z.string().url('Invalid API URL').optional(), // service may set this
});

const CustomModelProviderSchema = z.object({
    ...ServiceOnlyFields,
    ...BaseUserEditableFields,
    type: z.literal(CustomProvider),
    apiUrl: z.string().url('Invalid API URL'), // user must set,
});

export const ModelProviderSchema = z.discriminatedUnion('type', [
    PredefinedModelProviderSchema,
    CustomModelProviderSchema,
]);

// User-facing create schema - strips out service-only fields
const PredefinedModelProviderCreateSchema = z.object({
    ...BaseUserEditableFields,
    type: z.enum(PredefinedProviders),
    apiUrl: z.string().url('Invalid API URL').optional(), // user may omit
});

const CustomModelProviderCreateSchema = z.object({
    ...BaseUserEditableFields,
    type: z.literal(CustomProvider),
    apiUrl: z.string().url('Invalid API URL'), // required
});

export const ModelProviderCreateSchema = z.discriminatedUnion('type', [
    PredefinedModelProviderCreateSchema,
    CustomModelProviderCreateSchema,
]);

// Types
export type ModelProvider = z.infer<typeof ModelProviderSchema>;
export type ModelProviderCreate = z.infer<typeof ModelProviderCreateSchema>;

export type ModelProviderLite = Omit<ModelProvider, "apiKey">;

export interface ChatSendMessageArgs {
    chatId: string;
    messages: Message[];
    streamChannel: string;
}

export interface ChatAbortArgs {
    streamChannel: string;
}

export interface Model {
    id: string;
    name: string;
    description: string;
}
