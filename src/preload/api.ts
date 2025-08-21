import {ipcRenderer} from 'electron';
import {UIMessageChunk} from "ai";
import {ModelProvider, ModelProviderCreate, ModelProviderLite} from "../renderer/src/common/models/modelProvider";
import {Model} from "../renderer/src/common/models/model";

export interface ChatAPI {
    sendChatMessages: (data: any) => void;
    abortChat: (data: any) => void;
    onChatData: (channel: string, callback: (chunk: UIMessageChunk) => void) => void;
    onceChatEnd: (channel: string, callback: () => void) => void;
    onceChatError: (channel: string, callback: (error: any) => void) => void;
    removeChatListener: (channel: string) => void;
}

export interface ModelProviderAPI {
    addProvider: (providerData: ModelProviderCreate) => Promise<ModelProvider>;
    getProviders: () => Promise<ModelProviderLite[]>;
    getModels: (providerId: string) => Promise<Model[]>;
}

export const chatAPI: ChatAPI = {
    sendChatMessages: (data) => {
        ipcRenderer.send('chat-send-messages', data)
    },
    abortChat: (data) => {
        ipcRenderer.send('chat-abort', data)
    },
    onChatData: (channel, callback) => {
        ipcRenderer.on(channel, (_e, chunk) => callback(chunk))
    },
    onceChatEnd: (channel, callback) => {
        ipcRenderer.once(channel, () => callback())
    },
    onceChatError: (channel, callback) => {
        ipcRenderer.once(channel, (_e, error) => callback(error))
    },
    removeChatListener: (channel) => {
        ipcRenderer.removeAllListeners(channel)
    },
};

export const modelProviderAPI: ModelProviderAPI = {
    addProvider(providerData: ModelProviderCreate): Promise<ModelProvider> {
        return ipcRenderer.invoke('add-model-provider', providerData)
    },
    getProviders(): Promise<Omit<ModelProvider, "apiKey">[]> {
        return ipcRenderer.invoke('get-model-providers')
    },
    getModels: (providerId: string) => {
        return ipcRenderer.invoke('get-models-for-provider-id', providerId)
    },
};
