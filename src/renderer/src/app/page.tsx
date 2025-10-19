'use client'
import {JSX, useState} from "react";
import {ChatHistory} from "@/components/chat-history";
import {ChatWindow} from "@/components/chatWindow";
import {Chat} from "../../../core/dto";

export default function Page(): JSX.Element {
    const [selectedChat, setSelectedChat] = useState<Chat | undefined>(undefined);
    return (
        <>
            <ChatHistory
                onChangeSelectedChat={(chat) => {
                    setSelectedChat(chat)
                }}
            ></ChatHistory>
            {
                selectedChat !== undefined ? (
                    <ChatWindow
                        id={selectedChat.id}
                        initialMessages={[]}
                        initialChatModel=''
                    />) : (
                    <div>No chat selected</div>
                )
            }
        </>
    );
}