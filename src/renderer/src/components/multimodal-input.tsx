'use client';

import type {UIMessage} from 'ai';
import {type Dispatch, memo, type SetStateAction, useCallback, useRef, useState,} from 'react';
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
    PromptInputFooter,
    PromptInputHeader,
    PromptInputMessage,
    PromptInputModelSelect,
    PromptInputModelSelectContent,
    PromptInputModelSelectItem,
    PromptInputModelSelectTrigger,
    PromptInputModelSelectValue,
    PromptInputProvider,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
} from './ai-elements/prompt-input';
import equal from 'fast-deep-equal';
import type {UseChatHelpers} from '@ai-sdk/react';
import type {Attachment, ChatMessage} from '@/lib/types';

const models = [
    {id: 'openai:gpt-5-nano', name: 'GPT-5 Nano'},
    {id: 'anthropic:claude-opus-4-20250514', name: 'Claude 4 Opus'},
    {id: 'gemini:gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite'},
];

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
    const [modelId, setModelId] = useState<string>(models[0].id);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const submitForm = useCallback(() => {
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
                        <PromptInputModelSelect
                            onValueChange={(value) => {
                                setModelId(value);
                            }}
                            value={modelId}
                        >
                            <PromptInputModelSelectTrigger>
                                <PromptInputModelSelectValue/>
                            </PromptInputModelSelectTrigger>
                            <PromptInputModelSelectContent>
                                {models.map((model) => (
                                    <PromptInputModelSelectItem key={model.id} value={model.id}>
                                        {model.name}
                                    </PromptInputModelSelectItem>
                                ))}
                            </PromptInputModelSelectContent>
                        </PromptInputModelSelect>
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