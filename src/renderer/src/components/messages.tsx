import {PreviewMessage, ThinkingMessage} from './message';
import {Greeting} from './greeting';
import {memo, useCallback, useEffect, useRef} from 'react';
import equal from 'fast-deep-equal';
import type {UseChatHelpers} from '@ai-sdk/react';
import {useMessages} from '@/hooks/use-messages';
import {useScrollToBottom} from "@/hooks/use-scroll-to-bottom";
import type {ChatMessage} from '@/lib/types';
import {Conversation, ConversationContent} from './ai-elements/conversation';
import {ArrowDownIcon} from 'lucide-react';

interface MessagesProps {
    chatId: string;
    status: UseChatHelpers<ChatMessage>['status'];
    messages: ChatMessage[];
    setMessages: UseChatHelpers<ChatMessage>['setMessages'];
    regenerate: UseChatHelpers<ChatMessage>['regenerate'];
    isReadonly: boolean;
    isArtifactVisible: boolean;
    selectedModelId: string;
}

function PureMessages({
                          chatId,
                          status,
                          messages,
                          setMessages,
                          regenerate,
                          isReadonly,
                          isArtifactVisible,
                          selectedModelId,
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
        isAtBottom,
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
            className="overscroll-behavior-contain -webkit-overflow-scrolling-touch flex-1 touch-pan-y overflow-y-scroll"
            style={{overflowAnchor: 'none'}}
        >
            <Conversation className="mx-auto flex min-w-0 flex-col gap-4 md:gap-6">
                <ConversationContent className="flex flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
                    {messages.length === 0 && <Greeting/>}

                    {messages.map((message, index) => (
                        <PreviewMessage
                            key={message.id}
                            chatId={chatId}
                            message={message}
                            isLoading={
                                status === 'streaming' && messages.length - 1 === index
                            }
                            setMessages={setMessages}
                            regenerate={regenerate}
                            isReadonly={isReadonly}
                            requiresScrollPadding={
                                hasSentMessage && index === messages.length - 1
                            }
                            isArtifactVisible={isArtifactVisible}
                        />
                    ))}

                    {status === 'submitted' &&
                        messages.length > 0 &&
                        messages[messages.length - 1].role === 'user' &&
                        selectedModelId !== 'chat-model-reasoning' && <ThinkingMessage/>}

                    <div
                        ref={messagesEndRef}
                        className="min-h-[24px] min-w-[24px] shrink-0"
                    />
                </ConversationContent>
            </Conversation>

            {!isAtBottom && (
                <button
                    className="-translate-x-1/2 absolute bottom-40 left-1/2 z-10 rounded-full border bg-background p-2 shadow-lg transition-colors hover:bg-muted"
                    onClick={() => scrollToBottom('smooth')}
                    type="button"
                    aria-label="Scroll to bottom"
                >
                    <ArrowDownIcon className="size-4"/>
                </button>
            )}
        </div>
    );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
    if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) return true;

    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    if (!equal(prevProps.messages, nextProps.messages)) return false;

    return false;
});
