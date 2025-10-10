import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {ChatService} from "../services/ChatService";
import {NewChat} from "../repositories/ChatRepository";

@injectable()
export class ChatController {
    constructor(@inject(CORETYPES.ChatService) private chatService: ChatService) {
    }

    public async getAllChats() {
        return this.chatService.getAllChats();
    }

    public async getChatById(id: string) {
        return this.chatService.getChatById(id);
    }

    public async createChat(newChat: NewChat) {
        return this.chatService.createChat(newChat);
    }

    public async updateChat(id: string, updates: Partial<NewChat>) {
        return this.chatService.updateChat(id, updates);
    }

    public async deleteChat(id: string) {
        return this.chatService.deleteChat(id);
    }
}
