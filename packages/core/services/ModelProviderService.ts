import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {ModelProviderRepository} from "../repositories/ModelProviderRepository";
import {ModelProvider, ModelProviderCreateInput, ModelProviderLite, NewModel, ProviderWithModels} from "../dto";
import {ModelProviderTypeEnum} from "../database/schema/modelProviderSchema";
import {safeStorage} from "electron";
import {ProviderV3} from "@ai-sdk/provider";
import {AnthropicProviderSettings, createAnthropic} from "@ai-sdk/anthropic";
import {createGoogleGenerativeAI, GoogleGenerativeAIProviderSettings} from "@ai-sdk/google";
import {createOpenAI, OpenAIProviderSettings} from "@ai-sdk/openai";
import {createOllama, OllamaProviderSettings} from "ollama-ai-provider-v2";
import {createProviderRegistry, ProviderRegistryProvider} from "ai";
import {logger} from "../../../src/main/logger";
import {createXai} from "@ai-sdk/xai";
import {createMoonshotAI} from "@ai-sdk/moonshotai";
import {ProviderCatalogByType} from "../providerCatalog";


export type RemoteProviderOptions =
    AnthropicProviderSettings
    | GoogleGenerativeAIProviderSettings
    | OpenAIProviderSettings;

export type LocalProviderOptions = OllamaProviderSettings;

@injectable()
export class ModelProviderService {
    private readonly repository: ModelProviderRepository;
    private modelProviderRegistry: ProviderRegistryProvider;
    private static MODELS_DOT_DEV_URL = "https://models.dev/api.json";
    private static MODELS_OLLAMA_URL = "http://127.0.0.1:11434/api";
    private readonly providerFactoryByType: Record<ModelProviderTypeEnum, (provider: ModelProviderLite) => ProviderV3> = {
        [ModelProviderTypeEnum.ANTHROPIC]: (provider) => createAnthropic(this.createRemoteOptions(provider)),
        [ModelProviderTypeEnum.GOOGLE]: (provider) => createGoogleGenerativeAI(this.createRemoteOptions(provider)),
        [ModelProviderTypeEnum.OPENAI]: (provider) => createOpenAI(this.createRemoteOptions(provider)),
        [ModelProviderTypeEnum.XAI]: (provider) => createXai(this.createRemoteOptions(provider)),
        [ModelProviderTypeEnum.MOONSHOT]: (provider) => createMoonshotAI(this.createRemoteOptions(provider)),
        [ModelProviderTypeEnum.OLLAMA]: (provider) => createOllama(this.createLocalOptions(provider)),
        [ModelProviderTypeEnum.CUSTOM]: (provider) => createOpenAI({
            name: provider.name,
            apiKey: provider.apiKey,
            baseURL: provider.apiUrl,
        }),
    };

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
        if (!providerData.name || providerData.name.trim().length === 0) {
            throw new Error("Provider name is required.");
        }

        // Note: Runtime validation (like checking if apiUrl is a valid URL or
        // if type is valid) must now be handled manually or by a different library.

        // 1. Check basic duplication
        if (await this.isDuplicate(providerData)) {
            throw new Error('Duplicate provider entry.');
        }

        // 2. Map input data to the final Drizzle Insert type
        const insertData: ModelProviderCreateInput = {
            name: providerData.name,
            apiKey: providerData.apiKey, // Key is plain text here
            type: providerData.type,
            apiUrl: providerData.type === ModelProviderTypeEnum.CUSTOM
                ? providerData.apiUrl
                : providerData.apiUrl ?? "",
        };

