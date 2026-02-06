import {inject, injectable} from "inversify";
import {z} from "zod";
import {IpcController, IpcHandler} from "../ipc/Decorators";
import {CORETYPES} from "core/types/types";
import {SlashCommandService} from "core/services/SlashCommandService";
import type {
    SlashCommandCreateInput,
    SlashCommandDefinition,
    SlashCommandExecution,
    SlashCommandUpdateInput,
} from "core/dto";
import {Controller} from "./Controller";
import {logger} from "../logger";

const slashCommandCreateSchema = z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    template: z.string().min(1),
    argumentLabel: z.string().optional().nullable(),
});

const slashCommandUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    template: z.string().optional(),
    argumentLabel: z.string().optional().nullable(),
});

const slashCommandExecuteSchema = z.object({
    input: z.string().min(1),
});

@injectable()
@IpcController("slashCommand")
export class SlashCommandController implements Controller {
    constructor(
        @inject(CORETYPES.SlashCommandService)
        private slashCommandService: SlashCommandService
    ) {
    }

    // Provide commands to the renderer for discovery and selection.
    @IpcHandler("listAll")
    public async listAll(): Promise<SlashCommandDefinition[]> {
        return this.slashCommandService.listAll();
    }

    // Create a new user-defined command from validated inputs.
    @IpcHandler("create")
    public async create(input: SlashCommandCreateInput): Promise<SlashCommandDefinition> {
        const parsed = slashCommandCreateSchema.parse(input);
        return this.slashCommandService.create(parsed);
    }

    // Update an existing user-defined command after validation.
    @IpcHandler("update")
    public async update(id: string, updates: SlashCommandUpdateInput): Promise<SlashCommandDefinition> {
        const parsed = slashCommandUpdateSchema.parse(updates);
        return this.slashCommandService.update(id, parsed);
    }

    // Remove a user-defined command by id.
    @IpcHandler("delete")
    public async delete(id: string): Promise<void> {
        return this.slashCommandService.delete(id);
    }

    // Resolve a slash command into its final prompt text for chat execution.
    @IpcHandler("execute")
    public async execute(input: {input: string}): Promise<SlashCommandExecution> {
        const parsed = slashCommandExecuteSchema.parse(input);
        try {
            return await this.slashCommandService.execute(parsed.input);
        } catch (error) {
            logger.error("Failed to execute slash command", error);
            throw error;
        }
    }
}
