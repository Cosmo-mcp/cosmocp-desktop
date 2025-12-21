import { ipcRenderer } from 'electron';
import {
    NewChat,
    ModelProvider,
    ModelProviderLite,
    ChatAbortArgs,
    ChatSendMessageArgs,
    Model,
    Chat,
    ModelProviderCreateInput,
    NewMessage,
    Message,
    NewModel,
    ProviderWithModels,
    ChatWithMessages
} from '../../packages/core/dto';
import {UIMessage} from "ai";
export interface ChatApi {
    getAllChats(searchQuery: string | null): Promise<Chat[]>;
    getChatById(id: string): Promise<ChatWithMessages | undefined>;
    createChat(newChat: NewChat): Promise<Chat>;
    updateChat(id: string, updates: Partial<NewChat>): Promise<Chat>;
    deleteChat(id: string): Promise<void>;
    updatePinnedStatusForChat(id: string, pinned: boolean): Promise<void>;
    getSelectedModelForChat(id: string): Promise<string | null>;
    updateSelectedModelForChat(id: string, modelIdentifier: string): Promise<void>;
}

export interface ModelProviderApi {
    addProvider(providerData: ModelProviderCreateInput, models: NewModel[]): Promise<ProviderWithModels>;
    getProviderForId(providerId: string): Promise<ProviderWithModels | undefined>;
    getProviders(): Promise<ModelProviderLite[]>;
    getProvidersWithModels(): Promise<ProviderWithModels[]>;
    deleteProvider(providerId: string): Promise<void>;
    updateProvider(providerId: string, updateObject: Partial<ModelProviderCreateInput>, modelsData?: NewModel[]): Promise<ProviderWithModels>;
    getAvailableModelsFromProviders(provider: ModelProviderCreateInput): Promise<NewModel[]>;
}

export interface MessageApi {
    getByChat(chatId: string): Promise<UIMessage[]>;
    save(newMessage: NewMessage): Promise<Message>;
    update(id: string, updates: Partial<NewMessage>): Promise<void>;
    delete(id: string): Promise<void>;
}

export interface StreamingApi {
    sendMessage(args: ChatSendMessageArgs): void;
    abortMessage(args: ChatAbortArgs): void;
    onData: (channel: string, listener: (data: any) => void) => void;
    onEnd: (channel: string, listener: () => void) => void;
    onError: (channel: string, listener: (error: any) => void) => void;
    removeListeners: (channel: string) => void;
}

export interface Api {
  chat: ChatApi;
  modelProvider: ModelProviderApi;
  message: MessageApi;
  streaming: StreamingApi;
}

export const api: Api = {
  chat: {
    getAllChats: (searchQuery: string | null) => ipcRenderer.invoke('chat:getAllChats', searchQuery),
    getChatById: (id: string) => ipcRenderer.invoke('chat:getChatById', id),
    createChat: (newChat: NewChat) => ipcRenderer.invoke('chat:createChat', newChat),
    updateChat: (id: string, updates: Partial<NewChat>) => ipcRenderer.invoke('chat:updateChat', id, updates),
    deleteChat: (id: string) => ipcRenderer.invoke('chat:deleteChat', id),
    updatePinnedStatusForChat: (id: string, pinned: boolean) => ipcRenderer.invoke('chat:updatePinnedStatusForChat', id, pinned),
    getSelectedModelForChat: (id: string) => ipcRenderer.invoke('chat:getSelectedModelForChat', id),
    updateSelectedModelForChat: (id: string, modelIdentifier: string) => ipcRenderer.invoke('chat:updateSelectedModelForChat', id, modelIdentifier)
  },
  modelProvider: {
    addProvider: (providerData: ModelProviderCreateInput, models: NewModel[]) => ipcRenderer.invoke('modelProvider:addProvider', providerData, models),
    getProviderForId: (providerId: string) => ipcRenderer.invoke('modelProvider:getProviderForId', providerId),
    getProviders: () => ipcRenderer.invoke('modelProvider:getProviders'),
    getProvidersWithModels: () => ipcRenderer.invoke('modelProvider:getProvidersWithModels'),
    deleteProvider: (providerId: string) => ipcRenderer.invoke('modelProvider:deleteProvider', providerId),
    updateProvider: (providerId: string, updateObject: Partial<ModelProviderCreateInput>, modelsData?: NewModel[]) => ipcRenderer.invoke('modelProvider:updateProvider', providerId, updateObject, modelsData),
    getAvailableModelsFromProviders: (provider: ModelProviderCreateInput) => ipcRenderer.invoke('modelProvider:getAvailableModelsFromProviders', provider)
  },
  message: {
    getByChat: (chatId: string) => ipcRenderer.invoke('message:getByChat', chatId),
    save: (newMessage: NewMessage) => ipcRenderer.invoke('message:save', newMessage),
    update: (id: string, updates: Partial<NewMessage>) => ipcRenderer.invoke('message:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('message:delete', id)
  },
  streaming: {
    sendMessage: (args: ChatSendMessageArgs) => ipcRenderer.send('streamingChat:sendMessage', args),
    abortMessage: (args: ChatAbortArgs) => ipcRenderer.send('streamingChat:abortMessage', args),
    onData: (channel: string, listener: (data: any) => void) => {
      const subscription = (_event: any, data: any) => listener(data);
      ipcRenderer.on(`${channel}-data`, subscription);
    },
    onEnd: (channel: string, listener: () => void) => {
      ipcRenderer.on(`${channel}-end`, listener);
    },
    onError: (channel: string, listener: (error: any) => void) => {
      const subscription = (_event: any, error: any) => listener(error);
      ipcRenderer.on(`${channel}-error`, subscription);
    },
    removeListeners: (channel) => {
      ipcRenderer.removeAllListeners(`${channel}-error`);
      ipcRenderer.removeAllListeners(`${channel}-end`);
      ipcRenderer.removeAllListeners(`${channel}-data`);
    },
  },
};
