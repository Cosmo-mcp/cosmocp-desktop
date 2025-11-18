import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {ModelProviderRepository} from "../repositories/ModelProviderRepository";
import {Model, ModelProvider, ModelProviderCreateInput, ModelProviderLite} from "../dto";
import {ModelProviderTypeEnum} from "../database/schema/modelProviderSchema";


@injectable()
export class ModelProviderService {
    private readonly repository: ModelProviderRepository;

    constructor(
        @inject(CORETYPES.ModelProviderRepository) repository: ModelProviderRepository
    ) {
        this.repository = repository;

        (async () => {
            try {
                const providers = await this.repository.findAll();
                if (providers.length === 0) {
                    await this.createMockProvider();
                    console.log("Mock provider created.");
                }
            } catch (error) {
                // Log any errors that occur during initial check or mock creation
                console.error("Error during initial provider check:", error);
            }
        })();
    }

    private async createMockProvider(): Promise<void> {
        const mockProviderInput: ModelProviderCreateInput = {
            nickName: "Mock Model Provider",
            apiKey: 'mock-model-provider-key',
            type: ModelProviderTypeEnum.CUSTOM,
            apiUrl: 'http://localhost:8080/api/v1/chat/completions',
        };

        await this.addProvider(mockProviderInput);
    }

    private async isDuplicate(provider: ModelProviderCreateInput): Promise<boolean> {
        const providers = await this.repository.findAll();
        return providers.some(
            p => p.type === provider.type
                && p.apiKey === provider.apiKey // Check with plain text key
                && p.apiUrl === provider.apiUrl
        );
    }

    // Accepts ModelProviderCreateInput directly, relying on the caller/UI for data integrity.
    public async addProvider(providerData: ModelProviderCreateInput): Promise<ModelProvider> {
        // Note: Runtime validation (like checking if apiUrl is a valid URL or
        // if type is valid) must now be handled manually or by a different library.

        // 1. Check basic duplication
        if (await this.isDuplicate(providerData)) {
            throw new Error('Duplicate provider entry.');
        }

        // 2. Business logic to determine final apiUrl
        function getDefaultApiUrl(type: string) {
            return `https://remotehost${type}.com/api/v1/chat`;
        }

        // 3. Map input data to the final Drizzle Insert type
        const insertData: ModelProviderCreateInput = {
            nickName: providerData.nickName,
            apiKey: providerData.apiKey, // Key is plain text here
            type: providerData.type,
            apiUrl: providerData.type === ModelProviderTypeEnum.CUSTOM
                ? providerData.apiUrl
                : providerData.apiUrl ?? getDefaultApiUrl(providerData.type),
        };

        // 4. Repository handles insertion and encryption
        const newProvider = await this.repository.create(insertData);
        return newProvider;
    }

    public async getProviderForId(providerId: string): Promise<ModelProvider | undefined> {
        return this.repository.findById(providerId);
    }

    public async getProviders(): Promise<ModelProviderLite[]> {
        const providers = await this.repository.findAll();
        // Strip API key before returning to the public interface
        return providers.map(({...rest}) => rest);
    }

    public async getModels(providerId: string): Promise<Model[]> {
        const provider = await this.getProviderForId(providerId);
        if (!provider) {
            throw new Error('Provider not found.');
        }

        // Dummy model return logic
        return [{
            id: 'gemini-2.0-flash-lite',
            name: 'Gemini Flash Lite',
            description: 'Fast and efficient model for everyday tasks.'
        }, {
            id: 'gemini-2.0-pro-lite',
            name: 'Gemini Pro Lite',
            description: 'Most capable model for complex reasoning.'
        }];
    }

    public async deleteProvider(providerId: string): Promise<void> {
        const provider = await this.repository.findById(providerId);
        if (!provider) {
            throw new Error('Provider not found.');
        }
        await this.repository.deleteById(providerId);
    }

    public async updateProvider(providerId: string, updateObject: Partial<ModelProviderCreateInput>): Promise<ModelProvider> {
        return this.repository.update(providerId, updateObject);
    }
}
