'use client'
import {JSX, useEffect, useState} from "react";
import {ChatHistory} from "@/components/chat-history";
import {Chat} from "../../../../packages/core/dto";
import {ChatHeader} from "@/components/chat-header";
import {Messages} from "@/components/messages";
import {MultimodalInput} from "@/components/multimodal-input";
import {Attachment, ChatMessage} from "@/lib/types";
import {useChat} from "@ai-sdk/react";
import {IpcChatTransport} from "@/chat-transport";

export default function Page(): JSX.Element {
    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [refreshHistory, setRefreshHistory] = useState(false);
    const [input, setInput] = useState<string>('');
    const [attachments, setAttachments] = useState<Array<Attachment>>([]);

    const {
        messages,
        sendMessage,
        status,
        stop,
        regenerate,
    } = useChat<ChatMessage>({
        id: selectedChat?.id,
        transport: new IpcChatTransport(),
        onError: (error) => {
            console.error(error);
        },
    });


    useEffect(() => {
        window.api.chat.getAllChats()
            .then((chats) => {
                setChatHistory(chats);
                if (chats && chats.length > 0) {
                    setSelectedChat(chats[0]);
                }
                setRefreshHistory(false);
            })
            .catch((error) => console.log(error));
    }, [refreshHistory]);

    return (
        <div
            className="h-full min-h-[600px] flex rounded-b-lg border-t-0 overflow-hidden bg-background">
            <ChatHistory
                chats={chatHistory}
                selectedChat={selectedChat as Chat}
                onChangeSelectedChat={(chat) => {
                    setSelectedChat(chat)
                }}
                onNewChat={() => {
                    window.api.chat.createChat({title: "New Chat", lastMessage: null, lastMessageAt: null});
                    setRefreshHistory(true);
                }}
            ></ChatHistory>
            <div className="grow">
                {
                    selectedChat !== null ? (
                        <>
                            <div className="flex-1 flex flex-col min-w-0 bg-background">
                                {/* Chat Header with Hamburger Menu */}
                                <div className="flex items-center h-16 px-4 border-b bg-background">
                                    <div className="flex-1">
                                        <ChatHeader
                                            chat={selectedChat || null}
                                            onDeleteChat={(chat) => {
                                                window.api.chat.deleteChat(chat.id).then(() => {
                                                        setRefreshHistory(true);
                                                    }
                                                );

                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col min-h-0">
                                <Messages
                                    chatId={selectedChat.id}
                                    status={status}
                                    messages={messages}
                                    regenerate={regenerate}
                                />

                                <MultimodalInput
                                    input={input}
                                    setInput={setInput}
                                    status={status}
                                    attachments={attachments}
                                    messages={messages}
                                    sendMessage={sendMessage}
                                />
                            </div>
                        </>) : (
                        <div>No chat selected</div>
                    )
                }
            </div>
        </div>
    );
}