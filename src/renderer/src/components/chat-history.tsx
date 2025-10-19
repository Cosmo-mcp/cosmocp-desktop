'use client'
import {Table, TableBody, TableCaption, TableCell, TableRow} from "@/components/ui/table";
import {Button} from "@/components/ui/button";
import {useEffect, useState} from "react";
import {Chat} from "../../../core/dto";

export function     ChatHistory() {
    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    const startNewChat = () => {
        window.api.chat.createChat({title: "New Chat_" + new Date()});
    };
    useEffect(() => {
        window.api.chat.getAllChats()
            .then((chats) => setChatHistory(chats))
            .catch((error) => console.log(error));
    }, []);

    return (
        <div className="flex flex-col h-full w-30 border-r">
            <div className="flex-grow overflow-y-auto">
                <Table>
                    <TableCaption>A list of your recent chats.</TableCaption>
                    <TableBody>
                        {
                            chatHistory.map((chat: Chat) => (
                                <TableRow key={chat.id}>
                                    <TableCell>{chat.title}</TableCell>
                                </TableRow>
                            ))
                        }
                    </TableBody>
                </Table>
            </div>
            <div className="p-4">
                <Button onClick={startNewChat} className="w-full">New Chat</Button>
            </div>
        </div>
    );
}