        // 3. Repository handles insertion and encryption
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
            logger.error(error);
            throw error;
        }

    }

    public async updateProvider(providerId: string, updateObject: Partial<ModelProviderCreateInput>, modelsData?: NewModel[]): Promise<ProviderWithModels> {
        const result = await this.repository.updateProvider(providerId, updateObject, modelsData);
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
        const registryObject: Record<string, ProviderV3> = {};
        this.getProviders({withApiKey: true})
            .then(providers => {
                for (const provider of providers) {
                    const factory = this.providerFactoryByType[provider.type];
                    if (!factory) {
                        throw new Error(`Unknown provider: ${provider.type} , ${provider.name}`);
                    }
                    registryObject[provider.name] = factory(provider);
                }
                this.modelProviderRegistry = createProviderRegistry(registryObject);
            })
            .catch(error => logger.error(error));
    }

    private createLocalOptions(provider: ModelProviderLite): LocalProviderOptions {
        const options: LocalProviderOptions = {};
        if (provider.apiUrl && provider.apiUrl.trim() !== "") {
            options.baseURL = provider.apiUrl;
        }
        return options;
    }

    private createRemoteOptions(provider: ModelProviderLite): RemoteProviderOptions {
        const options: RemoteProviderOptions = {};
        if (provider.apiUrl && provider.apiUrl.trim() !== "") {
            options.baseURL = provider.apiUrl;
        }
        if (provider.apiKey.trim() !== "") {
            options.apiKey = provider.apiKey;
        }
        return options;
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
        const buffer = Buffer.from(encryptedKey, "base64");
        if (safeStorage.isEncryptionAvailable()) {
            return safeStorage.decryptString(buffer);
        }
        return buffer.toString("utf-8");
    };

    private async getModelsFromOllama(provider: ModelProviderCreateInput): Promise<NewModel[]> {
        let result: NewModel[] = [];
        const ollamaUrl = (provider.apiUrl && provider.apiUrl.trim()) || ModelProviderService.MODELS_OLLAMA_URL;
        try {
            const response = await fetch(ollamaUrl + '/tags', {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                logger.error("Models.dev API Error:", await response.text());
                return result;
            }

            const data = await response.json();

            result = data['models'].map((model: { name: string, model: string, modified_at: number }) => ({
                name: model.name,
                modelId: model.model,
                reasoning: false,
                releaseDate: new Date(model.modified_at),
                lastUpdatedByProvider: new Date(model.modified_at)
            }));

            result.sort((a, b) => {
                return b.lastUpdatedByProvider >= a.lastUpdatedByProvider ? 1 : -1;
            });

        } catch (err) {
            logger.error("Ollama Models fetch error:", err);
        }

        return result;
    }

    public async getModelsForProviderUsingModelsDotDev(provider: ModelProviderCreateInput): Promise<NewModel[]> {
        const result: NewModel[] = [];
        const catalogEntry = ProviderCatalogByType[provider.type];
        if (!catalogEntry) {
            logger.warn(`Model listing is not supported for provider type: ${provider.type}.`);
            return result;
        }

        if (catalogEntry.modelsSource === "ollama") {
            return this.getModelsFromOllama(provider);
        }

        if (catalogEntry.modelsSource === "none") {
            logger.warn(`Model listing is not supported for provider type: ${provider.type}.`);
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
                logger.error("Models.dev API Error:", await response.text());
                return result;
            }

            const data = await response.json();
            const modelsDevKey = catalogEntry.modelsDevKey ?? provider.type;
            const modelsDict = data[modelsDevKey]?.models ?? {};
            for (const key in modelsDict) {
                const m = modelsDict[key];
                result.push({
                    name: key,
                    modelId: key,
                    description: m.name,
                    reasoning: m.reasoning,
                    releaseDate: new Date(m.release_date),
                    lastUpdatedByProvider: new Date(m.last_updated),
                    attachment: m.attachment,
                    toolCall: m.tool_call,
                    inputModalities: m.modalities.input,
                    outputModalities: m.modalities.output,
                    ...(m.status !== undefined && {status: m.status}),
                });
            }

            result.sort((a, b) => {
                return b.lastUpdatedByProvider >= a.lastUpdatedByProvider ? 1 : -1;
            });

        } catch (err) {
            logger.error("Models.dev fetch error:", err);
        }

        return result;
    }
}
