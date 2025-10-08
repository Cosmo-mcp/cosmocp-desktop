import "reflect-metadata";
import {Container} from "inversify";
import {CORETYPES} from "./types/types";
import {DatabaseManager} from "./database/DatabaseManager";
import {ChatRepository} from "./repositories/ChatRepository";
import {MessageRepository} from "./repositories/MessageRepository";
import {ChatService} from "./services/ChatService";
import {MessageService} from "./services/MessageService";
import {ChatController} from "./controllers/ChatController";
import {MessageController} from "./controllers/MessageController";

const coreContainer = new Container();

// Database
coreContainer.bind<DatabaseManager>(CORETYPES.DatabaseManager).to(DatabaseManager).inSingletonScope();

// Repositories
coreContainer.bind<ChatRepository>(CORETYPES.ChatRepository).to(ChatRepository).inSingletonScope();
coreContainer.bind<MessageRepository>(CORETYPES.MessageRepository).to(MessageRepository).inSingletonScope();

// Services
coreContainer.bind<ChatService>(CORETYPES.ChatService).to(ChatService).inSingletonScope();
coreContainer.bind<MessageService>(CORETYPES.MessageService).to(MessageService).inSingletonScope();

// Controllers
coreContainer.bind<ChatController>(CORETYPES.ChatController).to(ChatController).inSingletonScope();
coreContainer.bind<MessageController>(CORETYPES.MessageController).to(MessageController).inSingletonScope();

export {coreContainer};
