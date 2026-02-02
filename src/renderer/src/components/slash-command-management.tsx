'use client';

import {useCallback, useEffect, useMemo, useState} from "react";
import {toast} from "sonner";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {ConfirmDialog} from "@/components/confirm-dialog";
import {ScrollArea} from "@/components/ui/scroll-area";
import type {SlashCommandCreateInput, SlashCommandDefinition, SlashCommandUpdateInput} from "core/dto";
import {CheckIcon, Edit, Trash2} from "lucide-react";
import {logger} from "../../logger";

type ArgumentMode = "none" | "optional";

// Provide a clean form state when creating or resetting commands.
const buildDefaultFormState = () => ({
    name: "",
    description: "",
    template: "",
    argumentMode: "none" as ArgumentMode,
    argumentLabel: "",
});

export function SlashCommandManagement() {
    const [commands, setCommands] = useState<SlashCommandDefinition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCommand, setEditingCommand] = useState<SlashCommandDefinition | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{isOpen: boolean; commandId: string | null}>({
        isOpen: false,
        commandId: null,
    });
    const [formState, setFormState] = useState(buildDefaultFormState());

    const loadCommands = useCallback(async () => {
        try {
            const list = await window.api.slashCommand.listAll();
            setCommands(list);
        } catch (error) {
            logger.error("Failed to load slash commands", error);
            toast.error("Failed to load slash commands");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCommands();
    }, [loadCommands]);

    const handleOpenDialog = () => {
        setEditingCommand(null);
        setFormState(buildDefaultFormState());
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingCommand(null);
        setFormState(buildDefaultFormState());
    };

    const handleEdit = (command: SlashCommandDefinition) => {
        setEditingCommand(command);
        setFormState({
            name: command.name,
            description: command.description,
            template: command.template,
            argumentMode: command.argumentLabel ? "optional" : "none",
            argumentLabel: command.argumentLabel ?? "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isSubmitting) {
            return;
        }
        setIsSubmitting(true);

        const payloadBase = {
            name: formState.name.trim(),
            description: formState.description.trim(),
            template: formState.template.trim(),
            argumentLabel: formState.argumentMode === "optional" ? formState.argumentLabel.trim() || null : null,
        };

        try {
            if (editingCommand) {
                const updatePayload: SlashCommandUpdateInput = {
                    ...payloadBase,
                };
                const updated = await window.api.slashCommand.update(editingCommand.id as string, updatePayload);
                setCommands((prev) => prev.map((command) => (command.id === updated.id ? updated : command)));
                toast.success("Command updated");
            } else {
                const createPayload: SlashCommandCreateInput = payloadBase;
                const created = await window.api.slashCommand.create(createPayload);
                setCommands((prev) => [...prev, created]);
                toast.success("Command created");
            }
            handleCloseDialog();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save command.";
            toast.error(message);
            logger.error("Failed to save slash command", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (commandId: string) => {
        setDeleteConfirmation({isOpen: true, commandId});
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmation.commandId) {
            return;
        }
        const commandId = deleteConfirmation.commandId;
        setDeleteConfirmation({isOpen: false, commandId: null});
        try {
            await window.api.slashCommand.delete(commandId);
            setCommands((prev) => prev.filter((command) => command.id !== commandId));
            toast.success("Command deleted");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete command.";
            toast.error(message);
            logger.error("Failed to delete slash command", error);
        }
    };

    const commandGroups = useMemo(() => {
        return {
            builtIn: commands.filter((command) => command.builtIn),
            custom: commands.filter((command) => !command.builtIn),
        };
    }, [commands]);

    if (isLoading) {
        return <div className="text-sm text-muted-foreground">Loading commands...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium">Slash Commands</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Create quick prompts that start with a slash and optionally take one argument.
                    </p>
                </div>
                <Button onClick={handleOpenDialog}>Add Command</Button>
            </div>

            <Card className="p-3">
                <ScrollArea className="h-[360px] pr-2">
                    <div className="space-y-6">
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold">Built-in</h3>
                                <Badge variant="secondary">Read-only</Badge>
                            </div>
                            {commandGroups.builtIn.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No built-in commands yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {commandGroups.builtIn.map((command) => (
                                        <div
                                            key={command.name}
                                            className="flex flex-col gap-1 rounded-md border border-border bg-background p-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{command.name}</span>
                                                    <Badge variant="outline">Built-in</Badge>
                                                </div>
                                                <CheckIcon className="size-4 text-muted-foreground"/>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{command.description}</p>
                                            {command.argumentLabel && (
                                                <p className="text-xs text-muted-foreground">
                                                    Optional argument: {command.argumentLabel}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold">Custom</h3>
                                <Badge variant="secondary">Editable</Badge>
                            </div>
                            {commandGroups.custom.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No custom commands yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {commandGroups.custom.map((command) => (
                                        <div
                                            key={command.id}
                                            className="flex flex-col gap-2 rounded-md border border-border bg-background p-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">{command.name}</p>
                                                    <p className="text-xs text-muted-foreground">{command.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        aria-label={`Edit ${command.name}`}
                                                        onClick={() => handleEdit(command)}
                                                    >
                                                        <Edit className="size-4"/>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        aria-label={`Delete ${command.name}`}
                                                        onClick={() => handleDeleteClick(command.id as string)}
                                                    >
                                                        <Trash2 className="size-4"/>
                                                    </Button>
                                                </div>
                                            </div>
                                            {command.argumentLabel && (
                                                <p className="text-xs text-muted-foreground">
                                                    Optional argument: {command.argumentLabel}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </ScrollArea>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCommand ? "Edit Command" : "Create Command"}
                        </DialogTitle>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="command-name">Name</label>
                            <Input
                                id="command-name"
                                placeholder="/summarize"
                                value={formState.name}
                                onChange={(event) => setFormState((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="command-description">Description</label>
                            <Input
                                id="command-description"
                                placeholder="Describe what this command does."
                                value={formState.description}
                                onChange={(event) => setFormState((prev) => ({
                                    ...prev,
                                    description: event.target.value,
                                }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium" htmlFor="command-template">Template</label>
                            <Textarea
                                id="command-template"
                                placeholder="Summarize the last response. {{input}}"
                                value={formState.template}
                                onChange={(event) => setFormState((prev) => ({
                                    ...prev,
                                    template: event.target.value,
                                }))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Use <code>{"{{input}}"}</code> to inject the optional argument.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-sm font-medium">Argument</span>
                            <Select
                                value={formState.argumentMode}
                                onValueChange={(value) =>
                                    setFormState((prev) => ({
                                        ...prev,
                                        argumentMode: value as ArgumentMode,
                                        argumentLabel: value === "none" ? "" : prev.argumentLabel,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select argument mode"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No argument</SelectItem>
                                    <SelectItem value="optional">Optional argument</SelectItem>
                                </SelectContent>
                            </Select>
                            {formState.argumentMode === "optional" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" htmlFor="command-argument-label">Argument label</label>
                                    <Input
                                        id="command-argument-label"
                                        placeholder="Focus (optional)"
                                        value={formState.argumentLabel}
                                        onChange={(event) => setFormState((prev) => ({
                                            ...prev,
                                            argumentLabel: event.target.value,
                                        }))}
                                    />
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {editingCommand ? "Save" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({isOpen: false, commandId: null})}
                onConfirm={handleConfirmDelete}
                title="Delete command?"
                description="This action cannot be undone."
            />
        </div>
    );
}
