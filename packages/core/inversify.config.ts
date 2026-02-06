import "reflect-metadata";
import {Container} from "inversify";
import {CORETYPES} from "./types/types";
import {DatabaseManager} from "./database/DatabaseManager";
import {ChatRepository} from "./repositories/ChatRepository";
import {MessageRepository} from "./repositories/MessageRepository";
import {ChatService} from "./services/ChatService";
import {MessageService} from "./services/MessageService";
import {ModelProviderRepository} from "./repositories/ModelProviderRepository";
import {ModelProviderService} from "./services/ModelProviderService";
import {PersonaRepository} from "./repositories/PersonaRepository";
import {PersonaService} from "./services/PersonaService";
import {SlashCommandRepository} from "./repositories/SlashCommandRepository";
import {SlashCommandService} from "./services/SlashCommandService";
import {McpServerRepository} from "./repositories/McpServerRepository";
import {McpServerService} from "./services/McpServerService";
import {McpClientManager} from "./services/McpClientManager";

const coreContainer = new Container();

// Database
coreContainer.bind<DatabaseManager>(CORETYPES.DatabaseManager).to(DatabaseManager).inSingletonScope();

// Repositories
coreContainer.bind<ChatRepository>(CORETYPES.ChatRepository).to(ChatRepository).inSingletonScope();
coreContainer.bind<MessageRepository>(CORETYPES.MessageRepository).to(MessageRepository).inSingletonScope();
coreContainer.bind<ModelProviderRepository>(CORETYPES.ModelProviderRepository).to(ModelProviderRepository).inSingletonScope();
coreContainer.bind<PersonaRepository>(CORETYPES.PersonaRepository).to(PersonaRepository).inSingletonScope();
coreContainer.bind<SlashCommandRepository>(CORETYPES.SlashCommandRepository).to(SlashCommandRepository).inSingletonScope();
coreContainer.bind<McpServerRepository>(CORETYPES.McpServerRepository).to(McpServerRepository).inSingletonScope();

// Services
coreContainer.bind<ChatService>(CORETYPES.ChatService).to(ChatService).inSingletonScope();
coreContainer.bind<MessageService>(CORETYPES.MessageService).to(MessageService).inSingletonScope();
coreContainer.bind<ModelProviderService>(CORETYPES.ModelProviderService).to(ModelProviderService).inSingletonScope();
coreContainer.bind<PersonaService>(CORETYPES.PersonaService).to(PersonaService).inSingletonScope();
coreContainer.bind<SlashCommandService>(CORETYPES.SlashCommandService).to(SlashCommandService).inSingletonScope();
coreContainer.bind<McpServerService>(CORETYPES.McpServerService).to(McpServerService).inSingletonScope();
coreContainer.bind<McpClientManager>(CORETYPES.McpClientManager).to(McpClientManager).inSingletonScope();

export {coreContainer};
