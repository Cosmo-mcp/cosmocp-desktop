'use client';

import type {UIMessage} from 'ai';
import {useCallback, useEffect, useMemo, useState,} from 'react';
import {toast} from 'sonner';
import {
    PromptInput,
    PromptInputActionAddAttachments,
    PromptInputActionMenu,
    PromptInputActionMenuContent,
    PromptInputActionMenuTrigger,
    PromptInputAttachment,
    PromptInputAttachments,
    PromptInputBody,
    PromptInputButton,
    PromptInputFooter,
    PromptInputHeader,
    PromptInputProvider,
    PromptInputSelect,
    PromptInputSelectContent,
    PromptInputSelectItem,
    PromptInputSelectTrigger,
    PromptInputSelectValue,
    PromptInputSubmit,
    PromptInputMentionsTextarea,
    PromptInputSelect,
    PromptInputSelectContent,
    PromptInputSelectItem,
    PromptInputSelectTrigger,
    PromptInputSelectValue,
    PromptInputTools,
    type PromptInputMessage
} from './ai-elements/prompt-input';
import type {UseChatHelpers} from '@ai-sdk/react';
import {Chat, Persona, ProviderWithModels} from "core/dto";
import {
    ModelSelector,
    ModelSelectorContent,
    ModelSelectorEmpty,
    ModelSelectorGroup,
    ModelSelectorInput,
    ModelSelectorItem,
    ModelSelectorList,
    ModelSelectorLogo,
    ModelSelectorName,
    ModelSelectorTrigger
} from "@/components/ai-elements/model-selector";
import {CheckIcon} from "lucide-react";
import {ModelModalityEnum} from "core/database/schema/modelProviderSchema";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {logger} from "../../logger";

