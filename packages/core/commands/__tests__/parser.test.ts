import {describe, expect, it} from "vitest";
import {normalizeSlashCommandName, parseSlashCommandInput} from "../parser";

describe("parseSlashCommandInput", () => {
    it("normalizes names with a leading slash", () => {
        expect(normalizeSlashCommandName("summarize")).toBe("/summarize");
    });

    it("returns null for non-command input", () => {
        expect(parseSlashCommandInput("hello world")).toBeNull();
    });

    it("parses a command without an argument", () => {
        expect(parseSlashCommandInput("/summarize")).toEqual({
            name: "/summarize",
            argument: undefined,
        });
    });

    it("parses a command with a single argument", () => {
        expect(parseSlashCommandInput("/summarize focus on key points")).toEqual({
            name: "/summarize",
            argument: "focus on key points",
        });
    });
});
