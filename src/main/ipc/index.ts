import {ipcMain} from 'electron';
import {ChatAbortArgs, chatAbortMessage, chatSendMessage, ChatSendMessageArgs} from './chat-handler';
import {Model} from "./dto";
import {keyStoreService} from "../services/KeyStoreService";

export function registerIpcHandlers(): void {
    ipcMain.on('chat-send-messages', (_event, args: ChatSendMessageArgs) => chatSendMessage(_event, args));
    ipcMain.on('chat-abort', (_event, args: ChatAbortArgs) => chatAbortMessage(_event, args));
    ipcMain.handle('get-models', () => getModels());
    ipcMain.handle('save-model', (_event, model: Model) => saveModel(model));
}

export async function getModels(): Promise<Model[]> {
    return keyStoreService.listProviders();
}

export async function saveModel(model: Model): Promise<void> {
    await keyStoreService.saveModel(model);
}