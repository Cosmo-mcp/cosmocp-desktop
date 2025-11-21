'use client';

import React, {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Dialog, DialogContent, DialogFooter} from '@/components/ui/dialog';
import ProviderIcon from '@/components/ui/provider-icon';
import {ProviderInfo} from '@/lib/types';
import {ModelProviderLite, NewModel} from 'core/dto';
import {CustomProvider, ModelProviderTypeEnum, PredefinedProviders} from 'core/database/schema/modelProviderSchema';
import {useTheme} from 'next-themes';
import {Edit, Trash2} from 'lucide-react';
import {defineStepper} from "@stepperize/react";

export function ProviderManagement() {
    const {resolvedTheme} = useTheme();
    const [providers, setProviders] = useState<ModelProviderLite[]>([]);
    const [models, setModels] = useState<NewModel[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Form state
    const [selectedProviderType, setSelectedProviderType] = useState<ModelProviderTypeEnum | null>(null);
    const [nickName, setNickName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiUrl, setApiUrl] = useState('');

    const {Scoped, useStepper, steps} = defineStepper(
        {id: "step-1", title: "Select Provider"},
        {id: "step-2", title: "Enter Info"},
        {id: "step-3", title: "Select Models"}
    );

    const methods = useStepper();

    // Load providers on mount
    useEffect(() => {
        async function loadProviders() {
            try {
                const list = await window.api.modelProvider.getProviders();
                setProviders(list);
            } catch (e) {
                console.error('Failed to load providers', e);
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
    };

    const handleCloseDialog = () => {
        setIsOpen(false);
        setSelectedProviderType(null);
        setNickName('');
        setApiKey('');
        setApiUrl('');
        setError(null);
    };

    const handleProviderTypeChange = (type: string) => {
        const selectedType = type as ModelProviderTypeEnum;
        setSelectedProviderType(selectedType);
        const info = ProviderInfo[selectedType];
        setNickName(info.name);
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
                nickName: nickName.trim(),
                apiKey: apiKey.trim(),
                apiUrl: apiUrl.trim() || (isCustomProvider ? '' : undefined),
            };

            const newProvider = await window.api.modelProvider.addProvider(providerData, []);
            if (newProvider) {
                setProviders([...providers, newProvider]);
                handleCloseDialog();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add provider';
            console.error('Failed to add provider:', err);
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditProvider = (provider: ModelProviderLite) => {
        // TODO: Implement updateProvider method
        console.log('Edit provider:', provider);
    };

    const handleDeleteProvider = async (providerId: string) => {
        setIsDeleting(providerId);

        try {
            await window.api.modelProvider.deleteProvider(providerId);
            setProviders(providers.filter(p => p.id !== providerId));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete provider';
            console.error('Failed to delete provider:', err);
            setError(errorMessage);
        } finally {
            setIsDeleting(null);
        }
    };

    const isFormValid = selectedProviderType && apiKey.trim() && (selectedProviderType !== ModelProviderTypeEnum.CUSTOM || apiUrl.trim());

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
                <div className="grid gap-3">
                    {providers.map((provider) => (
                        <Card key={provider.id} className="p-4 justify-between flex-row">
                            <div className="flex items-center gap-3">
                                <ProviderIcon type={provider.type} theme={resolvedTheme} size={40}/>
                                <div>
                                    <p className="font-medium text-sm">{provider.nickName}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{provider.type}</p>
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
                                    onClick={() => handleDeleteProvider(provider.id)}
                                    disabled={isDeleting === provider.id}
                                    title="Delete provider"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="size-4"/>
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No providers added yet.</p>
                </Card>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <React.Fragment>
                        {methods.when("step-1", (step) => (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">Select a provider type:</p>
                                {[...PredefinedProviders, CustomProvider].map((providerType) => {
                                    const info = ProviderInfo[providerType];
                                    return (
                                        <button
                                            key={providerType}
                                            type="button"
                                            onClick={() => handleProviderTypeChange(providerType)}
                                            className={`w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-blue-100 transition-colors text-left ${selectedProviderType === providerType ? 'bg-blue-100' : ''}`}
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
                        {methods.when("step-2", (step) => (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nick Name</label>
                                    <input
                                        type="text"
                                        placeholder="Display name (e.g., My OpenAI Account)"
                                        value={nickName}
                                        onChange={(e) => setNickName(e.target.value)}
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

                                {error && (
                                    <div
                                        className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-600">
                                        {error}
                                    </div>
                                )}
                            </div>
                        ))}
                        {methods.when("step-3", (step) => (
                            //iterate over the models
                            <div className="space-y-4">
                                {models.map((model) => (
                                    <div key={model.modelId} className="flex items-center space-x-2">
                                        <input type="checkbox" id={model.modelId} name={model.modelId}/>
                                        <label htmlFor={model.modelId} className="text-sm font-medium">
                                            {model.name}
                                        </label>
                                    </div>
                                ))}
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
                        {!methods.isLast && (
                            <Button
                                type="button"
                                onClick={() => {
                                    if (methods.current.id === 'step-2') {
                                        methods.beforeNext(() => {
                                            window.api.modelProvider.getAvailableModelsFromProviders({
                                                type: selectedProviderType as ModelProviderTypeEnum,
                                                apiKey,
                                                apiUrl
                                            }).then((values) => {
                                                setModels(values);
                                            }).catch(error => {
                                                console.log(error);
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
                        {methods.isLast && (
                            <Button
                                type="button"
                                onClick={() => handleAddProvider}
                            >
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
        </div>
    );
}

