import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {MessageRepository} from "../repositories/MessageRepository";
import {Message, NewMessage} from "../dto";
import {UIMessage} from "ai";

@injectable()
export class MessageService {
    constructor(
        @inject(CORETYPES.MessageRepository) private messageRepository: MessageRepository
    ) {
    }

    public async getMessagesByChatId(chatId: string): Promise<UIMessage[]> {
        const messages = await this.messageRepository.getMessagesByChatId(chatId);

        return messages.map((message) => {
            const parts: { type: 'text' | 'reasoning', text: string }[] = [];

            if (message.text) {
                parts.push({ type: 'text', text: message.text });
            }
            if (message.reasoning) {
                parts.push({ type: 'reasoning', text: message.reasoning });
            }

            return {
                id: message.id,
                role: message.role,
                parts: parts
            };
        });
    }

    public async createMessage(newMessage: NewMessage): Promise<Message> {
        console.log("createMessage", newMessage);
        return this.messageRepository.create(newMessage);
    }

    public async updateMessage(id: string, updates: Partial<NewMessage>): Promise<Message> {
        return this.messageRepository.update(id, updates);
    }

    public async deleteMessage(id: string): Promise<void> {
        return this.messageRepository.delete(id);
    }
}
