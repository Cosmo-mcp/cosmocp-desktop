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
            <div className="max-w-4xl mx-auto p-6 relative size-full">
                <div className="flex flex-col h-full">
                    <Messages
                        chatId={chat.id}
                        status={status}
                        messages={messages}
                        regenerate={regenerate}
                    />

                    <MultimodalInput
                        input={input}
                        setInput={setInput}
                        status={statu₹s}
                        attachments={attachments}
                        messages={messages}
                        sendMessage={sendMessage}
                    />
                </div>
            </div>
        </>
    );
}
