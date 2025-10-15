
import {app, safeStorage} from 'electron';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
    ModelProvider,
    ModelProviderCreate, ModelProviderCreateSchema, ModelProviderLite, ModelProviderSchema,
    ModelProviderType, PredefinedProviders
} from '../../renderer/src/common/models/modelProvider';
import {Model} from "../../renderer/src/common/models/model";
import {injectable} from "inversify";
import {IpcController, IpcHandler} from "../ipc/Decorators";

const providersFilePath = path.join(app.getPath('appData'), 'providers.json');

const encryptApiKey = (apiKey: string): string => {
    if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption is not available.');
    }
    const buffer = safeStorage.encryptString(apiKey);
    return buffer.toString('base64');
};

const decryptApiKey = (encryptedKey: string): string => {
    if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption is not available.');
    }
    const buffer = Buffer.from(encryptedKey, 'base64');
    return safeStorage.decryptString(buffer);
};

@injectable()
@IpcController("modelProvider")
export class ModelProviderController {
    private providers = new Map<string, ModelProvider>();

    constructor() {
        this.loadProviders().then((providerCount) => {
            if (providerCount === 0) {
                // TODO (shashank): get rid of this method once ui is complete
                this.createMockProvider().then(() => console.log("mock provider created"));
            }
        });
    }

    private async loadProviders(): Promise<number> {
        try {
            const data = await fs.readFile(providersFilePath, 'utf-8');
            const storedProviders = JSON.parse(data) as ModelProvider[];
            storedProviders.forEach(p => {
                this.providers.set(p.id, {
                    ...p,
                    apiKey: decryptApiKey(p.apiKey),
                });
            });
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                console.error("provider.json not found. Initializing empty.");
            } else {
                console.error('Failed to load providers:', err);
            }
        }
        return this.providers.size;
    }

    private async saveProviders() {
        try {
            const providersToSave = Array.from(this.providers.values()).map(p => ({
                ...p,
                apiKey: encryptApiKey(p.apiKey), // Encrypt keys before saving.
            }));
            await fs.writeFile(providersFilePath, JSON.stringify(providersToSave, null, 2));
        } catch (err) {
            console.error('Failed to save providers:', err);
        }
    }

    private isDuplicate(provider: ModelProviderCreate): boolean {
        return Array.from(this.providers.values()).some(
            p => p.type === provider.type
                && p.apiKey === provider.apiKey
                && p.apiUrl === provider.apiUrl
        );
    }

    @IpcHandler("addProvider")
    public async addProvider(providerData: ModelProviderCreate): Promise<ModelProvider> {
        const parsed = ModelProviderCreateSchema.parse(providerData);
        if (this.isDuplicate(providerData)) {
            throw new Error('Duplicate provider entry.');
        }

        // TODO(shashank): convert this to actually fetch model list from local cache (or the remote provider directly)
        function getDefaultApiUrl(type: string) {
            return `https://remotehost${type}.com/api/v1/chat`;
        }

        const newProvider: ModelProvider = {
            ...providerData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            apiUrl: parsed.type === ModelProviderType.CUSTOM
                ? parsed.apiUrl
                : parsed.apiUrl ?? getDefaultApiUrl(parsed.type)
        };
        ModelProviderSchema.parse(newProvider);
        this.providers.set(newProvider.id, newProvider);
        await this.saveProviders();
        return newProvider;
    }

    @IpcHandler("getProviderForId")
    public getProviderForId(providerId: string): ModelProvider | undefined {
        return this.providers.get(providerId);
    }

    @IpcHandler("getProviders")
    public getProviders(): ModelProviderLite[] {
        // Only return safe, non-sensitive data to the renderer.
        return Array.from(this.providers.values()).map(({ apiKey, ...rest }) => rest);
    }

    @IpcHandler("getModels")
    public async getModels(providerId: string): Promise<Model[]> {
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new Error('Provider not found.');
        }
        if (provider.type in PredefinedProviders) {
            // TODO(shashank): add logic to fetch model for a predefined provider
        }
        // TODO (shashank): add logic to fetch models for a custom provider
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

    // TODO (shashank): remove this method later, this is only till we don't have a UI in place
    private async createMockProvider() {
        const mockProvider: ModelProvider = {
            id: 'mock-model-provider',
            createdAt: new Date(),
            nickName: "Mock Model Provider",
            apiKey: 'mock-model-provider-key',
            type: ModelProviderType.CUSTOM,
            apiUrl: 'http://localhost:8080/api/v1/chat/completions',
        };
        this.providers.set(mockProvider.id, mockProvider);
        await this.saveProviders();
    }

    @IpcHandler("deleteProvider")
    public async deleteProvider(providerId: string): Promise<void> {
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new Error('Provider not found.');
        }
        this.providers.delete(provider.id);
        await this.saveProviders();
    }
}
