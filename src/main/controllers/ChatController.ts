import {inject, injectable} from "inversify";
import {CORETYPES} from "../../core/types/types";
import {ChatService} from "../../core/services/ChatService";
import {NewChat} from "../../core/repositories/ChatRepository";
import {IpcController, IpcHandler} from "../ipc/Decorators";
import {Controller} from "./Controller";

@injectable()
@IpcController("chat")
export class ChatController implements Controller {
    constructor(@inject(CORETYPES.ChatService) private chatService: ChatService) {
    }

    @IpcHandler("getAllChats")
    public async getAllChats() {
        return await this.chatService.getAllChats();
    }

    @IpcHandler("getChatById")
    public async getChatById(id: string) {
        return this.chatService.getChatById(id);
    }

    @IpcHandler("createChat")
    public async createChat(newChat: NewChat) {
        return this.chatService.createChat(newChat);
    }

    @IpcHandler("updateChat")
    public async updateChat(id: string, updates: Partial<NewChat>) {
        return this.chatService.updateChat(id, updates);
    }

    @IpcHandler("deleteChat")
    public async deleteChat(id: string) {
        return this.chatService.deleteChat(id);
    }
}
