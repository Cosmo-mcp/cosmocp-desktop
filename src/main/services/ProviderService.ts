import { StorageService } from './StorageService';
import { Provider } from '../ipc/dto';

export class ProviderService {
  private readonly storageService = new StorageService<Provider[]>('providers.json');

  async getProviders(): Promise<Provider[]> {
    return (await this.storageService.get()) || [];
  }

  async addProvider(provider: Provider): Promise<void> {
    const providers = await this.getProviders();
    providers.push(provider);
    await this.storageService.set(providers);
  }

  async updateProvider(provider: Provider): Promise<void> {
    const providers = await this.getProviders();
    const index = providers.findIndex((p) => p.id === provider.id);
    if (index !== -1) {
      providers[index] = provider;
      await this.storageService.set(providers);
    }
  }

  async deleteProvider(providerId: string): Promise<void> {
    const providers = await this.getProviders();
    const filteredProviders = providers.filter((p) => p.id !== providerId);
    await this.storageService.set(filteredProviders);
  }
}
