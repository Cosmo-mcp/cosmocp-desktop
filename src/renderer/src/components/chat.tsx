'use client';

import {ChatHeader} from '@/components/chat-header';
import type {ChatMessage} from '@/lib/types';
import {Messages} from "@/components/messages";
import {useChat} from "@ai-sdk/react";

export function Chat({
                         id,
                         initialMessages,
                         initialChatModel,
                     }: {
    id: string;
    initialMessages: ChatMessage[];
    initialChatModel: string;
}) {

    const {
        messages,
        setMessages,
        sendMessage,
        status,
        stop,
        regenerate,
        resumeStream,
    } = useChat<ChatMessage>({
        id,
        messages: initialMessages,
        experimental_throttle: 100,
        transport: new DefaultChatTransport({
            api: '/api/chat',
            fetch: fetchWithErrorHandlers,
            prepareSendMessagesRequest({ messages, id, body }) {
                return {
                    body: {
                        id,
                        message: messages.at(-1),
                        selectedChatModel: initialChatModel,
                        selectedVisibilityType: visibilityType,
                        ...body,
                    },
                };
            },
        }),
        onData: (dataPart) => {
            setDataStream((ds) => (ds ? [...ds, dataPart] : []));
        },
        onFinish: () => {
            mutate(unstable_serialize(getChatHistoryPaginationKey));
        },
        onError: (error) => {
            if (error instanceof ChatSDKError) {
                toast({
                    type: 'error',
                    description: error.message,
                });
            }
        },
    });

    return (
        <>
            <div className="flex flex-col min-w-0 h-dvh bg-background">
                <ChatHeader
                    chatId={id}
                    selectedModelId={initialChatModel}
                />
                <Messages
                    chatId={id}
                    status={status}
                    messages={messages}
                    setMessages={setMessages}
                    regenerate={regenerate}
                    isReadonly={isReadonly}
                    isArtifactVisible={isArtifactVisible}
                />
            </div>
        </>
    );
}
