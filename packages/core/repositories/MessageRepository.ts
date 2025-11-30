import {inject, injectable} from "inversify";
import {eq} from "drizzle-orm";
import {CORETYPES} from "../types/types";
import {DatabaseManager} from "../database/DatabaseManager";
import {Message, NewMessage} from "../dto";
import {chat, message} from "../database/schema/chatSchema";

@injectable()
export class MessageRepository {
    private db;

    constructor(@inject(CORETYPES.DatabaseManager) databaseManager: DatabaseManager) {
        this.db = databaseManager.getInstance();
    }

    public async getMessagesByChatId(chatId: string): Promise<Message[]> {
        return this.db.select().from(message).where(eq(message.chatId, chatId));
    }

    public async create(newMessage: NewMessage): Promise<Message> {
        return this.db.transaction(async (tx) => {
            const now = new Date();
            const [createdMessage] = await tx.insert(message).values({
                chatId: newMessage.chatId,
                content: newMessage.content,
                createdAt: now,
            }).returning();

            await tx.update(chat)
                .set({
                    lastMessage: newMessage.content,
                    lastMessageAt: now,
                })
                .where(eq(chat.id, newMessage.chatId));

            return createdMessage;
        });
    }

    public async update(id: string, updates: Partial<NewMessage>): Promise<Message> {
        const result = await this.db.update(message).set(updates).where(eq(message.id, id)).returning();
        return result[0];
    }

    public async delete(id: string): Promise<void> {
        await this.db.delete(message).where(eq(message.id, id));
    }
}
