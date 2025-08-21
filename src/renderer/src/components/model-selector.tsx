'use client';

import React, {useEffect, useMemo, useState} from 'react';

import {Button} from '@/components/ui/button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from '@/components/ui/dropdown-menu';
import {cn} from '@/lib/utils';

import {CheckCircleFillIcon, ChevronDownIcon} from './icons';
import {Model} from 'cosmo-commons/models/model';
import {
    ModelProviderCreate,
    ProviderLite
} from 'cosmo-commons/models/modelProvider';
// TODO(jayasurya): also import from modelProvider
import {ModelProviders, CustomProvider, PredefinedProviders} from "@/lib/types";

const LS_PROVIDER_KEY = 'selectedProviderId';

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
    const [providers, setProviders] = useState<ProviderLite>([]);
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [addingProvider, setAddingProvider] = useState(false);

    const [newProviderType, setNewProviderType] = useState<ModelProviders>(ModelProviders.OPENAI);
    const [newProviderName, setNewProviderName] = useState('');
    const [newProviderApiKey, setNewProviderApiKey] = useState('');
    const [newProviderApiUrl, setNewProviderApiUrl] = useState('');
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
            let providerData: ModelProviderCreate;
            const baseName = newProviderName.trim() || newProviderType?.toString();
            if (newProviderType === ModelProviders.CUSTOM) {
                providerData = {
                    name: baseName,
                    type: newProviderType,
                    apiKey: newProviderApiKey,
                    apiUrl: newProviderApiUrl,
                    comment: undefined,
                };
            } else {
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
                            <Button size="sm" onClick={() => setAddingProvider(true)} variant="secondary">Add
                                Provider</Button>
                            {providers.length === 0 &&
                                <div className="text-xs text-muted-foreground">No providers yet. Add one to
                                    continue.</div>}
                        </div>
                    )}
                    {addingProvider && (() => {
                        const isCustomProvider = newProviderType === ModelProviders.CUSTOM;
                        const apiUrlLabel = isCustomProvider ? 'API URL' : 'API URL (optional override)';
                        const apiUrlPlaceholder = isCustomProvider ? 'https://api.example.com/v1' : 'Leave blank for default';

                        return (
                            <form onSubmit={handleAddProvider} className="flex flex-col gap-2 mt-1">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium">Type</label>
                                    <select className="border rounded px-2 py-1 bg-background" value={newProviderType}
                                            onChange={e => setNewProviderType(e.target.value as ModelProviders)}>
                                        {PredefinedProviders.map(t => <option key={t} value={t}>{t}</option>)}
                                        <option value={CustomProvider}>{CustomProvider}</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium">Name</label>
                                    <input className="border rounded px-2 py-1 bg-background" value={newProviderName}
                                           onChange={e => setNewProviderName(e.target.value)}
                                           placeholder="Display name"/>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium">API Key</label>
                                    <input required className="border rounded px-2 py-1 bg-background" type="password"
                                           value={newProviderApiKey}
                                           onChange={e => setNewProviderApiKey(e.target.value)} placeholder="sk-..."/>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium">{apiUrlLabel}</label>
                                    <input
                                        required={isCustomProvider}
                                        className="border rounded px-2 py-1 bg-background"
                                        value={newProviderApiUrl}
                                        onChange={(e) => setNewProviderApiUrl(e.target.value)}
                                        placeholder={apiUrlPlaceholder}
                                    />
                                </div>
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
                        );
                    })()}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

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
                        <div className="px-2 py-1 text-xs text-muted-foreground">No models found for this
                            provider.</div>
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
                    // TODO: remove from provider.json
                    localStorage.removeItem(LS_PROVIDER_KEY);
                }}
                title={selectedProvider ? `Current provider: ${selectedProvider.name}` : 'Change Provider'}
            >
                Change Provider
            </Button>
        </div>
    );
}