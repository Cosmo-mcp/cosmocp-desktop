import {inject, injectable} from "inversify";
import {model, modelProvider,} from "../database/schema/modelProviderSchema"; // Use Drizzle-derived types
import {and, eq, getTableColumns} from "drizzle-orm";
import {CORETYPES} from "../types/types";
import {safeStorage} from 'electron';
import {DatabaseManager} from "../database/DatabaseManager";
import {
    Model,
    ModelProvider,
    ModelProviderCreateInput,
    ModelProviderInsert,
    ModelProviderLite,
    NewModel,
    ProviderWithModels,
} from "../dto";


@injectable()
export class ModelProviderRepository {
    private db;

    constructor(@inject(CORETYPES.DatabaseManager) databaseManager: DatabaseManager) {
        this.db = databaseManager.getInstance();
    }

    public async findAll(columns: { withApiKey: boolean }): Promise<ModelProviderLite[]> {
        if (columns.withApiKey) {
            return this.db.select().from(modelProvider);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const {apiKey, ...rest} = getTableColumns(modelProvider);
            return this.db.select({...rest}).from(modelProvider);
        }
    }

    public async findDuplicates(provider: ModelProviderCreateInput): Promise<ModelProvider[]> {
        return this.db.select().from(modelProvider).where(
            and(
                eq(modelProvider.type, provider.type),
                eq(modelProvider.apiKey, provider.apiKey),
                eq(modelProvider.apiUrl, provider.apiUrl),
            )
        );
    }

    public async findProviderById(id: string): Promise<ProviderWithModels | undefined> {
        const result = await this.db.query.modelProvider.findFirst({
            columns: {
                apiKey: false
            },
            where: eq(modelProvider.id, id),
            with: {
                models: true
            }
        });
        return result;
    }

    // Accepts the type-checked input from the service
    public async addProvider(newProvider: ModelProviderCreateInput, newModels: NewModel[]): Promise<ProviderWithModels> {
        // Encrypt the key before hitting the database
        const encryptedData: ModelProviderInsert = {
            ...newProvider,
            apiKey: this.encryptApiKey(newProvider.apiKey),
        };

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {apiKey, ...providerRest} = getTableColumns(modelProvider);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {providerId, ...modelRest} = getTableColumns(model);

        return this.db.transaction(async (tx) => {
            const [savedProvider] = await tx.insert(modelProvider)
                .values(encryptedData)
                .returning({...providerRest}); // Returning the DB record (with encrypted key)
            if (newModels && newModels.length > 0) {
                const modelsWithProvider = newModels.map(newModel => ({
                    ...newModel,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    providerId: savedProvider.id,
                }));
                const savedModels = await tx.insert(model).values(modelsWithProvider).returning({...modelRest});
                return {
                    ...savedProvider,
                    models: savedModels
                };
            }
            return {
                ...savedProvider,
                models: []
            };
        });

    }

    public async deleteProviderById(id: string): Promise<void> {
        await this.db.delete(modelProvider).where(eq(modelProvider.id, id));
    }

    public async updateProvider(providerId: string, updateObject: Partial<ModelProviderCreateInput>): Promise<ModelProvider> {
        const result = await this.db.update(modelProvider).set(updateObject).where(eq(modelProvider.id, providerId)).returning();
        return result[0];
    }

    public async getModels(provider: ModelProvider): Promise<Model[]> {
        return this.db.select().from(model).where(eq(model.providerId, provider.id));
    }

    private encryptApiKey = (apiKey: string): string => {
        if (!safeStorage.isEncryptionAvailable()) {
            throw new Error('Encryption is not available.');
        }
        const buffer = safeStorage.encryptString(apiKey);
        return buffer.toString('base64');
    };

}
