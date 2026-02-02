import {inject, injectable} from "inversify";
import {asc, eq} from "drizzle-orm";
import {CORETYPES} from "../types/types";
import {DatabaseManager} from "../database/DatabaseManager";
import {slashCommand} from "../database/schema/schema";
import {NewSlashCommand, SlashCommand} from "../dto";

@injectable()
export class SlashCommandRepository {
    private db;

    constructor(@inject(CORETYPES.DatabaseManager) databaseManager: DatabaseManager) {
        this.db = databaseManager.getInstance();
    }

    // Provide a consistent list order for UI rendering and conflict checks.
    public async getAll(): Promise<SlashCommand[]> {
        return this.db.select().from(slashCommand).orderBy(asc(slashCommand.name));
    }

    // Locate a specific command by id for edit and delete workflows.
    public async getById(id: string): Promise<SlashCommand | undefined> {
        const result = await this.db.select().from(slashCommand).where(eq(slashCommand.id, id)).limit(1);
        return result[0];
    }

    // Allow name collision checks before creating or renaming commands.
    public async getByName(name: string): Promise<SlashCommand | undefined> {
        const result = await this.db.select().from(slashCommand).where(eq(slashCommand.name, name)).limit(1);
        return result[0];
    }

    // Persist new user-defined commands.
    public async create(data: NewSlashCommand): Promise<SlashCommand> {
        const now = new Date();
        const [createdCommand] = await this.db.insert(slashCommand).values({
            ...data,
            createdAt: data.createdAt ?? now,
            updatedAt: data.updatedAt ?? now,
        }).returning();
        return createdCommand;
    }

    // Update command metadata and templates while tracking modification time.
    public async update(id: string, updates: Partial<NewSlashCommand>): Promise<SlashCommand> {
        const [updatedCommand] = await this.db.update(slashCommand).set({
            ...updates,
            updatedAt: new Date(),
        }).where(eq(slashCommand.id, id)).returning();
        return updatedCommand;
    }

    // Remove a user-defined command.
    public async delete(id: string): Promise<void> {
        await this.db.delete(slashCommand).where(eq(slashCommand.id, id));
    }
}
