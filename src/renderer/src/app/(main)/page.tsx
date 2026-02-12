'use client'
import { JSX, useCallback, useEffect, useState } from "react";
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
import { lastAssistantMessageIsCompleteWithApprovalResponses, UIMessage } from "ai";
import { toast } from "sonner"
import { logger } from "../../../logger";

export default function Page(): JSX.Element {
    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [refreshHistory, setRefreshHistory] = useState(false);
    const [searchHistoryQuery, setSearchHistoryQuery] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [totalMatches, setTotalMatches] = useState(0);

    const updateChatInHistory = useCallback((chatId: string, updates: Partial<Chat>) => {
        setChatHistory(prev =>
            prev.map(c => c.id === chatId ? { ...c, ...updates } : c)
        );
        setSelectedChat(prev =>
            prev && prev.id === chatId ? { ...prev, ...updates } : prev
        );
    }, []);

    const {
        messages,
        sendMessage,
        status,
        regenerate,
        setMessages,
        addToolApprovalResponse
    } = useChat<UIMessage>({
        id: selectedChat?.id,
        transport: new IpcChatTransport(),
        onFinish: ({ message }) => {
            // locally update the chat history
            if (!selectedChat) return;
            const textPart = message.parts?.find(p => p.type === 'text') as { type: 'text'; text: string } | undefined;
            const text = textPart?.text;
            const updates: Partial<Chat> = {
                lastMessage: text ? text.slice(0, 200) : selectedChat.lastMessage,
                lastMessageAt: new Date(),
            };
            // Update title on first exchange (matches backend logic in MessageRepository)
            const userMessages = messages.filter(m => m.role === 'user');
            if (userMessages.length === 1) {
                const userTextPart = userMessages[0].parts?.find(p => p.type === 'text') as { type: 'text'; text: string } | undefined;
                if (userTextPart?.text) {
                    updates.title = userTextPart.text.slice(0, 50);
                }
            }
            updateChatInHistory(selectedChat.id, updates);
        },
        onError: (error) => {
            toast.error("Failed to Stream Data", {
                description: error.message,
            })
        },
    });

    useEffect(() => {
        window.api.chat.getAllChats(searchHistoryQuery)
            .then((chats) => {
                setChatHistory(chats);
                if (chats && chats.length > 0) {
                    setSelectedChat(chats.find(chat => chat.selected) ?? chats[0]);
                } else {
                    setSelectedChat(null);
                }
                setRefreshHistory(false);
            })
            .catch((error) => {
                console.log(error);
                logger.error(error);
            });
    }, [refreshHistory, searchHistoryQuery]);

    useEffect(() => {
        if (selectedChat) {
            window.api.message.getByChat(selectedChat.id)
                .then((chat) => {
                    if (chat) {
                        setMessages(chat);
                    }
                })
                .catch((error) => {
                    console.log(error);
                    logger.error(error)
                });
        }

    }, [selectedChat, setMessages]);

    const handleNewChat = () => {
        // TODO: return chat after creation, instead of reloading all chats
        window.api.chat.createChat({ title: "New Chat" })
            .then(() => setRefreshHistory(true));
    }

    const searchFromChatHistory = (searchQuery: string) => {
        setSearchHistoryQuery(searchQuery);
        setRefreshHistory(true);
    }

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

        // update local chat history state
        setChatHistory(prev =>
            prev.map(chat => (chat.id === selectedChat.id ? updatedChat : chat))
        );

        window.api.chat
            .updateSelectedModelForChat(selectedChat.id, {
                selectedProvider: providerName,
                selectedModelId: modelId,
            })
            .catch((error) => {
                logger.error(error);
                setRefreshHistory(true);
            });
    }, [selectedChat]);

    const handlePersonaChange = useCallback((personaId: string | null) => {
        if (!selectedChat) return;

        const updatedChat = {
            ...selectedChat,
            selectedPersonaId: personaId
        };

        setSelectedChat(updatedChat);

        setChatHistory(prev =>
            prev.map(chat => (chat.id === selectedChat.id ? updatedChat : chat))
        );

        window.api.chat
            .updateSelectedPersonaForChat(selectedChat.id, {
                selectedPersonaId: personaId,
            })
            .catch((error) => {
                logger.error(error);
                setRefreshHistory(true);
            });
    }, [selectedChat]);

    return (
        <div
            className="flex-1 min-h-0 flex rounded-b-lg border-t-0 overflow-hidden bg-background">
            <ChatHistory
                chats={chatHistory}
                selectedChat={selectedChat as Chat}
                onChangeSelectedChat={(chat) => {
                    window.api.chat.updateSelectedChat(chat.id).then(() => {
                        setSelectedChat(chat);
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
                                            window.api.chat.deleteChat(chat.id).then(() => setRefreshHistory(true));
                                        }}
                                        onPinChat={(chat) => {
                                            window.api.chat.updatePinnedStatusForChat(chat.id, !chat.pinned).then(() => setRefreshHistory(true));
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
                                    addToolApprovalResponse={addToolApprovalResponse}
                                />
                            </div>
                            <div className="p-4 bg-background shrink-0 max-w-3xl mx-auto w-full border-t">
                                <MultimodalInput
                                    chat={selectedChat}
                                    status={status}
                                    messages={messages}
                                    sendMessage={sendMessage}
                                    onModelChange={handleModelChange}
                                    onPersonaChange={handlePersonaChange}
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
