'use client';

import type {UIMessage} from 'ai';
import {type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState,} from 'react';
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
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
} from './ai-elements/prompt-input';
import type {UseChatHelpers} from '@ai-sdk/react';
import type {Attachment} from '@/lib/types';
import {Chat, ModelLite, ProviderWithModels} from "core/dto";
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
                                    input,
                                    setInput,
                                    status,
                                    attachments,
                                    sendMessage,
                                    onModelChange,
                                }: {
    chat: Chat;
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    status: UseChatHelpers<UIMessage>['status'];
    attachments: Array<Attachment>;
    messages: Array<UIMessage>;
    sendMessage: UseChatHelpers<UIMessage>['sendMessage'];
    className?: string;
    stillAnswering?: boolean,
    onModelChange: (providerName: string, modelId: string) => void;
}) {
    const [selectedModelInfo, setSelectedModelInfo] = useState<ModelLite | undefined>(undefined);
    const [providers, setProviders] = useState<ProviderWithModels[]>([]);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        window.api.modelProvider.getProvidersWithModels()
            .then((providers) => {
                setProviders(providers);
                if (chat.selectedProvider) {
                    const provider = providers.find(provider => provider.name === chat.selectedProvider);
                    if (provider) {
                        setSelectedModelInfo(provider.models.find((model) => model.modelId === chat.selectedModelId));
                    }
                }
            })
            .catch((error) => logger.error(error));
    }, [chat]);
    const submitForm = useCallback(() => {
        if (!chat.selectedModelId) {
            return;
        }
        const modelId = chat.selectedProvider + ":" + chat.selectedModelId
        sendMessage({
            role: 'user',
            parts: [
                ...attachments.map((attachment) => ({
                    type: 'file' as const,
                    url: attachment.url,
                    name: attachment.name,
                    mediaType: attachment.contentType,
                })),
                {
                    type: 'text',
                    text: input,
                },
            ],
        }, {
            metadata: {modelId}
        }).then(() => {
            // TODO: use if reqd
        }).catch((error) => {
            toast.error(error.message);
            // TODO: use if reqd
        }).finally(() => {
            setInput('');
        })
    }, [chat.selectedModelId, chat.selectedProvider, sendMessage, attachments, input, setInput]);

    const handlePromptSubmit = () => {
        submitForm();
    }

    function saveSelectedModelPreference(providerName: string, modelId: string) {
        onModelChange(providerName, modelId);
    }

    return (
        <PromptInputProvider>
            <PromptInput globalDrop multiple onSubmit={handlePromptSubmit}>
                <PromptInputHeader>
                    <PromptInputAttachments>
                        {(attachment) => <PromptInputAttachment data={attachment}/>}
                    </PromptInputAttachments>
                </PromptInputHeader>
                <PromptInputBody>
                    <PromptInputTextarea
                        onChange={(e) => setInput(e.target.value)}
                        ref={textareaRef}
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
                                        <p>Images not supported my selected Model</p>
                                    )}

                                </TooltipContent>
                            </Tooltip>
                            <PromptInputActionMenuContent>
                                <PromptInputActionAddAttachments label="Add Photos"

                                />
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
                                                            saveSelectedModelPreference(provider.name, m.modelId);
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
                    </PromptInputTools>
                    <PromptInputSubmit disabled={!input && !status} status={status}/>
                </PromptInputFooter>
            </PromptInput>
        </PromptInputProvider>
    );
}