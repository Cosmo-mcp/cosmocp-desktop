import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types/types";
import { DatabaseManager } from "./database/DatabaseManager";
import { ChatRepository } from "./repositories/ChatRepository";
import { MessageRepository } from "./repositories/MessageRepository";
import { ChatService } from "./services/ChatService";
import { MessageService } from "./services/MessageService";
import { ChatController } from "./controllers/ChatController";
import { MessageController } from "./controllers/MessageController";

const container = new Container();

// Database
container.bind<DatabaseManager>(TYPES.DatabaseManager).to(DatabaseManager).inSingletonScope();

// Repositories
container.bind<ChatRepository>(TYPES.ChatRepository).to(ChatRepository).inSingletonScope();
container.bind<MessageRepository>(TYPES.MessageRepository).to(MessageRepository).inSingletonScope();

// Services
container.bind<ChatService>(TYPES.ChatService).to(ChatService).inSingletonScope();
container.bind<MessageService>(TYPES.MessageService).to(MessageService).inSingletonScope();

// Controllers
container.bind<ChatController>(TYPES.ChatController).to(ChatController).inSingletonScope();
container.bind<MessageController>(TYPES.MessageController).to(MessageController).inSingletonScope();

export { container };
