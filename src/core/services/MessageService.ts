import { injectable, inject } from "inversify";
import { TYPES } from "../types/types";
import { MessageRepository, NewMessage } from "../repositories/MessageRepository";
import { Message } from "../database/schema";

@injectable()
export class MessageService {
    constructor(
        @inject(TYPES.MessageRepository) private messageRepository: MessageRepository
    ) {}

    public async getMessagesByChatId(chatId: string): Promise<Message[]> {
        return this.messageRepository.getMessagesByChatId(chatId);
    }

    public async createMessage(newMessage: NewMessage): Promise<Message> {
        return this.messageRepository.create(newMessage);
    }

    public async updateMessage(id: string, updates: Partial<NewMessage>): Promise<Message> {
        return this.messageRepository.update(id, updates);
    }

    public async deleteMessage(id: string): Promise<void> {
        return this.messageRepository.delete(id);
    }
}
