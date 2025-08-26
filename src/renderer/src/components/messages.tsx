'use client';
import {PreviewMessage, ThinkingMessage} from './message';
import {Greeting} from './greeting';
import {memo, useCallback, useEffect, useRef} from 'react';
import equal from 'fast-deep-equal';
import type {UseChatHelpers} from '@ai-sdk/react';
import {motion} from 'framer-motion';
import {useMessages} from '@/hooks/use-messages';
import type {ChatMessage} from '@/lib/types';
import {useScrollToBottom} from "@/hooks/use-scroll-to-bottom";

interface MessagesProps {
    chatId: string;
    status: UseChatHelpers<ChatMessage>['status'];
    messages: ChatMessage[];
    setMessages: UseChatHelpers<ChatMessage>['setMessages'];
    regenerate: UseChatHelpers<ChatMessage>['regenerate'];
    isReadonly: boolean;
    isArtifactVisible: boolean;
}

function PureMessages({
                          chatId,
                          status,
                          messages,
                          setMessages,
                          regenerate,
                          isReadonly,
                          stillAnswering,
                          forceScrollToBottom,
                          setForceScrollToBottom,
                      }: MessagesProps &
    {
        stillAnswering: boolean;
        forceScrollToBottom: boolean;
        setForceScrollToBottom: (value: boolean) => void;
    }) {
    const {
        containerRef: messagesContainerRef,
        endRef: messagesEndRef,
        onViewportEnter,
        onViewportLeave,
        hasSentMessage,
    } = useMessages({
        chatId,
        status,
    });

    const {scrollToBottom} = useScrollToBottom();
    const THROTTLE_DELAY_MS = 200;
    const throttleTimeout = useRef<NodeJS.Timeout | null>(null);
    const isThrottled = useRef(false);

    const throttledScrollToBottom = useCallback(() => {
        if (isThrottled.current) {
            return;
        }

        scrollToBottom();
        isThrottled.current = true;

        throttleTimeout.current = setTimeout(() => {
            isThrottled.current = false;
        }, THROTTLE_DELAY_MS);

    }, [scrollToBottom]);

    // Scroll to bottom when forceScrollToBottom is set to true
    useEffect(() => {
        if (forceScrollToBottom) {
            scrollToBottom();
            if (setForceScrollToBottom) {
                setForceScrollToBottom(false);
            }
        }
    }, [forceScrollToBottom, scrollToBottom, setForceScrollToBottom]);

    // Scroll to bottom when new messages arrive and the model is still answering
    useEffect(() => {
        if (messages.length > 0 && stillAnswering) {
            throttledScrollToBottom();
        }
    }, [messages, stillAnswering, throttledScrollToBottom]);

    return (
        <div
            ref={messagesContainerRef}
            className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 relative"
        >
            {messages.length === 0 && <Greeting/>}

            {messages.map((message, index) => (
                <PreviewMessage
                    key={message.id}
                    chatId={chatId}
                    message={message}
                    isLoading={status === 'streaming' && messages.length - 1 === index}
                    setMessages={setMessages}
                    regenerate={regenerate}
                    isReadonly={isReadonly}
                    requiresScrollPadding={
                        hasSentMessage && index === messages.length - 1
                    }
                />
            ))}

            {status === 'submitted' &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'user' && <ThinkingMessage/>}

            <motion.div
                ref={messagesEndRef}
                className="shrink-0 min-w-[24px] min-h-[24px]"
                onViewportLeave={onViewportLeave}
                onViewportEnter={onViewportEnter}
            />
        </div>
    );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
    if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    if (!equal(prevProps.messages, nextProps.messages)) return false;
    return false;
});
