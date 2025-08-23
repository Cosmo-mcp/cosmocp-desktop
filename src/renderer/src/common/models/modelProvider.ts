import {z} from 'zod';

export const enum ModelProviderType {
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    GOOGLE = 'google',
    CUSTOM = 'custom',
}

export const ProviderInfo: Record<ModelProviderType, { name: string; description: string }> = {
    [ModelProviderType.OPENAI]: {
        name: 'OpenAI',
        description: 'Access state-of-the-art models like GPT-4 and GPT-3.5.'
    },
    [ModelProviderType.ANTHROPIC]: {
        name: 'Anthropic',
        description: 'Utilize the Claude family of models, known for safety and performance.'
    },
    [ModelProviderType.GOOGLE]: {
        name: 'Google',
        description: 'Leverage the powerful Gemini family of models from Google AI.'
    },
    [ModelProviderType.CUSTOM]: {
        name: 'Custom',
        description: 'Connect to any OpenAI-compatible API endpoint.'
    }
};

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
