import {inject, injectable} from "inversify";
import {CORETYPES} from "../types/types";
import {ChatRepository, NewChat} from "../repositories/ChatRepository";
import {Chat} from "@database/schema/chatSchema";

@injectable()
export class ChatService {
    constructor(
        @inject(CORETYPES.ChatRepository) private chatRepository: ChatRepository
    ) {
    }

    public async getAllChats(): Promise<Chat[]> {
        return this.chatRepository.getAll();
    }

    public async getChatById(id: string): Promise<Chat | undefined> {
        return this.chatRepository.getById(id);
    }

    public async createChat(newChat: NewChat): Promise<Chat> {
        return this.chatRepository.create(newChat);
    }

    public async updateChat(id: string, updates: Partial<NewChat>): Promise<Chat> {
        return this.chatRepository.update(id, updates);
    }

    public async deleteChat(id: string): Promise<void> {
        return this.chatRepository.delete(id);
    }
}
