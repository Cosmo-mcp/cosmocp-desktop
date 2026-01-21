'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from '@/components/ui/sidebar';

type Persona = Awaited<ReturnType<typeof window.api.persona.getAll>>[number];

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'Unable to create persona.';
};

const isUniqueNameError = (message: string) => {
    const normalized = message.toLowerCase();
    return normalized.includes('unique') || normalized.includes('duplicate') || normalized.includes('already exists');
};

export function PersonaList() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [details, setDetails] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const loadPersonas = useCallback(async () => {
        const list = await window.api.persona.getAll();
        setPersonas(list);
    }, []);

    useEffect(() => {
        loadPersonas();
    }, [loadPersonas]);

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setDetails('');
            setErrorMessage(null);
            setIsSaving(false);
        }
    }, [isOpen]);

    const hasPersonas = personas.length > 0;
    const trimmedName = name.trim();
    const trimmedDetails = details.trim();

    const canSave = useMemo(() => {
        return trimmedName.length > 0 && !isSaving;
    }, [trimmedName, isSaving]);

    const handleSave = async () => {
        if (!trimmedName) {
            setErrorMessage('Name is required.');
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);

        try {
            await window.api.persona.create({
                name: trimmedName,
                details: trimmedDetails ? trimmedDetails : null
            });
            await loadPersonas();
            setIsOpen(false);
        } catch (error) {
            const message = getErrorMessage(error);
            if (isUniqueNameError(message)) {
                setErrorMessage('A persona with this name already exists.');
            } else {
                setErrorMessage(message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <SidebarGroup>
                <SidebarGroupLabel>Personas</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {hasPersonas ? (
                            personas.map((persona) => (
                                <SidebarMenuItem key={persona.id ?? persona.name}>
                                    <SidebarMenuButton>
                                        <span className="truncate">{persona.name}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))
                        ) : (
                            <SidebarMenuItem>
                                <div className="px-2 py-1 text-xs text-muted-foreground">
                                    No personas yet.
                                </div>
                            </SidebarMenuItem>
                        )}
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={() => setIsOpen(true)}>
                                <Plus />
                                <span>Add persona</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Add persona</DialogTitle>
                        <DialogDescription>
                            Create a persona with a unique name and optional details.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="persona-name">
                                Name
                            </label>
                            <Input
                                id="persona-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="e.g. Research Assistant"
                                aria-invalid={Boolean(errorMessage)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-sm font-medium" htmlFor="persona-details">
                                Details
                            </label>
                            <Textarea
                                id="persona-details"
                                value={details}
                                onChange={(event) => setDetails(event.target.value)}
                                placeholder="Optional description or behavior notes"
                                rows={4}
                            />
                        </div>
                        {errorMessage ? (
                            <p className="text-sm text-destructive" role="alert">
                                {errorMessage}
                            </p>
                        ) : null}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsOpen(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSave} disabled={!canSave}>
                            {isSaving ? 'Saving...' : 'Save persona'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
