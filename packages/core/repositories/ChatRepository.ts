import {inject, injectable} from "inversify";
import {and, asc, desc, eq, ilike, SQL} from "drizzle-orm";
import {CORETYPES} from "../types/types";
import {DatabaseManager} from "../database/DatabaseManager";
import {chat, message} from "../database/schema/schema";
import {Chat, ChatWithMessages, Message, NewChat} from "../dto";
import {UIMessage} from "ai";

@injectable()
export class ChatRepository {
    private db;

    constructor(@inject(CORETYPES.DatabaseManager) databaseManager: DatabaseManager) {
        this.db = databaseManager.getInstance();
    }

    public async getAll(searchQuery: string | null): Promise<Chat[]> {
        const conditions: SQL[] = [];
        if (searchQuery) {
            conditions.push(ilike(chat.title, `%${searchQuery.trim()}%`))
        }
        return this.db.select().from(chat).where(and(...conditions)).orderBy(desc(chat.lastMessageAt));
    }

    public async getById(id: string): Promise<ChatWithMessages | undefined> {
        const result = await this.db.query.chat.findFirst({
            where: eq(chat.id, id),
            with: {messages: {orderBy: asc(message.createdAt)}}
        });

        return result ? {
            ...result,
            messages: this.convertToUiMessage(result.messages)
        } : undefined;
    }

    private convertToUiMessage(messages: Message[]): UIMessage[] {
        return messages.map((message) => {
            const parts: { type: 'text' | 'reasoning', text: string }[] = [];

            if (message.text) {
                parts.push({type: 'text', text: message.text});
            }
            if (message.reasoning) {
                parts.push({type: 'reasoning', text: message.reasoning});
            }

            return {
                id: message.id,
                role: message.role,
                parts: parts
            };
        });
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

    public async updatePinnedStatus(id: string, pinned: boolean): Promise<void> {
        const pinnedAt = pinned ? new Date() : null;
        await this.db
            .update(chat)
            .set({
                pinned: pinned,
                pinnedAt: pinnedAt,
            })
            .where(eq(chat.id, id))
            .execute();
    }

    public async getSelectedModelForChatId(chatId: string): Promise<string | null> {
        const chatRecord = await this.db
            .select({selectedModelId: chat.selectedModelId})
            .from(chat)
            .where(eq(chat.id, chatId))
            .limit(1);
        return chatRecord[0]?.selectedModelId ?? null;
    }

    public async updateSelectedModelForChatId(chatId: string, selectedModelId: string): Promise<void> {
        await this.db
            .update(chat)
            .set({selectedModelId})
            .where(eq(chat.id, chatId));
    }

    public async updateSelectedChat(chatId: string): Promise<void> {
        await this.db.transaction(async (tx) => {
            // 1. Set all rows to false
            await tx
                .update(chat)
                .set({selected: false});

            // 2. Set the chosen row to true
            await tx
                .update(chat)
                .set({selected: true})
                .where(eq(chat.id, chatId));
        });
    }
}
