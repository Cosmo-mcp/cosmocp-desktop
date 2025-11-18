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
    Message
} from 'core/dto';
export interface ChatApi {
    getAllChats(): Promise<Chat[]>;
    getChatById(id: string): Promise<Chat | undefined>;
    createChat(newChat: NewChat): Promise<Chat>;
    updateChat(id: string, updates: Partial<NewChat>): Promise<Chat>;
    deleteChat(id: string): Promise<void>;
}

export interface ModelProviderApi {
    addProvider(providerData: ModelProviderCreateInput): Promise<ModelProvider>;
    getProviderForId(providerId: string): Promise<ModelProvider | undefined>;
    getProviders(): Promise<ModelProviderLite[]>;
    getModels(providerId: string): Promise<Model[]>;
    deleteProvider(providerId: string): Promise<void>;
}

export interface MessageApi {
    getByChat(chatId: string): Promise<Message[]>;
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
    getAllChats: () => ipcRenderer.invoke('chat:getAllChats'),
    getChatById: (id: string) => ipcRenderer.invoke('chat:getChatById', id),
    createChat: (newChat: NewChat) => ipcRenderer.invoke('chat:createChat', newChat),
    updateChat: (id: string, updates: Partial<NewChat>) => ipcRenderer.invoke('chat:updateChat', id, updates),
    deleteChat: (id: string) => ipcRenderer.invoke('chat:deleteChat', id)
  },
  modelProvider: {
    addProvider: (providerData: ModelProviderCreateInput) => ipcRenderer.invoke('modelProvider:addProvider', providerData),
    getProviderForId: (providerId: string) => ipcRenderer.invoke('modelProvider:getProviderForId', providerId),
    getProviders: () => ipcRenderer.invoke('modelProvider:getProviders'),
    getModels: (providerId: string) => ipcRenderer.invoke('modelProvider:getModels', providerId),
    deleteProvider: (providerId: string) => ipcRenderer.invoke('modelProvider:deleteProvider', providerId)
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
