'use client';

import {useEffect, useMemo, useState} from 'react';

import {Button} from '@/components/ui/button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from '@/components/ui/dropdown-menu';
import {cn} from '@/lib/utils';

import {CheckCircleFillIcon, ChevronDownIcon} from './icons';
import {Model} from "cosmo-commons/models/model";

export function ModelSelector({
                                  selectedModelId,
                                  onModelChange,
                                  className,
                              }: {
    selectedModelId: string;
    onModelChange?: (modelId: string) => void;
} & React.ComponentProps<typeof Button>) {
    const [open, setOpen] = useState(false);
    const [currentModelId, setCurrentModelId] = useState(selectedModelId);
    const [availableChatModels, setAvailableChatModels] = useState<Model[]>([]);

    useEffect(() => {
        window.modelProviderAPI.getModels("mock-model-provider").then(models => setAvailableChatModels(models));
    }, []);

    useEffect(() => {
        setCurrentModelId(selectedModelId);
    }, [selectedModelId]);

    const selectedChatModel = useMemo(
        () =>
            availableChatModels.find(
                (chatModel) => chatModel.id === currentModelId,
            ),
        [currentModelId, availableChatModels],
    );

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
                asChild
                className={cn(
                    'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
                    className,
                )}
            >
                <Button
                    data-testid="model-selector"
                    variant="outline"
                    className="md:px-2 md:h-[34px]"
                >
                    {selectedChatModel?.name}
                    <ChevronDownIcon/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[300px]">
                {availableChatModels.map((chatModel) => {
                    const {id} = chatModel;

                    return (
                        <DropdownMenuItem
                            data-testid={`model-selector-item-${id}`}
                            key={id}
                            onSelect={() => {
                                setOpen(false);
                                setCurrentModelId(id);
                                onModelChange?.(id);
                            }}
                            data-active={id === currentModelId}
                            asChild
                        >
                            <button
                                type="button"
                                className="gap-4 group/item flex flex-row justify-between items-center w-full"
                            >
                                <div className="flex flex-col gap-1 items-start">
                                    <div>{chatModel.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {chatModel.description}
                                    </div>
                                </div>

                                <div
                                    className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                                    <CheckCircleFillIcon/>
                                </div>
                            </button>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}