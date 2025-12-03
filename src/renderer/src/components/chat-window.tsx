'use client';

import type {Attachment, ChatMessage} from '@/lib/types';
import {Messages} from "@/components/messages";
import {useChat} from "@ai-sdk/react";
import {IpcChatTransport} from "@/chat-transport";
import {MultimodalInput} from "@/components/multimodal-input";
import {useState} from "react";
import {Chat} from "core/dto";

export function ChatWindow({
                               chat,
                           }: {
    chat: Chat;
}) {

    const [input, setInput] = useState<string>('');
    const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const {
        messages,
        sendMessage,
        status,
        stop,
        regenerate,
    } = useChat<ChatMessage>({
        id: chat.id,
        transport: new IpcChatTransport(),
        onError: (error) => {
            console.error(error);
        },
        onFinish: (message) => {
            window.api.message.save({
                text: message.message.parts.join(''),
                chatId: chat.id
            });
        }
    });


    return (
        <>
            <div className="overscroll-behavior-contain flex h-full min-w-0 touch-pan-y flex-col bg-background">
                <Messages
                    chatId={chat.id}
                    status={status}
                    messages={messages}
                    regenerate={regenerate}
                />

                <div
                    className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
                    <MultimodalInput
                        input={input}
                        setInput={setInput}
                        status={status}
                        attachments={attachments}
                        messages={messages}
                        sendMessage={sendMessage}
                    />
                </div>
            </div>
        </>
    );
}
