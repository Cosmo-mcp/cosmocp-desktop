import {describe, expect, it} from "vitest";
import {renderSlashCommandTemplate} from "../template";

describe("renderSlashCommandTemplate", () => {
    it("returns the template when no argument is provided", () => {
        expect(renderSlashCommandTemplate("Summarize the chat.")).toBe("Summarize the chat.");
    });

    it("injects the argument into the template placeholder", () => {
        expect(renderSlashCommandTemplate("Summarize {{input}}.", "this response")).toBe(
            "Summarize this response."
        );
    });

    it("appends the argument when no placeholder exists", () => {
        expect(renderSlashCommandTemplate("Summarize the chat.", "focus on decisions")).toBe(
            "Summarize the chat.\n\nfocus on decisions"
        );
    });
});
