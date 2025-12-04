import {inject, injectable} from "inversify";
import {eq} from "drizzle-orm";
import {CORETYPES} from "../types/types";
import {DatabaseManager} from "../database/DatabaseManager";
import {chat} from "../database/schema/schema";
import {Chat, ChatWithMessages, NewChat} from "../dto";

@injectable()
export class ChatRepository {
    private db;

    constructor(@inject(CORETYPES.DatabaseManager) databaseManager: DatabaseManager) {
        this.db = databaseManager.getInstance();
    }

    public async getAll(): Promise<Chat[]> {
        return this.db.select().from(chat);
    }

    public async getById(id: string): Promise<ChatWithMessages | undefined> {
        const result = await this.db.query.chat.findFirst({
            where: eq(chat.id, id),
            with: {
                messages: true
            }
        })
        return result;
    }

    public async create(newChat: NewChat): Promise<Chat> {
        const result = await this.db.insert(chat).values({
            createdAt: new Date(),
            title: newChat.title
        }).returning();
        return result[0];
    }

    public async update(id: string, updates: Partial<NewChat>): Promise<Chat> {
        const result = await this.db.update(chat).set(updates).where(eq(chat.id, id)).returning();
        return result[0];
    }

    public async delete(id: string): Promise<void> {
        await this.db.delete(chat).where(eq(chat.id, id));
    }
}
