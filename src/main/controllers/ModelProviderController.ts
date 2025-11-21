import {inject, injectable} from 'inversify';
import {IpcController, IpcHandler} from '../ipc/Decorators';
import {ModelProvider, ModelProviderCreateInput, ModelProviderLite, NewModel, ProviderWithModels} from 'core/dto';
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
    public async addProvider(providerData: ModelProviderCreateInput, models: NewModel[]): Promise<ProviderWithModels> {
        return this.modelProviderService.addProvider(providerData, models);
    }

    @IpcHandler('getProviderForId')
    public async getProviderForId(providerId: string): Promise<ProviderWithModels | undefined> {
        return this.modelProviderService.getProviderForId(providerId);
    }

    @IpcHandler('getProviders')
    public async getProviders(): Promise<ModelProviderLite[]> {
        return this.modelProviderService.getProviders();
    }

    @IpcHandler('deleteProvider')
    public async deleteProvider(providerId: string): Promise<void> {
        return this.modelProviderService.deleteProvider(providerId);
    }

    @IpcHandler('updateProvider')
    public async updateProvider(providerId: string, updateObject: Partial<ModelProviderCreateInput>): Promise<ModelProvider> {
        return this.modelProviderService.updateProvider(providerId, updateObject);
    }

    @IpcHandler('getAvailableModelsFromProviders')
    public async getAvailableModelsFromProviders(provider: ModelProviderCreateInput): Promise<ModelProvider> {
        return this.modelProviderService.getAvailableModelsFromProviders(provider);
    }
}
