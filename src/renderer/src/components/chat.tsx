'use client';

import {ChatHeader} from '@/components/chat-header';
import type {ChatMessage} from '@/lib/types';

export function Chat({
                         id,
                         initialChatModel,
                     }: {
    id: string;
    initialMessages: ChatMessage[];
    initialChatModel: string;
}) {

    return (
        <>
            <div className="flex flex-col min-w-0 h-dvh bg-background">
                <ChatHeader
                    chatId={id}
                    selectedModelId={initialChatModel}
                />
            </div>
        </>
    );
}
