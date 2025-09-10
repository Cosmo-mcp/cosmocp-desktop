'use client';

import {ModelSelector} from '@/components/model-selector';
import {memo} from 'react';
import {ModeToggle} from "@/components/ModeToggle";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Button} from "@/components/ui/button";
import {PlusIcon} from "@/components/icons";
import {SidebarToggle} from "@/components/sidebar-toggle";
import {useWindowSize} from "usehooks-ts";
import {useSidebar} from "@/components/ui/sidebar";

function PureChatHeader({
                            selectedModelId,
                            onNewChat
                        }: {
    chatId: string;
    selectedModelId: string;
    onNewChat: () => void;
}) {
    const {open} = useSidebar();

    const {width: windowWidth} = useWindowSize();
    return (
        <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
            <SidebarToggle/>

            {(!open || windowWidth < 768) && (
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
            )}

            <ModelSelector
                selectedModelId={selectedModelId}
                className="order-1 md:order-2"
            />
            <ModeToggle/>
        </header>
    );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
    return prevProps.selectedModelId === nextProps.selectedModelId;
});
