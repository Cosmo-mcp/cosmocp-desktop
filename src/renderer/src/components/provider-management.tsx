'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import ProviderIcon from '@/components/ui/provider-icon';
import { ProviderWithModels } from 'core/dto';
import { useTheme } from 'next-themes';
import { Edit, Trash2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { logger } from "../../logger";
import { ProviderFormDialog } from "@/components/provider-form-dialog";

export function ProviderManagement() {
    const { resolvedTheme } = useTheme();
    const [providers, setProviders] = useState<ProviderWithModels[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingProvider, setEditingProvider] = useState<ProviderWithModels | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, providerId: string | null }>({
        isOpen: false,
        providerId: null
    });

    // Load providers
    async function loadProviders() {
        try {
            const list = await window.api.modelProvider.getProvidersWithModels();
            setProviders(list);
        } catch (e) {
            logger.error('Failed to load providers', e);
        } finally {
            setLoading(false);
        }
    }

    // Load providers on mount
    useEffect(() => {
        loadProviders();
    }, []);

    const handleOpenDialog = () => {
        setEditingProvider(null);
        setIsOpen(true);
    };

    const handleEditProvider = (provider: ProviderWithModels) => {
        setEditingProvider(provider);
        setIsOpen(true);
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
            logger.error('Failed to delete provider:', err);
        } finally {
            setIsDeleting(null);
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
                                    <ProviderIcon type={provider.type} theme={resolvedTheme} size={40} />
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
                                        <Edit className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => handleDeleteClick(provider.id)}
                                        disabled={isDeleting === provider.id}
                                        title="Delete provider"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <Trash2 className="size-4" />
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

            <ProviderFormDialog
                isOpen={isOpen}
                onOpenChange={setIsOpen}
                editingProvider={editingProvider}
                onSuccess={loadProviders}
            />

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

