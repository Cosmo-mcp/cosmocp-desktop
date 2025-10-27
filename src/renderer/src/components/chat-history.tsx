'use client'
import {Button} from "@/components/ui/button";
import {Fragment} from "react";
import {Chat} from "../../../core/dto";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Separator} from "@/components/ui/separator";
import {Trash} from "lucide-react";

export function ChatHistory({
                                chats,
                                selectedChat,
                                onChangeSelectedChat,
                                onNewChat,
                                onDeleteChat
                            }: {
    chats: Chat[];
    selectedChat: Chat;
    onChangeSelectedChat: (chat: Chat) => void,
    onNewChat: () => void,
    onDeleteChat: (chat: Chat) => void
}) {

    return (
        <div className="flex flex-col h-full">
            <ScrollArea className="flex-grow w-full">
                <div className="p-4">
                    <h4 className="mb-4 text-sm leading-none font-medium">Chat History</h4>
                    {chats.map((chat) => (
                        <Fragment key={chat.id}>
                            <div className="flex items-center">
                                <div className="text-sm text-ellipsis cursor-pointer flex-grow"
                                     onClick={() => onChangeSelectedChat(chat)}>{chat.title}</div>
                                <Button variant="ghost" size="icon" onClick={() => onDeleteChat(chat)}>
                                    <Trash className="h-4 w-4"/>
                                </Button>
                            </div>
                            <Separator className="my-2"/>
                        </Fragment>
                    ))}
                </div>
            </ScrollArea>
            <div className="p-4">
                <Button onClick={onNewChat} className="w-full">New Chat</Button>
            </div>
        </div>
    );
}