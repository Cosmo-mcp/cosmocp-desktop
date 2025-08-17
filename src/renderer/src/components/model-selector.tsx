'use client';

import React, {useEffect, useMemo, useState} from 'react';

import {Button} from '@/components/ui/button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from '@/components/ui/dropdown-menu';
import {cn} from '@/lib/utils';

import {CheckCircleFillIcon, ChevronDownIcon} from './icons';
import {Model} from 'cosmo-commons/models/model';
import {ModelProviderCreate, ModelProviderTypes, ProviderLite} from '@/lib/types';

// Add proper provider type aliases
type PredefinedProviderType = typeof ModelProviderTypes.predefined;
type ProviderType = PredefinedProviderType | typeof ModelProviderTypes.custom;

const LS_PROVIDER_KEY = 'selectedProviderId';

export function ModelSelector({
                                  selectedModelId,
                                  onModelChange,
                                  className,
                                  onProviderChange,
                              }: {
    selectedModelId: string;
    onModelChange?: (modelId: string) => void;
    onProviderChange?: (providerId: string) => void;
} & React.ComponentProps<typeof Button>) {
    const [open, setOpen] = useState(false);
    const [currentModelId, setCurrentModelId] = useState(selectedModelId);
    const [availableChatModels, setAvailableChatModels] = useState<Model[]>([]);
    const [providers, setProviders] = useState<ProviderLite[]>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [addingProvider, setAddingProvider] = useState(false);

    // Add provider form state
    const [newProviderType, setNewProviderType] = useState<ProviderType>(ModelProviderTypes.predefined);
    const [newProviderName, setNewProviderName] = useState('');
    const [newProviderApiKey, setNewProviderApiKey] = useState('');
    const [newProviderApiUrl, setNewProviderApiUrl] = useState('');
    const [submittingProvider, setSubmittingProvider] = useState(false);
    const [providerError, setProviderError] = useState<string | null>(null);

    // Initial load: providers + selected provider from localStorage
    useEffect(() => {
        async function init() {
            try {
                const list = await window.modelProviderAPI.getProviders();
                setProviders(list);
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
        if (!selectedProviderId) return;

        async function loadModels() {
            try {
                if (!selectedProviderId) return;
                const models = await window.modelProviderAPI.getModels(selectedProviderId);
                setAvailableChatModels(models);
            } catch (e) {
                console.error('Failed to load models', e);
            }
        }

        loadModels();
        localStorage.setItem(LS_PROVIDER_KEY, selectedProviderId);
        onProviderChange?.(selectedProviderId);
    }, [selectedProviderId, onProviderChange]);

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
            // Build providerData in a type-safe way for the discriminated union
            let providerData: ModelProviderCreate;
            const baseName = newProviderName.trim() || newProviderType.toString();
            if (newProviderType === ModelProviderTypes.custom) {
                // custom requires apiUrl
                providerData = {
                    name: baseName,
                    type: newProviderType,
                    apiKey: newProviderApiKey,
                    apiUrl: newProviderApiUrl,
                    comment: undefined,
                };
            } else {
                // predefined: apiUrl optional override
                providerData = {
                    name: baseName,
                    type: newProviderType,
                    apiKey: newProviderApiKey,
                    ...(newProviderApiUrl ? {apiUrl: newProviderApiUrl} : {}),
                    comment: undefined,
                };
            }
            await window.modelProviderAPI.addProvider(providerData);
            const list = await window.modelProviderAPI.getProviders();
            setProviders(list);
            // pick the newly added one: find by name & type & (apiUrl if provided)
            const added = list.find(p => p.name === providerData.name && p.type === providerData.type && (!providerData.apiUrl || p.apiUrl === providerData.apiUrl));
            if (added) {
                setSelectedProviderId(added.id);
            }
            // reset form
            setAddingProvider(false);
            setNewProviderName('');
            setNewProviderApiKey('');
            setNewProviderApiUrl('');
            // @ts-expect-error burp
        } catch (err: never) {
            setProviderError(err['message'] || 'Failed to add provider');
        } finally {
            setSubmittingProvider(false);
        }
    }

    // If no provider selected, show provider selection UI
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
                                        <span>{p.name}</span>
                                    </button>
                                </DropdownMenuItem>
                            ))}
                        </div>
                    )}
                    {!addingProvider && (
                        <div className="flex flex-col gap-2">
                            <Button size="sm" onClick={() => setAddingProvider(true)} variant="secondary">Add Provider</Button>
                            {providers.length === 0 && <div className="text-xs text-muted-foreground">No providers yet. Add one to continue.</div>}
                        </div>
                    )}
                    {addingProvider && (
                        <form onSubmit={handleAddProvider} className="flex flex-col gap-2 mt-1">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium">Type</label>
                                <select className="border rounded px-2 py-1 bg-background" value={newProviderType}
                                        onChange={e => setNewProviderType(e.target.value as ProviderType)}>
                                    {ModelProviderTypes.predefined.map(t => <option key={t} value={t}>{t}</option>)}
                                    <option value={ModelProviderTypes.custom}>{ModelProviderTypes.custom}</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium">Name</label>
                                <input className="border rounded px-2 py-1 bg-background" value={newProviderName}
                                       onChange={e => setNewProviderName(e.target.value)} placeholder="Display name"/>
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium">API Key</label>
                                <input required className="border rounded px-2 py-1 bg-background" type="password" value={newProviderApiKey}
                                       onChange={e => setNewProviderApiKey(e.target.value)} placeholder="sk-..."/>
                            </div>
                            {(newProviderType === ModelProviderTypes.custom) && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium">API URL</label>
                                    <input required className="border rounded px-2 py-1 bg-background" value={newProviderApiUrl}
                                           onChange={e => setNewProviderApiUrl(e.target.value)} placeholder="https://api.example.com/v1"/>
                                </div>
                            )}
                            {(newProviderType !== ModelProviderTypes.custom) && (
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium">API URL (optional override)</label>
                                    <input className="border rounded px-2 py-1 bg-background" value={newProviderApiUrl}
                                           onChange={e => setNewProviderApiUrl(e.target.value)} placeholder="Leave blank for default"/>
                                </div>
                            )}
                            {providerError && <div className="text-xs text-red-500">{providerError}</div>}
                            <div className="flex gap-2 pt-1">
                                <Button type="submit" size="sm"
                                        disabled={submittingProvider || !newProviderApiKey}>{submittingProvider ? 'Saving...' : 'Save'}</Button>
                                <Button type="button" size="sm" variant="secondary" onClick={() => {
                                    setAddingProvider(false);
                                    setProviderError(null);
                                }}>Cancel</Button>
                            </div>
                        </form>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    // New: show provider name and allow changing provider alongside model selector
    const selectedProvider = providers.find(p => p.id === selectedProviderId);

    return (
        <div className={cn('flex items-center gap-2', className)}>
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
                        <div className="px-2 py-1 text-xs text-muted-foreground">No models found for this provider.</div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <Button
                variant="secondary"
                size="sm"
                className="h-[34px]"
                onClick={() => {
                    setSelectedProviderId(null);
                    setAvailableChatModels([]);
                    setCurrentModelId('');
                    localStorage.removeItem(LS_PROVIDER_KEY);
                }}
                title={selectedProvider ? `Current provider: ${selectedProvider.name}` : 'Change Provider'}
            >
                Change Provider
            </Button>
        </div>
    );
}