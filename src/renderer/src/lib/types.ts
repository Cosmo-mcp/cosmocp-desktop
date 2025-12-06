import {ModelProviderTypeEnum} from "core/database/schema/modelProviderSchema";


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
    [ModelProviderTypeEnum.OLLAMA]: {
        name: 'Ollama',
        description: 'Access a range of open-source and customizable language models for various AI tasks.'
    },
    [ModelProviderTypeEnum.CUSTOM]: {
        name: 'Custom',
        description: 'Connect to any OpenAI-compatible API endpoint.'
    }
};
