import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {ModelProviderRepository} from "../repositories/ModelProviderRepository";
import {ModelProvider, ModelProviderCreateInput, ModelProviderLite, NewModel, ProviderWithModels} from "../dto";
import {ModelProviderTypeEnum} from "../database/schema/modelProviderSchema";
import {safeStorage} from "electron";


@injectable()
export class ModelProviderService {
    private readonly repository: ModelProviderRepository;

    private static readonly GOOGLE_MODEL_LIST_URL: string = "https://generativelanguage.googleapis.com/v1beta/models";

    constructor(
        @inject(CORETYPES.ModelProviderRepository) repository: ModelProviderRepository
    ) {
        this.repository = repository;
    }

    private async isDuplicate(provider: ModelProviderCreateInput): Promise<boolean> {
        const providers = await this.repository.findDuplicates(provider);
        return providers.length > 0;
    }

    // Accepts ModelProviderCreateInput directly, relying on the caller/UI for data integrity.
    public async addProvider(providerData: ModelProviderCreateInput, modelsData: NewModel[]): Promise<ProviderWithModels> {
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
        return await this.repository.addProvider(insertData, modelsData);
    }

    public async getProviderForId(providerId: string): Promise<ProviderWithModels | undefined> {
        return this.repository.findProviderById(providerId);
    }

    public async getProviders(input: {withApiKey: boolean}): Promise<ModelProviderLite[]> {
        const providers = await this.repository.findAll({withApiKey: input.withApiKey});
        return providers.map(this.mapToModelProvider);
    }

    public async getProvidersWithModels(): Promise<ProviderWithModels[]> {
        return this.repository.getAllWithModels();
    }

    public async deleteProvider(providerId: string): Promise<void> {
        try {
            await this.repository.deleteProviderById(providerId);
        } catch (error) {
            console.error(error);
        }

    }

    public async updateProvider(providerId: string, updateObject: Partial<ModelProviderCreateInput>, modelsData?: NewModel[]): Promise<ProviderWithModels> {
        return this.repository.updateProvider(providerId, updateObject, modelsData);
    }

    public async addModel(model: NewModel, provider: ModelProvider): Promise<ProviderWithModels> {
        return this.repository.addProvider(provider, [model]);
    }

    /** Maps a DB record (encrypted key) to the application model (decrypted key). */
    private mapToModelProvider = (dbRecord: ModelProvider): ModelProvider => {
        // Note: You must handle the timestamp conversion here if needed,
        // as we dropped Zod's automatic date coercion.
        return {
            ...dbRecord,
            apiKey: this.decryptApiKey(dbRecord.apiKey),
            createdAt: new Date(dbRecord.createdAt),
            updatedAt: dbRecord.updatedAt ? new Date(dbRecord.updatedAt) : undefined,
        } as ModelProvider;
    };

    private decryptApiKey = (encryptedKey?: string): string => {
        if (!encryptedKey) {
            return "";
        }
        if (!safeStorage.isEncryptionAvailable()) {
            throw new Error('Encryption is not available.');
        }
        const buffer = Buffer.from(encryptedKey, 'base64');
        return safeStorage.decryptString(buffer);
    };

    public async getAvailableModelsFromProviders(provider: ModelProviderCreateInput): Promise<NewModel[]> {
        const apiKey = provider.apiKey;
        const result: NewModel[] = [];
        if (provider.type == ModelProviderTypeEnum.GOOGLE) {
            try {
                const response = await fetch(ModelProviderService.GOOGLE_MODEL_LIST_URL, {
                    method: 'GET',
                    headers: [["x-goog-api-key", apiKey],
                        ["Content-Type", "application/json"]]
                });
                const data = await response.json();
                const jsonArray = data.models;
                jsonArray.forEach((model: {name:string, description: string}) => {
                    const modelId = model.name.substring(7);
                    result.push({
                        name: model.name,
                        modelId: modelId,
                        description: model.description,
                    })
                })
            } catch (error) {
                console.error(error);
            }
        }
        return result;
    }
}
