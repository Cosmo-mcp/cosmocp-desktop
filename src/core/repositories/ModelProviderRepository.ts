import {inject, injectable} from "inversify";
import {
    ModelProvider,
    ModelProviderInsert,
    ModelProviderCreateInput
} from "@database/schema/modelProviderSchema"; // Use Drizzle-derived types
import {eq} from "drizzle-orm";
import {CORETYPES} from "../types/types";
import {safeStorage} from 'electron';
import {DatabaseManager} from "@database/DatabaseManager";
import {modelProvider} from "@database/schema/schemaNew";


// TODO(shashank): remove these duplicate methods by moving them to a separate util file
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
export class ModelProviderRepository {
    private db;

    constructor(@inject(CORETYPES.DatabaseManager) databaseManager: DatabaseManager) {
        this.db = databaseManager.getInstance();
    }

    /** Maps a DB record (encrypted key) to the application model (decrypted key). */
    private mapToModelProvider(dbRecord: ModelProvider): ModelProvider {
        // Note: You must handle the timestamp conversion here if needed,
        // as we dropped Zod's automatic date coercion.
        return {
            ...dbRecord,
            apiKey: decryptApiKey(dbRecord.apiKey),
            createdAt: new Date(dbRecord.createdAt),
            updatedAt: dbRecord.updatedAt ? new Date(dbRecord.updatedAt) : undefined,
        } as ModelProvider;
    }

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
            apiKey: encryptApiKey(data.apiKey),
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
}
