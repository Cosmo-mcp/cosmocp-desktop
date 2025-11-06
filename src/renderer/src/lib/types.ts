import type {UIMessage} from 'ai';
import {z} from "zod";
import {ModelProviderTypeEnum} from "core/database/schema/modelProviderSchema";

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

export const ProviderInfo: Record<ModelProviderTypeEnum, { name: string; description: string }> = {
    [ModelProviderTypeEnum.OPENAI]: {
        name: 'OpenAI',
        description: 'Access state-of-the-art models like GPT-4 and GPT-3.5.'
    },
    [ModelProviderTypeEnum.ANTHROPIC]: {
        name: 'Anthropic',
        description: 'Utilize the Claude family of models, known for safety and performance.'
    },
    [ModelProviderTypeEnum.GOOGLE]: {
        name: 'Google',
        description: 'Leverage the powerful Gemini family of models from Google AI.'
    },
    [ModelProviderTypeEnum.CUSTOM]: {
        name: 'Custom',
        description: 'Connect to any OpenAI-compatible API endpoint.'
    }
};
