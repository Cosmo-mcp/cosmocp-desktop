'use client'
import { JSX, useCallback, useEffect, useMemo, useState } from "react";
import { ChatHistory } from "@/components/chat-history";
import { Chat } from "core/dto";
import { ChatHeader } from "@/components/chat-header";
import { Messages } from "@/components/messages";
import { MultimodalInput } from "@/components/multimodal-input";
import { useChat } from "@ai-sdk/react";
import { IpcChatTransport } from "@/chat-transport";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { MessageCirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UIMessage } from "ai";
import { toast } from "sonner"
import { logger } from "../../../logger";
import { useChats, useChatMessages } from "@/hooks/use-chat-store";

export default function Page(): JSX.Element {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [searchHistoryQuery, setSearchHistoryQuery] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [totalMatches, setTotalMatches] = useState(0);

    const { chats, mutate: mutateChats } = useChats(searchHistoryQuery);
    // Load messages for the selected chat using SWR
    const { messages: loadedMessages } = useChatMessages(selectedChat?.id);

    const transport = useMemo(() => new IpcChatTransport(), []);

    const {
        messages,
        sendMessage,
        status,
        stop,
        regenerate,
        setMessages,
    } = useChat<UIMessage>({
        id: selectedChat?.id,
        transport,
        onFinish: () => {
            mutateChats();
        },
        onError: (error) => {
            toast.error("Failed to Stream Data", {
                description: error.message,
            })
        },
    });

    // Sync loaded messages with AI SDK
    useEffect(() => {
        if (loadedMessages && loadedMessages.length > 0 && messages.length === 0) {
            setMessages(loadedMessages);
        }
    }, [loadedMessages, messages.length, setMessages]);

    // Auto-select first chat if none selected and chats are available
    useEffect(() => {
        if (!selectedChat && chats.length > 0) {
            const chatToSelect = chats.find(chat => chat.selected) ?? chats[0];
            setSelectedChat(chatToSelect);
        }
    }, [chats, selectedChat]);

    const handleNewChat = useCallback(() => {
        window.api.chat.createChat({ title: "New Chat" })
            .then(() => {
                mutateChats();
            });
    }, [mutateChats]);

    const searchFromChatHistory = useCallback((searchQuery: string) => {
        setSearchHistoryQuery(searchQuery);
        mutateChats();
    }, [mutateChats]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        if (!query) {
            setCurrentMatchIndex(0);
            setTotalMatches(0);
        }
    }, []);

    const handleMatchesFound = useCallback((count: number) => {
        setTotalMatches(count);
        if (count > 0) {
            setCurrentMatchIndex(prev => {
                if (prev === 0) return 1;
                if (prev > count) return count;
                return prev;
            });
        } else {
            setCurrentMatchIndex(0);
        }
    }, []);

    const handleNextMatch = useCallback(() => {
        if (totalMatches > 0) {
            setCurrentMatchIndex(prev => (prev < totalMatches ? prev + 1 : 1));
        }
    }, [totalMatches]);

    const handlePrevMatch = useCallback(() => {
        if (totalMatches > 0) {
            setCurrentMatchIndex(prev => (prev > 1 ? prev - 1 : totalMatches));
        }
    }, [totalMatches]);

    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
        setCurrentMatchIndex(0);
        setTotalMatches(0);
    }, []);

    const handleModelChange = useCallback((providerName: string, modelId: string) => {
        if (!selectedChat) return;

        const updatedChat = {
            ...selectedChat,
            selectedProvider: providerName,
            selectedModelId: modelId
        };

        setSelectedChat(updatedChat);

        // Optimistic update for database
        window.api.chat
            .updateSelectedModelForChat(selectedChat.id, {
                selectedProvider: providerName,
                selectedModelId: modelId,
            })
            .then(() => mutateChats()) // Revalidate to be sure
            .catch((error) => {
                logger.error(error);
                mutateChats();
            });
    }, [selectedChat, mutateChats]);

    return (
        <div
            className="flex-1 min-h-0 flex rounded-b-lg border-t-0 overflow-hidden bg-background">
            <ChatHistory
                chats={chats}
                selectedChat={selectedChat as Chat}
                onChangeSelectedChat={(chat) => {
                    window.api.chat.updateSelectedChat(chat.id).then(() => {
                        setSelectedChat(chat);
                        // No need to manual refresh, local state update is instant and background revalidation defaults handle consistency
                    }).catch((error) => {
                        logger.error(error);
                    })
                }}
                onNewChat={handleNewChat}
                onSearch={searchFromChatHistory}
            ></ChatHistory>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {
                    selectedChat !== null ? (
                        <>
                            <div className="flex items-center h-16 px-4 border-b bg-background shrink-0">
                                <div className="flex-1">
                                    <ChatHeader
                                        chat={selectedChat || null}
                                        onDeleteChat={(chat) => {
                                            window.api.chat.deleteChat(chat.id).then(() => mutateChats());
                                        }}
                                        onPinChat={(chat) => {
                                            window.api.chat.updatePinnedStatusForChat(chat.id, !chat.pinned).then(() => mutateChats());
                                        }}
                                        onSearch={handleSearch}
                                        currentMatch={currentMatchIndex}
                                        totalMatches={totalMatches}
                                        onNextMatch={handleNextMatch}
                                        onPrevMatch={handlePrevMatch}
                                        onClearSearch={handleClearSearch}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-h-0">
                                <Messages
                                    chatId={selectedChat.id}
                                    status={status}
                                    messages={messages}
                                    regenerate={regenerate}
                                    searchQuery={searchQuery}
                                    currentMatchIndex={currentMatchIndex}
                                    onMatchesFound={handleMatchesFound}
                                />
                            </div>
                            <div className="p-4 bg-background shrink-0 max-w-3xl mx-auto w-full border-t">
                                <MultimodalInput
                                    chat={selectedChat}
                                    status={status}
                                    messages={messages}
                                    sendMessage={sendMessage}
                                    onModelChange={handleModelChange}
                                />
                            </div>
                        </>) : (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <MessageCirclePlus />
                                    </EmptyMedia>
                                    <EmptyTitle>Start a new Chat</EmptyTitle>
                                    <EmptyDescription>
                                        Click on the button below to Start a new Chat
                                    </EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <Button variant="outline" size="sm" onClick={handleNewChat}>
                                        New Chat
                                    </Button>
                                </EmptyContent>
                            </Empty>
                        </div>
                    )
                }
            </div>
        </div>
    );
}