import { ipcRenderer } from 'electron';
import { UIMessageChunk } from "ai";
import {Model, Provider} from "../main/ipc/dto";

export interface ChatAPI {
    sendChatMessages: (data: any) => void;
    abortChat: (data: any) => void;
    onChatData: (channel: string, callback: (chunk: UIMessageChunk) => void) => void;
    onceChatEnd: (channel: string, callback: () => void) => void;
    onceChatError: (channel: string, callback: (error: any) => void) => void;
    removeChatListener: (channel: string) => void;
    getProviders: () => Promise<Provider[]>;
    addProvider: (provider: Provider) => Promise<void>;
    updateProvider: (provider: Provider) => Promise<void>;
    deleteProvider: (providerId: string) => Promise<void>;
}

export const chatAPI: ChatAPI = {
    sendChatMessages: (data) => ipcRenderer.send('chat-send-messages', data),
    abortChat: (data) => ipcRenderer.send('chat-abort', data),
    onChatData: (channel, callback) => ipcRenderer.on(channel, (_e, chunk) => callback(chunk)),
    onceChatEnd: (channel, callback) => ipcRenderer.once(channel, () => callback()),
    onceChatError: (channel, callback) => ipcRenderer.once(channel, (_e, error) => callback(error)),
    removeChatListener: (channel) => ipcRenderer.removeAllListeners(channel),
    getProviders: () => ipcRenderer.invoke('get-providers'),
    addProvider: (provider) => ipcRenderer.invoke('add-provider', provider),
    updateProvider: (provider) => ipcRenderer.invoke('update-provider', provider),
    deleteProvider: (providerId) => ipcRenderer.invoke('delete-provider', providerId),
};