import {describe, expect, it, vi} from "vitest";
import {render, screen, waitFor} from "@testing-library/react";
import {SlashCommandManagement} from "../slash-command-management";

vi.mock("electron-log/renderer", () => ({
    default: {
        scope: () => ({
            error: vi.fn(),
            warn: vi.fn(),
            info: vi.fn(),
            debug: vi.fn(),
        }),
    },
}));

describe("SlashCommandManagement", () => {
    it("renders built-in commands from the API", async () => {
        const listAll = vi.fn().mockResolvedValue([
            {
                name: "/summarize",
                description: "Summarize the chat.",
                template: "Summarize the chat.",
                builtIn: true,
            },
        ]);

        Object.defineProperty(window, "api", {
            value: {
                slashCommand: {
                    listAll,
                    create: vi.fn(),
                    update: vi.fn(),
                    delete: vi.fn(),
                },
            },
            writable: true,
        });

        render(<SlashCommandManagement/>);

        await waitFor(() => {
            expect(listAll).toHaveBeenCalled();
        });

        expect(screen.getByText("/summarize")).toBeInTheDocument();
        expect(screen.getByText("Summarize the chat.")).toBeInTheDocument();
    });
});
