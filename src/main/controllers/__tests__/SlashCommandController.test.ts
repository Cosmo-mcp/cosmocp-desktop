import {describe, expect, it, vi} from "vitest";
import {SlashCommandController} from "../SlashCommandController";
import type {SlashCommandDefinition, SlashCommandExecution} from "core/dto";

describe("SlashCommandController", () => {
    it("returns the list of commands from the service", async () => {
        const commands: SlashCommandDefinition[] = [
            {
                name: "/summarize",
                description: "Summarize the chat.",
                template: "Summarize the chat.",
                builtIn: true,
            },
        ];
        const service = {
            listAll: vi.fn().mockResolvedValue(commands),
        };

        const controller = new SlashCommandController(service as never);
        await expect(controller.listAll()).resolves.toEqual(commands);
    });

    it("executes a command via the service", async () => {
        const execution: SlashCommandExecution = {
            name: "/summarize",
            resolvedText: "Summarize the chat.",
        };
        const service = {
            execute: vi.fn().mockResolvedValue(execution),
        };

        const controller = new SlashCommandController(service as never);
        await expect(controller.execute({input: "/summarize"})).resolves.toEqual(execution);
    });
});
