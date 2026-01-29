import useSWR from 'swr';
import { Chat } from 'core/dto'; // Message removed as it is not used
import { UIMessage } from 'ai';

// Define keys for SWR cache
export const CHAT_KEYS = {
    all: (searchQuery: string | null) => ['chats', searchQuery] as const,
    messages: (chatId: string) => ['messages', chatId] as const,
};

export function useChats(searchQuery: string | null) {
    const { data, error, isLoading, mutate } = useSWR<Chat[]>(
        CHAT_KEYS.all(searchQuery),
        () => window.api.chat.getAllChats(searchQuery)
    );

    return {
        chats: data || [],
        isLoading,
        error,
        mutate,
    };
}

export function useChatMessages(chatId: string | undefined) {
    const { data, error, isLoading, mutate } = useSWR<UIMessage[]>(
        chatId ? CHAT_KEYS.messages(chatId) : null,
        () => {
            if (!chatId) throw new Error("Chat ID is required");
            return window.api.message.getByChat(chatId);
        }
    );

    return {
        messages: data || [],
        isLoading,
        error,
        mutate,
    };
}
