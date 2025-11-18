import {inject, injectable} from 'inversify';
import {IpcController, IpcHandler} from '../ipc/Decorators';
import {Model, ModelProvider, ModelProviderCreateInput, ModelProviderLite,} from 'core/dto';
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
    public async addProvider(providerData: ModelProviderCreateInput): Promise<ModelProvider> {
        return this.modelProviderService.addProvider(providerData);
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
    public async getModels(providerId: string): Promise<Model[]> {
        return this.modelProviderService.getModels(providerId);
    }

    @IpcHandler('deleteProvider')
    public async deleteProvider(providerId: string): Promise<void> {
        return this.modelProviderService.deleteProvider(providerId);
    }
}
