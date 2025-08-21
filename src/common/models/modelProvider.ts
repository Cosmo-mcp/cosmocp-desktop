import {z} from 'zod';

export const enum ModelProviders {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    GOOGLE = 'google',
    CUSTOM = 'custom',
}

export const PredefinedProviders = [
    ModelProviders.OPENAI,
    ModelProviders.ANTHROPIC,
    ModelProviders.GOOGLE,
] as const;

export const CustomProvider = [ModelProviders.CUSTOM] as const;

export type ProviderLite = Omit<ModelProvider, "apiKey">[];

// Fields that only the service sets, never user-provided
const ServiceOnlyFields = {
    id: z.string().uuid(),
    createdAt: z.date(),
};

// Fields the user can set for both provider types
const BaseUserEditableFields = {
    name: z.string().min(1, 'Name is required'),
    apiKey: z.string().min(1, 'API key is required'),
    comment: z.string().optional(),
    metadata: z.record(z.any()).optional(), // TODO(shashank): decide later if we really need this
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
    type: z.enum(CustomProvider),
    apiUrl: z.string().url('Invalid API URL').optional(),
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
    type: z.enum(CustomProvider),
    apiUrl: z.string().url('Invalid API URL'), // required
});

export const ModelProviderCreateSchema = z.discriminatedUnion('type', [
    PredefinedModelProviderCreateSchema,
    CustomModelProviderCreateSchema,
]);

// Types
export type ModelProvider = z.infer<typeof ModelProviderSchema>;
export type ModelProviderCreate = z.infer<typeof ModelProviderCreateSchema>;
