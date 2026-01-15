import {inject, injectable} from "inversify";
import {asc, eq} from "drizzle-orm";
import {CORETYPES} from "../types/types";
import {DatabaseManager} from "../database/DatabaseManager";
import {persona} from "../database/schema/schema";
import {Persona, PersonaCreateInput} from "../dto";

@injectable()
export class PersonaRepository {
    private db;

    constructor(@inject(CORETYPES.DatabaseManager) databaseManager: DatabaseManager) {
        this.db = databaseManager.getInstance();
    }

    public async getAll(): Promise<Persona[]> {
        return this.db.select().from(persona).orderBy(asc(persona.name));
    }

    public async getById(id: string): Promise<Persona | undefined> {
        const result = await this.db.select().from(persona).where(eq(persona.id, id)).limit(1);
        return result[0];
    }

    public async getByName(name: string): Promise<Persona | undefined> {
        const result = await this.db.select().from(persona).where(eq(persona.name, name)).limit(1);
        return result[0];
    }

    public async create(input: PersonaCreateInput): Promise<Persona> {
        const result = await this.db.insert(persona).values({
            ...input,
            updatedAt: new Date(),
        }).returning();
        return result[0];
    }

    public async update(id: string, updates: Partial<PersonaCreateInput>): Promise<Persona> {
        const result = await this.db.update(persona).set({
            ...updates,
            updatedAt: new Date(),
        }).where(eq(persona.id, id)).returning();
        return result[0];
    }

    public async delete(id: string): Promise<void> {
        await this.db.delete(persona).where(eq(persona.id, id));
    }
}
