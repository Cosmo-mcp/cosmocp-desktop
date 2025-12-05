'use client';

import {Chat} from "core/dto";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {Button} from "@/components/ui/button";
import {Pin, Search, Trash} from "lucide-react";

export function ChatHeader({chat, onDeleteChat}: {
    chat: Chat,
    onDeleteChat: (chat: Chat) => void
}) {

    const handleDeleteChat = () => {
        onDeleteChat(chat);
    }
    return (
        <div className="flex items-center justify-end h-full flex-row">
            {/* Right side - Action buttons */}
            <div className="flex items-center gap-1">
                <TooltipProvider>
                    {/* Pin */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                                <Pin className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Pin Chat</p>
                        </TooltipContent>
                    </Tooltip>
                    {/* Search */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                                <Search className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Search in conversation</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Info */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDeleteChat}
                                className="cursor-pointer"
                            >
                                <Trash className="h-4 w-4"/>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
    );
}