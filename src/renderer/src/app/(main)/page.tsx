'use client'
import {JSX, useEffect, useState} from "react";
import {ChatHistory} from "@/components/chat-history";
import {Chat} from "core/dto";
import {ChatHeader} from "@/components/chat-header";
import {Messages} from "@/components/messages";
import {MultimodalInput} from "@/components/multimodal-input";
import {Attachment} from "@/lib/types";
import {useChat} from "@ai-sdk/react";
import {IpcChatTransport} from "@/chat-transport";
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@/components/ui/empty";
import {MessageCirclePlus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {UIMessage} from "ai";
import { toast } from "sonner"

export default function Page(): JSX.Element {
    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [refreshHistory, setRefreshHistory] = useState(false);
    const [input, setInput] = useState<string>('');
    const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const [searchHistoryQuery, setSearchHistoryQuery] = useState<string | null>(null);

    const {
        messages,
        sendMessage,
        status,
        stop,
        regenerate,
        setMessages,
        error
    } = useChat<UIMessage>({
        id: selectedChat?.id,
        transport: new IpcChatTransport(),
        onFinish: () => {
            setRefreshHistory(true);
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
                    setSelectedChat(chats[0]);
                } else {
                    setSelectedChat(null);
                }
                setRefreshHistory(false);
            })
            .catch((error) => console.log(error));
    }, [refreshHistory, searchHistoryQuery]);

    useEffect(() => {
        if (selectedChat) {
            window.api.message.getByChat(selectedChat.id)
                .then((chat) => {
                    if (chat) {
                        setMessages(chat);
                    }
                })
                .catch((error) => console.log(error));
        }

    }, [selectedChat]);

    const handleNewChat = () => {
        window.api.chat.createChat({title: "New Chat", lastMessage: null, lastMessageAt: null})
            .then(() => {
                setRefreshHistory(true);
            });
    }

    const searchFromChatHistory = (searchQuery: string) => {
        setSearchHistoryQuery(searchQuery);
        setRefreshHistory(true);
    }

    return (
        <div
            className="h-full min-h-[600px] flex rounded-b-lg border-t-0 overflow-hidden bg-background">
            <ChatHistory
                chats={chatHistory}
                selectedChat={selectedChat as Chat}
                onChangeSelectedChat={(chat) => {
                    setSelectedChat(chat)
                }}
                onNewChat={handleNewChat}
                onSearch={searchFromChatHistory}
            ></ChatHistory>
            <div className="grow flex flex-col h-full overflow-hidden">
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
                                            window.api.chat.updateChat(chat.id, {pinned: !chat.pinned}).then(() => setRefreshHistory(true));
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 flex flex-col">
                                <Messages
                                    chatId={selectedChat.id}
                                    status={status}
                                    messages={messages}
                                    regenerate={regenerate}
                                />

                                <div className="p-4 bg-background shrink-0 max-w-3xl mx-auto w-full">
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
                        </>) : (
                        <div className="h-full flex flex-col items-center justify-center">
                            <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <MessageCirclePlus/>
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