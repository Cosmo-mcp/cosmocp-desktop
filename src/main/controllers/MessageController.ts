import {inject, injectable} from "inversify";
import {CORETYPES} from "../../core/types/types";
import {MessageService} from "../../core/services/MessageService";
import {NewMessage} from "../../core/repositories/MessageRepository";
import {Chat} from "@database/schema";

@injectable()
export class MessageController {
    constructor(@inject(CORETYPES.MessageService) private messageService: MessageService) {
    }

    public async getMessagesByChatId(chatId: string) {
        return this.messageService.getMessagesByChatId(chatId);
    }

    public async createMessage(newMessage: NewMessage, chat: Chat) {
        return this.messageService.createMessage(newMessage, chat);
    }

    public async updateMessage(id: string, updates: Partial<NewMessage>) {
        return this.messageService.updateMessage(id, updates);
    }

    public async deleteMessage(id: string) {
        return this.messageService.deleteMessage(id);
    }
}
