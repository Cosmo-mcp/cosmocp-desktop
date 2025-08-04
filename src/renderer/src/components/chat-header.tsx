'use client';

import {ModelSelector} from '@/components/model-selector';
import {memo} from 'react';
import {ModeToggle} from "@/components/ModeToggle";

function PureChatHeader({
                            selectedModelId
                        }: {
    chatId: string;
    selectedModelId: string;
}) {
    return (
        <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">

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
