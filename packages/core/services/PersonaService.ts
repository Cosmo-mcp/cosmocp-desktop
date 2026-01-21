import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {PersonaRepository} from "../repositories/PersonaRepository";
import {NewPersona, Persona} from "../dto";

@injectable()
export class PersonaService {
    constructor(
        @inject(CORETYPES.PersonaRepository) private personaRepository: PersonaRepository
    ) {
    }

    public async getAll(): Promise<Persona[]> {
        return this.personaRepository.getAll();
    }

    public async getById(id: string): Promise<Persona | undefined> {
        return this.personaRepository.getById(id);
    }

    public async getByName(name: string): Promise<Persona | undefined> {
        return this.personaRepository.getByName(name);
    }

    public async create(data: NewPersona): Promise<Persona> {
        return this.personaRepository.create(data);
    }

    public async update(id: string, updates: Partial<NewPersona>): Promise<Persona> {
        return this.personaRepository.update(id, updates);
    }

    public async delete(id: string): Promise<void> {
        return this.personaRepository.delete(id);
    }
}
