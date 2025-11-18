import {inject, injectable} from 'inversify';
import {IpcController, IpcHandler} from '../ipc/Decorators';
import {ModelProvider, ModelProviderCreateInput, ModelProviderLite, NewModel} from 'core/dto';
import {CORETYPES} from 'core/types/types';
import {ModelProviderService} from 'core/services/ModelProviderService';
import {Controller} from "./Controller";

@injectable()
@IpcController('modelProvider')
export class ModelProviderController implements Controller {
    constructor(@inject(CORETYPES.ModelProviderService)
                private modelProviderService: ModelProviderService
    ) {
    }

    @IpcHandler('addProvider')
    public async addProvider(providerData: ModelProviderCreateInput, models: NewModel[]): Promise<void> {
        const provider = await this.modelProviderService.addProvider(providerData);
        if (models) {
            models.forEach(model => {
                this.modelProviderService.addModel(model, provider);
            })
        }
    }

    @IpcHandler('getProviderForId')
    public async getProviderForId(providerId: string): Promise<ModelProvider | undefined> {
        return this.modelProviderService.getProviderForId(providerId);
    }

    @IpcHandler('getProviders')
    public async getProviders(): Promise<ModelProviderLite[]> {
        return this.modelProviderService.getProviders();
    }

    @IpcHandler('getModels')
    public async getModels(providerId: string): Promise<NewModel[]> {
        return this.modelProviderService.getModels(providerId);
    }

    @IpcHandler('deleteProvider')
    public async deleteProvider(providerId: string): Promise<void> {
        return this.modelProviderService.deleteProvider(providerId);
    }

    @IpcHandler('updateProvider')
    public async updateProvider(providerId: string, updateObject: Partial<ModelProviderCreateInput>): Promise<ModelProvider> {
        return this.modelProviderService.updateProvider(providerId, updateObject);
    }
}
