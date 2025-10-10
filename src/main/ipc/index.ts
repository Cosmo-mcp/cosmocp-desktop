import {ipcMain} from 'electron';
import {ModelProviderService} from "../services/modelProviderService";
import {ModelProviderCreate} from "../../renderer/src/common/models/modelProvider";
import {inject, injectable} from "inversify";
import {ChatAbortArgs, ChatHandler, ChatSendMessageArgs} from "./chat-handler";
import {TYPES} from "../types";
import {CORETYPES} from "../../core/types/types";
import {ChatController} from "../../core/controllers/ChatController";

@injectable()
export class IpcHandlerRegistry {

    constructor(
        @inject(TYPES.ModelProviderService) private readonly modelProviderService: ModelProviderService,
        @inject(TYPES.ChatHandler) private readonly chatHandler: ChatHandler,
        @inject(CORETYPES.ChatController) private readonly chatController: ChatController
    ) {
    }

    registerIpcHandlers(): void {
        ipcMain.on('chat-send-messages', (event, args: ChatSendMessageArgs) => this.chatHandler.sendMessage(event, args));
        ipcMain.on('chat-abort', (event, args: ChatAbortArgs) => this.chatHandler.abortMessage(event, args));
        ipcMain.handle('add-model-provider', (_event, providerData: ModelProviderCreate) => this.modelProviderService.addProvider(providerData));
        ipcMain.handle('get-model-providers', () => this.modelProviderService.getProviders());
        ipcMain.handle('get-models-for-provider-id', (_event, providerId) => this.modelProviderService.getModels(providerId));
        ipcMain.handle('save-chat', () => {
            console.log("here I am")
            this.chatController.createChat({
                title: "New Chat" + new Date()
            })
        });
    }
}
