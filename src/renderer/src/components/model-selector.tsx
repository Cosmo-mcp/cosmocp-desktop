'use client';

import React, {useEffect, useMemo, useState} from 'react';

import {Button} from '@/components/ui/button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from '@/components/ui/dropdown-menu';
import {cn} from '@/lib/utils';

import {CheckCircleFillIcon, ChevronDownIcon} from './icons';
import {Model} from "@/common/models/model";
import {
    CustomProvider,
    ModelProviderCreate,
    ModelProviderLite,
    ModelProviderType,
    PredefinedProviders,
} from "@/common/models/modelProvider";
import {useTheme} from "next-themes";
import ProviderIcon from "@/components/ui/provider-icon";
import {ProviderInfo} from "@/lib/types";

const LS_PROVIDER_KEY = 'selectedProviderId';

export function ModelSelector({
                                  selectedModelId,
                                  onModelChange,
                                  className,
                              }: {
    selectedModelId: string;
    onModelChange?: (modelId: string) => void;
} & React.ComponentProps<typeof Button>) {
    const {resolvedTheme} = useTheme();
    const [open, setOpen] = useState(false);
    const [currentModelId, setCurrentModelId] = useState(selectedModelId);
    const [availableChatModels, setAvailableChatModels] = useState<Model[]>([]);
    const [providers, setProviders] = useState<ModelProviderLite[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [addingProvider, setAddingProvider] = useState(false);

    const [newProviderType, setNewProviderType] = useState<ModelProviderType | null>(null);
    const [newProviderNickName, setNewProviderNickName] = useState('');
    const [newProviderApiKey, setNewProviderApiKey] = useState('');
    const [newProviderApiUrl, setNewProviderApiUrl] = useState<string | undefined>(undefined);
    const [submittingProvider, setSubmittingProvider] = useState(false);
    const [providerError, setProviderError] = useState<string | null>(null);

    useEffect(() => {
        async function init() {
            try {
                const list = await window.modelProviderAPI.getProviders();
                setProviders(list);
                // TODO: get from providers.json
                const saved = localStorage.getItem(LS_PROVIDER_KEY);
                if (saved && list.find(p => p.id === saved)) {
                    setSelectedProviderId(saved);
                }
            } catch (e) {
                console.error('Failed to load providers', e);
            }
        }

        init();
    }, []);

    // When a provider changes, fetch its models
    useEffect(() => {
        async function loadModels() {
            if (!selectedProviderId) return;
            try {
                const models = await window.modelProviderAPI.getModels(selectedProviderId);
                setAvailableChatModels(models);
            } catch (e) {
                console.error('Failed to load models', e);
            }
            // TODO: save it to providers.json
            localStorage.setItem(LS_PROVIDER_KEY, selectedProviderId);
        }

        loadModels();
    }, [selectedProviderId]);

    // When selectedModelId prop changes, update currentModelId
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

    function handleSelectProvider(id: string) {
        setSelectedProviderId(id);
        setOpen(false);
    }

    async function handleAddProvider(e: React.FormEvent) {
        e.preventDefault();
        if (submittingProvider) return;
        setSubmittingProvider(true);
        setProviderError(null);
        try {
            const providerData = {
                nickName: newProviderNickName.trim() || newProviderType?.toString(),
                type: newProviderType,
                apiKey: newProviderApiKey,
                apiUrl: newProviderApiUrl,
            } as ModelProviderCreate;
            const newProvider = await window.modelProviderAPI.addProvider(providerData);
            if (newProvider) {
                setSelectedProviderId(newProvider.id);
                setProviders([...providers, newProvider]);
            }
            // reset form
            setAddingProvider(false);
            setNewProviderType(null);
            setNewProviderNickName('');
            setNewProviderApiKey('');
            setNewProviderApiUrl(undefined);
            // @ts-expect-error Catch clause variable type annotation must be any or unknown
        } catch (err: never) {
            console.error('Failed to add provider:', err);
            setProviderError(err.message || 'Failed to add provider');
        } finally {
            setSubmittingProvider(false);
        }
    }

    if (!selectedProviderId) {
        return (
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild className={cn('w-fit', className)}>
                    <Button variant="outline" className="md:px-2 md:h-[34px]" data-testid="provider-selector">
                        Select Provider <ChevronDownIcon/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[340px] p-2">
                    {providers.length > 0 && !addingProvider && (
                        <div className="flex flex-col gap-1 mb-2">
                            {providers.map(p => (
                                <DropdownMenuItem key={p.id} onSelect={() => handleSelectProvider(p.id)} asChild>
                                    <button type="button" className="flex flex-row justify-between w-full items-center">
                                        <span className="flex">
                                            <ProviderIcon type={p.type} theme={resolvedTheme}/>
                                            {p.nickName}
                                        </span>
                                    </button>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                    {!addingProvider && (
                        <div className="flex flex-col gap-2">
                            <Button size="sm" onClick={() => setAddingProvider(true)} variant="secondary">Add
                                Provider</Button>
                            {providers.length === 0 &&
                                <div className="text-xs text-muted-foreground">No providers yet. Add one to
                                    continue.</div>}
                        </div>
                    )}
                    {addingProvider && (
                        // Show all available provider options
                        !newProviderType ? (
                            <div className="flex flex-col gap-1">
                                <div className="px-2 py-1.5 text-sm font-semibold">Add a provider</div>
                                {[...PredefinedProviders, CustomProvider].map(providerType => {
                                    const info = ProviderInfo[providerType];

                                    return (
                                        <DropdownMenuItem
                                            key={providerType}
                                            onSelect={(event) => {
                                                // stop from closing the dropdown
                                                event.preventDefault();
                                                setNewProviderType(providerType);
                                                setNewProviderNickName(info.name);
                                                setProviderError(null);
                                            }}
                                        >
                                            <button type="button"
                                                    className="flex w-full items-center gap-3 p-2 text-left">
                                                <ProviderIcon type={providerType} theme={resolvedTheme} size={50}/>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{info.name}</span>
                                                    <span
                                                        className="text-xs text-muted-foreground">{info.description}</span>
                                                </div>
                                            </button>
                                        </DropdownMenuItem>
                                    );
                                })}
                                <div className="my-1 border-t"/>
                                <DropdownMenuItem onSelect={(event) => {
                                    // stop from closing the dropdown
                                    event.preventDefault();
                                    setAddingProvider(false);
                                }}>
                                    <button type="button" className="flex w-full justify-center text-sm py-1">
                                        Cancel
                                    </button>
                                </DropdownMenuItem>
                            </div>
                        ) : (
                            // Show the form for the selected provider
                            (() => {
                                const isCustomProvider = newProviderType === ModelProviderType.CUSTOM;
                                const apiUrlLabel = isCustomProvider ? 'API URL' : 'API URL (optional override)';
                                const apiUrlPlaceholder = isCustomProvider ? 'https://api.example.com/v1' : 'Leave blank for default';

                                return (
                                    <form onSubmit={handleAddProvider} className="flex flex-col gap-2 p-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <ProviderIcon type={newProviderType} theme={resolvedTheme}/>
                                            <h3 className="font-semibold">{newProviderType === CustomProvider ? 'Custom Provider' : newProviderType}</h3>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium">Nick Name</label>
                                            <input
                                                className="border rounded px-2 py-1 bg-background"
                                                value={newProviderNickName}
                                                onChange={e => setNewProviderNickName(e.target.value)}
                                                placeholder="Display name"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium">API Key</label>
                                            <input required className="border rounded px-2 py-1 bg-background"
                                                   type="password"
                                                   value={newProviderApiKey}
                                                   onChange={e => setNewProviderApiKey(e.target.value)}
                                                   placeholder="Enter your API key"/>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-medium">{apiUrlLabel}</label>
                                            <input
                                                required={isCustomProvider}
                                                className="border rounded px-2 py-1 bg-background"
                                                value={newProviderApiUrl ?? ''}
                                                onChange={(e) => setNewProviderApiUrl(e.target.value)}
                                                placeholder={apiUrlPlaceholder}
                                            />
                                        </div>
                                        {providerError && <div className="text-xs text-red-500">{providerError}</div>}
                                        <div className="flex gap-2 pt-1">
                                            <Button type="submit" size="sm"
                                                    disabled={submittingProvider || !newProviderApiKey}>{submittingProvider ? 'Saving...' : 'Save'}</Button>
                                            <Button type="button" size="sm" variant="secondary" onClick={() => {
                                                setNewProviderType(null);
                                                setProviderError(null);
                                                setNewProviderApiKey('');
                                                setNewProviderApiUrl(undefined);
                                            }}>Back</Button>
                                        </div>
                                    </form>
                                );
                            })()
                        )
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    const selectedProvider = providers.find(p => p.id === selectedProviderId);

    return (
        <div className={cn('flex gap-2', className)}>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger
                    asChild
                    className={cn(
                        'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground'
                    )}
                >
                    <Button
                        data-testid="model-selector"
                        variant="outline"
                        className="md:px-2 md:h-[34px]"
                    >
                        {selectedChatModel?.name || 'Select Model'}
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
                    {availableChatModels.length === 0 && (
                        <div className="px-2 py-1 text-xs text-muted-foreground">No models found for this
                            provider.</div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <Button
                variant="secondary"
                size="sm"
                className="h-[34px] flex items-center"
                onClick={() => {
                    setSelectedProviderId(null);
                    setAvailableChatModels([]);
                    setCurrentModelId('');
                    // TODO: remove from provider.json
                    localStorage.removeItem(LS_PROVIDER_KEY);
                }}
                title={selectedProvider ? `Current provider: ${selectedProvider.nickName}` : 'Change Provider'}
            >
                {selectedProvider && <ProviderIcon type={selectedProvider.type} theme={resolvedTheme}/>}
                Change Provider
            </Button>
        </div>
    );
}
