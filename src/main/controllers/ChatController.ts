import {inject, injectable} from "inversify";
import {CORETYPES} from "../../core/types/types";
import {ChatService} from "../../core/services/ChatService";
import {IpcController, IpcHandler} from "../ipc/Decorators";
import {Controller} from "./Controller";
import {Chat, NewChat} from "../../core/dto";

@injectable()
@IpcController("chat")
export class ChatController implements Controller {
    constructor(@inject(CORETYPES.ChatService) private chatService: ChatService) {
    }

    @IpcHandler("getAllChats")
    public async getAllChats(): Promise<Chat[]> {
        return this.chatService.getAllChats();
    }

    @IpcHandler("getChatById")
    public async getChatById(id: string): Promise<Chat | undefined> {
        return this.chatService.getChatById(id);
    }

    @IpcHandler("createChat")
    public async createChat(newChat: NewChat): Promise<Chat> {
        return this.chatService.createChat(newChat);
    }

    @IpcHandler("updateChat")
    public async updateChat(id: string, updates: Partial<NewChat>): Promise<Chat> {
        return this.chatService.updateChat(id, updates);
    }

    @IpcHandler("deleteChat")
    public async deleteChat(id: string): Promise<void> {
        return this.chatService.deleteChat(id);
    }
}
