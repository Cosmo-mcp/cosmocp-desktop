'use client';

import {memo} from 'react';
import {ModeToggle} from "@/components/ModeToggle";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Button} from "@/components/ui/button";
import {PlusIcon} from "@/components/icons";

function PureChatHeader({
                            onNewChat
                        }: {
    chatId: string;
    selectedModelId: string;
    onNewChat: () => void;
}) {
    return (
        <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
                        onClick={() => {
                            // TODO: improve when save chat is implemented
                            onNewChat();
                        }}
                    >
                        <PlusIcon/>
                        <span className="md:sr-only">New Chat</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
            <ModeToggle/>
        </header>
    );
}

export const ChatHeader = memo(PureChatHeader);
