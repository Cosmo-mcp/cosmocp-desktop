import {ipcMain} from 'electron';
import {ChatAbortArgs, chatAbortMessage, chatSendMessage, ChatSendMessageArgs} from './chat-handler';
import {ProviderService} from "../services/modelProviderService";

export function registerIpcHandlers(): void {

    const providerService = new ProviderService();

    ipcMain.on('chat-send-messages', (_event, args: ChatSendMessageArgs) => chatSendMessage(_event, args));
    ipcMain.on('chat-abort', (_event, args: ChatAbortArgs) => chatAbortMessage(_event, args));
    ipcMain.handle('get-models', (_event, providerId) => providerService.getModels(providerId));
}
