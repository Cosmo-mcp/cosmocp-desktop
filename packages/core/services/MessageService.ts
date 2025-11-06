import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {MessageRepository} from "../repositories/MessageRepository";
import {Chat, Message, NewMessage} from "../dto";

@injectable()
export class MessageService {
    constructor(
        @inject(CORETYPES.MessageRepository) private messageRepository: MessageRepository
    ) {
    }

    public async getMessagesByChatId(chatId: string): Promise<Message[]> {
        return this.messageRepository.getMessagesByChatId(chatId);
    }

    public async createMessage(newMessage: NewMessage, chat: Chat): Promise<Message> {
        return this.messageRepository.create(newMessage, chat);
    }

    public async updateMessage(id: string, updates: Partial<NewMessage>): Promise<Message> {
        return this.messageRepository.update(id, updates);
    }

    public async deleteMessage(id: string): Promise<void> {
        return this.messageRepository.delete(id);
    }
}
