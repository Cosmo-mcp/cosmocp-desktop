'use client';

import {ChatHeader} from '@/components/chat-header';
import type {Attachment, ChatMessage} from '@/lib/types';
import {Messages} from "@/components/messages";
import {useChat} from "@ai-sdk/react";
import {IpcChatTransport} from "@/chat-transport";
import {MultimodalInput} from "@/components/multimodal-input";
import {useEffect, useState} from "react";

export function Chat({
                         id,
                         initialMessages,
                         initialChatModel,
                     }: {
    id: string;
    initialMessages: ChatMessage[];
    initialChatModel: string;
}) {

    const [input, setInput] = useState<string>('');
    const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const [forceScrollToBottom, setForceScrollToBottom] = useState(false);
    const [stillAnswering, setStillAnswering] = useState(false);
    const {
        messages,
        setMessages,
        sendMessage,
        status,
        stop,
        regenerate,
    } = useChat<ChatMessage>({
        id,
        messages: initialMessages,
        transport: new IpcChatTransport(),
        onData: (dataPart) => {
            console.log(dataPart);
        },
        onFinish: () => {
            setForceScrollToBottom(true);
        },
        onError: (error) => {
            console.error(error);
        },
    });

    // Track if the model is still answering based on the status
    useEffect(() => {
        if (status === 'ready' || status === 'error') {
            setStillAnswering(false);
        } else if (status === 'submitted' || status === 'streaming') {
            setStillAnswering(true);
        }
    }, [status]);


    const showSuggestedActions = messages.length === 0 && attachments.length === 0;

    return (
        <>
            <div className="flex flex-col min-w-0 h-dvh bg-background">
                <ChatHeader
                    chatId={id}
                    selectedModelId={initialChatModel}
                    onNewChat={() => {
                        stop();
                        // TODO: improve when save chat is implemented
                        setMessages([]);
                    }}
                />
                <Messages
                    chatId={id}
                    status={status}
                    messages={messages}
                    setMessages={setMessages}
                    regenerate={regenerate}
                    isReadonly={false}
                    isArtifactVisible={false}
                    stillAnswering={stillAnswering}
                    forceScrollToBottom={forceScrollToBottom}
                    setForceScrollToBottom={setForceScrollToBottom}
                    selectedModelId={initialChatModel}
                />

                <div className="sticky bottom-0 flex gap-2 px-4 pb-4 mx-auto w-full bg-background md:pb-6 md:max-w-3xl z-[1] border-t-0">
                    <MultimodalInput
                        chatId={id}
                        input={input}
                        setInput={setInput}
                        status={status}
                        stop={stop}
                        attachments={attachments}
                        setAttachments={setAttachments}
                        messages={messages}
                        selectedModelId={initialChatModel}
                        setMessages={setMessages}
                        sendMessage={sendMessage}
                        showSuggestedActions={showSuggestedActions}
                        stillAnswering={stillAnswering}
                        setForceScrollToBottom={setForceScrollToBottom}
                    />
                </div>
            </div>
        </>
    );
}
