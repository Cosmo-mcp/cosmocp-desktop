import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {PersonaRepository} from "../repositories/PersonaRepository";
import {Persona} from "../dto";

@injectable()
export class PersonaService {
    constructor(
        @inject(CORETYPES.PersonaRepository) private personaRepository: PersonaRepository
    ) {
    }

    public async getByName(name: string): Promise<Persona | undefined> {
        return this.personaRepository.getByName(name);
    }
}
