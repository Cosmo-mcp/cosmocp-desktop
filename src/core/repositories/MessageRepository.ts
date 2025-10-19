import {inject, injectable} from "inversify";
import {eq} from "drizzle-orm";
import {CORETYPES} from "../types/types";
import {DatabaseManager} from "@database/DatabaseManager";
import {Chat} from "@database/schema/schema";
import {message, Message} from "@database/schema/schema";

export type NewMessage = Omit<Message, "id" | "createdAt">;

@injectable()
export class MessageRepository {
    private db;

    constructor(@inject(CORETYPES.DatabaseManager) databaseManager: DatabaseManager) {
        this.db = databaseManager.getInstance();
    }

    public async getMessagesByChatId(chatId: string): Promise<Message[]> {
        return this.db.select().from(message).where(eq(message.chatId, chatId));
    }

    public async create(newMessage: NewMessage, chat: Chat): Promise<Message> {
        const result = await this.db.insert(message).values({
            chatId: chat.id,
            createdAt: new Date(),
            text: newMessage.text
        }).returning();
        return result[0];
    }

    public async update(id: string, updates: Partial<NewMessage>): Promise<Message> {
        const result = await this.db.update(message).set(updates).where(eq(message.id, id)).returning();
        return result[0];
    }

    public async delete(id: string): Promise<void> {
        await this.db.delete(message).where(eq(message.id, id));
    }
}
