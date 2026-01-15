import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {PersonaRepository} from "../repositories/PersonaRepository";
import {Persona, PersonaCreateInput} from "../dto";

@injectable()
export class PersonaService {
    constructor(@inject(CORETYPES.PersonaRepository) private personaRepository: PersonaRepository) {
    }

    public async getAllPersonas(): Promise<Persona[]> {
        return this.personaRepository.getAll();
    }

    public async getPersonaById(id: string): Promise<Persona | undefined> {
        return this.personaRepository.getById(id);
    }

    public async getPersonaByName(name: string): Promise<Persona | undefined> {
        return this.personaRepository.getByName(name);
    }

    public async createPersona(input: PersonaCreateInput): Promise<Persona> {
        return this.personaRepository.create(input);
    }

    public async updatePersona(id: string, updates: Partial<PersonaCreateInput>): Promise<Persona> {
        return this.personaRepository.update(id, updates);
    }

    public async deletePersona(id: string): Promise<void> {
        return this.personaRepository.delete(id);
    }
}
