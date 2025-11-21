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
import {Message, MessageContent} from "@/components/ai-elements/message";
import {MessageSquare} from "lucide-react";
import {Response} from '@/components/ai-elements/response';
import {Reasoning, ReasoningContent, ReasoningTrigger} from "@/components/ai-elements/reasoning";


interface MessagesProps {
    chatId: string;
    status: UseChatHelpers<ChatMessage>['status'];
    messages: ChatMessage[];
    regenerate: UseChatHelpers<ChatMessage>['regenerate'];
    selectedModelId: string;
}

function PureMessages({
                          chatId,
                          status,
                          messages,
                          regenerate,
                          selectedModelId,
                      }: MessagesProps) {

    return (
        <Conversation className="relative size-full">
            <ConversationContent>
                {messages.length === 0 ? (
                    <ConversationEmptyState
                        icon={<MessageSquare className="size-12"/>}
                        title="Start a conversation"
                        description="Type a message below to begin chatting"
                    />
                ) : (
                    messages.map((message) => (
                        <Message from={message.role} key={message.id}>
                            <MessageContent>
                                {message.parts.map((part, i) => {
                                    switch (part.type) {
                                        case 'text': // we don't use any reasoning or tool calls in this example
                                            return (
                                                <Response key={`${message.id}-${i}`}>
                                                    {part.text}
                                                </Response>
                                            );
                                        case 'reasoning':
                                            return (
                                                <Reasoning
                                                    key={`${message.id}-${i}`}
                                                    className="w-full"
                                                    isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                                                >
                                                    <ReasoningTrigger />
                                                    <ReasoningContent>{part.text}</ReasoningContent>
                                                </Reasoning>
                                            );
                                        default:
                                            return null;
                                    }
                                })}
                            </MessageContent>
                        </Message>
                    ))
                )}
            </ConversationContent>
            <ConversationScrollButton/>
        </Conversation>
    );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    if (!equal(prevProps.messages, nextProps.messages)) return false;

    return false;
});
