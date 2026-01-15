"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {Persona, PersonaCreateInput} from "core/dto";
import {SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton} from "@/components/ui/sidebar";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Plus} from "lucide-react";

export function PersonaList() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [details, setDetails] = useState("");
    const [error, setError] = useState<string | null>(null);

    const loadPersonas = useCallback(async () => {
        const list = await window.api.persona.getAll();
        setPersonas(list);
    }, []);

    useEffect(() => {
        loadPersonas();
    }, [loadPersonas]);

    const resetForm = useCallback(() => {
        setName("");
        setDetails("");
        setError(null);
    }, []);

    const handleOpenChange = useCallback((open: boolean) => {
        setIsOpen(open);
        if (!open) {
            resetForm();
        }
    }, [resetForm]);

    const createPayload = useMemo<PersonaCreateInput>(() => ({
        name: name.trim(),
        details: details.trim(),
    }), [name, details]);

    const handleSave = useCallback(async () => {
        if (!createPayload.name) {
            setError("Name is required.");
            return;
        }
        if (!createPayload.details) {
            setError("Details are required.");
            return;
        }

        try {
            await window.api.persona.create(createPayload);
            await loadPersonas();
            handleOpenChange(false);
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Failed to save persona.");
        }
    }, [createPayload, handleOpenChange, loadPersonas]);

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Personas</SidebarGroupLabel>
            <SidebarGroupAction asChild>
                <button type="button" onClick={() => handleOpenChange(true)}>
                    <Plus />
                    <span className="sr-only">Add persona</span>
                </button>
            </SidebarGroupAction>
            <SidebarGroupContent>
                <SidebarMenu>
                    {personas.length === 0 ? (
                        <SidebarMenuItem>
                            <SidebarMenuButton disabled>
                                <span className="text-muted-foreground">No personas yet</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ) : (
                        personas.map((persona) => (
                            <SidebarMenuItem key={persona.id}>
                                <SidebarMenuButton>
                                    <span>@{persona.name}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))
                    )}
                </SidebarMenu>
            </SidebarGroupContent>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Persona</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="persona-name">Name</label>
                            <Input
                                id="persona-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="persona-name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="persona-details">Details</label>
                            <Textarea
                                id="persona-details"
                                rows={6}
                                value={details}
                                onChange={(event) => setDetails(event.target.value)}
                                placeholder="Describe how this persona should behave..."
                            />
                        </div>
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : null}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save persona</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarGroup>
    );
}
