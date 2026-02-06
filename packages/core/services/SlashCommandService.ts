import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {SlashCommandRepository} from "../repositories/SlashCommandRepository";
import {
    SlashCommand,
    SlashCommandCreateInput,
    SlashCommandDefinition,
    SlashCommandExecution,
    SlashCommandUpdateInput,
} from "../dto";
import {
    findSlashCommand,
    mergeSlashCommands,
} from "../commands/registry";
import {normalizeSlashCommandName, parseSlashCommandInput} from "../commands/parser";
import {renderSlashCommandTemplate} from "../commands/template";

// Ensure required text inputs are present before persistence.
const normalizeRequired = (value: string | null | undefined, field: string) => {
    if (!value || value.trim().length === 0) {
        throw new Error(`${field} is required.`);
    }

    return value.trim();
};

@injectable()
export class SlashCommandService {
    constructor(
        @inject(CORETYPES.SlashCommandRepository)
        private slashCommandRepository: SlashCommandRepository
    ) {
    }

    // Provide a combined list of built-in and user-defined commands.
    public async listAll(): Promise<SlashCommandDefinition[]> {
        const userCommands = await this.slashCommandRepository.getAll();
        return mergeSlashCommands(userCommands);
    }

    // Persist a new user-defined command with validation and normalization.
    public async create(input: SlashCommandCreateInput): Promise<SlashCommandDefinition> {
        const name = normalizeSlashCommandName(normalizeRequired(input.name, "Name"));
        if (name.length < 2) {
            throw new Error("Command name must start with / and include at least one character.");
        }

        const description = normalizeRequired(input.description, "Description");
        const template = normalizeRequired(input.template, "Template");
        const argumentLabel = input.argumentLabel?.trim() || null;

        const allCommands = await this.listAll();
        const existing = findSlashCommand(allCommands, name);
        if (existing) {
            throw new Error(`Command "${name}" already exists.`);
        }

        const created = await this.slashCommandRepository.create({
            name,
            description,
            template,
            argumentLabel,
        });

        return {
            id: created.id,
            name: created.name,
            description: created.description,
            template: created.template,
            argumentLabel: created.argumentLabel,
            builtIn: false,
        };
    }

    // Update a user-defined command and keep it distinct from built-ins.
    public async update(id: string, updates: SlashCommandUpdateInput): Promise<SlashCommandDefinition> {
        const existing = await this.slashCommandRepository.getById(id);
        if (!existing) {
            throw new Error("Command not found.");
        }

        const normalizedUpdates: SlashCommandUpdateInput = {
            ...updates,
        };

        if (updates.name !== undefined) {
            const name = normalizeSlashCommandName(normalizeRequired(updates.name, "Name"));
            normalizedUpdates.name = name;
            const allCommands = await this.listAll();
            const match = findSlashCommand(allCommands, name);
            if (match && match.id !== existing.id) {
                throw new Error(`Command "${name}" already exists.`);
            }
        }

        if (updates.description !== undefined) {
            normalizedUpdates.description = normalizeRequired(updates.description, "Description");
        }

        if (updates.template !== undefined) {
            normalizedUpdates.template = normalizeRequired(updates.template, "Template");
        }

        if (updates.argumentLabel !== undefined) {
            normalizedUpdates.argumentLabel = updates.argumentLabel?.trim() || null;
        }

        const updated = await this.slashCommandRepository.update(existing.id, normalizedUpdates);

        return {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            template: updated.template,
            argumentLabel: updated.argumentLabel,
            builtIn: false,
        };
    }

    // Remove a user-defined command by id.
    public async delete(id: string): Promise<void> {
        const existing = await this.slashCommandRepository.getById(id);
        if (!existing) {
            throw new Error("Command not found.");
        }
        await this.slashCommandRepository.delete(id);
    }

    // Translate a slash command string into a resolved prompt to send.
    public async execute(input: string): Promise<SlashCommandExecution> {
        const parsed = parseSlashCommandInput(input);
        if (!parsed) {
            throw new Error("Invalid slash command.");
        }

        const allCommands = await this.listAll();
        const command = findSlashCommand(allCommands, parsed.name);
        if (!command) {
            throw new Error(`Command "${parsed.name}" not found.`);
        }

        const resolvedText = renderSlashCommandTemplate(command.template, parsed.argument);
        return {
            name: command.name,
            argument: parsed.argument,
            resolvedText,
        };
    }

    // Provide all user-defined commands for management screens.
    public async listUserCommands(): Promise<SlashCommand[]> {
        return this.slashCommandRepository.getAll();
    }
}
