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
    PromptInputMessage,
    PromptInputProvider,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
} from './ai-elements/prompt-input';
import equal from 'fast-deep-equal';
import type {UseChatHelpers} from '@ai-sdk/react';
import type {Attachment, ChatMessage} from '@/lib/types';
import {ModelLite, ProviderWithModels} from "core/dto";
import {
    ModelSelector, ModelSelectorContent, ModelSelectorEmpty, ModelSelectorGroup, ModelSelectorInput,
    ModelSelectorItem, ModelSelectorList,
    ModelSelectorLogo, ModelSelectorLogoGroup,
    ModelSelectorName,
    ModelSelectorTrigger
} from "@/components/ai-elements/model-selector";
import {CheckIcon} from "lucide-react";
import {model} from "core/database/schema/modelProviderSchema";

function PureMultimodalInput({
                                 chatId,
                                 input,
                                 setInput,
                                 status,
                                 stop,
                                 attachments,
                                 setAttachments,
                                 sendMessage,
                                 selectedModelId,
                             }: {
    chatId: string;
    input: string;
    setInput: Dispatch<SetStateAction<string>>;
    status: UseChatHelpers<ChatMessage>['status'];
    stop: () => void;
    attachments: Array<Attachment>;
    setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
    messages: Array<UIMessage>;
    sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
    className?: string;
    stillAnswering?: boolean,
    selectedModelId: string;
    onModelChange?: (modelId: string) => void;
}) {
    const [text, setText] = useState<string>('');
    const [modelId, setModelId] = useState<string | undefined>(undefined);
    const [providers, setProviders] = useState<ProviderWithModels[]>([]);
    const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        window.api.modelProvider.getProvidersWithModels()
            .then((providers) => {
                setProviders(providers);
                if (providers.length > 0) {
                    setModelId(providers[0].models[0].modelId);
                }
            })
            .catch((error) => console.log(error));
    });
    const submitForm = useCallback(() => {
        if (!modelId) {
            return;
        }
        sendMessage({
            role: 'user',
            metadata: {modelId},
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
        }).then(() => {
            // TODO: use if reqd
        }).catch((error) => {
            toast.error(error.message);
            // TODO: use if reqd
        }).finally(() => {
            setText('');
        })
    }, [sendMessage, attachments, input, modelId]);

    const handlePromptSubmit = (message: PromptInputMessage) => {
        submitForm();
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
                        value={text}
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
                                <PromptInputButton className="w-48">
                                    {modelId && (
                                        <ModelSelectorName>
                                            {modelId}
                                        </ModelSelectorName>
                                    )}
                                </PromptInputButton>
                            </ModelSelectorTrigger>
                            <ModelSelectorContent>
                                <ModelSelectorInput placeholder="Search models..."/>
                                <ModelSelectorList>
                                    <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                                    {providers.map((provider) => (
                                        <ModelSelectorGroup heading={provider.type.toString()} key={provider.type.toString()}>
                                            {provider.models
                                                .map((m) => (
                                                    <ModelSelectorItem
                                                        key={m.modelId}
                                                        onSelect={() => {
                                                            setModelId(m.modelId);
                                                            setModelSelectorOpen(false);
                                                        }}
                                                        value={m.modelId}
                                                    >
                                                        <ModelSelectorName>{m.name}</ModelSelectorName>
                                                        <ModelSelectorLogoGroup>
                                                            {providers.map((provider) => (
                                                                <ModelSelectorLogo
                                                                    key={provider.type.toString()}
                                                                    provider={provider.type.toString()}
                                                                />
                                                            ))}
                                                        </ModelSelectorLogoGroup>
                                                        {modelId === m.modelId ? (
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
                    <PromptInputSubmit disabled={!text && !status} status={status}/>
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
        if (prevProps.status !== nextProps.status) return false;
        if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    },
);