export function MultimodalInput({
                                    chat,
                                    status,
                                    sendMessage,
                                    onModelChange,
                                    onPersonaChange,
                                }: {
    chat: Chat;
    status: UseChatHelpers<UIMessage>['status'];
    messages: Array<UIMessage>;
    sendMessage: UseChatHelpers<UIMessage>['sendMessage'];
    className?: string;
    stillAnswering?: boolean,
    onModelChange: (providerName: string, modelId: string) => void;
    onPersonaChange: (personaId: string | null) => void;
}) {
    const [input, setInput] = useState<string>('');
    const [providers, setProviders] = useState<ProviderWithModels[]>([]);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | undefined>(undefined);

    useEffect(() => {
        window.api.modelProvider.getProvidersWithModels()
            .then(fetchedProviders => setProviders(fetchedProviders))
            .catch(error => logger.error(error));
    }, []);

    useEffect(() => {
        window.api.persona.getAll()
            .then(fetchedPersonas => setPersonas(fetchedPersonas))
            .catch(error => logger.error(error));
    }, []);

    const selectedModelInfo = useMemo(() => {
        if (providers.length === 0) return undefined;
        if (chat.selectedProvider && chat.selectedModelId) {
            const provider = providers.find(p => p.name === chat.selectedProvider);
            if (provider) {
                return provider.models.find(m => m.modelId === chat.selectedModelId);
            }
        }
        return undefined;
    }, [providers, chat.selectedProvider, chat.selectedModelId]);

    // Auto-select first available model if none selected.
    useEffect(() => {
        if (providers.length === 0) return;

        if (chat.selectedProvider && chat.selectedModelId) {
            return;
        }

        const firstProvider = providers.find(p => p.models.length > 0);
        if (firstProvider) {
            const firstModel = firstProvider.models[0];
            if (firstModel) {
               onModelChange(firstProvider.name, firstModel.modelId);
            }
        }
    }, [providers, chat.selectedProvider, chat.selectedModelId, onModelChange]);

    const submitForm = useCallback((message: PromptInputMessage) => {
        if (!chat.selectedModelId) {
            return;
        }
        const modelId = chat.selectedProvider + ":" + chat.selectedModelId

        sendMessage({
            text: message.text,
            files: message.files
        }, {
            metadata: {modelId}
        }).catch((error) => {
            toast.error(error.message);
        }).finally(() => {
            setInput('');
        })
    }, [chat.selectedModelId, chat.selectedProvider, sendMessage]);

    const personaOptions = useMemo(() => {
        return personas
            .map((persona) => ({
                id: persona.id ?? persona.name ?? '',
                name: persona.name ?? ''
            }))
            .filter((persona) => persona.id && persona.name);
    }, [personas]);

    const personaMentionData = useMemo(() => {
        return personaOptions.map((persona) => ({
            id: persona.id,
            display: persona.name
        }));
    }, [personaOptions]);

    return (
        <PromptInputProvider>
            <PromptInput globalDrop multiple onSubmit={submitForm}>
                <PromptInputHeader>
                    <PromptInputAttachments>
                        {(attachment) => <PromptInputAttachment data={attachment}/>}
                    </PromptInputAttachments>
                </PromptInputHeader>
                <PromptInputBody>
                    <PromptInputMentionsTextarea
                        mentionData={personaMentionData}
                        onChange={(value) => setInput(value)}
                        onMentionAdd={(id) => setSelectedPersonaId(id)}
                        value={input}
                    />
                </PromptInputBody>
                <PromptInputFooter>
                    <PromptInputTools>
                        <PromptInputActionMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <PromptInputActionMenuTrigger disabled={!selectedModelInfo?.inputModalities.includes(ModelModalityEnum.IMAGE)}>
                                        </PromptInputActionMenuTrigger>
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {selectedModelInfo?.inputModalities.includes(ModelModalityEnum.IMAGE) ? (
                                        <p>Attach Images</p>
                                    ) : (
                                        <p>Images not supported by selected Model</p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                            <PromptInputActionMenuContent>
                                <PromptInputActionAddAttachments/>
                            </PromptInputActionMenuContent>
                        </PromptInputActionMenu>
                        <ModelSelector
                            onOpenChange={setModelSelectorOpen}
                            open={modelSelectorOpen}
                        >
                            <ModelSelectorTrigger asChild>
                                <PromptInputButton className="w-max">
                                    {chat.selectedModelId ? (
                                        <ModelSelectorName>
                                            {chat.selectedModelId}
                                        </ModelSelectorName>
                                    ) : ('Select Model')}
                                </PromptInputButton>
                            </ModelSelectorTrigger>
                            <ModelSelectorContent>
                                <ModelSelectorInput placeholder="Search models..."/>
                                <ModelSelectorList>
                                    <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                                    {providers.map((provider) => (
                                        <ModelSelectorGroup heading={provider.name}
                                                            key={provider.name}>
                                            {provider.models
                                                .map((m) => (
                                                    <ModelSelectorItem
                                                        key={m.modelId}
                                                        onSelect={() => {
                                                            setModelSelectorOpen(false);
                                                            onModelChange(provider.name, m.modelId);
                                                        }}
                                                        value={m.modelId}
                                                    >
                                                        <ModelSelectorName>{m.name}</ModelSelectorName>
                                                        <ModelSelectorLogo
                                                            key={provider.type.toString()}
                                                            provider={provider.type.toString()}
                                                        />
                                                        {chat.selectedProvider === provider.name &&
                                                        chat.selectedModelId === m.modelId ? (
                                                            <CheckIcon className="ml-auto size-4"/>
                                                        ) : (
                                                            <div className="ml-auto size-4"/>
                                                        )}
                                                    </ModelSelectorItem>
                                                ))}
                                        </ModelSelectorGroup>
                                    ))}
                                </ModelSelectorList>
                            </ModelSelectorContent>
                        </ModelSelector>
                        <PromptInputSelect
                            onValueChange={setSelectedPersonaId}
                            value={selectedPersonaId}
                        >
                            <PromptInputSelectTrigger className="w-max">
                                <PromptInputSelectValue placeholder="Persona"/>
                            </PromptInputSelectTrigger>
                            <PromptInputSelectContent>
                                {personaOptions.map((persona) => (
                                    <PromptInputSelectItem
                                        key={persona.id}
                                        value={persona.id}
                                    >
                                        {persona.name}
                                    </PromptInputSelectItem>
                                ))}
                            </PromptInputSelectContent>
                        </PromptInputSelect>
                    </PromptInputTools>
                    <PromptInputSubmit
                        disabled={!input || !chat.selectedModelId || status !== 'ready'}
                        status={status}
                    />
                </PromptInputFooter>
            </PromptInput>
        </PromptInputProvider>
    );
}
