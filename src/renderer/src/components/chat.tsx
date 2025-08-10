'use client';

import {ChatHeader} from '@/components/chat-header';
import type {Attachment, ChatMessage} from '@/lib/types';
import {Messages} from "@/components/messages";
import {useChat} from "@ai-sdk/react";
import {IpcChatTransport} from "@/chat-transport";
import {MultimodalInput} from "@/components/multimodal-input";
import {useState} from "react";
import {useDataStream} from "@/components/data-stream-provider";

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
            console.log("onFinish");
        },
        onError: (error) => {
            console.error(error);
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
                    isReadonly={false}
                    isArtifactVisible={false}
                />

                <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
                    <MultimodalInput
                        chatId={id}
                        input={input}
                        setInput={setInput}
                        status={status}
                        stop={stop}
                        attachments={attachments}
                        setAttachments={setAttachments}
                        messages={messages}
                        setMessages={setMessages}
                        sendMessage={sendMessage}
                    />
                </form>
            </div>
        </>
    );
}
