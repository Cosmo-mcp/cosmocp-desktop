import {ipcMain} from 'electron';
import {ChatAbortArgs, chatAbortMessage, chatSendMessage, ChatSendMessageArgs} from './chat-handler';
import {Model} from "./dto";

export function registerIpcHandlers(): void {
    ipcMain.on('chat-send-messages', (_event, args: ChatSendMessageArgs) => chatSendMessage(_event, args));
    ipcMain.on('chat-abort', (_event, args: ChatAbortArgs) => chatAbortMessage(_event, args));
    ipcMain.handle('get-models', () => getModels());
}

export async function getModels(): Promise<Model[]> {
    return [{
        id: 'gemini-2.0-flash-lite',
        name: 'Gemini Flash Lite',
        description: 'Fast and efficient model for everyday tasks.'
    }, {
        id: 'gemini-2.0-pro-lite',
        name: 'Gemini Pro Lite',
        description: 'Most capable model for complex reasoning.'
    }];
}