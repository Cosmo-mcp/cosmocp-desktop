import {drizzle} from 'drizzle-orm/pglite';
import {chat, DBMessage, message} from "./schema";
import {asc, eq} from "drizzle-orm";
import {PGlite} from "@electric-sql/pglite";

const client = new PGlite({
    database: "./cosmodb/",
});
const db = drizzle({client});

export async function saveChat({
                                   title,
                               }: {
    title: string;
}) {
    try {
        return await db.insert(chat).values({
            createdAt: new Date(),
            title,
        });
    } catch (_error) {
        console.log(_error);
        throw new Error("Failed to save chat");
    }
}


export async function deleteChatById({id}: { id: string }) {
    try {
        await db.delete(message).where(eq(message.chatId, id));

        const [chatsDeleted] = await db
            .delete(chat)
            .where(eq(chat.id, id))
            .returning();
        return chatsDeleted;
    } catch (_error) {
        throw new Error(
            "Failed to delete chat by id"
        );
    }
}

export async function getChatById({id}: { id: string }) {
    try {
        const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
        if (!selectedChat) {
            return null;
        }
        return selectedChat;
    } catch (_error) {
        throw new Error("Failed to get chat by id");
    }
}

export async function saveMessages({messages}: { messages: DBMessage[] }) {
    try {
        return await db.insert(message).values(messages);
    } catch (_error) {
        throw new Error("Failed to save messages");
    }
}

export async function getMessagesByChatId({id}: { id: string }) {
    try {
        return await db
            .select()
            .from(message)
            .where(eq(message.chatId, id))
            .orderBy(asc(message.createdAt));
    } catch (_error) {
        throw new Error(
            "Failed to get messages by chat id"
        );
    }
}