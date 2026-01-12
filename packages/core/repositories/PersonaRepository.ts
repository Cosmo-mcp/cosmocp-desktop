import {inject, injectable} from "inversify";
import {eq} from "drizzle-orm";
import {CORETYPES} from "../types/types";
import {DatabaseManager} from "../database/DatabaseManager";
import {Persona} from "../dto";
import {persona} from "../database/schema/personaSchema";

@injectable()
export class PersonaRepository {
    private db;

    constructor(@inject(CORETYPES.DatabaseManager) databaseManager: DatabaseManager) {
        this.db = databaseManager.getInstance();
    }

    public async getByName(name: string): Promise<Persona | undefined> {
        const result = await this.db.select().from(persona).where(eq(persona.name, name)).limit(1);
        return result[0];
    }
}
