import type {UIMessage} from 'ai';
import {z} from "zod";
import {ModelProvider} from 'cosmo-commons/models/modelProvider';

export const messageMetadataSchema = z.object({
    createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export type CustomUIDataTypes = {
    textDelta: string;
    imageDelta: string;
    sheetDelta: string;
    codeDelta: string;
    appendMessage: string;
    id: string;
    title: string;
    clear: null;
    finish: null;
};


export type ChatMessage = UIMessage<MessageMetadata, CustomUIDataTypes>;

export interface Attachment {
    name: string;
    url: string;
    contentType: string;
}

// TODO: fix imports, same copied from src/common/models/modelProvider.ts, file import not working
const PREDEFINED_PROVIDER_TYPES = ['openai', 'anthropic', 'google'] as const;
type PredefinedProviderType = typeof PREDEFINED_PROVIDER_TYPES;
export const ModelProviderTypes = {
    predefined: PREDEFINED_PROVIDER_TYPES,
    custom: 'custom' as const,
};

interface BaseUserEditableFields {
    name: string;
    apiKey: string;
    comment?: string;
    metadata?: Record<string, any>; // TODO(shashank): review necessity later
}

// Create-time types (no service fields yet)
interface PredefinedModelProviderCreate extends BaseUserEditableFields {
    type: PredefinedProviderType;
    apiUrl?: string; // optional at create time
}

export interface CustomModelProviderCreate extends BaseUserEditableFields {
    type: typeof ModelProviderTypes.custom;
    apiUrl: string; // required
}

export type ModelProviderCreate = PredefinedModelProviderCreate | CustomModelProviderCreate;

export type ProviderLite = Omit<ModelProvider, "apiKey">[];