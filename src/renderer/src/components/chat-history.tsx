'use client'
import {Button} from "@/components/ui/button";
import {Fragment, useEffect, useState} from "react";
import {Chat} from "../../../core/dto";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Separator} from "@/components/ui/separator";

export function ChatHistory({
                                onChangeSelectedChat
                            }: {
    onChangeSelectedChat: (chat: Chat) => void
}) {
    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    const [updateCounter, setUpdateCounter] = useState(0);
    const startNewChat = () => {
        window.api.chat.createChat({title: "New Chat_" + new Date()}).then(() => {
            setUpdateCounter(updateCounter + 1);
        });
    };
    useEffect(() => {
        window.api.chat.getAllChats()
            .then((chats) => setChatHistory(chats))
            .catch((error) => console.log(error));
    }, [updateCounter]);

    return (
        <div className="flex flex-col h-full w-30 border-r">
            <ScrollArea className="h-72 w-48 rounded-md border">
                <div className="p-4">
                    <h4 className="mb-4 text-sm leading-none font-medium">Chat History</h4>
                    {chatHistory.map((chat) => (
                        <Fragment key={chat.id}>
                            <div className="text-sm"
                                 onClick={() => onChangeSelectedChat(chat)}>{chat.title}</div>
                            <Separator className="my-2"/>
                        </Fragment>
                    ))}
                </div>
            </ScrollArea>
            <div className="p-4">
                <Button onClick={startNewChat} className="w-full">New Chat</Button>
            </div>
        </div>
    );
}