import {injectable} from "inversify";
import {randomUUID} from "crypto";
import {NewPersona, Persona} from "../dto";

@injectable()
export class PersonaService {
    private personas = new Map<string, Persona>();

    public async getAll(): Promise<Persona[]> {
        return Array.from(this.personas.values());
    }

    public async getById(id: string): Promise<Persona | undefined> {
        return this.personas.get(id);
    }

    public async getByName(name: string): Promise<Persona | undefined> {
        return Array.from(this.personas.values()).find((persona) => persona.name === name);
    }

    public async create(newPersona: NewPersona): Promise<Persona> {
        const now = new Date();
        const persona: Persona = {
            id: randomUUID(),
            createdAt: now,
            updatedAt: now,
            ...newPersona,
        };

        this.personas.set(persona.id, persona);
        return persona;
    }

    public async update(id: string, updates: Partial<NewPersona>): Promise<Persona> {
        const existingPersona = this.personas.get(id);
        if (!existingPersona) {
            throw new Error(`Persona not found for id ${id}`);
        }

        const updatedPersona: Persona = {
            ...existingPersona,
            ...updates,
            updatedAt: new Date(),
        };

        this.personas.set(id, updatedPersona);
        return updatedPersona;
    }

    public async delete(id: string): Promise<void> {
        this.personas.delete(id);
    }
}
