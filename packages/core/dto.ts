import {InferInsertModel, InferSelectModel} from "drizzle-orm";
import {chat, message, model, modelProvider, persona} from "./database/schema/schema";
import {UIMessage} from "ai";

type Optional<T, K extends keyof T> = Omit<T, K> & Pick<Partial<T>, K>;

//full entity based dto
export type Message = InferSelectModel<typeof message>;
export type Chat = InferSelectModel<typeof chat>;
export type Persona = InferSelectModel<typeof persona>;

// DTOs for new database entry
export type NewChat = InferInsertModel<typeof chat>;
export type NewMessage = Omit<Message, "id" | "createdAt">;

// The full model, retrieved from the database with a decrypted apiKey.
export type ModelProvider = InferSelectModel<typeof modelProvider>;
// The raw type used for inserting a record into the database.
export type ModelProviderInsert = InferInsertModel<typeof modelProvider>;

// New type for user input, omitting DB-managed fields.
export type ModelProviderCreateInput = Omit<ModelProviderInsert, 'id' | 'createdAt' | 'updatedAt'>;

// The safe model for sending to the renderer process (no API key).
export type ModelProviderLite = Optional<ModelProvider, "apiKey">;
export type ModelIdentifier = Pick<Chat, "selectedProvider" | "selectedModelId">;

// Simple Model interface (kept here for full context)
export type Model = InferSelectModel<typeof model>;
export type ModelInsert = InferInsertModel<typeof model>;

export type NewModel = Omit<Model, 'id' | 'createdAt' | 'updatedAt' | 'providerId'>;
export type ModelLite = Omit<Model, 'providerId'>;

export type Persona = InferSelectModel<typeof persona>;
export type NewPersona = InferInsertModel<typeof persona>;
export type PersonaCreateInput = Omit<NewPersona, 'id' | 'createdAt' | 'updatedAt'>;

export type ProviderWithModels = ModelProviderLite & {
    models: ModelLite[]
}

export type ChatWithMessages = Chat & {
    messages: UIMessage[]
}

export interface ChatSendMessageArgs {
    chatId: string;
    messages: UIMessage[];
    streamChannel: string;
    modelIdentifier: string & {};
}

export interface ChatAbortArgs {
    streamChannel: string;
}
