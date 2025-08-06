import {ipcMain} from 'electron';
import {ChatAbortArgs, chatAbortMessage, chatSendMessage, ChatSendMessageArgs} from './chat-handler';
import {Model, Provider} from "./dto";
import {keyStoreService} from "../services/KeyStoreService";
import {ProviderService} from "../services/ProviderService";

const providerService = new ProviderService();

export function registerIpcHandlers(): void {
    ipcMain.on('chat-send-messages', (_event, args: ChatSendMessageArgs) => chatSendMessage(_event, args));
    ipcMain.on('chat-abort', (_event, args: ChatAbortArgs) => chatAbortMessage(_event, args));
    ipcMain.handle('get-providers', () => providerService.getProviders());
    ipcMain.handle('add-provider', (_event, provider: Provider) => providerService.addProvider(provider));
    ipcMain.handle('update-provider', (_event, provider: Provider) => providerService.updateProvider(provider));
    ipcMain.handle('delete-provider', (_event, providerId: string) => providerService.deleteProvider(providerId));
}