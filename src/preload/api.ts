import { ipcRenderer } from 'electron';
import {
    NewChat,
    ModelProvider,
    ModelProviderCreate,
    ModelProviderLite,
    ChatAbortArgs,
    ChatSendMessageArgs,
    Model,
    Chat
} from '../../src/core/dto';

export interface ChatApi {
    getAllChats(): Promise<Chat[]>;
    getChatById(id: string): Promise<Chat | undefined>;
    createChat(newChat: NewChat): Promise<Chat>;
    updateChat(id: string, updates: Partial<NewChat>): Promise<Chat>;
    deleteChat(id: string): Promise<void>;
}

export interface ModelProviderApi {
    addProvider(): Promise<void>;
    getProviderForId(): Promise<void>;
    getProviders(): Promise<void>;
    getModels(): Promise<void>;
    deleteProvider(): Promise<void>;
}

export interface StreamingApi {
    sendMessage(args: ChatSendMessageArgs): void;
    abortMessage(args: ChatAbortArgs): void;
    onData: (channel: string, listener: (data: any) => void) => void;
    onEnd: (channel: string, listener: () => void) => () => void;
    onError: (channel: string, listener: (error: any) => void) => () => void;
}

export interface Api {
  chat: ChatApi;
  modelProvider: ModelProviderApi;
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
    addProvider: () => ipcRenderer.invoke('modelProvider:addProvider'),
    getProviderForId: () => ipcRenderer.invoke('modelProvider:getProviderForId'),
    getProviders: () => ipcRenderer.invoke('modelProvider:getProviders'),
    getModels: () => ipcRenderer.invoke('modelProvider:getModels'),
    deleteProvider: () => ipcRenderer.invoke('modelProvider:deleteProvider')
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
      return () => ipcRenderer.removeAllListeners(`${channel}-end`);
    },
    onError: (channel: string, listener: (error: any) => void) => {
      const subscription = (_event: any, error: any) => listener(error);
      ipcRenderer.on(`${channel}-error`, subscription);
      return () => ipcRenderer.removeListener(`${channel}-error`, subscription);
    },
  },
};
