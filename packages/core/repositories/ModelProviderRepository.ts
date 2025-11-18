import {inject, injectable} from "inversify";
import {modelProvider,} from "../database/schema/modelProviderSchema"; // Use Drizzle-derived types
import {eq} from "drizzle-orm";
import {CORETYPES} from "../types/types";
import {safeStorage} from 'electron';
import {DatabaseManager} from "../database/DatabaseManager";
import {ModelProvider, ModelProviderCreateInput, ModelProviderInsert} from "../dto";


@injectable()
export class ModelProviderRepository {
    private db;

    constructor(@inject(CORETYPES.DatabaseManager) databaseManager: DatabaseManager) {
        this.db = databaseManager.getInstance();
    }

    private encryptApiKey = (apiKey: string): string => {
        if (!safeStorage.isEncryptionAvailable()) {
            throw new Error('Encryption is not available.');
        }
        const buffer = safeStorage.encryptString(apiKey);
        return buffer.toString('base64');
    };

    private decryptApiKey = (encryptedKey: string): string => {
        if (!safeStorage.isEncryptionAvailable()) {
            throw new Error('Encryption is not available.');
        }
        const buffer = Buffer.from(encryptedKey, 'base64');
        return safeStorage.decryptString(buffer);
    };

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

    public async findAll(): Promise<ModelProvider[]> {
        const providers = await this.db.select().from(modelProvider);
        return providers.map(this.mapToModelProvider);
    }

    public async findById(id: string): Promise<ModelProvider | undefined> {
        const result = await this.db.select()
            .from(modelProvider)
            .where(eq(modelProvider.id, id))
            .limit(1);

        return result.length ? this.mapToModelProvider(result[0]) : undefined;
    }

    // Accepts the type-checked input from the service
    public async create(data: ModelProviderCreateInput): Promise<ModelProvider> {
        // Encrypt the key before hitting the database
        const encryptedData: ModelProviderInsert = {
            ...data,
            apiKey: this.encryptApiKey(data.apiKey),
        };

        const [newProvider] = await this.db.insert(modelProvider)
            .values(encryptedData)
            .returning(); // Returning the DB record (with encrypted key)

        // Return the application model (with decrypted key)
        return this.mapToModelProvider(newProvider);
    }

    public async deleteById(id: string): Promise<void> {
        await this.db.delete(modelProvider).where(eq(modelProvider.id, id));
    }

    public async update(providerId: string, updateObject: Partial<ModelProviderCreateInput>): Promise<ModelProvider> {
        const result = await this.db.update(modelProvider).set(updateObject).where(eq(modelProvider.id, providerId)).returning();
        return result[0];
    }
}
