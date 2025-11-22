import {InferInsertModel, InferSelectModel} from "drizzle-orm";
import {chat, message, model, modelProvider} from "./database/schema/schema";
import {ChatMessage} from "renderer/src/lib/types";

type Optional<T, K extends keyof T> = Omit<T, K> & Pick<Partial<T>, K>;

//full entity based dto
export type Message = InferSelectModel<typeof message>;
export type Chat = InferSelectModel<typeof chat>;

// DTOs for new database entry
export type NewChat = Omit<Chat, "id" | "createdAt">;
export type NewMessage = Omit<Message, "id" | "createdAt">;

// The full model, retrieved from the database with a decrypted apiKey.
export type ModelProvider = InferSelectModel<typeof modelProvider>;
// The raw type used for inserting a record into the database.
export type ModelProviderInsert = InferInsertModel<typeof modelProvider>;

// New type for user input, omitting DB-managed fields.
export type ModelProviderCreateInput = Omit<ModelProviderInsert, 'id' | 'createdAt' | 'updatedAt'>;

// The safe model for sending to the renderer process (no API key).
export type ModelProviderLite = Optional<ModelProvider, "apiKey">;

// Simple Model interface (kept here for full context)
export type Model = InferSelectModel<typeof model>;
export type ModelInsert = InferInsertModel<typeof model>;

export type NewModel = Omit<Model, 'id' | 'createdAt' | 'updatedAt' | 'providerId'>;
export type ModelLite = Omit<Model, 'providerId'>;

export type ProviderWithModels = ModelProviderLite & {
    models: ModelLite[]
}

export interface ChatSendMessageArgs {
    chatId: string;
    messages: ChatMessage[];
    streamChannel: string;
    modelIdentifier: string & {};
}

export interface ChatAbortArgs {
    streamChannel: string;
}
