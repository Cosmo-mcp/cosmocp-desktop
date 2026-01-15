import {inject, injectable} from "inversify";
import {CORETYPES} from "core/types/types";
import {PersonaService} from "core/services/PersonaService";
import {IpcController, IpcHandler} from "../ipc/Decorators";
import {Controller} from "./Controller";
import {Persona, PersonaCreateInput} from "core/dto";

@injectable()
@IpcController("persona")
export class PersonaController implements Controller {
    constructor(@inject(CORETYPES.PersonaService) private personaService: PersonaService) {
    }

    @IpcHandler("getAll")
    public async getAllPersonas(): Promise<Persona[]> {
        return this.personaService.getAllPersonas();
    }

    @IpcHandler("getById")
    public async getPersonaById(id: string): Promise<Persona | undefined> {
        return this.personaService.getPersonaById(id);
    }

    @IpcHandler("getByName")
    public async getPersonaByName(name: string): Promise<Persona | undefined> {
        return this.personaService.getPersonaByName(name);
    }

    @IpcHandler("create")
    public async createPersona(input: PersonaCreateInput): Promise<Persona> {
        return this.personaService.createPersona(input);
    }

    @IpcHandler("update")
    public async updatePersona(id: string, updates: Partial<PersonaCreateInput>): Promise<Persona> {
        return this.personaService.updatePersona(id, updates);
    }

    @IpcHandler("delete")
    public async deletePersona(id: string): Promise<void> {
        return this.personaService.deletePersona(id);
    }
}
