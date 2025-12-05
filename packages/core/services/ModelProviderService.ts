import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {ModelProviderRepository} from "../repositories/ModelProviderRepository";
import {ModelProvider, ModelProviderCreateInput, ModelProviderLite, NewModel, ProviderWithModels} from "../dto";
import {ModelProviderTypeEnum} from "../database/schema/modelProviderSchema";
import {safeStorage} from "electron";
import {ProviderV2} from "@ai-sdk/provider";
import {createAnthropic} from "@ai-sdk/anthropic";
import {createGoogleGenerativeAI} from "@ai-sdk/google";
import {createOpenAI} from "@ai-sdk/openai";
import {createProviderRegistry, ProviderRegistryProvider} from "ai";


@injectable()
export class ModelProviderService {
    private readonly repository: ModelProviderRepository;

    private static readonly GOOGLE_MODEL_LIST_URL: string = "https://generativelanguage.googleapis.com/v1beta/models";
    private modelProviderRegistry: ProviderRegistryProvider;
    private static MODELS_DOT_DEV_URL = "https://models.dev/api.json";

    constructor(
        @inject(CORETYPES.ModelProviderRepository) repository: ModelProviderRepository
    ) {
        this.repository = repository;
        this.updateModelProviderRegistry();
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
            name: providerData.name,
            apiKey: providerData.apiKey, // Key is plain text here
            type: providerData.type,
            apiUrl: providerData.type === ModelProviderTypeEnum.CUSTOM
                ? providerData.apiUrl
                : providerData.apiUrl ?? getDefaultApiUrl(providerData.type),
        };

        // 4. Repository handles insertion and encryption
        const result = await this.repository.addProvider(insertData, modelsData);
        this.updateModelProviderRegistry();
        return result;
    }

    public async getProviderForId(providerId: string): Promise<ProviderWithModels | undefined> {
        return this.repository.findProviderById(providerId);
    }

    public async getProviders(input: { withApiKey: boolean }): Promise<ModelProviderLite[]> {
        const providers = await this.repository.findAll({withApiKey: input.withApiKey});
        return providers.map(this.mapToModelProvider);
    }

    public async getProvidersWithModels(): Promise<ProviderWithModels[]> {
        return this.repository.getAllWithModels();
    }

    public async deleteProvider(providerId: string): Promise<void> {
        try {
            await this.repository.deleteProviderById(providerId);
            this.updateModelProviderRegistry();
        } catch (error) {
            console.error(error);
        }

    }

    public async updateProvider(providerId: string, updateObject: Partial<ModelProviderCreateInput>, modelsData?: NewModel[]): Promise<ProviderWithModels> {
        const result = this.repository.updateProvider(providerId, updateObject, modelsData);
        this.updateModelProviderRegistry();
        return result;
    }

    public async getModelProviderRegistry(): Promise<ProviderRegistryProvider> {
        if (!this.modelProviderRegistry) {
            this.updateModelProviderRegistry();
        }
        return this.modelProviderRegistry;
    }

    private updateModelProviderRegistry() {
        const registryObject: Record<string, ProviderV2> = {};
        this.getProviders({withApiKey: true})
            .then(providers => {
                for (const provider of providers) {
                    if (provider.type === ModelProviderTypeEnum.ANTHROPIC) {
                        registryObject[provider.name] = createAnthropic({apiKey: provider.apiKey});
                    } else if (provider.type === ModelProviderTypeEnum.GOOGLE) {
                        registryObject[provider.name] = createGoogleGenerativeAI({apiKey: provider.apiKey});
                    } else if (provider.type === ModelProviderTypeEnum.OPENAI) {
                        registryObject[provider.name] = createOpenAI({apiKey: provider.apiKey});
                    } else {
                        throw new Error(`Unknown provider provider: ${provider.type} , ${provider.name}`);
                    }
                }
                this.modelProviderRegistry = createProviderRegistry(registryObject);
            })
            .catch(error => console.error(error));
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

    public async getModelsForProviderUsingModelsDotDev(provider: ModelProviderCreateInput): Promise<NewModel[]> {
        const result: NewModel[] = [];

        if (provider.type === ModelProviderTypeEnum.CUSTOM) {
            console.warn(`Model listing is not supported for CUSTOM provider type.`);
            return result;
        }

        try {
            const response = await fetch(ModelProviderService.MODELS_DOT_DEV_URL, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                console.error("Models.dev API Error:", await response.text());
                return result;
            }

            const data = await response.json();
            const modelsDict = data[provider.type]?.models ?? {};
            for (const key in modelsDict) {
                const m = modelsDict[key];
                result.push({
                    name: key,
                    modelId: key,
                    description: m.name,
                });
            }

        } catch (err) {
            console.error("Models.dev fetch error:", err);
        }

        return result;
    }
}
