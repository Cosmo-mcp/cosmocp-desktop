import type {SlashCommandDefinition} from "../dto";

// Provide built-in commands that ship with the app.
export const builtInSlashCommands: SlashCommandDefinition[] = [
    {
        name: "/summarize",
        description: "Summarize the current conversation.",
        template: "Summarize the current conversation in a few bullet points.",
        argumentLabel: "Focus (optional)",
        builtIn: true,
    },
];
