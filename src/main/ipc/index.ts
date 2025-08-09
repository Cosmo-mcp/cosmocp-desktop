import {ipcMain} from 'electron';
import {ChatAbortArgs, chatAbortMessage, chatSendMessage, ChatSendMessageArgs} from './chat-handler';
import {providerService} from "../services/modelProviderService";

export function registerIpcHandlers(): void {
    ipcMain.on('chat-send-messages', (_event, args: ChatSendMessageArgs) => chatSendMessage(_event, args));
    ipcMain.on('chat-abort', (_event, args: ChatAbortArgs) => chatAbortMessage(_event, args));
    ipcMain.handle('get-models', (_event, providerId) => providerService.getModels(providerId));
}
