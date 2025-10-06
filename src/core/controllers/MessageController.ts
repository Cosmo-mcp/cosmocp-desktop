import { injectable, inject } from "inversify";
import { TYPES } from "../types/types";
import { MessageService } from "../services/MessageService";
import { NewMessage } from "../repositories/MessageRepository";

@injectable()
export class MessageController {
    constructor(@inject(TYPES.MessageService) private messageService: MessageService) {}

    public async getMessagesByChatId(chatId: string) {
        return this.messageService.getMessagesByChatId(chatId);
    }

    public async createMessage(newMessage: NewMessage) {
        return this.messageService.createMessage(newMessage);
    }

    public async updateMessage(id: string, updates: Partial<NewMessage>) {
        return this.messageService.updateMessage(id, updates);
    }

    public async deleteMessage(id: string) {
        return this.messageService.deleteMessage(id);
    }
}
