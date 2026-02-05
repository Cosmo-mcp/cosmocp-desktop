import {describe, expect, it} from "vitest";
import {mergeSlashCommands} from "../registry";

describe("mergeSlashCommands", () => {
    it("deduplicates by name while keeping built-ins", () => {
        const merged = mergeSlashCommands([
            {
                id: "1",
                name: "/summarize",
                description: "User command",
                template: "User template",
                argumentLabel: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);

        const summarizeEntries = merged.filter((command) => command.name === "/summarize");
        expect(summarizeEntries).toHaveLength(1);
        expect(summarizeEntries[0]?.builtIn).toBe(true);
    });
});
