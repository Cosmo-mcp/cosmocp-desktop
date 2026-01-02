'use client';

import React, {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import ProviderIcon from '@/components/ui/provider-icon';
import {ProviderInfo} from '@/lib/types';
import {NewModel, ProviderWithModels} from 'core/dto';
import {CustomProvider, ModelProviderTypeEnum, PredefinedProviders} from 'core/database/schema/modelProviderSchema';
import {useTheme} from 'next-themes';
import {Edit, Trash2} from 'lucide-react';
import {defineStepper} from "@stepperize/react";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Loader} from "@/components/ai-elements/loader";
import {ConfirmDialog} from "@/components/confirm-dialog";
import log from 'electron-log/renderer';

export function ProviderManagement() {
    const {resolvedTheme} = useTheme();
    const [providers, setProviders] = useState<ProviderWithModels[]>([]);
    const [models, setModels] = useState<NewModel[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean, providerId: string | null}>({
        isOpen: false,
        providerId: null
    });

    // Form state
    const [selectedProviderType, setSelectedProviderType] = useState<ModelProviderTypeEnum | null>(null);
    const [name, setName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiUrl, setApiUrl] = useState('');
    const [editingProvider, setEditingProvider] = useState<ProviderWithModels | null>(null);
    const [selectedModels, setSelectedModels] = useState<NewModel[]>([]);

    const {useStepper} = defineStepper(
        {id: "step-1", title: "Select Provider"},
        {id: "step-2", title: "Enter Info"},
        {id: "step-3", title: "Select Models"}
    );

    const methods = useStepper();

    // Load providers on mount
    useEffect(() => {
        async function loadProviders() {
            try {
                const list = await window.api.modelProvider.getProvidersWithModels();
                setProviders(list);
            } catch (e) {
                log.error('Failed to load providers', e);
                setError('Failed to load providers');
            } finally {
                setLoading(false);
            }
        }

        loadProviders();
    }, []);

    const handleOpenDialog = () => {
        setIsOpen(true);
        setError(null);
        methods.goTo("step-1");
    };

    const handleCloseDialog = () => {
        setIsOpen(false);
        setSelectedProviderType(null);
        setName('');
        setApiKey('');
        setApiUrl('');
        setError(null);
        setEditingProvider(null);
        setSelectedModels([]);
        setModels([]);
    };

    const handleProviderTypeChange = (type: string) => {
        const selectedType = type as ModelProviderTypeEnum;
        setSelectedProviderType(selectedType);
        const info = ProviderInfo[selectedType];
        setName(info.name);
        methods.next();
    };

    const handleAddProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProviderType || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const isCustomProvider = selectedProviderType === ModelProviderTypeEnum.CUSTOM;
            const providerData = {
                type: selectedProviderType,
                name: name.trim(),
                apiKey: apiKey.trim(),
                apiUrl: apiUrl.trim() || (isCustomProvider ? '' : undefined),
            };

            if (editingProvider) {
                // Update existing provider
                const updatedProvider = await window.api.modelProvider.updateProvider(editingProvider.id, providerData, selectedModels);
                if (updatedProvider) {
                    setProviders(providers.map(p => p.id === editingProvider.id ? updatedProvider : p));
                    handleCloseDialog();
                }
            } else {
                const newProvider = await window.api.modelProvider.addProvider(providerData, selectedModels);
                if (newProvider) {
                    setProviders([...providers, newProvider]);
                    handleCloseDialog();
                }
            }
        } catch (err) {
            const errorMessage = `Failed to ${editingProvider ? 'update' : 'add'} provider`;
            log.error(`Failed to ${editingProvider ? 'update' : 'add'} provider:`, err);
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditProvider = (provider: ProviderWithModels) => {
        setEditingProvider(provider);
        setSelectedProviderType(provider.type);
        setName(provider.name ?? '');
        setApiKey(provider.apiKey ?? '');
        setApiUrl(provider.apiUrl ?? '');
        setSelectedModels(provider.models ?? []);
        setIsOpen(true);
        setError(null);
        methods.goTo("step-2");
    };

    const handleDeleteClick = (providerId: string) => {
        setDeleteConfirmation({ isOpen: true, providerId });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation.providerId) return;
        const providerId = deleteConfirmation.providerId;

        setIsDeleting(providerId);
        setDeleteConfirmation({ isOpen: false, providerId: null });

        try {
            await window.api.modelProvider.deleteProvider(providerId);
            setProviders(providers.filter(p => p.id !== providerId));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete provider';
            log.error('Failed to delete provider:', err);
            setError(errorMessage);
        } finally {
            setIsDeleting(null);
        }
    };

    const handleModelToggle = (modelId: string) => {
        // Use Set for uniqueness checking
        const modelIdSet = new Set(selectedModels.map(m => m.modelId));

        if (modelIdSet.has(modelId)) {
            // Remove model
            setSelectedModels(selectedModels.filter(m => m.modelId !== modelId));
        } else {
            // Add model
            const modelToAdd = models.find(m => m.modelId === modelId);
            if (modelToAdd) {
                setSelectedModels([...selectedModels, modelToAdd]);
            }
        }
    };

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading providers...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium">Providers</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Manage your AI provider configurations and API keys.
                    </p>
                </div>
                <Button onClick={handleOpenDialog} className="ml-auto">
                    Add Provider
                </Button>
            </div>

            {providers.length > 0 ? (
                <ScrollArea type="always" className="h-[50dvh]">
                    <div className="space-y-3">
                        {providers.map((provider) => (
                            <Card key={provider.id} className="p-4 justify-between flex-row">
                            <div className="flex items-center gap-3">
                                <ProviderIcon type={provider.type} theme={resolvedTheme} size={40}/>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{provider.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{provider.type}</p>
                                    {provider.models && provider.models.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {provider.models.map((model) => (
                                                <span key={model.modelId}
                                                      className="inline-block px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                                                    {model.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleEditProvider(provider)}
                                    title="Edit provider">
                                    <Edit className="size-4"/>
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() => handleDeleteClick(provider.id)}
                                    disabled={isDeleting === provider.id}
                                    title="Delete provider"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="size-4"/>
                                </Button>
                            </div>
                        </Card>
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <Card className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No providers added yet.</p>
                </Card>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingProvider ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
                    </DialogHeader>
                    <React.Fragment>
                        {methods.when("step-1", () => (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">Select a provider type:</p>
                                {[...PredefinedProviders, CustomProvider].map((providerType) => {
                                    const info = ProviderInfo[providerType];
                                    return (
                                        <button
                                            key={providerType}
                                            type="button"
                                            onClick={() => handleProviderTypeChange(providerType)}
                                            className={`w-full flex items-center gap-3 p-3 border rounded-lg transition-colors text-left ${selectedProviderType === providerType ? 'bg-secondary text-secondary-foreground' : 'hover:bg-accent'}`}
                                        >
                                            <ProviderIcon type={providerType} theme={resolvedTheme} size={40}/>
                                            <div>
                                                <p className="text-sm font-medium">{info.name}</p>
                                                <p className="text-xs text-muted-foreground">{info.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                        {selectedProviderType && methods.when("step-2", () => (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 pb-2 border-b">
                                    <ProviderIcon type={selectedProviderType} theme={resolvedTheme} size={32}/>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {ProviderInfo[selectedProviderType].name}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Name(Unique)</label>
                                    <input
                                        type="text"
                                        placeholder="Display name (e.g., My OpenAI Account)"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">API Key *</label>
                                    <input
                                        type="password"
                                        placeholder="Enter your API key"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                                    />
                                </div>

                                {(selectedProviderType === ModelProviderTypeEnum.CUSTOM) && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">API URL *</label>
                                        <input
                                            type="url"
                                            placeholder="https://api.example.com/v1"
                                            value={apiUrl}
                                            onChange={(e) => setApiUrl(e.target.value)}
                                            required={selectedProviderType === ModelProviderTypeEnum.CUSTOM}
                                            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                                        />
                                    </div>
                                )}

                                {(selectedProviderType !== ModelProviderTypeEnum.CUSTOM) && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">API URL (optional)</label>
                                        <input
                                            type="url"
                                            placeholder="Leave blank for default"
                                            value={apiUrl}
                                            onChange={(e) => setApiUrl(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        {methods.when("step-3", () => (
                            //iterate over the models
                            <div className="space-y-4">
                                <ScrollArea type="always" className="h-72 rounded-md border">
                                    {models.length === 0 ? (<Loader/>) :
                                        models.map((model) => (
                                            <div key={model.modelId} className="flex items-center space-x-2 p-2">
                                                <input
                                                    type="checkbox"
                                                    id={model.modelId}
                                                    name={model.modelId}
                                                    checked={selectedModels.some(m => m.modelId === model.modelId)}
                                                    onChange={() => handleModelToggle(model.modelId)}
                                                />
                                                <label htmlFor={model.modelId}
                                                       className="text-sm font-medium cursor-pointer">
                                                    {model.name}
                                                </label>
                                            </div>
                                        ))}
                                </ScrollArea>
                                {error && (
                                    <div
                                        className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-600">
                                        {error}
                                    </div>
                                )}
                            </div>
                        ))}

                    </React.Fragment>
                    <DialogFooter>
                        {!methods.isFirst && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => methods.prev()}
                            >
                                Prev
                            </Button>
                        )}
                        {!methods.isLast && !(selectedProviderType === ModelProviderTypeEnum.CUSTOM) && (
                            <Button
                                type="button"
                                disabled={(methods.current.id === 'step-1' && !selectedProviderType)}
                                onClick={() => {
                                    if (methods.current.id === 'step-2') {
                                        methods.beforeNext(() => {
                                            window.api.modelProvider.getAvailableModelsFromProviders({
                                                type: selectedProviderType as ModelProviderTypeEnum,
                                                apiKey,
                                                apiUrl,
                                                name
                                            }).then((values) => {
                                                setModels(values);
                                                // If editing and already have selected models, they'll stay selected
                                                // because we set them in handleEditProvider
                                            }).catch(error => {
                                                log.error(error);
                                            });
                                            return true;
                                        });
                                    }
                                    methods.next()
                                }}
                            >
                                Next
                            </Button>
                        )}
                        {(methods.isLast || (methods.current.id === 'step-2' && selectedProviderType === ModelProviderTypeEnum.CUSTOM)) && (
                            <Button
                                type="button"
                                onClick={handleAddProvider}>
                                Save
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseDialog}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={deleteConfirmation.isOpen}
                onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
                title="Delete Provider"
                description="Are you sure you want to delete this provider? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
}

