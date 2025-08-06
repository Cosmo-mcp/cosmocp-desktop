'use client';

import {ModelSelector} from '@/components/model-selector';
import {memo, useState} from 'react';
import {ModeToggle} from "@/components/ModeToggle";
import {Button} from "@/components/ui/button";
import {ManageProvidersDialog} from "@/components/manage-providers-dialog";

function PureChatHeader({
                            selectedModelId
                        }: {
    chatId: string;
    selectedModelId: string;
}) {
    const [isManageProvidersDialogOpen, setManageProvidersDialogOpen] = useState(false);

    return (
        <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">

            <ModelSelector
                selectedModelId={selectedModelId}
                className="order-1 md:order-2"
            />
            <Button onClick={() => setManageProvidersDialogOpen(true)}>Manage Providers</Button>
            <ModeToggle/>
            <ManageProvidersDialog open={isManageProvidersDialogOpen} onOpenChange={setManageProvidersDialogOpen}/>
        </header>
    );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
    return prevProps.selectedModelId === nextProps.selectedModelId;
});
