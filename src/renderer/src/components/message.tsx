'use client';
import {motion} from 'framer-motion';
import {memo, useState} from 'react';
import {SparklesIcon} from './icons';
import {Response} from './ai-elements/response';
import {MessageContent} from './ai-elements/message';
import {MessageActions} from './message-actions';
import {PreviewAttachment} from './preview-attachment';
import equal from 'fast-deep-equal';
import {cn, sanitizeText} from '@/lib/utils';
import {MessageEditor} from './message-editor';
import {MessageReasoning} from './message-reasoning';
import type {UseChatHelpers} from '@ai-sdk/react';
import type {ChatMessage} from '@/lib/types';

const PurePreviewMessage = ({
                                chatId,
                                message,
                                isLoading,
                                setMessages,
                                regenerate,
                                isReadonly,
                                requiresScrollPadding,
                            }: {
    chatId: string;
    message: ChatMessage;
    isLoading: boolean;
    setMessages: UseChatHelpers<ChatMessage>['setMessages'];
    regenerate: UseChatHelpers<ChatMessage>['regenerate'];
    isReadonly: boolean;
    requiresScrollPadding: boolean;
    isArtifactVisible: boolean;
}) => {
    const [mode, setMode] = useState<'view' | 'edit'>('view');

    const attachmentsFromMessage = message.parts.filter(
        (part) => part.type === 'file',
    );

    //useDataStream();

    return (
        <motion.div
            data-testid={`message-${message.role}`}
            className="group/message w-full"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            data-role={message.role}
        >
            <div
                className={cn('flex w-full items-start gap-2 md:gap-3', {
                    'justify-end': message.role === 'user' && mode !== 'edit',
                    'justify-start': message.role === 'assistant',
                })}
            >
                {message.role === 'assistant' && (
                    <div
                        className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                        <SparklesIcon size={14}/>
                    </div>
                )}

                <div
                    className={cn('flex flex-col', {
                        'gap-2 md:gap-4': message.parts?.some(
                            (p) => p.type === 'text' && p.text?.trim(),
                        ),
                        'min-h-96': message.role === 'assistant' && requiresScrollPadding,
                        'w-full':
                            (message.role === 'assistant' &&
                                message.parts?.some(
                                    (p) => p.type === 'text' && p.text?.trim(),
                                )) ||
                            mode === 'edit',
                        'max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]':
                            message.role === 'user' && mode !== 'edit',
                    })}
                >
                    {attachmentsFromMessage.length > 0 && (
                        <div
                            data-testid={`message-attachments`}
                            className="flex flex-row justify-end gap-2"
                        >
                            {attachmentsFromMessage.map((attachment) => (
                                <PreviewAttachment
                                    key={attachment.url}
                                    attachment={{
                                        name: attachment.filename ?? 'file',
                                        contentType: attachment.mediaType,
                                        url: attachment.url,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {message.parts?.map((part, index) => {
                        const {type} = part;
                        const key = `message-${message.id}-part-${index}`;

                        if (type === 'reasoning' && part.text?.trim().length > 0) {
                            return (
                                <MessageReasoning
                                    key={key}
                                    isLoading={isLoading}
                                    reasoning={part.text}
                                />
                            );
                        }

                        if (type === 'text') {
                            if (mode === 'view') {
                                return (
                                    <div key={key}>
                                        <MessageContent
                                            data-testid="message-content"
                                            className={cn({
                                                'w-fit break-words rounded-2xl px-3 py-2 text-right text-white':
                                                    message.role === 'user',
                                                'bg-transparent px-0 py-0 text-left':
                                                    message.role === 'assistant',
                                            })}
                                            style={
                                                message.role === 'user'
                                                    ? {backgroundColor: '#006cff'}
                                                    : undefined
                                            }
                                        >
                                            <Response>{sanitizeText(part.text)}</Response>
                                        </MessageContent>
                                    </div>
                                );
                            }

                            if (mode === 'edit') {
                                return (
                                    <div
                                        key={key}
                                        className="flex w-full flex-row items-start gap-3"
                                    >
                                        <div className="size-8"/>
                                        <div className="min-w-0 flex-1">
                                            <MessageEditor
                                                key={message.id}
                                                message={message}
                                                setMode={setMode}
                                                setMessages={setMessages}
                                                regenerate={regenerate}
                                            />
                                        </div>
                                    </div>
                                );
                            }
                        }
                    })}

                    {!isReadonly && (
                        <MessageActions
                            key={`action-${message.id}`}
                            chatId={chatId}
                            message={message}
                            isLoading={isLoading}
                            setMode={setMode}
                        />
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export const PreviewMessage = memo(
    PurePreviewMessage,
    (prevProps, nextProps) => {
        if (prevProps.isLoading !== nextProps.isLoading) return false;
        if (prevProps.message.id !== nextProps.message.id) return false;
        if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
            return false;
        if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

        return false;
    },
);

export const ThinkingMessage = () => {
    const role = 'assistant';

    return (
        <motion.div
            data-testid="message-assistant-loading"
            className="group/message w-full"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            data-role={role}
        >
            <div className="flex items-start justify-start gap-3">
                <div
                    className="-mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-border">
                    <SparklesIcon size={14}/>
                </div>

                <div className="flex w-full flex-col gap-2 md:gap-4">
                    <div className="p-0 text-muted-foreground text-sm">
                        <LoadingText>Thinking...</LoadingText>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const LoadingText = ({children}: { children: React.ReactNode }) => {
    return (
        <motion.div
            animate={{backgroundPosition: ['100% 50%', '-100% 50%']}}
            transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
            }}
            style={{
                background:
                    'linear-gradient(90deg, hsl(var(--muted-foreground)) 0%, hsl(var(--muted-foreground)) 35%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 65%, hsl(var(--muted-foreground)) 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
            }}
            className="flex items-center text-transparent"
        >
            {children}
        </motion.div>
    );
};
