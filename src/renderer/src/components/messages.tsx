import {memo} from 'react';
import equal from 'fast-deep-equal';
import type {UseChatHelpers} from '@ai-sdk/react';
import type {ChatMessage} from '@/lib/types';
import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton
} from './ai-elements/conversation';
import {
    Message,
    MessageAction,
    MessageActions,
    MessageContent,
    MessageResponse
} from "@/components/ai-elements/message";
import {CopyIcon, Loader, MessageSquare, RefreshCcwIcon} from "lucide-react";
import {Reasoning, ReasoningContent, ReasoningTrigger} from "@/components/ai-elements/reasoning";
import {Source, Sources, SourcesContent, SourcesTrigger} from "@/components/ai-elements/sources";


interface MessagesProps {
    chatId: string;
    status: UseChatHelpers<ChatMessage>['status'];
    messages: ChatMessage[];
    regenerate: UseChatHelpers<ChatMessage>['regenerate'];
}

function PureMessages({
                          chatId,
                          status,
                          messages,
                          regenerate,
                      }: MessagesProps) {

    return (
        <Conversation>
            <ConversationContent>
                {messages.length === 0 ? (
                    <ConversationEmptyState
                        icon={<MessageSquare className="size-12"/>}
                        title="Start a conversation"
                        description="Type a message below to begin chatting"
                    />
                ) : (
                    messages.map((message) => (
                        <div key={message.id}>
                            {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                                <Sources>
                                    <SourcesTrigger
                                        count={
                                            message.parts.filter(
                                                (part) => part.type === 'source-url',
                                            ).length
                                        }
                                    />
                                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                                        <SourcesContent key={`${message.id}-${i}`}>
                                            <Source
                                                key={`${message.id}-${i}`}
                                                href={part.url}
                                                title={part.url}
                                            />
                                        </SourcesContent>
                                    ))}
                                </Sources>
                            )}
                            {message.parts.map((part, i) => {
                                switch (part.type) {
                                    case 'text':
                                        return (
                                            <Message key={`${message.id}-${i}`} from={message.role}>
                                                <MessageContent>
                                                    <MessageResponse>
                                                        {part.text}
                                                    </MessageResponse>
                                                </MessageContent>
                                                {message.role === 'assistant' && i === messages.length - 1 && (
                                                    <MessageActions>
                                                        <MessageAction
                                                            onClick={() => regenerate()}
                                                            label="Retry"
                                                        >
                                                            <RefreshCcwIcon className="size-3"/>
                                                        </MessageAction>
                                                        <MessageAction
                                                            onClick={() =>
                                                                navigator.clipboard.writeText(part.text)
                                                            }
                                                            label="Copy"
                                                        >
                                                            <CopyIcon className="size-3"/>
                                                        </MessageAction>
                                                    </MessageActions>
                                                )}
                                            </Message>
                                        );
                                    case 'reasoning':
                                        return (
                                            <Reasoning
                                                key={`${message.id}-${i}`}
                                                className="w-full"
                                                isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                                            >
                                                <ReasoningTrigger/>
                                                <ReasoningContent>{part.text}</ReasoningContent>
                                            </Reasoning>
                                        );
                                    default:
                                        return null;
                                }
                            })}
                        </div>
                    )))}
                {status === 'submitted' && <Loader/>}
            </ConversationContent>
            <ConversationScrollButton/>
        </Conversation>
    );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    if (!equal(prevProps.messages, nextProps.messages)) return false;

    return false;
});
