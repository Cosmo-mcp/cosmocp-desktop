'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ProviderIcon from '@/components/ui/provider-icon';
import { ProviderInfo } from '@/lib/types';
import { NewModel, ProviderWithModels } from 'core/dto';
import { CustomProvider, ModelProviderTypeEnum, PredefinedProviders } from 'core/database/schema/modelProviderSchema';
import { useTheme } from 'next-themes';
import { defineStepper } from "@stepperize/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader } from "@/components/ai-elements/loader";
import { logger } from "../../logger";

interface ProviderFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingProvider: ProviderWithModels | null;
    onSuccess: () => void;
}

export function ProviderFormDialog({
    isOpen,
    onOpenChange,
    editingProvider,
    onSuccess
}: ProviderFormDialogProps) {
    const { resolvedTheme } = useTheme();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [models, setModels] = useState<NewModel[]>([]);

    // Form state
    const [selectedProviderType, setSelectedProviderType] = useState<ModelProviderTypeEnum | null>(null);
    const [name, setName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiUrl, setApiUrl] = useState('');
    const [selectedModels, setSelectedModels] = useState<NewModel[]>([]);

    const { useStepper } = defineStepper(
        { id: "step-1", title: "Select Provider" },
        { id: "step-2", title: "Enter Info" },
        { id: "step-3", title: "Select Models" }
    );

    const methods = useStepper();

    // Reset form when dialog opens/closes/editingProvider changes
    React.useEffect(() => {
        if (isOpen) {
            setError(null);
            if (editingProvider) {
                setSelectedProviderType(editingProvider.type);
                setName(editingProvider.name ?? '');
                setApiKey(editingProvider.apiKey ?? '');
                setApiUrl(editingProvider.apiUrl ?? '');
                setSelectedModels(editingProvider.models ?? []);
                // If editing, we might need to load available models immediately or let user go to step 3?
                // The original code went to step-2 for editing.
                methods.goTo("step-2");
            } else {
                setSelectedProviderType(null);
                setName('');
                setApiKey('');
                setApiUrl('');
                setSelectedModels([]);
                setModels([]);
                methods.goTo("step-1");
            }
        }
    }, [isOpen, editingProvider]);

    const handleProviderTypeChange = (type: string) => {
        const selectedType = type as ModelProviderTypeEnum;
        setSelectedProviderType(selectedType);
        const info = ProviderInfo[selectedType];
        setName(info.name);
        methods.next();
    };

    const handleAddProvider = async () => {
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
                await window.api.modelProvider.updateProvider(editingProvider.id, providerData, selectedModels);
            } else {
                await window.api.modelProvider.addProvider(providerData, selectedModels);
            }
            onSuccess();
            onOpenChange(false);
        } catch (err) {
            const errorMessage = `Failed to ${editingProvider ? 'update' : 'add'} provider`;
            logger.error(`Failed to ${editingProvider ? 'update' : 'add'} provider:`, err);
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModelToggle = (modelId: string) => {
        const modelIdSet = new Set(selectedModels.map(m => m.modelId));
        if (modelIdSet.has(modelId)) {
            setSelectedModels(selectedModels.filter(m => m.modelId !== modelId));
        } else {
            const modelToAdd = models.find(m => m.modelId === modelId);
            if (modelToAdd) {
                setSelectedModels([...selectedModels, modelToAdd]);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                                        <ProviderIcon type={providerType} theme={resolvedTheme} size={40} />
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
                                <ProviderIcon type={selectedProviderType} theme={resolvedTheme} size={32} />
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
                        <div className="space-y-4">
                            <ScrollArea type="always" className="h-72 rounded-md border">
                                {models.length === 0 ? (<Loader />) :
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
                                        }).catch(error => {
                                            logger.error(error);
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
                            onClick={handleAddProvider}
                            disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
