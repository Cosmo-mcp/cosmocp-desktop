import {app, safeStorage} from 'electron';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
    ModelProvider,
    ModelProviderCreate,
    ModelProviderCreateSchema,
    ModelProviders,
    ModelProviderSchema,
    PredefinedProviders
} from '../../common/models/modelProvider';
import {Model} from "../../common/models/model";

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

export class ModelProviderService {
    private providers: ModelProvider[] = [];

    constructor() {
        this.loadProviders();
        if (this.providers.length === 0) {
            this.createMockProvider(); // TODO (shashank): get rid of this method once ui is complete
        }
    }

    public async addProvider(providerData: ModelProviderCreate): Promise<void> {
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
            apiUrl: parsed.type === ModelProviders.CUSTOM
                ? parsed.apiUrl
                : parsed.apiUrl ?? getDefaultApiUrl(parsed.type)
        };
        ModelProviderSchema.parse(newProvider);
        this.providers.push(newProvider);
        await this.saveProviders();
    }

    public getProviders(): Omit<ModelProvider, 'apiKey'>[] {
        // Only return safe, non-sensitive data to the renderer.
        return this.providers.map(({apiKey, ...rest}) => rest);
    }

    public async getModels(providerId: string): Promise<Model[]> {
        const provider = this.providers.find(p => p.id === providerId);
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

    private async loadProviders() {
        try {
            const data = await fs.readFile(providersFilePath, 'utf-8');
            const storedProviders = JSON.parse(data) as ModelProvider[];
            this.providers = storedProviders.map(p => ({
                ...p,
                apiKey: decryptApiKey(p.apiKey),
            }));
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
                this.providers = [];
            } else {
                console.error('Failed to load providers:', err);
            }
        }
    }

    private async saveProviders() {
        try {
            const providersToSave = this.providers.map(p => ({
                ...p,
                apiKey: encryptApiKey(p.apiKey), // Encrypt keys before saving.
            }));
            await fs.writeFile(providersFilePath, JSON.stringify(providersToSave, null, 2));
        } catch (err) {
            console.error('Failed to save providers:', err);
        }
    }

    private isDuplicate(provider: ModelProviderCreate): boolean {
        return this.providers.some(
            p => p.type === provider.type
                && p.apiKey === provider.apiKey
                && p.apiUrl === provider.apiUrl
        );
    }

    // TODO (shashank): remove this method later, this is only till we don't have a UI in place
    private createMockProvider() {
        const mockProvider: ModelProvider = {
            id: 'mock-model-provider',
            createdAt: new Date(),
            name: "Mock Model Provider",
            apiKey: 'mock-model-provider-key',
            type: ModelProviders.CUSTOM,
            apiUrl: 'http://localhost:8080/api/v1/chat/completions',
        };
        this.providers.push(mockProvider);
        this.saveProviders();
    }
}
