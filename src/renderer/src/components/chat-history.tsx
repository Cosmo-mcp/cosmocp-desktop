'use client'
import {Button} from "@/components/ui/button";
import {Fragment, useState} from "react";
import {Chat} from "../../../core/dto";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Separator} from "@/components/ui/separator";

export function ChatHistory({
                                chats,
                                selectedChat,
                                onChangeSelectedChat
                            }: {
    chats: Chat[];
    selectedChat: Chat;
    onChangeSelectedChat: (chat: Chat) => void
}) {
    const startNewChat = () => {
        window.api.chat.createChat({title: "New Chat_" + new Date()});
    };
    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-grow w-full">
                <div className="p-4">
                    <h4 className="mb-4 text-sm leading-none font-medium">Chat History</h4>
                    {chats.map((chat) => (
                        <Fragment key={chat.id}>
                            <div className="text-sm text-ellipsis cursor-pointer"
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