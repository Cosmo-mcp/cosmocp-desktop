import type {SlashCommand, SlashCommandDefinition} from "../dto";
import {builtInSlashCommands} from "./builtins";
import {normalizeSlashCommandName} from "./parser";

const normalizeDefinition = (
    command: SlashCommand | SlashCommandDefinition,
    builtIn: boolean
): SlashCommandDefinition => ({
    id: "id" in command ? command.id : undefined,
    name: normalizeSlashCommandName(command.name),
    description: command.description,
    template: command.template,
    argumentLabel: command.argumentLabel ?? undefined,
    builtIn,
});

// Merge built-in commands with user-defined commands for display and execution.
export const mergeSlashCommands = (
    userCommands: SlashCommand[]
): SlashCommandDefinition[] => {
    const normalizedBuiltIns = builtInSlashCommands.map((command) =>
        normalizeDefinition(command, true)
    );
    const normalizedUserCommands = userCommands.map((command) =>
        normalizeDefinition(command, false)
    );
    const uniqueByName = new Map<string, SlashCommandDefinition>();

    for (const command of normalizedBuiltIns) {
        uniqueByName.set(command.name, command);
    }

    for (const command of normalizedUserCommands) {
        if (!uniqueByName.has(command.name)) {
            uniqueByName.set(command.name, command);
        }
    }

    return Array.from(uniqueByName.values());
};

// Find a command by name across both built-in and user-defined sets.
export const findSlashCommand = (
    allCommands: SlashCommandDefinition[],
    name: string
): SlashCommandDefinition | undefined => {
    const normalizedName = normalizeSlashCommandName(name);
    return allCommands.find((command) => command.name === normalizedName);
};
