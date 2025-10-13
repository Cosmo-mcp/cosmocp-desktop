'use client'
import {JSX, useState} from "react";
import {ChatHistory} from "@/components/chat-history";
import {Chat} from "@/components/chat";

export default function Page(): JSX.Element {
    const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined);
    return (
        <>
            <ChatHistory></ChatHistory>
            {
                selectedChatId !== undefined ? (
                    <Chat
                        id={selectedChatId as string}
                        initialMessages={[]}
                        initialChatModel=''
                    />) : (
                    <div>No chat selected</div>
                )}
        </>
    );
}