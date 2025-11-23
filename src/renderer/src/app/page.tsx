'use client'
import {JSX, useEffect, useState} from "react";
import {ChatHistory} from "@/components/chat-history";
import {ChatWindow} from "@/components/chat-window";
import {Chat} from "../../../../packages/core/dto";

export default function Page(): JSX.Element {
    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat>();
    const [refreshHistory, setRefreshHistory] = useState(false);
    useEffect(() => {
        window.api.chat.getAllChats()
            .then((chats) => {
                setChatHistory(chats);
                setSelectedChat(chats[0]);
                setRefreshHistory(false);
            })
            .catch((error) => console.log(error));
    }, [refreshHistory]);
    return (
        <div className="flex flex flex-row flex-nowrap justify-start h-full">
            <div className=" h-full w-48">
                <ChatHistory
                    chats={chatHistory}
                    selectedChat={selectedChat as Chat}
                    onChangeSelectedChat={(chat) => {
                        setSelectedChat(chat)
                    }}
                    onNewChat={() => {
                        window.api.chat.createChat({title: "New Chat"});
                        setRefreshHistory(true);
                    }}
                    onDeleteChat={(chat) => {
                        window.api.chat.deleteChat(chat.id);
                        setRefreshHistory(true);
                    }}
                ></ChatHistory>
            </div>
            <div className="grow">
                {
                    selectedChat !== undefined ? (
                        <ChatWindow
                            chat={selectedChat}
                        />) : (
                        <div>No chat selected</div>
                    )
                }
            </div>
        </div>
    );
}