import {inject, injectable} from "inversify";
import {CORETYPES} from "../../../packages/core/types/types";
import {ChatService} from "../../../packages/core/services/ChatService";
import {IpcController, IpcHandler} from "../ipc/Decorators";
import {Controller} from "./Controller";
import {Chat, ChatWithMessages, NewChat} from "../../../packages/core/dto";

@injectable()
@IpcController("chat")
export class ChatController implements Controller {
    constructor(@inject(CORETYPES.ChatService) private chatService: ChatService) {
    }

    @IpcHandler("getAllChats")
    public async getAllChats(searchQuery: string | null): Promise<Chat[]> {
        return this.chatService.getAllChats(searchQuery);
    }

    @IpcHandler("getChatById")
    public async getChatById(id: string): Promise<ChatWithMessages | undefined> {
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
