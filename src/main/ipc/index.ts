import {ipcMain} from 'electron';
import {ChatAbortArgs, chatAbortMessage, chatSendMessage, ChatSendMessageArgs} from './chat-handler';
import {ModelProviderService} from "../services/modelProviderService";
import {ModelProviderCreate} from "../../renderer/src/common/models/modelProvider";

export function registerIpcHandlers(): void {

    const modelProviderService = new ModelProviderService();

    ipcMain.on('chat-send-messages', (_event, args: ChatSendMessageArgs) => chatSendMessage(_event, args));
    ipcMain.on('chat-abort', (_event, args: ChatAbortArgs) => chatAbortMessage(_event, args));
    ipcMain.handle('add-model-provider', (_event, providerData: ModelProviderCreate) => modelProviderService.addProvider(providerData));
    ipcMain.handle('get-model-providers', () => modelProviderService.getProviders());
    ipcMain.handle('get-models-for-provider-id', (_event, providerId) => modelProviderService.getModels(providerId));

}
