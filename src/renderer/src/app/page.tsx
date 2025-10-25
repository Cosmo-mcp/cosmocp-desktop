'use client'
import {JSX, useEffect, useState} from "react";
import {ChatHistory} from "@/components/chat-history";
import {ChatWindow} from "@/components/chatWindow";
import {Chat} from "../../../core/dto";

export default function Page(): JSX.Element {
    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat>();
    useEffect(() => {
        window.api.chat.getAllChats()
            .then((chats) => {
                setChatHistory(chats);
                setSelectedChat(chats[0]);
            })
            .catch((error) => console.log(error));
    }, []);
    return (
        <div className="flex flex flex-row flex-nowrap justify-start h-full">
            <div className=" h-full w-48">
                <ChatHistory
                    chats={chatHistory}
                    selectedChat={selectedChat as Chat}
                    onChangeSelectedChat={(chat) => {
                        setSelectedChat(chat)
                    }}
                ></ChatHistory>
            </div>
            <div className="grow">
                {
                    selectedChat !== undefined ? (
                        <ChatWindow
                            chat={selectedChat}
                            initialMessages={[]}
                            initialChatModel=''
                        />) : (
                        <div>No chat selected</div>
                    )
                }
            </div>
        </div>
    );
}