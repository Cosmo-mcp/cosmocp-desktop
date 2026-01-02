'use client';

import type {UIMessage} from 'ai';
import {type Dispatch, memo, type SetStateAction, useCallback, useEffect, useRef, useState,} from 'react';
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
import equal from 'fast-deep-equal';
import type {UseChatHelpers} from '@ai-sdk/react';
import type {Attachment} from '@/lib/types';
import {ProviderWithModels} from "core/dto";
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
import log from 'electron-log/renderer';

function PureMultimodalInput({
                                 input,
                                 setInput,
                                 status,
                                 attachments,
                                 sendMessage,
                                 onModelChange,
                                 modelId,
                                 providerName
                             }: {
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    status: UseChatHelpers<UIMessage>['status'];
    attachments: Array<Attachment>;
    messages: Array<UIMessage>;
    sendMessage: UseChatHelpers<UIMessage>['sendMessage'];
    className?: string;
    stillAnswering?: boolean,
    modelId: string | null,
    providerName: string | null
    onModelChange: (providerName: string, modelId: string) => void;
}) {
    const [selectedModelId, setSelectedModelId] = useState<string | null>(modelId);
    const [selectedProviderName, setSelectedProviderName] = useState<string | null>(providerName);
    const [providers, setProviders] = useState<ProviderWithModels[]>([]);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        window.api.modelProvider.getProvidersWithModels()
            .then((providers) => {
                setProviders(providers);
                if (!selectedProviderName && !selectedModelId && providers.length > 0) {
                    setSelectedProviderName((providers[0].name));
                    if (providers[0].models.length > 0) {
                        setSelectedModelId(providers[0]?.models[0]?.modelId);
                    } else {
                        log.error('No model found for provider ' + providers[0].name);
                    }
                }

            })
            .catch((error) => log.error(error));
    }, []);
    const submitForm = useCallback(() => {
        if (!selectedModelId) {
            return;
        }
        const modelId = selectedProviderName + ":" + selectedModelId
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
    }, [selectedModelId, selectedProviderName, sendMessage, attachments, input, setInput]);

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
                            <PromptInputActionMenuTrigger/>
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
                                    {selectedModelId ? (
                                        <ModelSelectorName>
                                            {selectedModelId}
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
                                                            setSelectedProviderName(provider.name);
                                                            setSelectedModelId(m.modelId);
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
                                                        {selectedProviderName === provider.name &&
                                                        selectedModelId === m.modelId ? (
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

export const MultimodalInput = memo(
    PureMultimodalInput,
    (prevProps, nextProps) => {
        if (prevProps.input !== nextProps.input) return false;
        if (prevProps.stillAnswering !== nextProps.stillAnswering) return false;
        if (!equal(prevProps.attachments, nextProps.attachments)) return false;
        return prevProps.status !== nextProps.status;
    },
);